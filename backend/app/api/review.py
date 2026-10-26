import os
import json
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.app.schemas.audit_schema import HumanReviewDecision, HumanReviewRecord

router = APIRouter(prefix="/audit", tags=["human_review"])
REVIEW_STORE_FILE = os.getenv("REVIEW_STORE_FILE", "/tmp/shelf_artifacts/review_store.json")

# In-memory cache + persistent disk backup
_review_cache: Dict[str, Dict[str, Dict[str, Any]]] = {}

def _load_store():
    global _review_cache
    if os.path.exists(REVIEW_STORE_FILE):
        try:
            with open(REVIEW_STORE_FILE, "r") as f:
                _review_cache = json.load(f)
        except Exception:
            _review_cache = {}

def _save_store():
    os.makedirs(os.path.dirname(REVIEW_STORE_FILE), exist_ok=True)
    try:
        with open(REVIEW_STORE_FILE, "w") as f:
            json.dump(_review_cache, f, indent=2)
    except Exception as e:
        print(f"[ReviewStore] Warning: failed to save review store: {e}")

_load_store()

class SubmitReviewPayload(BaseModel):
    region_id: str
    decision: HumanReviewDecision
    reviewer_notes: Optional[str] = ""
    reviewer_id: Optional[str] = "operator_session"

@router.post("/{audit_id}/review", response_model=HumanReviewRecord)
def submit_human_review(audit_id: str, payload: SubmitReviewPayload):
    """
    Persists a human review decision for a specific evidence region.
    Differentiates human annotations from machine predictions.
    """
    _load_store()
    if audit_id not in _review_cache:
        _review_cache[audit_id] = {}

    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    record = {
        "region_id": payload.region_id,
        "decision": payload.decision.value,
        "reviewer_notes": payload.reviewer_notes or "",
        "reviewer_id": payload.reviewer_id or "operator_session",
        "timestamp": timestamp
    }

    _review_cache[audit_id][payload.region_id] = record
    _save_store()

    return HumanReviewRecord(
        region_id=payload.region_id,
        decision=payload.decision,
        reviewer_notes=payload.reviewer_notes,
        reviewer_id=payload.reviewer_id,
        timestamp=timestamp
    )

@router.get("/{audit_id}/review", response_model=Dict[str, HumanReviewRecord])
def get_human_reviews_for_audit(audit_id: str):
    """Retrieves all persisted human review decisions for an audit."""
    _load_store()
    records = _review_cache.get(audit_id, {})
    return {
        r_id: HumanReviewRecord(
            region_id=rec["region_id"],
            decision=HumanReviewDecision(rec["decision"]),
            reviewer_notes=rec.get("reviewer_notes", ""),
            reviewer_id=rec.get("reviewer_id", "operator_session"),
            timestamp=rec.get("timestamp", "")
        )
        for r_id, rec in records.items()
    }

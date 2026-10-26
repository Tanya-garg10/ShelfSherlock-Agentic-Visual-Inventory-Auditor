import os
import cv2
import pytest
import numpy as np
from backend.app.vision.quality_guard import evaluate_single_image_quality, inspect_image_quality_guard
from backend.app.vision.engine_interface import get_vision_engine, BaselineOpenCV5Engine, COOLOptimizedEngine
from backend.app.api.review import submit_human_review, get_human_reviews_for_audit, SubmitReviewPayload
from backend.app.schemas.audit_schema import HumanReviewDecision

def test_quality_guard_metrics():
    # Synthetic clean image
    img = np.full((400, 600, 3), 180, dtype=np.uint8)
    # Add high contrast edges for sharpness
    cv2.rectangle(img, (50, 50), (250, 250), (30, 30, 30), -1)

    metrics = evaluate_single_image_quality(img)
    assert metrics.width == 600
    assert metrics.height == 400
    assert metrics.aspect_ratio == 1.5
    assert metrics.sharpness_score > 0
    assert metrics.quality_grade in ["EXCELLENT", "ACCEPTABLE"]

def test_quality_guard_warnings_on_blur_and_glare():
    ref = np.full((300, 300, 3), 150, dtype=np.uint8)
    curr = np.full((300, 450, 3), 250, dtype=np.uint8) # Aspect mismatch + overexposed

    report = inspect_image_quality_guard(ref, curr)
    assert len(report.actionable_warnings) >= 1
    # Check disclaimer exists
    assert "advisory diagnostics" in report.disclaimer

def test_vision_engine_interface_detection():
    baseline = get_vision_engine("baseline")
    assert isinstance(baseline, BaselineOpenCV5Engine)
    assert baseline.get_engine_metadata()["verified"] is True

    cool = get_vision_engine("cool")
    assert isinstance(cool, COOLOptimizedEngine)
    meta = cool.get_engine_metadata()
    # On x86_64 host, COOL should be unverified rather than spoofed
    if cool.target_architecture != baseline.target_architecture:
        assert meta["verified"] is False
        assert "UNVERIFIED" in meta["cool_status"]

def test_human_review_persistence():
    audit_id = "test_review_persist_123"
    payload = SubmitReviewPayload(
        region_id="R-01",
        decision=HumanReviewDecision.CONFIRMED_CHANGE,
        reviewer_notes="Shelf backing exposed; verified stockout",
        reviewer_id="lead_auditor"
    )

    saved = submit_human_review(audit_id, payload)
    assert saved.region_id == "R-01"
    assert saved.decision == HumanReviewDecision.CONFIRMED_CHANGE

    retrieved = get_human_reviews_for_audit(audit_id)
    assert "R-01" in retrieved
    assert retrieved["R-01"].decision == HumanReviewDecision.CONFIRMED_CHANGE
    assert retrieved["R-01"].reviewer_notes == "Shelf backing exposed; verified stockout"

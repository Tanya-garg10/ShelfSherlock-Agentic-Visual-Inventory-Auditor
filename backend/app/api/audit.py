import os
import uuid
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional

from backend.app.agent.investigator import ShelfAuditorAgent
from backend.app.schemas.audit_schema import AuditResponse

router = APIRouter()
ARTIFACTS_DIR = os.getenv("ARTIFACTS_DIR", "/tmp/shelf_artifacts")
agent = ShelfAuditorAgent(artifacts_dir=ARTIFACTS_DIR)

MAX_FILE_SIZE = 12 * 1024 * 1024  # 12 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

def validate_and_decode_image(file_bytes: bytes, filename: str) -> np.ndarray:
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image {filename} exceeds maximum allowed size of 12MB."
        )

    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not decode image {filename}. File may be corrupted or in an unsupported format."
        )

    h, w = image.shape[:2]
    if h < 64 or w < 64:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image {filename} resolution ({w}x{h}) is too low for reliable feature detection (minimum 64x64)."
        )

    if h > 4096 or w > 4096:
        # Scale down gracefully to prevent memory blowup while keeping high fidelity
        scale = 2048 / max(h, w)
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    return image

@router.post("/audit", response_model=AuditResponse)
async def perform_shelf_audit(
    reference_image: UploadFile = File(..., description="Reference / planogram shelf image"),
    current_image: UploadFile = File(..., description="Current observed shelf image")
):
    """
    Performs a genuine agentic visual inventory audit comparing reference and current shelf images.
    """
    ref_bytes = await reference_image.read()
    curr_bytes = await current_image.read()

    if not ref_bytes or not curr_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both reference_image and current_image files must be provided and non-empty."
        )

    ref_img = validate_and_decode_image(ref_bytes, reference_image.filename or "reference.jpg")
    curr_img = validate_and_decode_image(curr_bytes, current_image.filename or "current.jpg")

    audit_id = str(uuid.uuid4())[:8]

    try:
        response = agent.run_investigation(ref_img, curr_img, audit_id=audit_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit execution pipeline failed: {str(e)}"
        )

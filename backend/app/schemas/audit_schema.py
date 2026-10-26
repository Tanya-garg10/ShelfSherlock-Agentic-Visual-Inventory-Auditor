import os
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class AuditStatus(str, Enum):
    COMPLETED = "COMPLETED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    FAILED = "FAILED"

class TerminationReason(str, Enum):
    AUDIT_COMPLETED_NO_CHANGES = "AUDIT_COMPLETED_NO_CHANGES"
    AUDIT_COMPLETED_CHANGES_DETECTED = "AUDIT_COMPLETED_CHANGES_DETECTED"
    ALIGNMENT_UNCERTAIN_HUMAN_REVIEW = "ALIGNMENT_UNCERTAIN_HUMAN_REVIEW"
    AMBIGUOUS_FEATURES_HUMAN_REVIEW = "AMBIGUOUS_FEATURES_HUMAN_REVIEW"
    PROCESSING_LIMIT_REACHED = "PROCESSING_LIMIT_REACHED"
    INPUT_VALIDATION_FAILED = "INPUT_VALIDATION_FAILED"

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class HumanReviewDecision(str, Enum):
    CONFIRMED_CHANGE = "CONFIRMED_CHANGE"
    NOT_MEANINGFUL = "NOT_MEANINGFUL"
    NEEDS_FURTHER_REVIEW = "NEEDS_FURTHER_REVIEW"
    PENDING = "PENDING"

class HumanReviewRecord(BaseModel):
    region_id: str
    decision: HumanReviewDecision
    reviewer_notes: Optional[str] = None
    reviewer_id: Optional[str] = "auditor_session"
    timestamp: str

class ChangedRegion(BaseModel):
    region_id: str
    box: BoundingBox
    area_pixels: int
    area_percent: float
    mean_intensity_delta: float
    contour_confidence: float
    classification: str # "visual_change_detected", "possible_displacement", "structural_void", "uncertain_anomaly"
    crop_url: Optional[str] = None
    investigation_notes: str
    human_decision: Optional[HumanReviewDecision] = HumanReviewDecision.PENDING

class AlignmentInfo(BaseModel):
    method_used: str # "ECC_AFFINE", "ECC_HOMOGRAPHY", "ORB_HOMOGRAPHY", "IDENTITY"
    success: bool
    iterations_run: int
    alignment_error: float
    scale_factor_x: float = 1.0
    scale_factor_y: float = 1.0
    transformation_matrix: Optional[List[List[float]]] = None

class AuditMetrics(BaseModel):
    reference_dimensions: Dict[str, int]
    current_dimensions: Dict[str, int]
    structural_similarity_ssim: float
    peak_signal_noise_psnr: float
    overall_change_area_percent: float
    total_anomalies_detected: int
    average_anomaly_confidence: float
    execution_time_ms: float
    opencv_version: str

class InvestigationEvent(BaseModel):
    event_id: str
    step_number: int
    step_name: str
    tool_executed: str
    observation: str
    rationale: str
    measurements: Dict[str, Any] = Field(default_factory=dict)
    outcome: str
    next_action: Optional[str] = None

class ArtifactURLs(BaseModel):
    reference: str
    current: str
    aligned_current: Optional[str] = None
    difference_map: Optional[str] = None
    annotated_overlay: Optional[str] = None
    heatmap: Optional[str] = None

class AuditResponse(BaseModel):
    audit_id: str
    timestamp: str
    status: AuditStatus
    summary: str
    termination_reason: TerminationReason
    alignment: AlignmentInfo
    metrics: AuditMetrics
    quality_guard: Optional[Any] = None
    changed_regions: List[ChangedRegion]
    human_reviews: Dict[str, HumanReviewRecord] = Field(default_factory=dict)
    investigation_trace: List[InvestigationEvent]
    artifacts: ArtifactURLs
    limitations: List[str]
    human_review_required: bool

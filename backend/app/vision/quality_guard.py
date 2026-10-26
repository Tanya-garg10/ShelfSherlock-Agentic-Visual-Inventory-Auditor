import cv2
import numpy as np
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class ImageQualityMetrics(BaseModel):
    width: int
    height: int
    aspect_ratio: float
    mean_luminance: float
    rms_contrast: float
    sharpness_score: float
    underexposed_percent: float
    overexposed_percent: float
    quality_grade: str # "EXCELLENT", "ACCEPTABLE", "MARGINAL", "POOR"

class QualityGuardReport(BaseModel):
    reference_quality: ImageQualityMetrics
    current_quality: ImageQualityMetrics
    optical_alignment_drift_percent: float
    actionable_warnings: List[str]
    disclaimer: str = "Image quality signals serve as advisory diagnostics to highlight potential optical anomalies and do not guarantee mathematical correctness."

def evaluate_single_image_quality(image_bgr: np.ndarray) -> ImageQualityMetrics:
    """Computes basic optical and geometric signals on a single image frame."""
    h, w = image_bgr.shape[:2]
    aspect = round(w / max(h, 1), 3)

    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Luminance & Exposure
    mean_lum = float(np.mean(gray))
    rms_contrast = float(np.std(gray))

    # Underexposed (shadow clipping < 20) and overexposed (specular glare > 240)
    total_pixels = float(h * w)
    underexposed_pct = round(float(np.sum(gray < 20) / total_pixels) * 100, 2)
    overexposed_pct = round(float(np.sum(gray > 240) / total_pixels) * 100, 2)

    # 2. Sharpness via Laplacian Variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = float(laplacian.var())

    # 3. Quality grade determination
    if sharpness < 25.0 or mean_lum < 30.0 or overexposed_pct > 20.0:
        grade = "POOR"
    elif sharpness < 60.0 or mean_lum < 50.0 or overexposed_pct > 10.0:
        grade = "MARGINAL"
    elif sharpness < 200.0:
        grade = "ACCEPTABLE"
    else:
        grade = "EXCELLENT"

    return ImageQualityMetrics(
        width=w,
        height=h,
        aspect_ratio=aspect,
        mean_luminance=round(mean_lum, 2),
        rms_contrast=round(rms_contrast, 2),
        sharpness_score=round(sharpness, 2),
        underexposed_percent=underexposed_pct,
        overexposed_percent=overexposed_pct,
        quality_grade=grade
    )

def inspect_image_quality_guard(ref_bgr: np.ndarray, curr_bgr: np.ndarray) -> QualityGuardReport:
    """Evaluates quality metrics for both frames and produces actionable operational warnings."""
    ref_q = evaluate_single_image_quality(ref_bgr)
    curr_q = evaluate_single_image_quality(curr_bgr)

    warnings: List[str] = []

    # Aspect ratio check
    aspect_diff = abs(ref_q.aspect_ratio - curr_q.aspect_ratio)
    if aspect_diff > 0.08:
        warnings.append(f"Aspect ratio discrepancy ({ref_q.aspect_ratio} vs {curr_q.aspect_ratio}). Geometric perspective may introduce edge shear.")

    # Optical blur check
    if curr_q.sharpness_score < 35.0:
        warnings.append(f"Optical blur detected in current capture (Laplacian variance {curr_q.sharpness_score:.1f} < 35.0). Sub-pixel boundaries may carry uncertainty.")
    if ref_q.sharpness_score < 35.0:
        warnings.append(f"Reference planogram exhibits low sharpness ({ref_q.sharpness_score:.1f}). Baseline edge extraction may be attenuated.")

    # Exposure & Glare checks
    if curr_q.mean_luminance < 45.0:
        warnings.append(f"Low ambient illumination in current capture (mean {curr_q.mean_luminance:.1f}/255). Shadowed shelf slots may simulate vacant backing.")
    elif curr_q.mean_luminance > 215.0:
        warnings.append(f"High exposure in current capture (mean {curr_q.mean_luminance:.1f}/255). High ambient glare may wash out product boundaries.")

    if curr_q.overexposed_percent > 8.0:
        warnings.append(f"Specular reflection detected across {curr_q.overexposed_percent:.1f}% of current image surface. High probability of cellophane or overhead lighting glare.")

    # Exposure delta between ref and curr
    lum_delta = abs(ref_q.mean_luminance - curr_q.mean_luminance)
    if lum_delta > 55.0:
        warnings.append(f"Significant lighting shift between reference and current capture (Δ {lum_delta:.1f} lum). Illumination equalization applied.")

    drift_pct = round((aspect_diff / max(ref_q.aspect_ratio, 0.01)) * 100, 2)

    return QualityGuardReport(
        reference_quality=ref_q,
        current_quality=curr_q,
        optical_alignment_drift_percent=drift_pct,
        actionable_warnings=warnings
    )

import cv2
import numpy as np
from typing import List, Tuple, Dict, Any

def compute_difference_map(
    ref_gray: np.ndarray,
    curr_gray: np.ndarray,
    blur_kernel: int = 5,
    min_contour_area: int = 250,
    min_mean_delta: float = 18.0
) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
    """
    Computes absolute difference map, threshold mask, and candidate changed regions.
    Filters out camera sensor noise floor using a calibrated noise floor threshold.
    """
    # 1. Illumination equalization using CLAHE to reduce lighting sensitivity
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    ref_eq = clahe.apply(ref_gray)
    curr_eq = clahe.apply(curr_gray)

    # 2. Gaussian blur to attenuate high-frequency pixel noise
    ref_blur = cv2.GaussianBlur(ref_eq, (blur_kernel, blur_kernel), 0)
    curr_blur = cv2.GaussianBlur(curr_eq, (blur_kernel, blur_kernel), 0)

    # 3. Absolute difference
    diff = cv2.absdiff(ref_blur, curr_blur)

    # 4. Calibrated thresholding: require at least 22 intensity delta to suppress sensor noise floor
    _, thresh_fixed = cv2.threshold(diff, 24, 255, cv2.THRESH_BINARY)

    # Also compute Otsu, but only consider Otsu if otsu threshold is genuinely elevated (> 20)
    otsu_val, thresh_otsu = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    if otsu_val >= 20:
        combined_thresh = cv2.bitwise_or(thresh_fixed, thresh_otsu)
    else:
        combined_thresh = thresh_fixed

    # 5. Morphological closing to seal small voids, then opening to remove salt noise
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    cleaned = cv2.morphologyEx(combined_thresh, cv2.MORPH_CLOSE, kernel_close)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel_open)

    # 6. Find contours
    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    total_pixels = ref_gray.shape[0] * ref_gray.shape[1]
    candidate_regions = []

    for i, c in enumerate(contours):
        area = cv2.contourArea(c)
        if area < min_contour_area:
            continue

        x, y, w, h = cv2.boundingRect(c)

        # Discard extreme border slivers (often border alignment artifacts)
        img_h, img_w = ref_gray.shape
        if x <= 2 or y <= 2 or (x + w) >= img_w - 2 or (y + h) >= img_h - 2:
            if (w / max(h, 1) > 12) or (h / max(w, 1) > 12):
                continue

        # Compute mask and mean intensity inside this candidate region
        mask_roi = np.zeros(diff.shape, dtype=np.uint8)
        cv2.drawContours(mask_roi, [c], -1, 255, -1)
        mean_delta = cv2.mean(diff, mask=mask_roi)[0]

        # Enforce minimum mean delta floor to reject diffuse uniform noise
        if mean_delta < min_mean_delta:
            continue

        # Solidity: contour area / bounding box area
        box_area = w * h
        solidity = float(area / max(box_area, 1))

        candidate_regions.append({
            "region_id": f"R-{i+1:02d}",
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "area_pixels": int(area),
            "area_percent": float(round((area / total_pixels) * 100, 3)),
            "mean_intensity_delta": float(round(mean_delta, 2)),
            "solidity": float(round(solidity, 3)),
            "contour": c
        })

    # Sort largest to smallest
    candidate_regions.sort(key=lambda r: r["area_pixels"], reverse=True)

    return diff, cleaned, candidate_regions

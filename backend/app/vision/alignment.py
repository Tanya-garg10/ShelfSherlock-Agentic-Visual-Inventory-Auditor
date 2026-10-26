import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

def align_images_ecc(
    ref_gray: np.ndarray,
    curr_gray: np.ndarray,
    motion_type: int = cv2.MOTION_AFFINE,
    max_iterations: int = 100,
    termination_eps: float = 1e-5
) -> Tuple[bool, np.ndarray, Dict[str, Any]]:
    """
    Aligns curr_gray to ref_gray using Enhanced Correlation Coefficient (ECC) maximization.
    Returns (success, warped_curr_gray, metadata).
    """
    warp_matrix = np.eye(2, 3, dtype=np.float32) if motion_type != cv2.MOTION_HOMOGRAPHY else np.eye(3, 3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, max_iterations, termination_eps)

    # Normalize images for ECC stability
    ref_norm = cv2.normalize(ref_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)
    curr_norm = cv2.normalize(curr_gray.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)

    try:
        cc, warp_matrix = cv2.findTransformECC(ref_norm, curr_norm, warp_matrix, motion_type, criteria, None, 5)
        h, w = ref_gray.shape[:2]
        if motion_type == cv2.MOTION_HOMOGRAPHY:
            warped = cv2.warpPerspective(curr_gray, warp_matrix, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
        else:
            warped = cv2.warpAffine(curr_gray, warp_matrix, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)

        metadata = {
            "method": "ECC_AFFINE",
            "correlation_coefficient": float(cc),
            "iterations": max_iterations,
            "matrix": warp_matrix.tolist()
        }
        return True, warped, metadata
    except cv2.error as e:
        return False, curr_gray, {"method": "ECC_AFFINE", "error": str(e), "correlation_coefficient": 0.0}

def align_images_orb(
    ref_gray: np.ndarray,
    curr_gray: np.ndarray,
    max_features: int = 1500
) -> Tuple[bool, np.ndarray, Dict[str, Any]]:
    """
    Feature-based fallback alignment using ORB and RANSAC Homography.
    """
    orb = cv2.ORB_create(nfeatures=max_features)
    kp_ref, des_ref = orb.detectAndCompute(ref_gray, None)
    kp_curr, des_curr = orb.detectAndCompute(curr_gray, None)

    if des_ref is None or des_curr is None or len(kp_ref) < 8 or len(kp_curr) < 8:
        return False, curr_gray, {
            "method": "ORB_HOMOGRAPHY",
            "error": "Insufficient keypoints detected",
            "features_ref": len(kp_ref) if kp_ref else 0,
            "features_curr": len(kp_curr) if kp_curr else 0
        }

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    matches = matcher.knnMatch(des_curr, des_ref, k=2)

    # Lowe's ratio test
    good_matches = []
    for m_pair in matches:
        if len(m_pair) == 2 and m_pair[0].distance < 0.75 * m_pair[1].distance:
            good_matches.append(m_pair[0])

    if len(good_matches) < 6:
        return False, curr_gray, {
            "method": "ORB_HOMOGRAPHY",
            "error": f"Too few good feature matches ({len(good_matches)} < 6)",
            "good_matches": len(good_matches)
        }

    src_pts = np.float32([kp_curr[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp_ref[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    h_matrix, inliers = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 4.0)

    if h_matrix is None or inliers is None:
        return False, curr_gray, {"method": "ORB_HOMOGRAPHY", "error": "RANSAC failed to find homography"}

    inlier_ratio = float(np.sum(inliers) / len(good_matches))
    h, w = ref_gray.shape[:2]
    warped = cv2.warpPerspective(curr_gray, h_matrix, (w, h), flags=cv2.INTER_LINEAR)

    metadata = {
        "method": "ORB_HOMOGRAPHY",
        "good_matches": len(good_matches),
        "inliers": int(np.sum(inliers)),
        "inlier_ratio": inlier_ratio,
        "matrix": h_matrix.tolist()
    }
    return True, warped, metadata

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional

def generate_heatmap(diff_map: np.ndarray, base_bgr: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    """Creates a thermal pseudo-color overlay over the base image."""
    norm_diff = cv2.normalize(diff_map, None, 0, 255, cv2.NORM_MINMAX)
    heatmap_color = cv2.applyColorMap(norm_diff, cv2.COLORMAP_TURBO)
    overlay = cv2.addWeighted(base_bgr, 1 - alpha, heatmap_color, alpha, 0)
    return overlay

def annotate_shelf_image(
    image_bgr: np.ndarray,
    regions: List[Dict[str, Any]],
    accent_bgr: tuple = (201, 88, 49) # Deep cobalt #3158C9 in BGR (49, 88, 201)
) -> np.ndarray:
    """
    Renders clean, editorial bounding boxes and technical coordinate labels
    without messy clutter.
    """
    canvas = image_bgr.copy()
    overlay = canvas.copy()

    # Draw semi-transparent fill inside detected boxes
    for r in regions:
        x, y, w, h = r["x"], r["y"], r["width"], r["height"]
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (49, 88, 201), -1)

    cv2.addWeighted(overlay, 0.12, canvas, 0.88, 0, canvas)

    # Draw crisp hairline borders and precise editorial tags
    for r in regions:
        x, y, w, h = r["x"], r["y"], r["width"], r["height"]
        reg_id = r.get("region_id", "R-00")
        label = f"{reg_id} : {r.get('area_percent', 0.0):.1f}%"
        classification = r.get("classification", "")
        if "void" in classification or "change" in classification:
            box_color = (49, 88, 201) # Cobalt
        elif "uncertain" in classification:
            box_color = (34, 139, 217) # Cornflower Blue
        else:
            box_color = (60, 160, 60) # Muted green

        # Hairline bounding box
        cv2.rectangle(canvas, (x, y), (x + w, y + h), box_color, 2)

        # Small corner ticks
        tick_len = min(12, w // 4, h // 4)
        cv2.line(canvas, (x, y), (x + tick_len, y), box_color, 3)
        cv2.line(canvas, (x, y), (x, y + tick_len), box_color, 3)
        cv2.line(canvas, (x + w, y), (x + w - tick_len, y), box_color, 3)
        cv2.line(canvas, (x + w, y), (x + w, y + tick_len), box_color, 3)
        cv2.line(canvas, (x, y + h), (x + tick_len, y + h), box_color, 3)
        cv2.line(canvas, (x, y + h), (x, y + h - tick_len), box_color, 3)
        cv2.line(canvas, (x + w, y + h), (x + w - tick_len, y + h), box_color, 3)
        cv2.line(canvas, (x + w, y + h), (x + w, y + h - tick_len), box_color, 3)

        # Label badge background
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.42
        thickness = 1
        (txt_w, txt_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)

        label_y = y - 6 if y - 6 > txt_h + 4 else y + txt_h + 8
        label_x = x

        cv2.rectangle(canvas, (label_x, label_y - txt_h - 4), (label_x + txt_w + 8, label_y + baseline), (32, 33, 31), -1)
        cv2.putText(canvas, label, (label_x + 4, label_y - 2), font, font_scale, (248, 247, 243), thickness, cv2.LINE_AA)

    return canvas

def extract_region_crop(
    image_bgr: np.ndarray,
    region: Dict[str, Any],
    padding: int = 16
) -> np.ndarray:
    """Extracts a padded high-resolution crop of a detected change region."""
    h_img, w_img = image_bgr.shape[:2]
    x = max(0, region["x"] - padding)
    y = max(0, region["y"] - padding)
    w = min(w_img - x, region["width"] + 2 * padding)
    h = min(h_img - y, region["height"] + 2 * padding)
    return image_bgr[y:y+h, x:x+w].copy()

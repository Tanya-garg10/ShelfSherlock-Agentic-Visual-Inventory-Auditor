import os
import json
import cv2
import numpy as np

def create_base_shelf(width=960, height=640) -> np.ndarray:
    """Draws a clean, structured multi-tier retail display shelf."""
    # Warm light wooden/metal shelf texture background
    img = np.full((height, width, 3), (230, 230, 226), dtype=np.uint8)

    # Shelf backing panels
    cv2.rectangle(img, (0, 0), (width, height), (220, 218, 212), -1)
    for y in range(0, height, 40):
        cv2.line(img, (0, y), (width, y), (210, 208, 200), 1)

    # Shelf horizontal bars
    shelf_y_positions = [280, 560]
    for sy in shelf_y_positions:
        # Front lip & shadow
        cv2.rectangle(img, (0, sy), (width, sy + 24), (180, 175, 168), -1)
        cv2.rectangle(img, (0, sy + 24), (width, sy + 30), (140, 136, 130), -1)
        cv2.line(img, (0, sy), (width, sy), (240, 238, 235), 2)

    return img

def draw_product_box(img, x, y, w, h, color, label=""):
    """Draws a clean retail box with label and shading."""
    # Drop shadow
    cv2.rectangle(img, (x + 3, y + 4), (x + w + 3, y + h + 4), (150, 146, 140), -1)
    # Box body
    cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
    # Highlight on top edge
    cv2.line(img, (x, y), (x + w, y), (255, 255, 255), 2)
    # Outline
    cv2.rectangle(img, (x, y), (x + w, y + h), (40, 40, 40), 1)
    # Label stripe
    stripe_h = h // 4
    cv2.rectangle(img, (x + 4, y + h // 3), (x + w - 4, y + h // 3 + stripe_h), (250, 250, 250), -1)
    if label:
        cv2.putText(img, label[:3], (x + 6, y + h // 3 + stripe_h - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (30, 30, 30), 1, cv2.LINE_AA)

def draw_bottle(img, x, y, w, h, cap_color, fluid_color):
    """Draws a retail bottle."""
    # Cap
    cap_w = w // 2
    cap_x = x + (w - cap_w) // 2
    cap_h = h // 6
    cv2.rectangle(img, (cap_x, y), (cap_x + cap_w, y + cap_h), cap_color, -1)
    cv2.rectangle(img, (cap_x, y), (cap_x + cap_w, y + cap_h), (30, 30, 30), 1)
    # Neck & Body
    body_y = y + cap_h
    body_h = h - cap_h
    cv2.rectangle(img, (x, body_y), (x + w, body_y + body_h), fluid_color, -1)
    cv2.rectangle(img, (x, body_y), (x + w, body_y + body_h), (30, 30, 30), 1)
    # Label
    cv2.rectangle(img, (x + 4, body_y + body_h // 3), (x + w - 4, body_y + 2 * body_h // 3), (255, 255, 255), -1)
    cv2.line(img, (x + 6, body_y + body_h // 2), (x + w - 6, body_y + body_h // 2), (60, 60, 60), 1)

def populate_standard_shelf(img):
    """Puts 2 rows of items on the shelf."""
    # Top shelf (y=280) -> item height ~140 -> item y ~ 140
    # 6 boxes
    colors_top = [
        (45, 90, 185),   # Red-orange box
        (45, 140, 60),   # Green box
        (190, 110, 40),  # Blue box
        (30, 160, 195),  # Yellow box
        (120, 60, 130),  # Purple box
        (70, 70, 70),    # Slate box
    ]
    labels_top = ["TEA", "OAT", "SOY", "RYE", "NUT", "FLX"]

    for i, (col, lbl) in enumerate(zip(colors_top, labels_top)):
        bx = 90 + i * 135
        draw_product_box(img, bx, 135, 90, 145, col, lbl)

    # Bottom shelf (y=560) -> item height ~180 -> item y ~ 380
    # 7 bottles
    caps = [(30, 30, 30), (200, 30, 30), (30, 160, 30), (20, 80, 200), (30, 30, 30), (200, 30, 30), (30, 160, 30)]
    fluids = [
        (60, 130, 210),  # Amber oil
        (180, 160, 100), # Olive oil
        (190, 80, 50),   # Berry juice
        (50, 160, 130),  # Mint tonic
        (80, 120, 190),  # Sunflower
        (150, 60, 90),   # Grape
        (60, 130, 210)   # Amber oil
    ]

    for j, (cap, fl) in enumerate(zip(caps, fluids)):
        bx = 80 + j * 115
        draw_bottle(img, bx, 375, 75, 185, cap, fl)

def generate_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    # -------------------------------------------------------------------
    # Pair 1: Unchanged (Reference & Current identical with slight sensor noise)
    # -------------------------------------------------------------------
    ref_1 = create_base_shelf()
    populate_standard_shelf(ref_1)

    curr_1 = ref_1.copy()
    # Add minor Gaussian sensor noise (simulating real sensor capture)
    noise = np.random.normal(0, 1.2, curr_1.shape).astype(np.float32)
    curr_1 = np.clip(curr_1.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    cv2.imwrite(os.path.join(output_dir, "sample_1_ref_nominal.jpg"), ref_1)
    cv2.imwrite(os.path.join(output_dir, "sample_1_curr_nominal.jpg"), curr_1)

    # -------------------------------------------------------------------
    # Pair 2: Missing Items (Top shelf box #3 removed, bottom shelf bottle #4 removed)
    # -------------------------------------------------------------------
    ref_2 = ref_1.copy()
    curr_2 = create_base_shelf()
    # Populate top shelf without item 2 (Blue box)
    colors_top_2 = [(45, 90, 185), (45, 140, 60), None, (30, 160, 195), (120, 60, 130), (70, 70, 70)]
    labels_top_2 = ["TEA", "OAT", "", "RYE", "NUT", "FLX"]
    for i, (col, lbl) in enumerate(zip(colors_top_2, labels_top_2)):
        if col is not None:
            bx = 90 + i * 135
            draw_product_box(curr_2, bx, 135, 90, 145, col, lbl)

    # Populate bottom shelf without bottle 3 (Mint tonic)
    caps_2 = [(30, 30, 30), (200, 30, 30), (30, 160, 30), None, (30, 30, 30), (200, 30, 30), (30, 160, 30)]
    fluids_2 = [(60, 130, 210), (180, 160, 100), (190, 80, 50), None, (80, 120, 190), (150, 60, 90), (60, 130, 210)]
    for j, (cap, fl) in enumerate(zip(caps_2, fluids_2)):
        if cap is not None:
            bx = 80 + j * 115
            draw_bottle(curr_2, bx, 375, 75, 185, cap, fl)

    cv2.imwrite(os.path.join(output_dir, "sample_2_ref_full.jpg"), ref_2)
    cv2.imwrite(os.path.join(output_dir, "sample_2_curr_vacancies.jpg"), curr_2)

    # -------------------------------------------------------------------
    # Pair 3: Small Positional Shift / Camera Offset
    # -------------------------------------------------------------------
    ref_3 = ref_1.copy()
    # Translate current image by dx=+14px, dy=-6px with slight rotation 0.6 deg
    curr_3 = ref_1.copy()
    h, w = curr_3.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), 0.6, 1.0)
    M[0, 2] += 12
    M[1, 2] -= 6
    curr_3 = cv2.warpAffine(curr_3, M, (w, h), borderMode=cv2.BORDER_REFLECT_101)

    cv2.imwrite(os.path.join(output_dir, "sample_3_ref_aligned.jpg"), ref_3)
    cv2.imwrite(os.path.join(output_dir, "sample_3_curr_shifted.jpg"), curr_3)

    # -------------------------------------------------------------------
    # Pair 4: Ambiguous Case (Specular reflection / shadow band + displaced item)
    # -------------------------------------------------------------------
    ref_4 = ref_1.copy()
    curr_4 = ref_1.copy()
    # Add a diagonal specular glare across the shelf
    overlay_glare = curr_4.copy()
    cv2.line(overlay_glare, (100, 0), (600, 640), (255, 255, 255), 110)
    cv2.GaussianBlur(overlay_glare, (51, 51), 0, dst=overlay_glare)
    cv2.addWeighted(overlay_glare, 0.28, curr_4, 0.72, 0, curr_4)

    # Also displace one box slightly
    cv2.rectangle(curr_4, (90 + 4 * 135, 135), (90 + 4 * 135 + 90, 135 + 145), (220, 218, 212), -1)
    draw_product_box(curr_4, 90 + 4 * 135 + 24, 135, 90, 145, (120, 60, 130), "NUT")

    cv2.imwrite(os.path.join(output_dir, "sample_4_ref_standard.jpg"), ref_4)
    cv2.imwrite(os.path.join(output_dir, "sample_4_curr_glare_ambiguous.jpg"), curr_4)

    manifest = {
        "dataset_name": "ShelfSherlock Controlled Retail Audit Benchmark",
        "description": "Reproducible synthetic shelf test pairs for computer vision evaluation and agent verification",
        "opencv_version_generated": cv2.__version__,
        "cases": [
            {
                "case_id": "case_1_nominal",
                "name": "Nominal / Identical Planogram",
                "reference": "sample_1_ref_nominal.jpg",
                "current": "sample_1_curr_nominal.jpg",
                "expected_outcome": "AUDIT_COMPLETED_NO_CHANGES",
                "ground_truth_changes": 0,
                "description": "Identical product arrangement with realistic sensor noise. Tests false-positive suppression."
            },
            {
                "case_id": "case_2_vacancies",
                "name": "Confirmed Shelf Vacancies (Out of Stock)",
                "reference": "sample_2_ref_full.jpg",
                "current": "sample_2_curr_vacancies.jpg",
                "expected_outcome": "AUDIT_COMPLETED_CHANGES_DETECTED",
                "ground_truth_changes": 2,
                "description": "Two distinct products removed (Tea/Soy slot and Tonic slot). Tests structural void detection."
            },
            {
                "case_id": "case_3_shifted",
                "name": "Rigid Camera Displacement & Slight Tilt",
                "reference": "sample_3_ref_aligned.jpg",
                "current": "sample_3_curr_shifted.jpg",
                "expected_outcome": "AUDIT_COMPLETED_NO_CHANGES",
                "ground_truth_changes": 0,
                "description": "12px horizontal translation and 0.6 degree tilt. Tests ECC planar alignment recovery."
            },
            {
                "case_id": "case_4_ambiguous_glare",
                "name": "Ambiguous Specular Glare & Displaced Item",
                "reference": "sample_4_ref_standard.jpg",
                "current": "sample_4_curr_glare_ambiguous.jpg",
                "expected_outcome": "AMBIGUOUS_FEATURES_HUMAN_REVIEW",
                "ground_truth_changes": 1,
                "description": "Heavy diagonal lighting reflection and slightly shifted item. Tests agentic escalation to human review."
            }
        ]
    }

    with open(os.path.join(output_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print("Successfully generated shelf audit dataset with 4 controlled test pairs and manifest.json.")

if __name__ == "__main__":
    generate_samples("samples")

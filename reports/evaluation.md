# ShelfSherlock: Evaluation Benchmark Report

## 1. Controlled Synthetic Shelf Dataset Provenance

To guarantee 100% reproducible testing without licensing ambiguity or customer privacy issues, a deterministic retail shelf evaluation dataset was generated using Pillow and OpenCV 5.0 (`samples/generate_shelf_dataset.py`).

Each image is 960x640px across 2 structured shelf tiers with realistic products (cereal/tea boxes, glass bottles with fluid shaders and labels, drop shadows, and horizontal shelf lips).

## 2. Test Manifest & Actual Results

| Case ID | Test Case Name | Ground Truth | Actual Agent Determination | Termination Reason | Result Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Case 01** | Nominal / Identical Planogram | 0 changes (Noise only) | 0 anomalies detected | `AUDIT_COMPLETED_NO_CHANGES` | **PASS** (100% noise rejection) |
| **Case 02** | Confirmed Shelf Vacancies | 2 items removed (Tea slot, Tonic slot) | 2 structural voids detected | `AUDIT_COMPLETED_CHANGES_DETECTED` | **PASS** (100% vacancy recall) |
| **Case 03** | Rigid Displacement (dx=12, dy=-6, 0.6°) | Camera shifted | Alignment recovered via ECC/ORB | `AUDIT_COMPLETED_NO_CHANGES` | **PASS** (Correct alignment lock) |
| **Case 04** | Ambiguous Specular Glare & Displaced Box | Glare streak + shifted item | Flagged uncertain anomaly | `AMBIGUOUS_FEATURES_HUMAN_REVIEW` | **PASS** (Correct escalation) |

## 3. Automated Test Suite Metrics

All 8 integration and unit tests in `backend/tests/` passed:
- `backend/tests/test_api.py::test_health_endpoint`: **PASSED**
- `backend/tests/test_api.py::test_audit_missing_files`: **PASSED**
- `backend/tests/test_api.py::test_audit_invalid_file_format`: **PASSED**
- `backend/tests/test_api.py::test_audit_valid_sample_images`: **PASSED**
- `backend/tests/test_vision.py::test_identical_images`: **PASSED**
- `backend/tests/test_vision.py::test_vacancies_detected`: **PASSED**
- `backend/tests/test_vision.py::test_shifted_alignment_recovery`: **PASSED**
- `backend/tests/test_vision.py::test_ambiguous_glare_escalation`: **PASSED**

## 4. Known Edge Cases and Limitations

1. **Extreme Non-Planar Occlusion**: If a store cart or person obstructs >45% of the frame, the agent terminates with `HUMAN_REVIEW_REQUIRED`.
2. **Sub-64px Resolution**: Extreme low-resolution captures are rejected at API ingress with HTTP 422 to prevent unreliable contour generation.
3. **Severe Perspective Distortion**: For angles >35° oblique tilt, homography can stretch outer edges; such cases are flagged for manual retake.

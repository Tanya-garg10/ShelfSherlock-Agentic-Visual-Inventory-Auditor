# ShelfSherlock: Agentic Visual Inventory Auditor

> “Every shelf has a story. We find what changed.”
> Computer vision that investigates shelf changes, follows evidence, and knows when to ask for a human.

ShelfSherlock is an autonomous visual auditing platform designed for retail planogram compliance and out-of-stock discovery. Rather than relying on static comparisons or hallucinating language models, ShelfSherlock couples sub-pixel computer vision (**OpenCV 5.0.0**) with a deterministic, bounded decision loop and an editorial React interface.

---

## 1. Verified Technology Stack

- **Computer Vision Core**: OpenCV 5.0.0 (`opencv-python==5.0.0.93`), NumPy 2.4, Pillow 13.0
- **Backend API**: FastAPI 0.162, Uvicorn 0.54, Pydantic 2.14, Python 3.11
- **Full-Stack Orchestration**: Express 4.21, TypeScript 7.0, `http-proxy-middleware`
- **Frontend Interface**: React 19, Vite 8, Tailwind CSS v4, Motion (Framer Motion 12), Lucide React
- **Test Framework**: Pytest 9.1, HTTPX 0.28

---

## 2. Quickstart & Local Setup

### Step A: Verify OpenCV 5.0

```bash
python3 -c "import cv2; print(cv2.__version__)"
# Expected output: 5.0.0
```

### Step B: Install Dependencies

```bash
# Python backend dependencies
pip3 install -r requirements.txt

# Node.js frontend dependencies
npm install
```

### Step C: Generate Synthetic Evaluation Dataset

```bash
python3 samples/generate_shelf_dataset.py
```

### Step D: Run Test Suite

```bash
PYTHONPATH=. pytest backend/tests/ -v
```

### Step E: Run Complete Full-Stack Product

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Express starts on port 3000, automatically spawns the FastAPI backend on port 5050, and proxies all API endpoints seamlessly.

---

## 3. API Contract

### `GET /health`
Returns system status, verified OpenCV version, and pipeline readiness.

```json
{
  "status": "HEALTHY",
  "service": "ShelfSherlock Agentic Auditor",
  "opencv_version": "5.0.0",
  "python_version": "3.11.2",
  "artifacts_directory": "/tmp/shelf_artifacts",
  "uptime_seconds": 12.4
}
```

### `POST /api/audit`
Accepts `multipart/form-data`:
- `reference_image`: Reference planogram shelf capture (JPEG/PNG/WebP, max 12MB).
- `current_image`: Observed store shelf capture.

Returns structured `AuditResponse` JSON containing:
- `audit_id`: Unique identifier.
- `status`: `COMPLETED` or `REVIEW_REQUIRED`.
- `summary`: Operational audit findings.
- `termination_reason`: Concrete reason (e.g. `AUDIT_COMPLETED_CHANGES_DETECTED`, `AMBIGUOUS_FEATURES_HUMAN_REVIEW`).
- `alignment`: Applied transformation (`ECC_AFFINE`, `ORB_HOMOGRAPHY`, or `IDENTITY`) with error metrics.
- `metrics`: Structural similarity (`SSIM`), `PSNR`, changed area %, and anomaly counts.
- `changed_regions`: Array of bounding boxes, surface %, edge density classifications (`structural_void`, `possible_displacement`, `uncertain_anomaly`), and crop URLs.
- `investigation_trace`: Ordered list of executed steps with observations, rationales, and OpenCV tool metrics.
- `artifacts`: URLs for reference, aligned current, annotated overlay, difference map, and thermal heatmap.

---

## 4. Experiences Overview

- **Experience A — Introduction**: Full-screen opening narrative with architectural scanning line and skippable navigation.
- **Experience B — Product Story**: Editorial product landing explaining planar homography, adaptive CLAHE difference mapping, and the 3-stage audit loop.
- **Experience C — Audit Workspace**: Dual-panel drag-and-drop file upload, live dimensions decoder, and one-click bundled benchmark loader.
- **Experience D — Visual Evidence**: Multi-layer viewer including an interactive Before/After comparison slider, thermal heatmaps, high-resolution evidence crops, and human decision buttons.
- **Experience E — Agentic Investigation**: Transparent, ordered execution log detailing every OpenCV operation and measurement that dictated the final termination state.

---

## 5. Documentation Directory

- `docs/architecture.md`: Comprehensive architecture breakdown.
- `docs/agent-decision-loop.md`: State machine flowchart and measurement rules.
- `reports/evaluation.md`: Benchmark results on the 4 controlled retail test cases.

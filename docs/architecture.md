# ShelfSherlock: System Architecture

ShelfSherlock is an autonomous agentic visual inventory auditor engineered for retail shelf change discovery. It couples sub-pixel computer vision (OpenCV 5.0) with a deterministic, bounded decision loop and an editorial web interface.

## 1. High-Level System Architecture

```
[ Client: React 19 + Vite ]
         │ (HTTP / FormData Multipart)
         ▼
[ Full-Stack Server: Express (Port 3000) ]
         │ (Proxy /api, /health, /artifacts)
         ▼
[ Computer Vision Core: FastAPI + Python 3.11 (Port 5050) ]
         │
         ├── Alignment Engine (ECC Affine & ORB Homography)
         ├── Difference Pipeline (CLAHE, Adaptive AbsDiff, Morphological Cleaners)
         ├── Region Deep-Dive (Canny Edge Density & Bhattacharyya Histograms)
         └── Bounded Agent Evaluator (Termination & Escalation Gates)
```

## 2. Component Directory Structure

- `backend/app/main.py`: FastAPI server mounting `/health`, `/api/audit`, and static `/artifacts`.
- `backend/app/api/audit.py`: Multipart upload handling, file size & format validation, and agent dispatch.
- `backend/app/agent/investigator.py`: Bounded agent decision loop recording deterministic execution events.
- `backend/app/vision/alignment.py`: Enhanced Correlation Coefficient (ECC) alignment with automatic ORB RANSAC homography failover.
- `backend/app/vision/difference.py`: Calibrated multi-threshold difference mapping and contour extraction.
- `backend/app/vision/metrics.py`: Mean SSIM, PSNR, sharpness (Laplacian variance), and normalized cross-correlation.
- `backend/app/vision/annotator.py`: Thermal colormap heatmaps, high-res evidence crop extraction, and bounding box rendering.
- `src/components/Introduction.tsx`: Experience A full-screen opening sequence with restrained motion.
- `src/components/ProductStory.tsx`: Experience B product landing & 3-stage methodology.
- `src/components/AuditWorkspace.tsx`: Experience C & D functional dual-dropzone audit workspace, multi-mode visual viewer, and human review decision gallery.
- `src/components/InvestigationTraceViewer.tsx`: Experience E real ordered execution trace viewer.
- `src/components/ImageComparisonSlider.tsx`: Draggable Before/After interactive slider.

## 3. Technology Verification

- **OpenCV Version**: Verified OpenCV 5.0.0 (`5.0.0.93`).
- **Python**: Python 3.11.2 runtime with NumPy 2.4, Pillow 13.0, FastAPI 0.162, Pydantic 2.14.
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Motion (Framer Motion 12), Lucide React.

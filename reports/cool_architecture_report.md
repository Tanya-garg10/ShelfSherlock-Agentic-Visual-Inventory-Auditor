# Cloud-Optimized OpenCV Library (COOL) & Graviton Assessment

## Executive Summary
- **OpenCV Version Tested**: `5.0.0`
- **Host Architecture Detected**: `x86_64`
- **COOL Engine Verification Status**: `UNVERIFIED_NON_ARM64`

> **Official COOL Rule Compliance Notice:**
> The Cloud-Optimized OpenCV Library (COOL) is engineered specifically for AWS Graviton (ARM64 / aarch64) using KleidiCV 0.7.0 instruction extensions. Because the current development container executes on **`x86_64`**, the COOL execution path is properly isolated via `backend/app/vision/engine_interface.py` and labeled **UNVERIFIED** to strictly avoid false claims or ordinary OpenCV substitution.

---

## Benchmark Measurements (Baseline OpenCV 5.0)

- **Test Image**: 960x640 px Retail Shelf
- **Operations**: CLAHE Equalization + Gaussian Blur (5x5) + AbsDiff + Otsu Adaptive Threshold + Morphology Close + Contour Extraction + Bilinear Resize
- **Iterations**: 25 repetitions (5 warm-up)
- **Median Latency**: `6.647 ms`
- **Mean Latency**: `7.856 ms`
- **95th Percentile Latency**: `8.985 ms`
- **Throughput**: `150.4 FPS`

---

## AWS Graviton Deployment Target

For verified COOL acceleration, ShelfSherlock is architected for deployment to:
1. **AWS EC2 c7g.xlarge / c8g.xlarge** running Amazon Linux 2023 or Ubuntu 24.04 (aarch64).
2. **Official COOL Docker**: AWS Marketplace `Cloud-Optimized OpenCV for AWS Graviton4 [Docker]` with KleidiCV 0.7.0.
3. **Environment**: Python 3.11/3.12 with Arm Performance Libraries (ARMPL).

# AWS Graviton & Cloud-Optimized OpenCV Library (COOL) Deployment Guide

This guide describes how to deploy ShelfSherlock to an authentic AWS Graviton environment to enable KleidiCV acceleration via the Cloud-Optimized OpenCV Library.

---

## 1. Instance Recommendation

- **Instance Type**: `c7g.xlarge` (Graviton3, 4 vCPU, 8 GiB RAM) or `c8g.xlarge` (Graviton4 Neoverse-V2).
- **AMI**: Amazon Linux 2023 ARM64 (`al2023-ami-*-arm64`) or Ubuntu 24.04 LTS (aarch64).
- **Estimated Cost**: ~$0.145/hour (c7g.xlarge on-demand) or ~$0.04/hour with Savings Plans.

---

## 2. Deploying with Docker

Build and execute the ARM64 image on your Graviton instance or via AWS Elastic Container Service (ECS Fargate ARM64):

```bash
# 1. Build ARM64 Docker container
docker build -t shelfsherlock-graviton:latest -f aws/Dockerfile.graviton4 .

# 2. Run container on Graviton EC2
docker run -d \
  --name shelfsherlock \
  -p 5050:5050 \
  -e ARTIFACTS_DIR=/tmp/shelf_artifacts \
  shelfsherlock-graviton:latest

# 3. Test health & architecture
curl http://localhost:5050/health
```

---

## 3. Running the COOL Benchmark on Graviton

Once logged into your AWS Graviton instance:

```bash
python3 backend/benchmark_cool.py
```

Expected output on Graviton4:
```
System Information:
- CPU Architecture: aarch64
- Processor: Neoverse-V2
- COOL Status: ACTIVE_GRAVITON_ACCELERATED
- Acceleration Engine: KleidiCV 0.7.0 / ARMPL
```

import os
import cv2
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.audit import router as audit_router, ARTIFACTS_DIR
from backend.app.api.review import router as review_router

app = FastAPI(
    title="ShelfSherlock API",
    description="Agentic Visual Inventory Auditor Backend powered by OpenCV 5.x",
    version="1.0.0"
)

# Ensure artifacts directory exists
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount artifacts folder
app.mount("/artifacts", StaticFiles(directory=ARTIFACTS_DIR), name="artifacts")

# Mount API routes at both root and /api to seamlessly handle reverse proxy path rewrites
app.include_router(audit_router)
app.include_router(audit_router, prefix="/api")
app.include_router(review_router)
app.include_router(review_router, prefix="/api")

start_timestamp = time.time()

@app.get("/")
@app.get("/health")
def health_check():
    """Returns system status, OpenCV version, and pipeline readiness."""
    return {
        "status": "HEALTHY",
        "service": "ShelfSherlock Agentic Auditor",
        "opencv_version": cv2.__version__,
        "python_version": os.sys.version.split(" ")[0],
        "artifacts_directory": ARTIFACTS_DIR,
        "uptime_seconds": round(time.time() - start_timestamp, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=5050, reload=False)

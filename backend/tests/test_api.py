import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["opencv_version"].startswith("5.")
    assert "ShelfSherlock" in data["service"]

def test_audit_missing_files():
    response = client.post("/api/audit")
    assert response.status_code == 422 # Unprocessable entity due to missing form files

def test_audit_invalid_file_format():
    files = {
        "reference_image": ("ref.txt", io.BytesIO(b"not an image"), "text/plain"),
        "current_image": ("curr.txt", io.BytesIO(b"also not an image"), "text/plain"),
    }
    response = client.post("/api/audit", files=files)
    assert response.status_code == 422 # Could not decode image

def test_audit_valid_sample_images():
    with open("samples/sample_2_ref_full.jpg", "rb") as f_ref, \
         open("samples/sample_2_curr_vacancies.jpg", "rb") as f_curr:
        files = {
            "reference_image": ("ref.jpg", f_ref, "image/jpeg"),
            "current_image": ("curr.jpg", f_curr, "image/jpeg"),
        }
        response = client.post("/api/audit", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "audit_id" in data
        assert data["status"] in ["COMPLETED", "REVIEW_REQUIRED"]
        assert len(data["investigation_trace"]) >= 5
        assert "structural_similarity_ssim" in data["metrics"]

import os
import cv2
import pytest
import numpy as np
from backend.app.agent.investigator import ShelfAuditorAgent
from backend.app.schemas.audit_schema import TerminationReason, AuditStatus

@pytest.fixture
def agent():
    return ShelfAuditorAgent(artifacts_dir="/tmp/shelf_test_artifacts")

def test_identical_images(agent):
    ref = cv2.imread("samples/sample_1_ref_nominal.jpg")
    curr = cv2.imread("samples/sample_1_curr_nominal.jpg")
    assert ref is not None and curr is not None

    res = agent.run_investigation(ref, curr, audit_id="test_ident")
    assert res.status == AuditStatus.COMPLETED
    assert res.termination_reason == TerminationReason.AUDIT_COMPLETED_NO_CHANGES
    assert res.metrics.total_anomalies_detected == 0
    assert len(res.investigation_trace) >= 4
    assert res.metrics.opencv_version.startswith("5.")

def test_vacancies_detected(agent):
    ref = cv2.imread("samples/sample_2_ref_full.jpg")
    curr = cv2.imread("samples/sample_2_curr_vacancies.jpg")
    assert ref is not None and curr is not None

    res = agent.run_investigation(ref, curr, audit_id="test_vac")
    assert res.status == AuditStatus.COMPLETED
    assert res.termination_reason == TerminationReason.AUDIT_COMPLETED_CHANGES_DETECTED
    assert res.metrics.total_anomalies_detected >= 1
    # Check that structural voids were identified
    voids = [r for r in res.changed_regions if r.classification == "structural_void"]
    assert len(voids) >= 1
    assert res.artifacts.difference_map is not None
    assert res.artifacts.annotated_overlay is not None

def test_shifted_alignment_recovery(agent):
    ref = cv2.imread("samples/sample_3_ref_aligned.jpg")
    curr = cv2.imread("samples/sample_3_curr_shifted.jpg")
    assert ref is not None and curr is not None

    res = agent.run_investigation(ref, curr, audit_id="test_shift")
    # Alignment should be executed and recovered
    assert res.alignment.method_used in ["ECC_AFFINE", "ORB_HOMOGRAPHY"]
    assert res.alignment.success is True

def test_ambiguous_glare_escalation(agent):
    ref = cv2.imread("samples/sample_4_ref_standard.jpg")
    curr = cv2.imread("samples/sample_4_curr_glare_ambiguous.jpg")
    assert ref is not None and curr is not None

    res = agent.run_investigation(ref, curr, audit_id="test_glare")
    # Should require human review due to ambiguous lighting/glare
    assert res.human_review_required is True
    assert res.status == AuditStatus.REVIEW_REQUIRED

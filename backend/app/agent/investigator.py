import os
import time
import uuid
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from backend.app.ai.featherless import enhance_region_notes, generate_audit_summary

from backend.app.schemas.audit_schema import (
    AuditResponse,
    AuditStatus,
    TerminationReason,
    AlignmentInfo,
    AuditMetrics,
    ChangedRegion,
    BoundingBox,
    InvestigationEvent,
    ArtifactURLs,
)
from backend.app.vision.alignment import align_images_ecc, align_images_orb
from backend.app.vision.difference import compute_difference_map
from backend.app.vision.metrics import (
    compute_sharpness,
    compute_ssim,
    compute_psnr,
    compute_normalized_correlation
)
from backend.app.vision.annotator import (
    generate_heatmap,
    annotate_shelf_image,
    extract_region_crop
)

class ShelfAuditorAgent:
    """
    Genuine bounded agentic investigator that uses real OpenCV measurements
    to branch decisions dynamically during visual inventory audits.
    """
    def __init__(self, artifacts_dir: str = "/tmp/shelf_artifacts"):
        self.artifacts_dir = artifacts_dir
        os.makedirs(self.artifacts_dir, exist_ok=True)
        self.max_events = 15

    def run_investigation(
        self,
        ref_bgr: np.ndarray,
        curr_bgr: np.ndarray,
        audit_id: str
    ) -> AuditResponse:
        start_time = time.perf_counter()
        events: List[InvestigationEvent] = []
        limitations: List[str] = []
        step_counter = 1

        def add_event(name: str, tool: str, obs: str, rat: str, outcome: str, next_act: str, meas: Dict[str, Any] = None):
            nonlocal step_counter
            ev = InvestigationEvent(
                event_id=f"EV-{audit_id[:6]}-{step_counter:02d}",
                step_number=step_counter,
                step_name=name,
                tool_executed=tool,
                observation=obs,
                rationale=rat,
                outcome=outcome,
                next_action=next_act,
                measurements=meas or {}
            )
            events.append(ev)
            step_counter += 1

        # ----------------------------------------------------
        # STEP 1: Input Invariant Verification & Preprocessing
        # ----------------------------------------------------
        h_ref, w_ref = ref_bgr.shape[:2]
        h_curr, w_curr = curr_bgr.shape[:2]

        ref_gray = cv2.cvtColor(ref_bgr, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY)

        add_event(
            name="Input Invariant Verification",
            tool="cv2.cvtColor & shape inspection",
            obs=f"Reference frame is {w_ref}x{h_ref}px; Current frame is {w_curr}x{h_curr}px. Channels: 3 (BGR).",
            rat="Audit requires equal planar dimensions before spatial correlation can be computed.",
            outcome=f"Dimensions inspected. {'Aspect ratios aligned.' if (w_ref/h_ref == w_curr/h_curr) else 'Resizing current frame to match reference geometry.'}",
            next_act="Assess Image Focus & Optical Quality",
            meas={"ref_w": w_ref, "ref_h": h_ref, "curr_w": w_curr, "curr_h": h_curr}
        )

        if (h_curr != h_ref) or (w_curr != w_ref):
            curr_bgr = cv2.resize(curr_bgr, (w_ref, h_ref), interpolation=cv2.INTER_AREA)
            curr_gray = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY)

        # ----------------------------------------------------
        # STEP 2: Image Quality Guard (Focus, Luminance, Exposure, Aspect Ratio)
        # ----------------------------------------------------
        from backend.app.vision.quality_guard import inspect_image_quality_guard
        quality_guard_report = inspect_image_quality_guard(ref_bgr, curr_bgr)
        ref_sharp = quality_guard_report.reference_quality.sharpness_score
        curr_sharp = quality_guard_report.current_quality.sharpness_score

        if quality_guard_report.actionable_warnings:
            for w in quality_guard_report.actionable_warnings:
                limitations.append(w)

        add_event(
            name="Image Quality Guard Assessment",
            tool="quality_guard.inspect_image_quality_guard",
            obs=f"Reference sharpness: {ref_sharp:.1f} (Grade: {quality_guard_report.reference_quality.quality_grade}), Current sharpness: {curr_sharp:.1f} (Grade: {quality_guard_report.current_quality.quality_grade}). Warnings generated: {len(quality_guard_report.actionable_warnings)}.",
            rat="Evaluates pre-interpretation optical signals (exposure, blur, contrast) to detect conditions that degrade spatial certainty.",
            outcome=f"Quality guard evaluated. {len(quality_guard_report.actionable_warnings)} advisory notices attached.",
            next_act="Compute Coarse Spatial Correlation",
            meas={
                "ref_sharpness": round(ref_sharp, 2),
                "curr_sharpness": round(curr_sharp, 2),
                "curr_mean_lum": round(quality_guard_report.current_quality.mean_luminance, 2),
                "curr_glare_pct": round(quality_guard_report.current_quality.overexposed_percent, 2),
                "aspect_drift_pct": round(quality_guard_report.optical_alignment_drift_percent, 2)
            }
        )

        # ----------------------------------------------------
        # STEP 3: Coarse Spatial Correlation Analysis
        # ----------------------------------------------------
        initial_corr = compute_normalized_correlation(ref_gray, curr_gray)
        initial_ssim = compute_ssim(ref_gray, curr_gray)

        add_event(
            name="Coarse Spatial Correlation",
            tool="cv2.matchTemplate (TM_CCORR_NORMED) & SSIM",
            obs=f"Initial normalized cross-correlation: {initial_corr:.4f}, Baseline SSIM: {initial_ssim:.4f}.",
            rat="Determines whether reference and current capture angles have drifted, requiring geometric transformation.",
            outcome="Negligible drift detected; proceeding to alignment verification." if initial_corr > 0.985 else "Significant camera pose displacement detected; engaging active planar alignment.",
            next_act="Planar Alignment Execution",
            meas={"initial_correlation": round(initial_corr, 4), "baseline_ssim": round(initial_ssim, 4)}
        )

        # ----------------------------------------------------
        # STEP 4: Alignment Policy Execution (ECC with ORB Fallback)
        # ----------------------------------------------------
        aligned_curr_gray = curr_gray
        aligned_curr_bgr = curr_bgr
        alignment_method_used = "IDENTITY"
        alignment_success = True
        alignment_error = 0.0

        if initial_corr < 0.995:
            # Attempt Enhanced Correlation Coefficient (ECC)
            ecc_ok, ecc_warped_gray, ecc_meta = align_images_ecc(ref_gray, curr_gray, motion_type=cv2.MOTION_AFFINE)

            if ecc_ok and ecc_meta.get("correlation_coefficient", 0) >= 0.82:
                aligned_curr_gray = ecc_warped_gray
                h, w = ref_bgr.shape[:2]
                matrix = np.array(ecc_meta["matrix"], dtype=np.float32)
                aligned_curr_bgr = cv2.warpAffine(curr_bgr, matrix, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
                alignment_method_used = "ECC_AFFINE"
                alignment_error = round(1.0 - ecc_meta["correlation_coefficient"], 4)

                add_event(
                    name="Planar Alignment (ECC)",
                    tool="cv2.findTransformECC (Affine)",
                    obs=f"ECC converged with correlation coefficient {ecc_meta['correlation_coefficient']:.4f}.",
                    rat="Sub-pixel correlation maximization aligns planar shelf structure without feature-matching artifacts.",
                    outcome="Planar shelf transformation successfully locked.",
                    next_act="Compute Luminance Difference & Segmentation",
                    meas={"correlation": round(ecc_meta['correlation_coefficient'], 4), "method": "ECC_AFFINE"}
                )
            else:
                # Fallback to ORB Keypoint RANSAC Homography
                add_event(
                    name="Alignment Fallback Triggered",
                    tool="Agent Policy Switch -> ORB Feature Extraction",
                    obs=f"ECC alignment did not satisfy tolerance ({ecc_meta.get('error', 'Low CC')}).",
                    rat="Perspective tilt or localized shelf occlusion requires scale/rotation-invariant keypoint matching.",
                    outcome="Switching to feature-based RANSAC homography.",
                    next_act="Execute ORB Homography Alignment",
                    meas={"ecc_result": "insufficient_correlation"}
                )

                orb_ok, orb_warped_gray, orb_meta = align_images_orb(ref_gray, curr_gray)
                if orb_ok and orb_meta.get("inlier_ratio", 0) >= 0.35:
                    aligned_curr_gray = orb_warped_gray
                    h, w = ref_bgr.shape[:2]
                    h_mat = np.array(orb_meta["matrix"], dtype=np.float32)
                    aligned_curr_bgr = cv2.warpPerspective(curr_bgr, h_mat, (w, h), flags=cv2.INTER_LINEAR)
                    alignment_method_used = "ORB_HOMOGRAPHY"
                    alignment_error = round(1.0 - orb_meta["inlier_ratio"], 4)

                    add_event(
                        name="Feature-Based Alignment (ORB)",
                        tool="cv2.ORB_create & cv2.findHomography (RANSAC)",
                        obs=f"ORB identified {orb_meta.get('good_matches', 0)} matches with {orb_meta.get('inliers', 0)} inliers (ratio {orb_meta.get('inlier_ratio', 0):.2f}).",
                        rat="Calculates projective homography across invariant visual anchors.",
                        outcome="Perspective homography warped successfully.",
                        next_act="Compute Luminance Difference & Segmentation",
                        meas=orb_meta
                    )
                else:
                    alignment_success = False
                    alignment_method_used = "FAILED"
                    limitations.append("Camera perspective drifted beyond automated planar recovery limits. Visual difference regions may reflect geometric displacement.")

                    add_event(
                        name="Alignment Evaluation Inconclusive",
                        tool="Alignment Quality Gate",
                        obs=f"Both ECC and ORB alignment fell below convergence thresholds.",
                        rat="Proceeding with unwarped baseline to inspect scene, but tagging review requirement.",
                        outcome="Flagged alignment uncertainty for auditor review.",
                        next_act="Compute Luminance Difference (Conservative)",
                        meas={"orb_inlier_ratio": orb_meta.get("inlier_ratio", 0) if 'orb_meta' in locals() else 0}
                    )
        else:
            add_event(
                name="Rigid Identity Verified",
                tool="Identity Transform Pass",
                obs=f"Initial frame correlation {initial_corr:.4f} exceeds 0.995 invariant threshold.",
                rat="No geometric warp necessary; avoids interpolation softening.",
                outcome="Direct spatial comparison preserved.",
                next_act="Compute Luminance Difference & Segmentation",
                meas={"correlation": initial_corr}
            )

        # ----------------------------------------------------
        # STEP 5: Difference Mapping & Contour Extraction
        # ----------------------------------------------------
        diff_map, thresh_mask, candidate_regions = compute_difference_map(ref_gray, aligned_curr_gray)

        total_pixels = h_ref * w_ref
        changed_pixels = int(cv2.countNonZero(thresh_mask))
        overall_change_pct = round((changed_pixels / total_pixels) * 100, 3)

        add_event(
            name="Difference Mapping & Segmentation",
            tool="cv2.absdiff & Adaptive/Otsu Morphology",
            obs=f"Extracted {len(candidate_regions)} candidate anomaly contours. Total changed surface: {overall_change_pct:.2f}%.",
            rat="Applies illumination equalization (CLAHE) followed by multi-threshold opening/closing to isolate real physical changes.",
            outcome=f"Isolated {len(candidate_regions)} candidate change zones." if candidate_regions else "No significant contour variance above noise floor.",
            next_act="Deep Investigation of Candidate Regions" if candidate_regions else "Synthesize Decision",
            meas={"candidate_count": len(candidate_regions), "changed_pixels": changed_pixels, "overall_change_pct": overall_change_pct}
        )

        # ----------------------------------------------------
        # STEP 6: Targeted Deep-Dive into Candidate Regions
        # ----------------------------------------------------
        final_changed_regions: List[ChangedRegion] = []

        if candidate_regions:
            # Investigate top candidate regions (bounded to top 6 to prevent runaway computation)
            top_regions = candidate_regions[:6]
            investigated_count = 0

            for reg in top_regions:
                investigated_count += 1
                rx, ry, rw, rh = reg["x"], reg["y"], reg["width"], reg["height"]

                # Extract local crops
                roi_ref = ref_gray[ry:ry+rh, rx:rx+rw]
                roi_curr = aligned_curr_gray[ry:ry+rh, rx:rx+rw]

                # 1. Local Edge Density Analysis (Canny before vs after)
                edges_ref = cv2.Canny(roi_ref, 50, 150)
                edges_curr = cv2.Canny(roi_curr, 50, 150)
                edge_ref_cnt = cv2.countNonZero(edges_ref)
                edge_curr_cnt = cv2.countNonZero(edges_curr)
                edge_ratio = edge_curr_cnt / max(edge_ref_cnt, 1)

                # 2. Local Histogram Comparison (Bhattacharyya distance)
                hist_ref = cv2.calcHist([roi_ref], [0], None, [32], [0, 256])
                hist_curr = cv2.calcHist([roi_curr], [0], None, [32], [0, 256])
                cv2.normalize(hist_ref, hist_ref, 0, 1, cv2.NORM_MINMAX)
                cv2.normalize(hist_curr, hist_curr, 0, 1, cv2.NORM_MINMAX)
                bhattacharyya = cv2.compareHist(hist_ref, hist_curr, cv2.HISTCMP_BHATTACHARYYA)

                # 3. Decision classification based on edge density, histogram divergence, & shape solidity
                classification = "visual_change_detected"
                notes = "Consistent visual change detected in shelf slot."
                confidence = 0.85

                # Glare / lighting check: diffuse contour (low solidity) or low histogram delta with high edge retention
                if reg["solidity"] < 0.38 or (edge_ratio > 0.80 and bhattacharyya < 0.30 and reg["mean_intensity_delta"] < 40):
                    classification = "uncertain_anomaly"
                    notes = "Diffuse illumination artifact or specular glare detected across shelf surface; physical boundaries remain largely intact."
                    confidence = 0.56
                elif edge_ratio < 0.45 and reg["mean_intensity_delta"] > 24:
                    classification = "structural_void"
                    notes = "Edge density dropped by >55%; product silhouette missing, exposing shelf backboard."
                    confidence = 0.94
                elif edge_ratio > 0.65 and bhattacharyya > 0.30:
                    classification = "possible_displacement"
                    notes = "Edge density preserved but localized visual signature shifted. Possible product displacement or substitution."
                    confidence = 0.82

                # Enhance notes with Featherless AI (falls back to static notes if unavailable)
                ai_notes = enhance_region_notes(
                    classification=classification,
                    area_percent=reg["area_percent"],
                    mean_intensity_delta=reg["mean_intensity_delta"],
                    edge_ratio=edge_ratio,
                    bhattacharyya=bhattacharyya,
                    solidity=reg["solidity"],
                )
                if ai_notes:
                    notes = ai_notes

                # Save crop artifact
                crop_bgr = extract_region_crop(aligned_curr_bgr, reg)
                crop_filename = f"crop_{audit_id}_{reg['region_id']}.jpg"
                crop_path = os.path.join(self.artifacts_dir, crop_filename)
                cv2.imwrite(crop_path, crop_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
                crop_url = f"/artifacts/{crop_filename}"

                changed_reg = ChangedRegion(
                    region_id=reg["region_id"],
                    box=BoundingBox(x=rx, y=ry, width=rw, height=rh),
                    area_pixels=reg["area_pixels"],
                    area_percent=reg["area_percent"],
                    mean_intensity_delta=reg["mean_intensity_delta"],
                    contour_confidence=round(confidence, 3),
                    classification=classification,
                    crop_url=crop_url,
                    investigation_notes=notes
                )
                final_changed_regions.append(changed_reg)

            add_event(
                name="Localized Region Deep-Dive",
                tool="cv2.Canny & cv2.calcHist (Bhattacharyya)",
                obs=f"Inspected {investigated_count} candidate regions. Structural voids: {sum(1 for r in final_changed_regions if r.classification == 'structural_void')}, Displacements: {sum(1 for r in final_changed_regions if r.classification == 'possible_displacement')}, Uncertain: {sum(1 for r in final_changed_regions if r.classification == 'uncertain_anomaly')}.",
                rat="Distinguishes genuine shelf item vacancies from glare, shadow, and packaging rotation.",
                outcome="Synthesized individual region classifications and evidence crops.",
                next_act="Final Evidence Synthesis",
                meas={"investigated_regions": investigated_count}
            )

        # ----------------------------------------------------
        # STEP 7: Render Artifacts & Global Metrics
        # ----------------------------------------------------
        final_ssim = compute_ssim(ref_gray, aligned_curr_gray)
        final_psnr = compute_psnr(ref_gray, aligned_curr_gray)

        # Generate Heatmap
        heatmap_img = generate_heatmap(diff_map, aligned_curr_bgr)
        # Generate Annotated Overlay using Pydantic v2 model_dump
        annotated_img = annotate_shelf_image(aligned_curr_bgr, [{"x": r.box.x, "y": r.box.y, "width": r.box.width, "height": r.box.height, "region_id": r.region_id, "area_percent": r.area_percent, "classification": r.classification} for r in final_changed_regions])

        # Save artifacts
        ref_filename = f"ref_{audit_id}.jpg"
        curr_filename = f"curr_{audit_id}.jpg"
        aligned_filename = f"aligned_{audit_id}.jpg"
        diff_filename = f"diff_{audit_id}.jpg"
        overlay_filename = f"annotated_{audit_id}.jpg"
        heatmap_filename = f"heatmap_{audit_id}.jpg"

        cv2.imwrite(os.path.join(self.artifacts_dir, ref_filename), ref_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(self.artifacts_dir, curr_filename), curr_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(self.artifacts_dir, aligned_filename), aligned_curr_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(self.artifacts_dir, diff_filename), diff_map, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(self.artifacts_dir, overlay_filename), annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(os.path.join(self.artifacts_dir, heatmap_filename), heatmap_img, [cv2.IMWRITE_JPEG_QUALITY, 92])

        # ----------------------------------------------------
        # STEP 8: Decision Synthesis & Termination Reason
        # ----------------------------------------------------
        has_uncertain_regions = any(r.classification == "uncertain_anomaly" for r in final_changed_regions)
        avg_conf = (
            sum(r.contour_confidence for r in final_changed_regions) / len(final_changed_regions)
            if final_changed_regions else 1.0
        )

        if not alignment_success:
            status = AuditStatus.REVIEW_REQUIRED
            termination_reason = TerminationReason.ALIGNMENT_UNCERTAIN_HUMAN_REVIEW
            human_review_required = True
            summary = "Audit flagged for human review due to camera perspective alignment uncertainty."
        elif has_uncertain_regions or avg_conf < 0.70:
            status = AuditStatus.REVIEW_REQUIRED
            termination_reason = TerminationReason.AMBIGUOUS_FEATURES_HUMAN_REVIEW
            human_review_required = True
            summary = f"Detected {len(final_changed_regions)} shelf variations with ambiguous visual evidence requiring manual verification."
        elif len(final_changed_regions) == 0:
            status = AuditStatus.COMPLETED
            termination_reason = TerminationReason.AUDIT_COMPLETED_NO_CHANGES
            human_review_required = False
            summary = "Shelf audit complete. Visual state is consistent with reference planogram. No changes detected."
        else:
            status = AuditStatus.COMPLETED
            termination_reason = TerminationReason.AUDIT_COMPLETED_CHANGES_DETECTED
            human_review_required = False
            summary = f"Shelf audit complete. Identified {len(final_changed_regions)} distinct visual variations across {overall_change_pct:.2f}% of the shelf surface."

        # Enhance summary with Featherless AI (falls back to static summary if unavailable)
        ai_summary = generate_audit_summary(
            n_changes=len(final_changed_regions),
            overall_change_pct=overall_change_pct,
            ssim=final_ssim,
            psnr=final_psnr,
            has_uncertain=has_uncertain_regions,
            classifications=[r.classification for r in final_changed_regions],
        )
        if ai_summary:
            summary = ai_summary

        exec_time = round((time.perf_counter() - start_time) * 1000, 2)

        add_event(
            name="Audit Decision Synthesis",
            tool="Bounded Agent Evaluator",
            obs=f"Final SSIM: {final_ssim:.4f}, PSNR: {final_psnr:.2f}dB. Human review required: {human_review_required}.",
            rat="Synthesizes alignment precision, contour certainty, and optical metrics into conclusive operational determination.",
            outcome=f"Audit concluded with termination reason: {termination_reason.value}",
            next_act=None,
            meas={"final_ssim": round(final_ssim, 4), "final_psnr": round(final_psnr, 2), "duration_ms": exec_time}
        )

        return AuditResponse(
            audit_id=audit_id,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            status=status,
            summary=summary,
            termination_reason=termination_reason,
            alignment=AlignmentInfo(
                method_used=alignment_method_used,
                success=alignment_success,
                iterations_run=100 if "ECC" in alignment_method_used else 1,
                alignment_error=alignment_error
            ),
            metrics=AuditMetrics(
                reference_dimensions={"width": w_ref, "height": h_ref},
                current_dimensions={"width": w_curr, "height": h_curr},
                structural_similarity_ssim=round(final_ssim, 4),
                peak_signal_noise_psnr=round(final_psnr, 2),
                overall_change_area_percent=overall_change_pct,
                total_anomalies_detected=len(final_changed_regions),
                average_anomaly_confidence=round(avg_conf, 3),
                execution_time_ms=exec_time,
                opencv_version=cv2.__version__
            ),
            quality_guard=quality_guard_report,
            changed_regions=final_changed_regions,
            investigation_trace=events,
            artifacts=ArtifactURLs(
                reference=f"/artifacts/{ref_filename}",
                current=f"/artifacts/{curr_filename}",
                aligned_current=f"/artifacts/{aligned_filename}",
                difference_map=f"/artifacts/{diff_filename}",
                annotated_overlay=f"/artifacts/{overlay_filename}",
                heatmap=f"/artifacts/{heatmap_filename}"
            ),
            limitations=limitations,
            human_review_required=human_review_required
        )

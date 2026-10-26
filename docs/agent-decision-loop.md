# ShelfSherlock: Agent Decision Loop

ShelfSherlock does not use generative LLMs to narrate fictional vision tasks. Instead, it implements a genuine, bounded state machine where **each subsequent action is strictly governed by numerical measurements returned from OpenCV 5.0**.

## 1. Decision Flowchart

```
                 [Input Frames: Ref & Curr]
                             │
            [Step 1: Check Invariants & Dimensions]
                             │
            [Step 2: Laplacian Focus Assessment]
                             │
            [Step 3: Coarse Spatial Correlation]
                             │
              ┌──────────────┴──────────────┐
     Corr >= 0.995                 Corr < 0.995
              │                             │
   [Skip Alignment Warp]         [Step 4: Execute ECC Affine]
              │                             │
              │                   ┌─────────┴─────────┐
              │             ECC ok (CC >= 0.82)   ECC diverged / low CC
              │                   │                   │
              │                   │      [Fallback: ORB RANSAC Homography]
              │                   │                   │
              │                   │         ┌─────────┴─────────┐
              │                   │     Inliers >= 35%      Inliers < 35%
              │                   │         │                   │
              │                   └────┬────┘             [Flag Alignment]
              │                        │                  [Uncertain Review]
              └────────────────────────┼────────────────────────┘
                                       │
                [Step 5: CLAHE Difference & Segmentation]
                                       │
                        ┌──────────────┴──────────────┐
                 No Contours                    Contours Found
                        │                             │
        [AUDIT_COMPLETED_NO_CHANGES]       [Step 6: Local Deep-Dive]
                        │                  (Canny Edge Delta & Bhattacharyya)
                        │                             │
                        │               ┌─────────────┴─────────────┐
                        │        Edge Drop > 55%             Solidity < 0.38
                        │               │                    or Glare Profile
                        │        [STRUCTURAL VOID]                  │
                        │               │                   [UNCERTAIN ANOMALY]
                        │               └─────────────┬─────────────┘
                        │                             │
                        └──────────────┬──────────────┘
                                       │
                      [Step 7: Decision Synthesis]
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
  Uncertain Anomaly?           Alignment Uncertain?            All High-Conf?
       │                               │                               │
[AMBIGUOUS_FEATURES_            [ALIGNMENT_UNCERTAIN_            [AUDIT_COMPLETED_
   HUMAN_REVIEW]                   HUMAN_REVIEW]                CHANGES_DETECTED]
```

## 2. Event Trace Contract

Every executed event emitted in the `investigation_trace` JSON array contains:
1. `event_id`: Unique identifier (e.g. `EV-b45bfc-03`).
2. `step_number`: 1-indexed execution order.
3. `step_name`: Concrete pipeline stage.
4. `tool_executed`: Exact OpenCV / Python function called.
5. `observation`: Observed physical attributes.
6. `rationale`: Why this specific tool was run given prior data.
7. `measurements`: Exact dictionary of numeric outputs (correlation, SSIM, inliers, pixel delta).
8. `outcome`: Operational result of this step.
9. `next_action`: Dynamic downstream target chosen by the policy.

## 3. Termination Reasons

- `AUDIT_COMPLETED_NO_CHANGES`: Reference and current shelf states are within nominal noise tolerance.
- `AUDIT_COMPLETED_CHANGES_DETECTED`: Changes confirmed with high confidence (e.g. structural voids or item displacement).
- `ALIGNMENT_UNCERTAIN_HUMAN_REVIEW`: Perspective distortion could not be resolved reliably by ECC or ORB homography.
- `AMBIGUOUS_FEATURES_HUMAN_REVIEW`: Diffuse reflections, specular glare, or low-contrast anomalies require store personnel review.
- `PROCESSING_LIMIT_REACHED`: Region candidate count exceeded bounded execution threshold.
- `INPUT_VALIDATION_FAILED`: Corrupted image, unsupported format, or invalid dimensions.

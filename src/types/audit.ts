export type AuditStatus = 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';

export type TerminationReason =
  | 'AUDIT_COMPLETED_NO_CHANGES'
  | 'AUDIT_COMPLETED_CHANGES_DETECTED'
  | 'ALIGNMENT_UNCERTAIN_HUMAN_REVIEW'
  | 'AMBIGUOUS_FEATURES_HUMAN_REVIEW'
  | 'PROCESSING_LIMIT_REACHED'
  | 'INPUT_VALIDATION_FAILED';

export type HumanReviewDecision =
  | 'CONFIRMED_CHANGE'
  | 'NOT_MEANINGFUL'
  | 'NEEDS_FURTHER_REVIEW'
  | 'PENDING';

export interface HumanReviewRecord {
  region_id: string;
  decision: HumanReviewDecision;
  reviewer_notes?: string;
  reviewer_id?: string;
  timestamp: string;
}

export interface ImageQualityMetrics {
  width: number;
  height: number;
  aspect_ratio: number;
  mean_luminance: number;
  rms_contrast: number;
  sharpness_score: number;
  underexposed_percent: number;
  overexposed_percent: number;
  quality_grade: 'EXCELLENT' | 'ACCEPTABLE' | 'MARGINAL' | 'POOR';
}

export interface QualityGuardReport {
  reference_quality: ImageQualityMetrics;
  current_quality: ImageQualityMetrics;
  optical_alignment_drift_percent: number;
  actionable_warnings: string[];
  disclaimer: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChangedRegion {
  region_id: string;
  box: BoundingBox;
  area_pixels: number;
  area_percent: number;
  mean_intensity_delta: number;
  contour_confidence: number;
  classification: 'visual_change_detected' | 'possible_displacement' | 'structural_void' | 'uncertain_anomaly' | string;
  crop_url?: string;
  investigation_notes: string;
  human_decision?: HumanReviewDecision;
}

export interface AlignmentInfo {
  method_used: string;
  success: boolean;
  iterations_run: number;
  alignment_error: number;
  scale_factor_x?: number;
  scale_factor_y?: number;
}

export interface AuditMetrics {
  reference_dimensions: { width: number; height: number };
  current_dimensions: { width: number; height: number };
  structural_similarity_ssim: number;
  peak_signal_noise_psnr: number;
  overall_change_area_percent: number;
  total_anomalies_detected: number;
  average_anomaly_confidence: number;
  execution_time_ms: number;
  opencv_version: string;
}

export interface InvestigationEvent {
  event_id: string;
  step_number: number;
  step_name: string;
  tool_executed: string;
  observation: string;
  rationale: string;
  measurements: Record<string, any>;
  outcome: string;
  next_action?: string | null;
}

export interface ArtifactURLs {
  reference: string;
  current: string;
  aligned_current?: string;
  difference_map?: string;
  annotated_overlay?: string;
  heatmap?: string;
}

export interface AuditResponse {
  audit_id: string;
  timestamp: string;
  status: AuditStatus;
  summary: string;
  termination_reason: TerminationReason;
  alignment: AlignmentInfo;
  metrics: AuditMetrics;
  quality_guard?: QualityGuardReport;
  changed_regions: ChangedRegion[];
  human_reviews?: Record<string, HumanReviewRecord>;
  investigation_trace: InvestigationEvent[];
  artifacts: ArtifactURLs;
  limitations: string[];
  human_review_required: boolean;
}

export interface SampleCase {
  case_id: string;
  name: string;
  reference: string;
  current: string;
  expected_outcome: string;
  ground_truth_changes: number;
  description: string;
}

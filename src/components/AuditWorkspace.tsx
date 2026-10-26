import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  Activity,
  FileText,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Printer,
  Cpu,
  UserCheck
} from 'lucide-react';
import {
  AuditResponse,
  ChangedRegion,
  SampleCase,
  HumanReviewDecision
} from '../types/audit';
import { VisualEvidenceExplorer } from './VisualEvidenceExplorer';
import { ImageQualityGuardCard } from './ImageQualityGuardCard';
import { HumanReviewQueue } from './HumanReviewQueue';
import { PrintableAuditReport } from './PrintableAuditReport';
import { InvestigationTraceViewer } from './InvestigationTraceViewer';

interface AuditWorkspaceProps {
  onBackToStory: () => void;
  onOpenDiagnostics: () => void;
  initialSampleCaseId?: string | null;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({
  onBackToStory,
  onOpenDiagnostics,
  initialSampleCaseId,
}) => {
  // Upload States
  const [refFile, setRefFile] = useState<File | null>(null);
  const [currFile, setCurrFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [currPreview, setCurrPreview] = useState<string | null>(null);
  const [refDimensions, setRefDimensions] = useState<{ width: number; height: number } | null>(null);
  const [currDimensions, setCurrDimensions] = useState<{ width: number; height: number } | null>(null);

  // Execution States
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<ChangedRegion | null>(null);

  // Human Review & Report States
  const [humanReviews, setHumanReviews] = useState<Record<string, HumanReviewDecision>>({});
  const [isReportOpen, setIsReportOpen] = useState(false);

  // System & Sample States
  const [samples, setSamples] = useState<SampleCase[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<{ status: string; opencv: string } | null>(null);

  const refInputRef = useRef<HTMLInputElement>(null);
  const currInputRef = useRef<HTMLInputElement>(null);

  // Fetch health and samples on mount
  useEffect(() => {
    fetch('/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setHealthStatus({ status: data.status, opencv: data.opencv_version });
        }
      })
      .catch(() => setHealthStatus({ status: 'OFFLINE', opencv: 'Unknown' }));

    fetch('/samples/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cases) {
          setSamples(data.cases);
          if (initialSampleCaseId) {
            loadSampleById(initialSampleCaseId, data.cases);
          }
        }
      })
      .catch((err) => console.error('Failed to load sample manifest:', err));
  }, [initialSampleCaseId]);

  // Load sample case helper
  const loadSampleById = async (caseId: string, caseList: SampleCase[] = samples) => {
    const target = caseList.find((c) => c.case_id === caseId);
    if (!target) return;

    setSelectedSampleId(caseId);
    setAuditResult(null);
    setAuditError(null);
    setHumanReviews({});

    try {
      const [refBlob, currBlob] = await Promise.all([
        fetch(`/samples/${target.reference}`).then((r) => r.blob()),
        fetch(`/samples/${target.current}`).then((r) => r.blob()),
      ]);

      const refF = new File([refBlob], target.reference, { type: 'image/jpeg' });
      const currF = new File([currBlob], target.current, { type: 'image/jpeg' });

      handleSetRefFile(refF);
      handleSetCurrFile(currF);
    } catch (e) {
      setAuditError('Failed to load bundled sample files.');
    }
  };

  const handleSetRefFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAuditError('Unsupported image format. Please use JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAuditError('Image exceeds the 12MB limit.');
      return;
    }
    setRefFile(file);
    const url = URL.createObjectURL(file);
    setRefPreview(url);
    setAuditError(null);

    const img = new Image();
    img.onload = () => setRefDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  };

  const handleSetCurrFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAuditError('Unsupported image format. Please use JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAuditError('Image exceeds the 12MB limit.');
      return;
    }
    setCurrFile(file);
    const url = URL.createObjectURL(file);
    setCurrPreview(url);
    setAuditError(null);

    const img = new Image();
    img.onload = () => setCurrDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
  };

  const clearAll = () => {
    setRefFile(null);
    setCurrFile(null);
    setRefPreview(null);
    setCurrPreview(null);
    setRefDimensions(null);
    setCurrDimensions(null);
    setAuditResult(null);
    setAuditError(null);
    setSelectedRegion(null);
    setHumanReviews({});
    setSelectedSampleId('');
  };

  const handleRunAudit = async () => {
    if (!refFile || !currFile) {
      setAuditError('Please upload both Reference and Current shelf images.');
      return;
    }

    setIsRunning(true);
    setAuditError(null);
    setAuditResult(null);
    setSelectedRegion(null);
    setHumanReviews({});

    const formData = new FormData();
    formData.append('reference_image', refFile);
    formData.append('current_image', currFile);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Audit processing failed.' }));
        throw new Error(errorData.detail || `Server returned status ${response.status}`);
      }

      const data: AuditResponse = await response.json();
      setAuditResult(data);

      if (data.changed_regions?.length > 0) {
        setSelectedRegion(data.changed_regions[0]);
      }

      // Check for any previously persisted reviews for this audit ID
      fetch(`/api/audit/${data.audit_id}/review`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((stored: Record<string, any>) => {
          if (stored && Object.keys(stored).length > 0) {
            const loaded: Record<string, HumanReviewDecision> = {};
            Object.keys(stored).forEach((k) => {
              loaded[k] = stored[k].decision;
            });
            setHumanReviews(loaded);
          }
        })
        .catch(() => {});
    } catch (err: any) {
      setAuditError(err.message || 'An unexpected network error occurred while running the audit.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleUpdateHumanDecision = (regionId: string, decision: HumanReviewDecision, notes?: string) => {
    setHumanReviews((prev) => ({ ...prev, [regionId]: decision }));
    if (auditResult?.audit_id) {
      try {
        localStorage.setItem(`shelf_review_${auditResult.audit_id}_${regionId}`, decision);
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#20211F] flex flex-col">
      {/* Top Bar following 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-[#F8F7F3] border-b border-[#E5E3DC] px-6 lg:px-12 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark with context */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBackToStory}
            className="text-lg font-semibold tracking-tight text-[#20211F] hover:text-[#3158C9] transition-colors"
          >
            ShelfSherlock
          </button>
          <span className="text-[#20211F]/30" aria-hidden="true">/</span>
          <span className="text-xs font-mono uppercase tracking-widest text-[#20211F]/70">
            AUDIT WORKSPACE
          </span>
        </div>

        {/* Zone 2: System Health and Sample Selector */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 ${
                healthStatus?.status === 'HEALTHY' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            />
            <span className="text-[#20211F]/70">
              CORE: OpenCV {healthStatus?.opencv || '5.0.0'}
            </span>
          </div>

          <span className="text-[#20211F]/30" aria-hidden="true">|</span>

          {/* Sample quick picker */}
          <div className="flex items-center gap-2">
            <span className="text-[#20211F]/60">SAMPLE AUDITS:</span>
            <select
              value={selectedSampleId}
              onChange={(e) => loadSampleById(e.target.value)}
              className="bg-white border border-[#E5E3DC] px-2 py-1 text-xs text-[#20211F] focus:outline-none focus:ring-1 focus:ring-[#3158C9] cursor-pointer"
            >
              <option value="">Select benchmark case...</option>
              {samples.map((s) => (
                <option key={s.case_id} value={s.case_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 3: Actions & Diagnostics */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenDiagnostics}
            className="px-3.5 py-1.5 text-xs font-mono font-semibold border border-[#E5E3DC] bg-white text-[#20211F] hover:bg-neutral-50 hover:border-[#3158C9] transition-colors"
          >
            System & Benchmark
          </button>

          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-mono text-[#20211F]/60 hover:text-[#20211F] transition-colors"
          >
            Clear
          </button>

          <button
            onClick={onBackToStory}
            className="px-3 py-1.5 text-xs font-mono text-[#3158C9] hover:underline transition-colors"
          >
            About
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-8">
        {/* Workspace Headline and Description */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#20211F]">
            Shelf audit investigation
          </h1>
          <p className="text-sm text-[#20211F]/70 max-w-3xl">
            Upload a reference planogram frame and an observed store shelf image. The agent executes sub-pixel planar alignment, evaluates pre-interpretation optical quality, and extracts high-resolution evidence crops for human review.
          </p>
        </div>

        {/* Dual Upload / Inspection Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel A: Reference Shelf */}
          <div className="bg-white border border-[#E5E3DC] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#3158C9]">PANEL A</span>
                <span className="font-semibold text-sm text-[#20211F]">Reference Shelf (Planogram)</span>
              </div>
              {refDimensions && (
                <span className="text-[11px] font-mono text-[#20211F]/60 tabular-nums">
                  {refDimensions.width} × {refDimensions.height} px
                </span>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleSetRefFile(e.dataTransfer.files[0]);
              }}
              onClick={() => refInputRef.current?.click()}
              className="relative aspect-3/2 bg-[#F8F7F3] border-2 border-dashed border-[#E5E3DC] hover:border-[#3158C9] flex flex-col items-center justify-center p-4 transition-colors cursor-pointer overflow-hidden group"
            >
              <input
                ref={refInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSetRefFile(e.target.files[0]);
                }}
              />

              {refPreview ? (
                <>
                  <img
                    src={refPreview}
                    alt="Reference Shelf Preview"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                    Click or drag to replace image
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2 p-4">
                  <Upload className="w-8 h-8 text-[#20211F]/30 mx-auto" />
                  <div className="font-medium text-xs text-[#20211F]">
                    Drop reference planogram image here
                  </div>
                  <div className="text-[11px] text-[#20211F]/50">
                    Supports JPEG, PNG, WebP up to 12MB
                  </div>
                </div>
              )}
            </div>

            {refFile && (
              <div className="flex items-center justify-between text-xs text-[#20211F]/70 pt-1">
                <span className="truncate max-w-[220px] font-mono">{refFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRefFile(null);
                    setRefPreview(null);
                    setRefDimensions(null);
                  }}
                  className="text-red-700 hover:underline font-mono text-[11px]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Panel B: Current Observed Shelf */}
          <div className="bg-white border border-[#E5E3DC] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#3158C9]">PANEL B</span>
                <span className="font-semibold text-sm text-[#20211F]">Current Shelf (Observed Capture)</span>
              </div>
              {currDimensions && (
                <span className="text-[11px] font-mono text-[#20211F]/60 tabular-nums">
                  {currDimensions.width} × {currDimensions.height} px
                </span>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleSetCurrFile(e.dataTransfer.files[0]);
              }}
              onClick={() => currInputRef.current?.click()}
              className="relative aspect-3/2 bg-[#F8F7F3] border-2 border-dashed border-[#E5E3DC] hover:border-[#3158C9] flex flex-col items-center justify-center p-4 transition-colors cursor-pointer overflow-hidden group"
            >
              <input
                ref={currInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSetCurrFile(e.target.files[0]);
                }}
              />

              {currPreview ? (
                <>
                  <img
                    src={currPreview}
                    alt="Current Observed Shelf Preview"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono">
                    Click or drag to replace image
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2 p-4">
                  <Upload className="w-8 h-8 text-[#20211F]/30 mx-auto" />
                  <div className="font-medium text-xs text-[#20211F]">
                    Drop latest observed shelf image here
                  </div>
                  <div className="text-[11px] text-[#20211F]/50">
                    Supports JPEG, PNG, WebP up to 12MB
                  </div>
                </div>
              )}
            </div>

            {currFile && (
              <div className="flex items-center justify-between text-xs text-[#20211F]/70 pt-1">
                <span className="truncate max-w-[220px] font-mono">{currFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrFile(null);
                    setCurrPreview(null);
                    setCurrDimensions(null);
                  }}
                  className="text-red-700 hover:underline font-mono text-[11px]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Audit Execution Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-[#E5E3DC]">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#20211F] flex items-center gap-2">
              <span>Ready for Visual Audit</span>
              {refFile && currFile && (
                <span className="text-emerald-700 font-mono text-[11px]">(2 images primed)</span>
              )}
            </div>
            <p className="text-xs text-[#20211F]/60">
              Submits both frames to the OpenCV 5.0 bounded agent for autonomous feature alignment & contour anomaly classification.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRunAudit}
              disabled={isRunning || !refFile || !currFile}
              className={`inline-flex items-center gap-2.5 px-7 py-3 font-semibold text-xs uppercase tracking-wider text-white transition-all ${
                isRunning || !refFile || !currFile
                  ? 'bg-[#20211F]/30 cursor-not-allowed'
                  : 'bg-[#3158C9] hover:bg-[#2546a3] cursor-pointer'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing OpenCV 5.0 Investigation...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Visual Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Callout */}
        {auditError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">Audit Execution Notice</strong>
              <span>{auditError}</span>
            </div>
          </div>
        )}

        {/* Results Canvas */}
        {auditResult && (
          <div className="space-y-8 pt-4">
            {/* Status & Termination Banner */}
            <div
              className={`p-6 border ${
                auditResult.human_review_required
                  ? 'bg-amber-50/60 border-amber-300'
                  : auditResult.changed_regions.length === 0
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : 'bg-white border-[#E5E3DC]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 ${
                        auditResult.human_review_required
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-[#3158C9] text-white'
                      }`}
                    >
                      {auditResult.status}
                    </span>
                    <span className="text-xs font-mono text-[#20211F]/60">
                      ID: {auditResult.audit_id}
                    </span>
                    <span className="text-[#20211F]/30">·</span>
                    <span className="text-xs font-mono text-[#20211F]/60">
                      TERMINATION: {auditResult.termination_reason}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-[#20211F]">
                    {auditResult.summary}
                  </h2>

                  {auditResult.limitations.length > 0 && (
                    <div className="pt-1 text-xs text-[#20211F]/70">
                      <strong>Noted Limitations:</strong> {auditResult.limitations.join(' ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#20211F] text-white text-xs font-mono hover:bg-[#3158C9] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View / Print Formal Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 3: Image Quality Guard Report */}
            {auditResult.quality_guard && (
              <ImageQualityGuardCard report={auditResult.quality_guard} />
            )}

            {/* Feature 1: Visual Evidence Explorer */}
            <VisualEvidenceExplorer
              artifacts={auditResult.artifacts}
              regions={auditResult.changed_regions}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              humanReviews={humanReviews}
              onUpdateDecision={handleUpdateHumanDecision}
              imageDimensions={auditResult.metrics.reference_dimensions}
            />

            {/* Feature 4: Human Review Queue */}
            <HumanReviewQueue
              auditId={auditResult.audit_id}
              regions={auditResult.changed_regions}
              humanReviews={humanReviews}
              onUpdateDecision={handleUpdateHumanDecision}
              selectedRegionId={selectedRegion?.region_id || null}
              onSelectRegion={setSelectedRegion}
            />

            {/* Feature 2: Live Agent Timeline Trace */}
            <div className="space-y-4">
              <InvestigationTraceViewer
                trace={auditResult.investigation_trace}
                terminationReason={auditResult.termination_reason}
              />
            </div>
          </div>
        )}
      </main>

      {/* Feature 5: Formal Audit Report Modal */}
      {isReportOpen && auditResult && (
        <PrintableAuditReport
          audit={auditResult}
          humanReviews={humanReviews}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
};

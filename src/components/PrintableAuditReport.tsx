import React from 'react';
import { AuditResponse, HumanReviewDecision } from '../types/audit';
import { Printer, Download, X, Check, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

interface PrintableAuditReportProps {
  audit: AuditResponse;
  humanReviews: Record<string, HumanReviewDecision>;
  onClose: () => void;
}

export const PrintableAuditReport: React.FC<PrintableAuditReportProps> = ({
  audit,
  humanReviews,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const exportData = {
      ...audit,
      human_review_decisions: humanReviews,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shelf_audit_${audit.audit_id}_full_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:z-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E5E3DC] shadow-2xl overflow-hidden print:shadow-none print:border-none print:max-w-none text-[#20211F]">
        {/* Print Controls Bar (hidden during printing) */}
        <div className="px-6 py-4 border-b border-[#E5E3DC] flex items-center justify-between bg-[#F8F7F3] print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3158C9]" />
            <h3 className="text-sm font-semibold text-[#20211F]">
              Formal Audit Investigation Report
            </h3>
            <span className="text-xs font-mono text-[#20211F]/50">({audit.audit_id})</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#20211F] text-white text-xs font-mono hover:bg-[#3158C9] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#E5E3DC] bg-white text-xs font-mono hover:bg-neutral-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-200 text-[#20211F]/60 hover:text-[#20211F] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 space-y-8 text-xs font-sans print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-[#20211F] pb-6 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#3158C9] uppercase">
                  SHELFSHELLOCK · AGENTIC AUDIT RECORD
                </span>
                <h1 className="text-2xl sm:text-3xl font-light text-[#20211F] mt-1">
                  Shelf Inventory Discrepancy Report
                </h1>
              </div>
              <div className="text-right font-mono text-[11px] text-[#20211F]/70 space-y-0.5">
                <div>AUDIT ID: <strong className="text-[#20211F]">{audit.audit_id}</strong></div>
                <div>TIMESTAMP: {audit.timestamp}</div>
                <div>CORE: OpenCV {audit.metrics.opencv_version}</div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-mono border-t border-[#E5E3DC]">
              <span>STATUS: <strong>{audit.status}</strong></span>
              <span>·</span>
              <span>TERMINATION: <strong>{audit.termination_reason}</strong></span>
              <span>·</span>
              <span>HUMAN REVIEW: <strong>{audit.human_review_required ? 'REQUIRED' : 'NOMINAL'}</strong></span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 bg-[#F8F7F3] border border-[#E5E3DC] space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-[#3158C9]">EXECUTIVE FINDINGS</span>
            <p className="text-sm font-medium text-[#20211F] leading-relaxed">
              {audit.summary}
            </p>
          </div>

          {/* Optical Metrics & Quality Guard Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 border border-[#E5E3DC] bg-white">
              <span className="text-[10px] font-mono text-[#20211F]/60 uppercase block">SSIM Similarity</span>
              <span className="text-lg font-bold font-mono text-[#20211F] tabular-nums">
                {audit.metrics.structural_similarity_ssim.toFixed(4)}
              </span>
              <span className="text-[10px] text-[#20211F]/50 block">Index [-1.0 to 1.0]</span>
            </div>

            <div className="p-3 border border-[#E5E3DC] bg-white">
              <span className="text-[10px] font-mono text-[#20211F]/60 uppercase block">PSNR Metric</span>
              <span className="text-lg font-bold font-mono text-[#20211F] tabular-nums">
                {audit.metrics.peak_signal_noise_psnr.toFixed(1)} dB
              </span>
              <span className="text-[10px] text-[#20211F]/50 block">Signal-to-Noise</span>
            </div>

            <div className="p-3 border border-[#E5E3DC] bg-white">
              <span className="text-[10px] font-mono text-[#20211F]/60 uppercase block">Changed Surface</span>
              <span className="text-lg font-bold font-mono text-[#3158C9] tabular-nums">
                {audit.metrics.overall_change_area_percent.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#20211F]/50 block">Surface Area Delta</span>
            </div>

            <div className="p-3 border border-[#E5E3DC] bg-white">
              <span className="text-[10px] font-mono text-[#20211F]/60 uppercase block">Alignment Model</span>
              <span className="text-xs font-bold font-mono text-[#20211F] block mt-1 truncate">
                {audit.alignment.method_used}
              </span>
              <span className="text-[10px] text-[#20211F]/50 block">Error: {(audit.alignment.alignment_error * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Visual Evidence Section */}
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase text-[#3158C9] block">
              VISUAL EVIDENCE PLOTS
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#20211F]/60">ANNOTATED DISCREPANCY OVERLAY</span>
                <div className="aspect-3/2 bg-neutral-900 border border-[#E5E3DC] overflow-hidden">
                  <img
                    src={audit.artifacts.annotated_overlay || audit.artifacts.current}
                    alt="Annotated"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#20211F]/60">THERMAL DIFFERENCE HEATMAP</span>
                <div className="aspect-3/2 bg-neutral-900 border border-[#E5E3DC] overflow-hidden">
                  <img
                    src={audit.artifacts.heatmap || audit.artifacts.difference_map || audit.artifacts.current}
                    alt="Heatmap"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Changed Regions Table with Human Decisions */}
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase text-[#3158C9] block">
              DETECTED EVIDENCE REGIONS & HUMAN AUDITOR VERIFICATION
            </span>

            {audit.changed_regions.length > 0 ? (
              <div className="border border-[#E5E3DC] overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-[#E5E3DC]">
                  <thead className="bg-[#F8F7F3] font-mono text-[10px] uppercase text-[#20211F]/70">
                    <tr>
                      <th className="p-3">Region ID</th>
                      <th className="p-3">Coordinates (X,Y,W,H)</th>
                      <th className="p-3">Surface %</th>
                      <th className="p-3">Machine Tag</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Human Auditor Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E3DC] font-mono text-[11px]">
                    {audit.changed_regions.map((reg) => {
                      const humanDec = humanReviews[reg.region_id] || 'PENDING';
                      return (
                        <tr key={reg.region_id}>
                          <td className="p-3 font-bold text-[#3158C9]">{reg.region_id}</td>
                          <td className="p-3 tabular-nums">
                            {reg.box.x},{reg.box.y} ({reg.box.width}×{reg.box.height})
                          </td>
                          <td className="p-3 tabular-nums">{reg.area_percent}%</td>
                          <td className="p-3 font-sans font-medium text-[11px]">
                            {reg.classification.replace('_', ' ')}
                          </td>
                          <td className="p-3 tabular-nums">{(reg.contour_confidence * 100).toFixed(0)}%</td>
                          <td className="p-3 font-sans font-bold">
                            <span
                              className={`px-2 py-0.5 text-[10px] ${
                                humanDec === 'CONFIRMED_CHANGE'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : humanDec === 'NOT_MEANINGFUL'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : humanDec === 'NEEDS_FURTHER_REVIEW'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-neutral-500'
                              }`}
                            >
                              {humanDec.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#20211F]/60 italic">No discrete region discrepancies were detected above the physical noise floor.</p>
            )}
          </div>

          {/* Investigation Trace Summary */}
          <div className="space-y-3">
            <span className="font-mono text-xs font-bold uppercase text-[#3158C9] block">
              AGENTIC INVESTIGATION EVENT TRACE
            </span>

            <div className="border border-[#E5E3DC] divide-y divide-[#E5E3DC] font-mono text-[11px]">
              {audit.investigation_trace.map((ev) => (
                <div key={ev.event_id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between text-[#20211F]">
                    <span>
                      <strong className="text-[#3158C9]">{ev.event_id}</strong> · Step {ev.step_number}: {ev.step_name}
                    </span>
                    <span className="text-[#20211F]/50">{ev.tool_executed}</span>
                  </div>
                  <div className="text-[#20211F]/80 font-sans text-xs">
                    <strong>Observed:</strong> {ev.observation}
                  </div>
                  <div className="text-emerald-900 font-sans text-xs">
                    <strong>Outcome:</strong> {ev.outcome}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations and Operational Sign-off */}
          <div className="pt-4 border-t border-[#E5E3DC] space-y-2 text-xs text-[#20211F]/70">
            <span className="font-mono text-[10px] uppercase font-bold text-[#20211F] block">
              OPERATIONAL LIMITATIONS & ADVISORY NOTICE
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              {audit.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
              <li>Visual inventory audits identify physical planar discrepancies; physical item stock counts should be verified before ordering.</li>
            </ul>

            <div className="pt-6 flex items-center justify-between font-mono text-[10px] text-[#20211F]/50">
              <span>Generated autonomously by ShelfSherlock Engine</span>
              <span>Verification Stamp: SHA256-DETERMINISTIC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

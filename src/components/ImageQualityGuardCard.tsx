import React from 'react';
import { QualityGuardReport } from '../types/audit';
import { ShieldAlert, CheckCircle2, AlertTriangle, Eye, Sun, Focus, Maximize2 } from 'lucide-react';

interface ImageQualityGuardCardProps {
  report?: QualityGuardReport;
}

export const ImageQualityGuardCard: React.FC<ImageQualityGuardCardProps> = ({ report }) => {
  if (!report) return null;

  const hasWarnings = report.actionable_warnings && report.actionable_warnings.length > 0;

  return (
    <div className="bg-white border border-[#E5E3DC] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E3DC]">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#EEF2FB] text-[#3158C9]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#20211F]">
              Image Quality Guard
            </h3>
            <span className="text-[11px] text-[#20211F]/60">
              Pre-interpretation optical signals evaluated before contour analysis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#20211F]/50">OVERALL OPTICAL STATUS:</span>
          {hasWarnings ? (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{report.actionable_warnings.length} Advisory Warnings</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Nominal Capture Fidelity</span>
            </span>
          )}
        </div>
      </div>

      {/* Optical Signal Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Signal 1: Sharpness / Focus */}
        <div className="p-3 bg-[#F8F7F3] border border-[#E5E3DC] space-y-1">
          <div className="flex items-center justify-between text-[#20211F]/60">
            <span className="font-mono text-[10px] uppercase">Optical Focus</span>
            <Focus className="w-3.5 h-3.5 text-[#3158C9]" />
          </div>
          <div className="font-bold font-mono text-sm tabular-nums">
            {report.current_quality.sharpness_score.toFixed(1)} <span className="text-[10px] font-normal text-[#20211F]/50">var</span>
          </div>
          <div className="text-[10px] font-mono text-[#20211F]/70">
            Grade: <strong>{report.current_quality.quality_grade}</strong>
          </div>
        </div>

        {/* Signal 2: Ambient Luminance */}
        <div className="p-3 bg-[#F8F7F3] border border-[#E5E3DC] space-y-1">
          <div className="flex items-center justify-between text-[#20211F]/60">
            <span className="font-mono text-[10px] uppercase">Luminance</span>
            <Sun className="w-3.5 h-3.5 text-[#3158C9]" />
          </div>
          <div className="font-bold font-mono text-sm tabular-nums">
            {report.current_quality.mean_luminance.toFixed(1)} <span className="text-[10px] font-normal text-[#20211F]/50">/ 255</span>
          </div>
          <div className="text-[10px] font-mono text-[#20211F]/70">
            Contrast RMS: {report.current_quality.rms_contrast.toFixed(1)}
          </div>
        </div>

        {/* Signal 3: Specular Glare / Clipping */}
        <div className="p-3 bg-[#F8F7F3] border border-[#E5E3DC] space-y-1">
          <div className="flex items-center justify-between text-[#20211F]/60">
            <span className="font-mono text-[10px] uppercase">Glare Clipping</span>
            <Eye className="w-3.5 h-3.5 text-[#3158C9]" />
          </div>
          <div className="font-bold font-mono text-sm tabular-nums">
            {report.current_quality.overexposed_percent.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-[#20211F]/70">
            Shadows: {report.current_quality.underexposed_percent.toFixed(1)}%
          </div>
        </div>

        {/* Signal 4: Geometry Parity */}
        <div className="p-3 bg-[#F8F7F3] border border-[#E5E3DC] space-y-1">
          <div className="flex items-center justify-between text-[#20211F]/60">
            <span className="font-mono text-[10px] uppercase">Aspect Parity</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#3158C9]" />
          </div>
          <div className="font-bold font-mono text-sm tabular-nums">
            {report.current_quality.aspect_ratio} <span className="text-[10px] font-normal text-[#20211F]/50">ratio</span>
          </div>
          <div className="text-[10px] font-mono text-[#20211F]/70">
            Drift: {report.optical_alignment_drift_percent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Actionable Warnings List */}
      {hasWarnings && (
        <div className="space-y-1.5 pt-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#D97706] font-semibold block">
            Actionable Image Quality Warnings
          </span>
          <div className="space-y-1">
            {report.actionable_warnings.map((warning, i) => (
              <div
                key={i}
                className="text-xs p-2.5 bg-amber-50/60 border border-amber-200/80 text-amber-950 flex items-start gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="pt-2 border-t border-[#E5E3DC] text-[10px] text-[#20211F]/60 font-mono italic">
        {report.disclaimer}
      </div>
    </div>
  );
};

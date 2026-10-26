import React, { useState } from 'react';
import { ChangedRegion, HumanReviewDecision } from '../types/audit';
import { CheckCircle2, XCircle, HelpCircle, Check, MessageSquare, Save, UserCheck } from 'lucide-react';

interface HumanReviewQueueProps {
  auditId: string;
  regions: ChangedRegion[];
  humanReviews: Record<string, HumanReviewDecision>;
  onUpdateDecision: (regionId: string, decision: HumanReviewDecision, notes?: string) => void;
  selectedRegionId: string | null;
  onSelectRegion: (region: ChangedRegion) => void;
}

export const HumanReviewQueue: React.FC<HumanReviewQueueProps> = ({
  auditId,
  regions,
  humanReviews,
  onUpdateDecision,
  selectedRegionId,
  onSelectRegion,
}) => {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const total = regions.length;
  const reviewedCount = Object.keys(humanReviews).filter(
    (k) => humanReviews[k] && humanReviews[k] !== 'PENDING'
  ).length;

  const handleSetDecision = (regId: string, decision: HumanReviewDecision) => {
    const note = reviewNotes[regId] || '';
    onUpdateDecision(regId, decision, note);

    // Save to persistent backend endpoint /api/audit/{audit_id}/review
    fetch(`/api/audit/${auditId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region_id: regId,
        decision: decision,
        reviewer_notes: note,
        reviewer_id: 'operator_auditor',
      }),
    })
      .then((res) => {
        if (res.ok) {
          setSavedNotice(`Decision saved to review database for ${regId}`);
          setTimeout(() => setSavedNotice(null), 2500);
        }
      })
      .catch((e) => console.warn('Could not persist to review backend:', e));
  };

  if (total === 0) {
    return (
      <div className="bg-white border border-[#E5E3DC] p-6 text-center text-xs text-[#20211F]/60">
        <UserCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
        <p className="font-medium text-[#20211F]">No Discrepancies Requiring Review</p>
        <p className="mt-1">The current shelf capture fully matched the reference planogram.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E3DC] p-5 space-y-4">
      {/* Header & Review Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E3DC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#3158C9]">HUMAN REVIEW QUEUE</span>
            <span className="text-[#20211F]/30">·</span>
            <span className="text-xs font-mono text-[#20211F]/70">
              AUDIT RECORD {auditId}
            </span>
          </div>
          <p className="text-xs text-[#20211F]/60 mt-0.5">
            Human auditor annotations are recorded side-by-side and supersede machine predictions.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#20211F]/70">
            REVIEWED: <strong className="tabular-nums">{reviewedCount}</strong> of {total}
          </span>
          <div className="w-24 h-2 bg-[#EFECE6] border border-[#E5E3DC] overflow-hidden">
            <div
              className="h-full bg-[#3158C9] transition-all duration-300"
              style={{ width: `${(reviewedCount / Math.max(total, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-mono flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((reg) => {
          const decision = humanReviews[reg.region_id] || 'PENDING';
          const isSelected = selectedRegionId === reg.region_id;

          return (
            <div
              key={reg.region_id}
              onClick={() => onSelectRegion(reg)}
              className={`border p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#3158C9] bg-blue-50/15 shadow-xs'
                  : 'border-[#E5E3DC] bg-[#F8F7F3]/40 hover:bg-neutral-50'
              }`}
            >
              {/* Evidence Crop Thumbnail & Identification */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-20 h-16 bg-white border border-[#E5E3DC] overflow-hidden shrink-0 flex items-center justify-center">
                  {reg.crop_url ? (
                    <img src={reg.crop_url} alt={reg.region_id} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-[#20211F]/40 font-mono">No Crop</span>
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#3158C9]">{reg.region_id}</span>
                    <span className="text-[10px] font-mono text-[#20211F]/60 tabular-nums">
                      {reg.area_percent}% surface
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[#20211F]/70">
                    Machine Tag: <strong>{reg.classification.replace('_', ' ')}</strong>
                  </div>

                  <div className="text-[10px] font-mono text-[#20211F]/50">
                    Confidence: {(reg.contour_confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Rationale Prose */}
              <p className="text-[11px] text-[#20211F]/75 leading-relaxed mb-3 line-clamp-2">
                {reg.investigation_notes}
              </p>

              {/* 3 Human Decision Buttons */}
              <div className="space-y-1 pt-2 border-t border-[#E5E3DC]">
                <div className="text-[10px] font-mono uppercase text-[#20211F]/50 mb-1">
                  Human Annotation:
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDecision(reg.region_id, 'CONFIRMED_CHANGE');
                    }}
                    className={`py-1 px-1 border transition-colors text-center ${
                      decision === 'CONFIRMED_CHANGE'
                        ? 'bg-rose-700 text-white border-rose-700 font-bold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    Confirmed
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDecision(reg.region_id, 'NOT_MEANINGFUL');
                    }}
                    className={`py-1 px-1 border transition-colors text-center ${
                      decision === 'NOT_MEANINGFUL'
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDecision(reg.region_id, 'NEEDS_FURTHER_REVIEW');
                    }}
                    className={`py-1 px-1 border transition-colors text-center ${
                      decision === 'NEEDS_FURTHER_REVIEW'
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    Escalate
                  </button>
                </div>
              </div>

              {/* Optional Auditor Note Field */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Optional review notes..."
                  value={reviewNotes[reg.region_id] || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReviewNotes((prev) => ({ ...prev, [reg.region_id]: val }));
                  }}
                  onBlur={() => {
                    if (decision !== 'PENDING') {
                      handleSetDecision(reg.region_id, decision);
                    }
                  }}
                  className="w-full bg-white border border-[#E5E3DC] px-2 py-1 text-[11px] text-[#20211F] placeholder:text-[#20211F]/30 focus:outline-none focus:ring-1 focus:ring-[#3158C9]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

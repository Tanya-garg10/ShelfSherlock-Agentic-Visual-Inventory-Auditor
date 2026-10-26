import React, { useState } from 'react';
import { InvestigationEvent } from '../types/audit';
import { ChevronDown, ChevronRight, Terminal, ArrowRight, Activity, Check } from 'lucide-react';

interface InvestigationTraceViewerProps {
  trace: InvestigationEvent[];
  terminationReason?: string;
}

export const InvestigationTraceViewer: React.FC<InvestigationTraceViewerProps> = ({
  trace,
  terminationReason,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [trace[0]?.event_id]: true,
    [trace[trace.length - 1]?.event_id]: true,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    trace.forEach((e) => {
      all[e.event_id] = true;
    });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  return (
    <div className="bg-white border border-[#E5E3DC] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E3DC] flex flex-wrap items-center justify-between gap-4 bg-[#F8F7F3]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#3158C9]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#20211F]">
              Agentic Investigation Event Trace
            </h3>
          </div>
          <p className="text-xs text-[#20211F]/60">
            Real ordered decision chain executed by OpenCV 5.0 and bounded logic gates.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={expandAll}
            className="text-[#3158C9] hover:underline cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-[#20211F]/30">|</span>
          <button
            onClick={collapseAll}
            className="text-[#20211F]/60 hover:text-[#20211F] cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Ordered Event List */}
      <div className="divide-y divide-[#E5E3DC]">
        {trace.map((event, idx) => {
          const isExpanded = !!expandedIds[event.event_id];
          const isTerminal = idx === trace.length - 1;

          return (
            <div
              key={event.event_id}
              className={`transition-colors ${isExpanded ? 'bg-white' : 'hover:bg-neutral-50/60'}`}
            >
              {/* Event Summary Bar */}
              <button
                onClick={() => toggleExpand(event.event_id)}
                className="w-full px-6 py-3.5 flex items-center justify-between text-left cursor-pointer focus:outline-none focus-visible:bg-blue-50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono font-bold text-[#3158C9] shrink-0">
                    {event.event_id}
                  </span>

                  <span className="text-xs font-mono text-[#20211F]/40 shrink-0">
                    STEP {event.step_number.toString().padStart(2, '0')}
                  </span>

                  <span className="text-sm font-medium text-[#20211F] truncate">
                    {event.step_name}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline-block text-xs font-mono text-[#20211F]/50 px-2 py-0.5 bg-[#EFECE6]/60">
                    {event.tool_executed.split('(')[0]}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#20211F]/40" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#20211F]/40" />
                  )}
                </div>
              </button>

              {/* Event Detail Panel */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-1 text-xs space-y-3.5 bg-[#F8F7F3]/40 border-t border-neutral-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Observation */}
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#20211F]/60 font-semibold block">
                        Visual Observation
                      </span>
                      <p className="text-[#20211F] leading-relaxed bg-white p-2.5 border border-[#E5E3DC]">
                        {event.observation}
                      </p>
                    </div>

                    {/* Rationale */}
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#20211F]/60 font-semibold block">
                        Decision Rationale
                      </span>
                      <p className="text-[#20211F]/80 leading-relaxed bg-white p-2.5 border border-[#E5E3DC]">
                        {event.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Operation & Outcome */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#20211F]/60 font-semibold block mb-1">
                        Tool Executed
                      </span>
                      <code className="block bg-neutral-900 text-neutral-100 font-mono p-2 text-[11px] overflow-x-auto">
                        {event.tool_executed}
                      </code>
                    </div>

                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#20211F]/60 font-semibold block mb-1">
                        Outcome
                      </span>
                      <div className="p-2 bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-medium">
                        {event.outcome}
                      </div>
                    </div>
                  </div>

                  {/* Measurements Dictionary if present */}
                  {event.measurements && Object.keys(event.measurements).length > 0 && (
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#20211F]/60 font-semibold block mb-1">
                        OpenCV Measurements
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(event.measurements).map(([key, val]) => (
                          <span
                            key={key}
                            className="bg-white border border-[#E5E3DC] font-mono px-2 py-1 text-[11px] text-[#20211F]"
                          >
                            <span className="text-[#20211F]/50">{key}: </span>
                            <span className="font-semibold tabular-nums">
                              {typeof val === 'number' ? val.toFixed(4).replace(/\.?0+$/, '') : String(val)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Action Indicator */}
                  {event.next_action && (
                    <div className="flex items-center gap-2 pt-1 text-[#3158C9] font-mono text-[11px]">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Next Action Determined: <strong>{event.next_action}</strong></span>
                    </div>
                  )}

                  {isTerminal && terminationReason && (
                    <div className="mt-3 p-3 bg-[#EEF2FB] border border-[#3158C9]/20 flex items-center justify-between">
                      <span className="font-mono uppercase tracking-wider text-[#3158C9] font-semibold text-[11px]">
                        TERMINATION STATE: {terminationReason}
                      </span>
                      <Check className="w-4 h-4 text-[#3158C9]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

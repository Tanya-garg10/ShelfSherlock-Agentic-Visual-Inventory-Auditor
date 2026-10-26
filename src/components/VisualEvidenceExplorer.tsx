import React, { useState } from 'react';
import { ChangedRegion, ArtifactURLs, HumanReviewDecision } from '../types/audit';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { Layers, Crosshair, Check, AlertCircle, Eye, Sliders, Maximize2 } from 'lucide-react';

interface VisualEvidenceExplorerProps {
  artifacts: ArtifactURLs;
  regions: ChangedRegion[];
  selectedRegion: ChangedRegion | null;
  onSelectRegion: (region: ChangedRegion) => void;
  humanReviews: Record<string, HumanReviewDecision>;
  onUpdateDecision: (regionId: string, decision: HumanReviewDecision) => void;
  imageDimensions: { width: number; height: number };
}

export const VisualEvidenceExplorer: React.FC<VisualEvidenceExplorerProps> = ({
  artifacts,
  regions,
  selectedRegion,
  onSelectRegion,
  humanReviews,
  onUpdateDecision,
  imageDimensions,
}) => {
  const [activeMode, setActiveMode] = useState<
    'slider' | 'annotated' | 'heatmap' | 'difference' | 'split' | 'reference' | 'current'
  >('slider');

  const { width: imgW = 960, height: imgH = 640 } = imageDimensions || {};

  return (
    <div className="bg-white border border-[#E5E3DC] p-5 space-y-5">
      {/* Top Header & Layer Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E3DC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#3158C9]">VISUAL EVIDENCE EXPLORER</span>
            <span className="text-[#20211F]/30">·</span>
            <span className="text-xs text-[#20211F]/70 font-mono">
              {regions.length} Detected Evidence Zones
            </span>
          </div>
          <p className="text-xs text-[#20211F]/60 mt-0.5">
            Click any highlighted region on the canvas or in the drawer to inspect localized metrics.
          </p>
        </div>

        {/* View Mode Segmented Bar */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F8F7F3] border border-[#E5E3DC] text-xs font-mono">
          <button
            onClick={() => setActiveMode('slider')}
            className={`px-3 py-1 transition-colors ${
              activeMode === 'slider' ? 'bg-white shadow-xs font-bold text-[#20211F]' : 'text-[#20211F]/70 hover:text-[#20211F]'
            }`}
          >
            Before/After Slider
          </button>
          <button
            onClick={() => setActiveMode('annotated')}
            className={`px-3 py-1 transition-colors ${
              activeMode === 'annotated' ? 'bg-white shadow-xs font-bold text-[#20211F]' : 'text-[#20211F]/70 hover:text-[#20211F]'
            }`}
          >
            Interactive Overlay
          </button>
          <button
            onClick={() => setActiveMode('heatmap')}
            className={`px-3 py-1 transition-colors ${
              activeMode === 'heatmap' ? 'bg-white shadow-xs font-bold text-[#20211F]' : 'text-[#20211F]/70 hover:text-[#20211F]'
            }`}
          >
            Thermal Heatmap
          </button>
          <button
            onClick={() => setActiveMode('difference')}
            className={`px-3 py-1 transition-colors ${
              activeMode === 'difference' ? 'bg-white shadow-xs font-bold text-[#20211F]' : 'text-[#20211F]/70 hover:text-[#20211F]'
            }`}
          >
            Difference Map
          </button>
          <button
            onClick={() => setActiveMode('split')}
            className={`px-3 py-1 transition-colors ${
              activeMode === 'split' ? 'bg-white shadow-xs font-bold text-[#20211F]' : 'text-[#20211F]/70 hover:text-[#20211F]'
            }`}
          >
            Split View
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Area (8 cols) */}
        <div className="lg:col-span-8">
          {activeMode === 'slider' && (
            <ImageComparisonSlider
              beforeSrc={artifacts.reference}
              afterSrc={artifacts.aligned_current || artifacts.current}
              beforeLabel="REFERENCE PLANOGRAM"
              afterLabel="ALIGNED OBSERVED SHELF"
            />
          )}

          {activeMode === 'annotated' && (
            <div className="relative aspect-3/2 bg-[#20211F] border border-[#E5E3DC] overflow-hidden select-none">
              <img
                src={artifacts.annotated_overlay || artifacts.current}
                alt="Annotated Shelf"
                className="w-full h-full object-contain"
              />

              {/* Clickable SVG Interactive Bounding Boxes */}
              <svg
                viewBox={`0 0 ${imgW} ${imgH}`}
                className="absolute inset-0 w-full h-full pointer-events-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {regions.map((reg) => {
                  const isSelected = selectedRegion?.region_id === reg.region_id;
                  const { x, y, width: w, height: h } = reg.box;

                  return (
                    <g
                      key={reg.region_id}
                      onClick={() => onSelectRegion(reg)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={isSelected ? 'rgba(49, 88, 201, 0.35)' : 'rgba(49, 88, 201, 0.12)'}
                        stroke={isSelected ? '#FFFFFF' : '#3158C9'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        strokeDasharray={isSelected ? 'none' : '4, 2'}
                        className="transition-all hover:fill-[#3158C9]/40"
                      />
                      {/* Interactive coordinate crosshair icon */}
                      <circle
                        cx={x + w / 2}
                        cy={y + h / 2}
                        r={isSelected ? 5 : 3}
                        fill={isSelected ? '#3158C9' : '#FFFFFF'}
                        stroke="#20211F"
                        strokeWidth={1}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-3 left-3 bg-[#20211F]/90 text-white text-[10px] font-mono px-2 py-1 flex items-center gap-2">
                <Crosshair className="w-3 h-3 text-[#3158C9]" />
                <span>INTERACTIVE SELECTION ACTIVE — CLICK ANY HIGHLIGHTED BOX</span>
              </div>
            </div>
          )}

          {activeMode === 'heatmap' && artifacts.heatmap && (
            <div className="relative aspect-3/2 bg-[#20211F] border border-[#E5E3DC] overflow-hidden">
              <img
                src={artifacts.heatmap}
                alt="Thermal Heatmap"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 bg-[#20211F]/90 text-white text-[10px] font-mono px-2 py-1">
                TURBO COLORMAP PSEUDO-COLOR INTENSITY DELTA
              </div>
            </div>
          )}

          {activeMode === 'difference' && artifacts.difference_map && (
            <div className="relative aspect-3/2 bg-[#20211F] border border-[#E5E3DC] overflow-hidden">
              <img
                src={artifacts.difference_map}
                alt="Difference Map"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 bg-[#20211F]/90 text-white text-[10px] font-mono px-2 py-1">
                ABSOLUTE DIFFERENCE MAP (CLAHE EQUALIZED)
              </div>
            </div>
          )}

          {activeMode === 'split' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#20211F]/60">REFERENCE PLANOGRAM</span>
                <img
                  src={artifacts.reference}
                  alt="Reference"
                  className="aspect-3/2 w-full object-contain border border-[#E5E3DC] bg-[#F8F7F3]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#20211F]/60">ALIGNED CURRENT CAPTURE</span>
                <img
                  src={artifacts.aligned_current || artifacts.current}
                  alt="Current"
                  className="aspect-3/2 w-full object-contain border border-[#E5E3DC] bg-[#F8F7F3]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected Evidence Detail Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-[#F8F7F3] border border-[#E5E3DC] p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E3DC]">
            <span className="font-mono text-xs font-bold text-[#3158C9]">
              REGION INSPECTOR
            </span>
            {selectedRegion && (
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-white border border-[#E5E3DC]">
                {selectedRegion.region_id}
              </span>
            )}
          </div>

          {selectedRegion ? (
            <div className="space-y-3.5 text-xs">
              {/* High-Res Evidence Crop */}
              <div className="aspect-3/2 bg-white border border-[#E5E3DC] overflow-hidden flex items-center justify-center relative">
                {selectedRegion.crop_url ? (
                  <img
                    src={selectedRegion.crop_url}
                    alt={`Evidence Crop ${selectedRegion.region_id}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs font-mono text-[#20211F]/50">No crop extracted</span>
                )}
                <div className="absolute bottom-2 left-2 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5">
                  100% EVIDENCE CROP
                </div>
              </div>

              {/* Classification Tag */}
              <div className="flex items-center justify-between">
                <span className="text-[#20211F]/60 font-mono text-[11px]">AUTOMATED TAG:</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 font-semibold ${
                    selectedRegion.classification === 'structural_void'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedRegion.classification === 'possible_displacement'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedRegion.classification.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Analysis Explanation */}
              <div className="p-3 bg-white border border-[#E5E3DC] space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#20211F]/50 block">
                  Agent Analysis Notes
                </span>
                <p className="text-[#20211F] leading-relaxed text-[11px]">
                  {selectedRegion.investigation_notes}
                </p>
              </div>

              {/* Region Coordinate & Geometry Strip */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-white border border-[#E5E3DC]">
                  <span className="text-[#20211F]/50 block text-[9px]">BOUNDING BOX</span>
                  <span className="font-semibold">
                    {selectedRegion.box.x},{selectedRegion.box.y} ({selectedRegion.box.width}×{selectedRegion.box.height})
                  </span>
                </div>
                <div className="p-2 bg-white border border-[#E5E3DC]">
                  <span className="text-[#20211F]/50 block text-[9px]">SURFACE DELTA</span>
                  <span className="font-semibold tabular-nums text-[#3158C9]">
                    {selectedRegion.area_percent}% ({selectedRegion.area_pixels} px)
                  </span>
                </div>
                <div className="p-2 bg-white border border-[#E5E3DC]">
                  <span className="text-[#20211F]/50 block text-[9px]">LUMINANCE DELTA</span>
                  <span className="font-semibold tabular-nums">
                    {selectedRegion.mean_intensity_delta.toFixed(1)} / 255
                  </span>
                </div>
                <div className="p-2 bg-white border border-[#E5E3DC]">
                  <span className="text-[#20211F]/50 block text-[9px]">CONTOUR CONF</span>
                  <span className="font-semibold tabular-nums">
                    {(selectedRegion.contour_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Quick Human Decision Widget */}
              <div className="pt-2 border-t border-[#E5E3DC] space-y-2">
                <span className="font-mono text-[10px] uppercase text-[#20211F]/60 font-semibold block">
                  Auditor Decision Override
                </span>
                <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                  <button
                    onClick={() => onUpdateDecision(selectedRegion.region_id, 'CONFIRMED_CHANGE')}
                    className={`py-1.5 px-2.5 text-left border transition-colors flex items-center justify-between ${
                      humanReviews[selectedRegion.region_id] === 'CONFIRMED_CHANGE'
                        ? 'bg-rose-700 text-white border-rose-700 font-semibold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    <span>Confirmed Visual Change</span>
                    {humanReviews[selectedRegion.region_id] === 'CONFIRMED_CHANGE' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onUpdateDecision(selectedRegion.region_id, 'NOT_MEANINGFUL')}
                    className={`py-1.5 px-2.5 text-left border transition-colors flex items-center justify-between ${
                      humanReviews[selectedRegion.region_id] === 'NOT_MEANINGFUL'
                        ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    <span>Not a Meaningful Change</span>
                    {humanReviews[selectedRegion.region_id] === 'NOT_MEANINGFUL' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onUpdateDecision(selectedRegion.region_id, 'NEEDS_FURTHER_REVIEW')}
                    className={`py-1.5 px-2.5 text-left border transition-colors flex items-center justify-between ${
                      humanReviews[selectedRegion.region_id] === 'NEEDS_FURTHER_REVIEW'
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'bg-white text-[#20211F] border-[#E5E3DC] hover:bg-neutral-50'
                    }`}
                  >
                    <span>Needs Further Physical Review</span>
                    {humanReviews[selectedRegion.region_id] === 'NEEDS_FURTHER_REVIEW' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-xs text-[#20211F]/50">
              <Crosshair className="w-6 h-6 mx-auto text-[#20211F]/30" />
              <p>Select any evidence region on the image or from the list below to inspect physical metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

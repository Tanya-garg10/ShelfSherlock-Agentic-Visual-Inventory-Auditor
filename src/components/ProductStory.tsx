import React from 'react';
import { ArrowRight, CheckCircle2, Search, Sliders, ShieldAlert, Cpu, Eye, FileText } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface ProductStoryProps {
  onLaunchAudit: () => void;
  onOpenDiagnostics: () => void;
}

export const ProductStory: React.FC<ProductStoryProps> = ({
  onLaunchAudit,
  onOpenDiagnostics,
}) => {
  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#20211F]">
      {/* Top Bar following strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-[#F8F7F3]/95 backdrop-blur-sm border-b border-[#E5E3DC] px-6 lg:px-16 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="#hero" className="text-xl font-semibold tracking-tight text-[#20211F] whitespace-nowrap shrink-0">
          ShelfSherlock
        </a>

        {/* Zone 2: 4 Single-line Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#20211F]/70">
          <a href="#how-it-works" className="hover:text-[#20211F] transition-colors whitespace-nowrap shrink-0">Methodology</a>
          <a href="#features" className="hover:text-[#20211F] transition-colors whitespace-nowrap shrink-0">Core Engine</a>
          <a href="#workflow" className="hover:text-[#20211F] transition-colors whitespace-nowrap shrink-0">Workflow</a>
          <button onClick={onOpenDiagnostics} className="hover:text-[#20211F] transition-colors whitespace-nowrap shrink-0 text-left">System Specs</button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLaunchAudit}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#3158C9] hover:bg-[#2546a3] transition-colors whitespace-nowrap shrink-0"
          >
            Launch an audit
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="max-w-7xl mx-auto px-6 lg:px-16 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Headline & Mechanism */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#3158C9]">
              <span>COMPUTER VISION AUDITING</span>
              <span aria-hidden="true">·</span>
              <span>OPENCV 5.0 ENGINE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] text-balance">
              Investigate shelf reality against <span className="font-semibold text-[#20211F]">the planogram.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#20211F]/80 leading-relaxed max-w-xl text-balance">
              Retail shelves change continuously. ShelfSherlock deploys autonomous sub-pixel alignment, adaptive morphological difference mapping, and localized edge-density analysis to pinpoint discrepancies before stockouts disrupt operations.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onLaunchAudit}
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#20211F] text-[#F8F7F3] text-sm font-medium hover:bg-[#3158C9] transition-colors"
              >
                <span>Open audit workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-[#E5E3DC] bg-white text-sm font-medium text-[#20211F] hover:bg-neutral-50 transition-colors"
              >
                See how it works
              </a>
            </div>

            {/* Invariant Trust Markers */}
            <div className="pt-6 border-t border-[#E5E3DC] grid grid-cols-3 gap-4 text-xs font-mono text-[#20211F]/70">
              <div>
                <span className="block font-bold text-[#20211F] text-sm tabular-nums">100%</span>
                <span>Trace Determinism</span>
              </div>
              <div>
                <span className="block font-bold text-[#20211F] text-sm tabular-nums">Sub-Pixel</span>
                <span>ECC Correlation</span>
              </div>
              <div>
                <span className="block font-bold text-[#20211F] text-sm tabular-nums">Zero</span>
                <span>LLM Hallucinations</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Before/After Visual Comparison */}
          <div className="lg:col-span-6">
            <div className="bg-white p-3 border border-[#E5E3DC] shadow-sm">
              <div className="flex items-center justify-between pb-3 px-1 text-xs text-[#20211F]/60 font-mono">
                <span>INTERACTIVE COMPARISON DEMO</span>
                <span>DRAG SLIDER TO INSPECT</span>
              </div>
              <ImageComparisonSlider
                beforeSrc="/samples/sample_2_ref_full.jpg"
                afterSrc="/samples/sample_2_curr_vacancies.jpg"
                beforeLabel="REFERENCE (FULL)"
                afterLabel="CURRENT (VACANCIES)"
              />
              <div className="pt-3 px-1 flex items-center justify-between text-xs text-[#20211F]/75">
                <span>Controlled Retail Benchmark (Case 02)</span>
                <span className="text-[#3158C9] font-mono font-medium">2 vacancies detected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-[#E5E3DC] bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="max-w-2xl mb-14 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#3158C9]">METHODOLOGY</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#20211F]">
              How visual shelf auditing works
            </h2>
            <p className="text-[#20211F]/75 leading-relaxed">
              Traditional inventory audits rely on slow barcode scans or superficial image comparison that breaks when cameras tilt. ShelfSherlock treats auditing as an investigative scientific procedure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#F8F7F3] border border-[#E5E3DC] space-y-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white border border-[#E5E3DC] text-[#3158C9]">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#20211F]">1. Planar Homography</h3>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                Images taken from hand-held devices drift in perspective. The engine locks coordinate planes with Enhanced Correlation Coefficient (ECC) or switches to ORB RANSAC if perspective tilt is severe.
              </p>
            </div>

            <div className="p-8 bg-[#F8F7F3] border border-[#E5E3DC] space-y-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white border border-[#E5E3DC] text-[#3158C9]">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#20211F]">2. Adaptive Segmentation</h3>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) to negate store lighting flicker, followed by multi-kernel morphological operations to isolate actual item boundaries.
              </p>
            </div>

            <div className="p-8 bg-[#F8F7F3] border border-[#E5E3DC] space-y-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white border border-[#E5E3DC] text-[#3158C9]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#20211F]">3. Bounded Agent Reasoning</h3>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                For every isolated contour, the agent inspects edge density drop and chromatic divergence. When evidence is ambiguous, it requests human review rather than guessing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-16 py-20">
        <div className="max-w-2xl mb-14 space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#3158C9]">INVESTIGATIVE CAPABILITIES</span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#20211F]">
            Three pillars of disciplined auditing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-[#E5E3DC] bg-white p-8 space-y-4">
            <div className="text-xs font-mono text-[#3158C9]">PILLAR 01</div>
            <h3 className="text-xl font-medium text-[#20211F]">Detect Visual Changes</h3>
            <p className="text-sm text-[#20211F]/75 leading-relaxed">
              Calculates structural similarity (SSIM) and peak signal-to-noise ratio (PSNR) across localized shelf coordinates. Discovers item deletions, misplacements, and facing changes down to 0.1% surface resolution.
            </p>
          </div>

          <div className="border border-[#E5E3DC] bg-white p-8 space-y-4">
            <div className="text-xs font-mono text-[#3158C9]">PILLAR 02</div>
            <h3 className="text-xl font-medium text-[#20211F]">Investigate Uncertain Regions</h3>
            <p className="text-sm text-[#20211F]/75 leading-relaxed">
              When an anomaly contour is ambiguous, the agent drills down with Canny edge ratio tracking and Bhattacharyya histogram metrics to distinguish genuine shelf voids from lighting shadows or plastic glare.
            </p>
          </div>

          <div className="border border-[#E5E3DC] bg-white p-8 space-y-4">
            <div className="text-xs font-mono text-[#3158C9]">PILLAR 03</div>
            <h3 className="text-xl font-medium text-[#20211F]">Review Evidence Before Action</h3>
            <p className="text-sm text-[#20211F]/75 leading-relaxed">
              Every audit outputs a verifiable execution log, thermal heatmaps, difference maps, and side-by-side evidence crops so inventory auditors can audit the AI's reasoning chain before committing restock orders.
            </p>
          </div>
        </div>
      </section>

      {/* Three-Stage Workflow */}
      <section id="workflow" className="border-t border-[#E5E3DC] bg-[#EEF2FB]/40 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#3158C9]">OPERATION CYCLE</span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#20211F]">
              Compare · Investigate · Review
            </h2>
            <p className="text-sm text-[#20211F]/70">
              A transparent 3-step loop designed for store operators and loss-prevention teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 border border-[#E5E3DC]">
              <div className="flex items-center justify-between pb-6 border-b border-[#E5E3DC]">
                <span className="font-mono text-xs font-bold text-[#3158C9]">STAGE 01</span>
                <Sliders className="w-4 h-4 text-[#20211F]/40" />
              </div>
              <h4 className="text-lg font-semibold mt-6 mb-2">Compare</h4>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                Upload the reference planogram and the latest shelf photo. The engine tests optical sharpness and aligns perspectives automatically.
              </p>
            </div>

            <div className="bg-white p-8 border border-[#E5E3DC]">
              <div className="flex items-center justify-between pb-6 border-b border-[#E5E3DC]">
                <span className="font-mono text-xs font-bold text-[#3158C9]">STAGE 02</span>
                <Search className="w-4 h-4 text-[#20211F]/40" />
              </div>
              <h4 className="text-lg font-semibold mt-6 mb-2">Investigate</h4>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                The agent follows OpenCV feedback: evaluates alignment quality, computes difference thresholds, segments contours, and extracts evidence crops.
              </p>
            </div>

            <div className="bg-white p-8 border border-[#E5E3DC]">
              <div className="flex items-center justify-between pb-6 border-b border-[#E5E3DC]">
                <span className="font-mono text-xs font-bold text-[#3158C9]">STAGE 03</span>
                <CheckCircle2 className="w-4 h-4 text-[#20211F]/40" />
              </div>
              <h4 className="text-lg font-semibold mt-6 mb-2">Review</h4>
              <p className="text-sm text-[#20211F]/75 leading-relaxed">
                Inspect high-resolution crops of changed slots, verify thermal heatmaps, confirm genuine vacancies, or resolve flagged ambiguous conditions.
              </p>
            </div>
          </div>

          <div className="mt-14 text-center">
            <button
              onClick={onLaunchAudit}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#3158C9] text-white font-semibold text-sm tracking-wide hover:bg-[#2546a3] transition-colors"
            >
              <span>Launch an audit now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E3DC] bg-white py-12 px-6 lg:px-16 text-xs text-[#20211F]/70">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="font-semibold text-sm text-[#20211F]">ShelfSherlock</div>
            <div>Agentic Visual Inventory Auditor · OpenCV 5.0.0 Architecture</div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onOpenDiagnostics} className="hover:text-[#20211F] transition-colors">
              Evaluation Manifest
            </button>
            <span aria-hidden="true">·</span>
            <span>FastAPI & Python 3.11</span>
            <span aria-hidden="true">·</span>
            <span>React 19 & Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

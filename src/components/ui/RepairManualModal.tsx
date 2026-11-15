import { useState } from 'react';
import { BookOpen, Eye, HelpCircle, Play, X } from 'lucide-react';
import { MANUAL_PAGES, getManualPageForContext } from '../../data/manual';
import { useGameStore } from '../../store/gameStore';

function ManualDiagramSvg({ type }: { type: string }) {
  if (type === 'electrolysis' || type === 'power-circuit') {
    return (
      <svg viewBox="0 0 360 130" className="w-full h-32 rounded-xl bg-[#07111F] border border-white/10">
        <rect x="20" y="20" width="90" height="90" rx="10" fill="#152A3E" stroke="#37D6F4" strokeWidth="1.5" />
        <text x="65" y="42" textAnchor="middle" fill="#F4F7FB" fontSize="10" fontWeight="bold">SOURCE</text>
        <circle cx="95" cy="60" r="6" fill="#FF5B68" />
        <circle cx="95" cy="80" r="6" fill="#FFB84D" />
        <circle cx="95" cy="100" r="6" fill="#94A3B8" />
        <line x1="101" y1="60" x2="254" y2="60" stroke="#FF5B68" strokeWidth="3" />
        <line x1="101" y1="80" x2="254" y2="80" stroke="#FFB84D" strokeWidth="3" />
        <line x1="101" y1="100" x2="254" y2="100" stroke="#94A3B8" strokeWidth="3" />
        <text x="178" y="54" textAnchor="middle" fill="#FF5B68" fontSize="9">RED → PWR+</text>
        <text x="178" y="74" textAnchor="middle" fill="#FFB84D" fontSize="9">YELLOW → CTRL</text>
        <text x="178" y="94" textAnchor="middle" fill="#AAB8C8" fontSize="9">BLACK → GND</text>
        <rect x="250" y="20" width="90" height="90" rx="10" fill="#152A3E" stroke="#37D67A" strokeWidth="1.5" />
        <text x="295" y="42" textAnchor="middle" fill="#37D67A" fontSize="10" fontWeight="bold">O₂ / PWR</text>
        <circle cx="260" cy="60" r="6" fill="#FF5B68" />
        <circle cx="260" cy="80" r="6" fill="#FFB84D" />
        <circle cx="260" cy="100" r="6" fill="#94A3B8" />
      </svg>
    );
  }
  if (type === 'co2-scrubber') {
    return (
      <svg viewBox="0 0 360 130" className="w-full h-32 rounded-xl bg-[#07111F] border border-white/10">
        <rect x="24" y="40" width="66" height="50" rx="8" fill="#152A3E" stroke="#37D6F4" />
        <text x="57" y="69" textAnchor="middle" fill="#F4F7FB" fontSize="9" fontWeight="bold">1. GASKET</text>
        <rect x="106" y="40" width="66" height="50" rx="8" fill="#152A3E" stroke="#FFB84D" />
        <text x="139" y="69" textAnchor="middle" fill="#F4F7FB" fontSize="9" fontWeight="bold">2. ADAPTER</text>
        <rect x="188" y="40" width="66" height="50" rx="8" fill="#152A3E" stroke="#37D67A" />
        <text x="221" y="69" textAnchor="middle" fill="#F4F7FB" fontSize="9" fontWeight="bold">3. LiOH</text>
        <rect x="270" y="40" width="66" height="50" rx="8" fill="#152A3E" stroke="#37D6F4" />
        <text x="303" y="69" textAnchor="middle" fill="#F4F7FB" fontSize="9" fontWeight="bold">4. HEPA</text>
        <text x="180" y="22" textAnchor="middle" fill="#37D6F4" fontSize="10" fontWeight="bold">
          CABIN CO₂ AIRFLOW → CLEANED AIR OUT (NO O₂ PRODUCED)
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 360 130" className="w-full h-32 rounded-xl bg-[#07111F] border border-white/10">
      <rect x="30" y="25" width="300" height="80" rx="12" fill="#152A3E" stroke="#37D6F4" strokeWidth="1.5" />
      <rect x="55" y="40" width="60" height="50" rx="6" fill="#37D6F4" fillOpacity="0.25" stroke="#37D6F4" />
      <rect x="125" y="40" width="60" height="50" rx="6" fill="#37D6F4" fillOpacity="0.35" stroke="#37D6F4" />
      <rect x="195" y="40" width="60" height="50" rx="6" fill="#FFB84D" fillOpacity="0.25" stroke="#FFB84D" />
      <text x="180" y="20" textAnchor="middle" fill="#FFB84D" fontSize="10" fontWeight="bold">
        SHIELDING / SEALING SCHEMATIC
      </text>
      <text x="155" y="70" textAnchor="middle" fill="#F4F7FB" fontSize="10" fontWeight="bold">
        WATER BLOCKS & CREW SHELTER
      </text>
    </svg>
  );
}

export default function RepairManualModal() {
  const closeModal = useGameStore((s) => s.closeModal);
  const manualContextStation = useGameStore((s) => s.manualContextStation);
  const emergency = useGameStore((s) => s.emergency);
  const startPracticePuzzle = useGameStore((s) => s.startPracticePuzzle);

  const defaultPage = getManualPageForContext(manualContextStation, emergency?.scenarioId);
  const [selectedId, setSelectedId] = useState(defaultPage.id);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const page = MANUAL_PAGES.find((p) => p.id === selectedId) || defaultPage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">Digital Repair Manual</h2>
              <p className="text-xs text-[#AAB8C8]">
                Turn progression paused · Inspect diagrams and steps before repairing
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close manual"
            className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
          {/* Left Page Selector */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
              System Chapters
            </p>
            {MANUAL_PAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setShowHint(false);
                  setShowSolution(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                  page.id === p.id
                    ? 'bg-[#152A3E] border-[#37D6F4] text-[#37D6F4]'
                    : 'bg-[#07111F] border-white/10 text-[#F4F7FB] hover:border-white/30'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-[#F4F7FB]">{page.title}</h3>
              <p className="text-sm text-[#37D6F4] mt-0.5">{page.subtitle}</p>
            </div>

            <div className="rounded-xl bg-[#152A3E] border border-white/10 p-4 text-sm text-[#F4F7FB] leading-relaxed">
              {page.kidSummary}
            </div>

            <ManualDiagramSvg type={page.diagramType} />

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#FFB84D] mb-2">
                Repair Steps
              </p>
              <ol className="space-y-2 text-sm text-[#F4F7FB] list-decimal list-inside">
                {page.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5 text-xs text-[#AAB8C8]">
              <span className="font-bold text-[#37D6F4]">Space Word · {page.glossaryTerm.word}: </span>
              {page.glossaryTerm.meaning}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => setShowHint((v) => !v)}
                className="px-4 py-2 rounded-xl bg-[#152A3E] border border-[#FFB84D]/50 text-xs font-bold text-[#FFB84D] hover:bg-[#1b3650] flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
              <button
                onClick={() => setShowSolution((v) => !v)}
                className="px-4 py-2 rounded-xl bg-[#152A3E] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] hover:bg-[#1b3650] flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>{showSolution ? 'Hide Full Solution' : 'Show Full Solution'}</span>
              </button>
              {page.relatedPuzzle && (
                <button
                  onClick={() => {
                    closeModal();
                    startPracticePuzzle(page.relatedPuzzle!);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#37D67A] text-[#07111F] text-xs font-bold hover:bg-[#49e289] flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Practice Repair Puzzle</span>
                </button>
              )}
            </div>

            {showHint && (
              <div className="rounded-xl bg-[#FFB84D]/15 border border-[#FFB84D]/40 p-3 text-xs text-[#FFB84D] font-medium">
                Hint: {page.hint}
              </div>
            )}
            {showSolution && (
              <div className="rounded-xl bg-[#37D6F4]/15 border border-[#37D6F4]/40 p-3 text-xs text-[#37D6F4] font-medium">
                {page.fullSolution}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Wind, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

type PartId = 'gasket' | 'adapter' | 'cartridge' | 'hepa';

const PARTS: { id: PartId; name: string; desc: string }[] = [
  { id: 'cartridge', name: 'LiOH CO₂ Cartridge', desc: 'Square chemical absorber canister' },
  { id: 'hepa', name: 'HEPA Pre-Filter', desc: 'Top dust & lint screen' },
  { id: 'gasket', name: 'Seal Gasket', desc: 'Rubber airtight base ring' },
  { id: 'adapter', name: 'Square-to-Round Adapter', desc: 'Apollo 13-style improvised duct collar' },
];

const SLOTS: { slotIndex: number; expected: PartId; label: string; hint: string }[] = [
  { slotIndex: 0, expected: 'gasket', label: 'Slot 1 · Blower Base', hint: 'Needs an airtight rubber seal first' },
  { slotIndex: 1, expected: 'adapter', label: 'Slot 2 · Duct Collar', hint: 'Connects round pipe to square cartridge' },
  { slotIndex: 2, expected: 'cartridge', label: 'Slot 3 · Chemical Bed', hint: 'Absorbs cabin CO₂ gas' },
  { slotIndex: 3, expected: 'hepa', label: 'Slot 4 · Top Intake', hint: 'Catches floating dust before air enters' },
];

export default function FilterAdapterPuzzle() {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const closePuzzle = useGameStore((s) => s.closePuzzle);
  const openModal = useGameStore((s) => s.openModal);

  const [selectedPart, setSelectedPart] = useState<PartId | null>(null);
  const [placed, setPlaced] = useState<(PartId | null)[]>([null, null, null, null]);
  const [feedback, setFeedback] = useState(
    'Assemble the CO₂ Scrubber from Slot 1 (bottom) to Slot 4 (top) so cabin air flows cleanly!'
  );
  const [isError, setIsError] = useState(false);

  const allCorrect = SLOTS.every((s, idx) => placed[idx] === s.expected);

  const tryPlace = (partId: PartId, slotIdx: number) => {
    const expected = SLOTS[slotIdx].expected;
    if (partId === expected) {
      const next = [...placed];
      next[slotIdx] = partId;
      setPlaced(next);
      setSelectedPart(null);
      setIsError(false);
      const done = SLOTS.every((s, i) => next[i] === s.expected);
      setFeedback(
        done
          ? 'Airflow continuous! Cabin CO₂ is now being scrubbed (remember: CO₂ scrubbers remove CO₂, they do not make O₂!).'
          : `Great fit in Slot ${slotIdx + 1}! Select the next component.`
      );
    } else {
      setIsError(true);
      setSelectedPart(null);
      const partName = PARTS.find((p) => p.id === partId)?.name || 'That part';
      setFeedback(`${partName} does not seal in Slot ${slotIdx + 1}. Hint: ${SLOTS[slotIdx].hint}.`);
      completePuzzle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFB84D]/15 border border-[#FFB84D]/40 flex items-center justify-center text-[#FFB84D]">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F4F7FB]">
                CO₂ Scrubber & Apollo 13 Adapter Puzzle
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                Simplified educational adaptation · Build continuous cabin airflow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('manual', 'co2-scrubber')}
              className="px-3 py-1.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-xs font-semibold text-[#37D6F4] hover:border-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
            <button
              onClick={closePuzzle}
              aria-label="Close puzzle"
              className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Available Parts */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#AAB8C8]">
                Available Components
              </p>
              {PARTS.map((part) => {
                const used = placed.includes(part.id);
                const selected = selectedPart === part.id;
                return (
                  <button
                    key={part.id}
                    draggable={!used}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', part.id);
                      setSelectedPart(part.id);
                    }}
                    onClick={() => !used && setSelectedPart(part.id)}
                    disabled={used}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      used
                        ? 'bg-[#37D67A]/10 border-[#37D67A]/40 text-[#37D67A]/80'
                        : selected
                          ? 'bg-[#152A3E] border-[#37D6F4] ring-2 ring-[#37D6F4]/30 text-white'
                          : 'bg-[#07111F] border-white/15 text-[#F4F7FB] hover:border-white/35'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{part.name}</span>
                      {used && <CheckCircle2 className="w-4 h-4 text-[#37D67A]" />}
                    </div>
                    <p className="text-xs text-[#AAB8C8] mt-0.5">{part.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Filter Housing Stack (Top -> Bottom visualization, Slot 4 on top down to Slot 1 base) */}
            <div className="space-y-2.5 rounded-2xl bg-[#07111F] border border-white/10 p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#AAB8C8] mb-1">
                <span>Scrubber Housing</span>
                <span className={allCorrect ? 'text-[#37D67A]' : 'text-[#FFB84D]'}>
                  {allCorrect ? 'AIRFLOW ACTIVE' : 'AIRFLOW BLOCKED'}
                </span>
              </div>
              {[...SLOTS].reverse().map((slot) => {
                const filledId = placed[slot.slotIndex];
                const filledPart = PARTS.find((p) => p.id === filledId);
                return (
                  <button
                    key={slot.slotIndex}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const pid = (e.dataTransfer.getData('text/plain') || selectedPart) as PartId;
                      if (pid) tryPlace(pid, slot.slotIndex);
                    }}
                    onClick={() => selectedPart && tryPlace(selectedPart, slot.slotIndex)}
                    className={`w-full px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      filledPart
                        ? 'bg-[#37D67A]/15 border-[#37D67A] text-[#37D67A]'
                        : selectedPart
                          ? 'bg-[#152A3E] border-dashed border-[#37D6F4] text-white'
                          : 'bg-[#0D1B2A] border-white/15 text-[#AAB8C8]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{slot.label}</span>
                      <span>{filledPart ? filledPart.name : 'Empty Slot'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`mt-4 rounded-xl px-4 py-3 border text-sm flex items-center gap-2.5 ${
              allCorrect
                ? 'bg-[#37D67A]/15 border-[#37D67A]/50 text-[#37D67A]'
                : isError
                  ? 'bg-[#FF5B68]/15 border-[#FF5B68]/50 text-[#FF5B68]'
                  : 'bg-[#152A3E] border-white/10 text-[#F4F7FB]'
            }`}
          >
            {allCorrect ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 shrink-0 text-[#37D6F4]" />
            )}
            <span>{feedback}</span>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => {
                setPlaced([null, null, null, null]);
                setSelectedPart(null);
                setIsError(false);
                setFeedback('Housing cleared. Start from Slot 1 at the blower base.');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#152A3E] border border-white/15 text-sm font-semibold text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              Reset Housing
            </button>
            <button
              onClick={() => completePuzzle(true)}
              disabled={!allCorrect}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                allCorrect
                  ? 'bg-[#37D67A] hover:bg-[#48e088] text-[#07111F] shadow-lg'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Activate Scrubber Fan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export default function HullPatchPuzzle() {
  const activePuzzle = useGameStore((s) => s.activePuzzle);
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const closePuzzle = useGameStore((s) => s.closePuzzle);

  const seed = activePuzzle?.instanceSeed ?? 1;
  const { target, initialPatch } = useMemo(() => {
    const s1 = ((seed * 1664525 + 1013904223) >>> 0);
    const s2 = ((s1 * 1664525 + 1013904223) >>> 0);
    const tx = 20 + (s1 % 62); // 20..81
    const ty = 22 + (s2 % 56); // 22..77
    const px = tx > 50 ? 18 : 82;
    const py = ty > 50 ? 22 : 76;
    return { target: { x: tx, y: ty }, initialPatch: { x: px, y: py } };
  }, [seed]);

  const areaRef = useRef<HTMLDivElement>(null);
  const [patchPos, setPatchPos] = useState(initialPatch);
  const [dragging, setDragging] = useState(false);

  const dist = Math.hypot(patchPos.x - target.x, patchPos.y - target.y);
  const alignment = Math.max(0, Math.round(100 - dist * 2.1));
  const aligned = dist <= 8;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(85, ((clientY - rect.top) / rect.height) * 100));
    setPatchPos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#0D1B2A] border border-[#FFB84D]/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#FFB84D]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F4F7FB]">
                Hull Breach Patch Alignment
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                Drag the orange Composite Patch directly over the glowing hull leak
              </p>
            </div>
          </div>
          <button
            onClick={closePuzzle}
            aria-label="Close puzzle"
            className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div
            ref={areaRef}
            onPointerMove={(e) => dragging && updateFromPointer(e.clientX, e.clientY)}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
            className="relative h-64 rounded-2xl bg-[#07111F] border border-white/15 overflow-hidden touch-none select-none"
          >
            {/* Hull metal panel grid lines */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#37D6F4_1px,transparent_1px),linear-gradient(to_bottom,#37D6F4_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Target Breach Ring */}
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center ${
                aligned ? 'border-[#37D67A] bg-[#37D67A]/15' : 'border-[#37D6F4] bg-[#37D6F4]/10'
              }`}
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-center text-white/90">
                {aligned ? 'SEALED' : 'LEAK ZONE'}
              </span>
            </div>

            {/* Draggable Composite Patch */}
            <div
              onPointerDown={(e) => {
                setDragging(true);
                updateFromPointer(e.clientX, e.clientY);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-lg transition-colors ${
                aligned
                  ? 'bg-[#37D67A]/90 border-white text-[#07111F]'
                  : 'bg-[#FF7A3D]/90 border-[#FFB84D] text-white'
              }`}
              style={{ left: `${patchPos.x}%`, top: `${patchPos.y}%` }}
            >
              <span className="text-xs font-extrabold">HULL PATCH</span>
              <span className="text-[10px] font-mono tabular-nums">{alignment}%</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-sm text-[#AAB8C8]">
              Seal Alignment:{' '}
              <span className={`font-bold tabular-nums ${aligned ? 'text-[#37D67A]' : 'text-[#FFB84D]'}`}>
                {alignment}%
              </span>
            </div>
            <button
              onClick={() => completePuzzle(true)}
              disabled={!aligned}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer ${
                aligned
                  ? 'bg-[#37D67A] text-[#07111F] hover:bg-[#48e088]'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lock Hull Seal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

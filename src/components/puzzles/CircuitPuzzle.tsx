import { useState } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, X, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

type WireColor = 'red' | 'yellow' | 'black';

const SOURCES: { id: WireColor; label: string; colorHex: string; portTarget: WireColor }[] = [
  { id: 'red', label: 'RED · +12V PWR', colorHex: '#FF5B68', portTarget: 'red' },
  { id: 'yellow', label: 'YELLOW · CTRL', colorHex: '#FFB84D', portTarget: 'yellow' },
  { id: 'black', label: 'BLACK · GND', colorHex: '#94A3B8', portTarget: 'black' },
];

// Shuffled order for right-side ports so player actually matches them
const DEST_PORTS: { id: WireColor; label: string; colorHex: string }[] = [
  { id: 'yellow', label: 'PORT B · CTRL', colorHex: '#FFB84D' },
  { id: 'black', label: 'PORT C · GND', colorHex: '#94A3B8' },
  { id: 'red', label: 'PORT A · PWR+', colorHex: '#FF5B68' },
];

export default function CircuitPuzzle() {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const closePuzzle = useGameStore((s) => s.closePuzzle);
  const openModal = useGameStore((s) => s.openModal);

  const [selectedSource, setSelectedSource] = useState<WireColor | null>(null);
  const [connected, setConnected] = useState<Record<WireColor, boolean>>({
    red: false,
    yellow: false,
    black: false,
  });
  const [feedback, setFeedback] = useState<string>(
    'Select a colored wire on the left, then tap or drop it onto its matching port on the right.'
  );
  const [isError, setIsError] = useState(false);

  const allDone = connected.red && connected.yellow && connected.black;

  const tryConnect = (source: WireColor, dest: WireColor) => {
    if (connected[source]) return;
    if (source === dest) {
      const next = { ...connected, [source]: true };
      setConnected(next);
      setSelectedSource(null);
      setIsError(false);
      if (next.red && next.yellow && next.black) {
        setFeedback('All 3 harness wires locked! Circuit continuity 100% restored!');
      } else {
        setFeedback(`Connected ${source.toUpperCase()} harness! Match the remaining wires.`);
      }
    } else {
      setIsError(true);
      setSelectedSource(null);
      setFeedback('That connection does not match. Check the Repair Manual diagram!');
      completePuzzle(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, src: WireColor) => {
    e.dataTransfer.setData('text/plain', src);
    setSelectedSource(src);
  };

  const handleDrop = (e: React.DragEvent, dest: WireColor) => {
    e.preventDefault();
    const src = (e.dataTransfer.getData('text/plain') || selectedSource) as WireColor;
    if (src) tryConnect(src, dest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#37D6F4]/15 border border-[#37D6F4]/40 flex items-center justify-center text-[#37D6F4]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F4F7FB]">
                Color-Coded Circuit Reconnect Puzzle
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                Fictional low-voltage educational schematic · Match wire colors and labels
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('manual', 'oxygen-generator')}
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

        {/* Circuit Board Area */}
        <div className="p-6">
          <div className="relative rounded-2xl bg-[#07111F] border border-white/10 p-6">
            <div className="grid grid-cols-2 gap-10 items-center relative z-10">
              {/* Left Source Terminals */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#AAB8C8]">
                  Source Harness Leads
                </p>
                {SOURCES.map((src) => {
                  const isConnected = connected[src.id];
                  const isSelected = selectedSource === src.id;
                  return (
                    <button
                      key={src.id}
                      draggable={!isConnected}
                      onDragStart={(e) => handleDragStart(e, src.id)}
                      onClick={() => !isConnected && setSelectedSource(src.id)}
                      disabled={isConnected}
                      className={`w-full px-4 py-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isConnected
                          ? 'bg-[#37D67A]/15 border-[#37D67A] text-[#37D67A]'
                          : isSelected
                            ? 'bg-[#152A3E] border-[#37D6F4] ring-2 ring-[#37D6F4]/40 text-white'
                            : 'bg-[#0D1B2A] border-white/15 text-[#F4F7FB] hover:border-white/40'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-sm font-bold">
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: src.colorHex }}
                        />
                        {src.label}
                      </span>
                      {isConnected && <CheckCircle2 className="w-4 h-4 text-[#37D67A]" />}
                    </button>
                  );
                })}
              </div>

              {/* Right Destination Ports */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#AAB8C8]">
                  Destination Ports
                </p>
                {DEST_PORTS.map((port) => {
                  const isConnected = connected[port.id];
                  return (
                    <button
                      key={port.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, port.id)}
                      onClick={() => selectedSource && tryConnect(selectedSource, port.id)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isConnected
                          ? 'bg-[#37D67A]/15 border-[#37D67A] text-[#37D67A]'
                          : selectedSource
                            ? 'bg-[#152A3E] border-dashed border-[#37D6F4]/70 text-white hover:bg-[#152A3E]/80'
                            : 'bg-[#0D1B2A] border-white/15 text-[#F4F7FB]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 text-sm font-bold">
                        <span
                          className="w-4 h-4 rounded-sm border border-white/30 shrink-0"
                          style={{ backgroundColor: port.colorHex }}
                        />
                        {port.label}
                      </span>
                      <span className="text-xs font-mono text-[#AAB8C8]">
                        {isConnected ? 'LOCKED' : selectedSource ? 'DROP HERE' : 'OPEN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          <div
            className={`mt-4 rounded-xl px-4 py-3 border text-sm flex items-center gap-2.5 ${
              allDone
                ? 'bg-[#37D67A]/15 border-[#37D67A]/50 text-[#37D67A]'
                : isError
                  ? 'bg-[#FF5B68]/15 border-[#FF5B68]/50 text-[#FF5B68]'
                  : 'bg-[#152A3E] border-white/10 text-[#F4F7FB]'
            }`}
          >
            {allDone ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 shrink-0 text-[#37D6F4]" />
            )}
            <span>{feedback}</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setConnected({ red: false, yellow: false, black: false });
                setSelectedSource(null);
                setIsError(false);
                setFeedback('Board reset. Match each color wire to its port.');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#152A3E] border border-white/15 text-sm font-semibold text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              Reset Wires
            </button>

            <button
              onClick={() => completePuzzle(true)}
              disabled={!allDone}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                allDone
                  ? 'bg-[#37D67A] hover:bg-[#48e088] text-[#07111F] shadow-lg'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Restore System Power
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

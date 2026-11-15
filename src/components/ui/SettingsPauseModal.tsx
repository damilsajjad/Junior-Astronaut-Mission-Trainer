import { useState } from 'react';
import { Play, RotateCcw, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export default function SettingsPauseModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const savedProgress = useGameStore((s) => s.savedProgress);
  const difficulty = useGameStore((s) => s.difficulty);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const toggleLowGraphics = useGameStore((s) => s.toggleLowGraphics);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const resetMission = useGameStore((s) => s.resetMission);
  const closeModal = useGameStore((s) => s.closeModal);

  const [confirmAbandon, setConfirmAbandon] = useState(false);

  if (activeModal !== 'pause' && activeModal !== 'settings') return null;
  const isPause = activeModal === 'pause';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/20 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#37D6F4]" />
            <h2 className="text-lg font-bold text-[#F4F7FB]">
              {isPause ? 'Mission Paused' : 'Training Settings'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-[#07111F] border border-white/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              {savedProgress.muted ? (
                <VolumeX className="w-4 h-4 text-[#AAB8C8]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#37D6F4]" />
              )}
              <span className="text-sm font-semibold text-[#F4F7FB]">Sound Effects</span>
            </div>
            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                !savedProgress.muted ? 'bg-[#37D67A] text-[#07111F]' : 'bg-[#152A3E] text-[#AAB8C8]'
              }`}
            >
              {savedProgress.muted ? 'Muted' : 'Enabled'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#07111F] border border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#F4F7FB]">Reduced Motion</p>
              <p className="text-xs text-[#AAB8C8]">Shorter cinematic & gentler transitions</p>
            </div>
            <button
              onClick={toggleReducedMotion}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                savedProgress.reducedMotion ? 'bg-[#37D6F4] text-[#07111F]' : 'bg-[#152A3E] text-[#AAB8C8]'
              }`}
            >
              {savedProgress.reducedMotion ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#07111F] border border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#F4F7FB]">Low-Quality 3D Graphics</p>
              <p className="text-xs text-[#AAB8C8]">Boosts speed on older laptops</p>
            </div>
            <button
              onClick={toggleLowGraphics}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                savedProgress.lowGraphics ? 'bg-[#37D6F4] text-[#07111F]' : 'bg-[#152A3E] text-[#AAB8C8]'
              }`}
            >
              {savedProgress.lowGraphics ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#07111F] border border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#F4F7FB]">Difficulty Mode</p>
              <p className="text-xs text-[#AAB8C8]">Cadet (guided) vs Commander (detailed)</p>
            </div>
            <div className="flex items-center gap-1 bg-[#152A3E] p-1 rounded-lg">
              <button
                onClick={() => setDifficulty('cadet')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                  difficulty === 'cadet' ? 'bg-[#37D6F4] text-[#07111F]' : 'text-[#AAB8C8]'
                }`}
              >
                Cadet
              </button>
              <button
                onClick={() => setDifficulty('commander')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                  difficulty === 'commander' ? 'bg-[#FF7A3D] text-white' : 'text-[#AAB8C8]'
                }`}
              >
                Commander
              </button>
            </div>
          </div>

          {isPause && (
            <div className="pt-2 space-y-2.5 border-t border-white/10">
              <button
                onClick={closeModal}
                className="w-full py-2.5 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Resume Mission</span>
              </button>
              {!confirmAbandon ? (
                <button
                  onClick={() => setConfirmAbandon(true)}
                  className="w-full py-2.5 rounded-xl bg-[#152A3E] border border-[#FF5B68]/40 text-[#FF5B68] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Abandon Mission</span>
                </button>
              ) : (
                <div className="rounded-xl bg-[#FF5B68]/15 border border-[#FF5B68]/40 p-3 text-center space-y-2">
                  <p className="text-xs text-[#F4F7FB] font-semibold">
                    Return to Mission Select? Current Sol progress will reset.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setConfirmAbandon(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#152A3E] text-xs font-semibold text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => resetMission(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF5B68] text-xs font-bold text-white cursor-pointer"
                    >
                      Confirm Exit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { LogOut, Play, RotateCcw, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export default function SettingsPauseModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const missionStatus = useGameStore((s) => s.missionStatus);
  const savedProgress = useGameStore((s) => s.savedProgress);
  const difficulty = useGameStore((s) => s.difficulty);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const setAudioVolume = useGameStore((s) => s.setAudioVolume);
  const toggleReducedMotion = useGameStore((s) => s.toggleReducedMotion);
  const toggleLowGraphics = useGameStore((s) => s.toggleLowGraphics);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const exitGameSafely = useGameStore((s) => s.exitGameSafely);
  const resetMission = useGameStore((s) => s.resetMission);
  const closeModal = useGameStore((s) => s.closeModal);

  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    if (activeModal !== 'pause' && activeModal !== 'settings') {
      setConfirmAbandon(false);
      setConfirmExit(false);
    }
  }, [activeModal]);

  if (activeModal !== 'pause' && activeModal !== 'settings' && activeModal !== 'exit-confirm') {
    return null;
  }

  const isPause = activeModal === 'pause';
  const isStandaloneExitConfirm = activeModal === 'exit-confirm';
  const inActiveMission =
    missionStatus === 'active' || missionStatus === 'paused' || missionStatus === 'briefing';

  // Dedicated confirmation dialog (triggered either directly via HUD Exit icon or inside Pause/Settings)
  if (isStandaloneExitConfirm || confirmExit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-confirm-title"
          className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-[#FF5B68]/45 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <LogOut className="w-5 h-5 text-[#FF7A3D]" />
              <h2 id="exit-confirm-title" className="text-lg font-bold text-[#F4F7FB]">
                Exit Game
              </h2>
            </div>
            <button
              onClick={() => (isStandaloneExitConfirm ? closeModal() : setConfirmExit(false))}
              aria-label="Continue Playing"
              className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2 text-center">
              <p className="text-base font-extrabold text-[#F4F7FB]">
                Are you sure you want to exit the mission?
              </p>
              <p className="text-xs text-[#AAB8C8] leading-relaxed">
                {inActiveMission
                  ? 'Your current Sol progress, crew vitals, and habitat systems will be saved before exiting to the Main Menu.'
                  : 'Your cadet settings and progress will be saved before returning to the Main Menu.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => (isStandaloneExitConfirm ? closeModal() : setConfirmExit(false))}
                className="py-2.5 px-4 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] font-extrabold text-sm cursor-pointer transition-colors"
              >
                Continue Playing
              </button>
              <button
                onClick={() => {
                  setConfirmExit(false);
                  exitGameSafely();
                }}
                className="py-2.5 px-4 rounded-xl bg-[#FF5B68] hover:bg-[#ff707c] text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Game</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="rounded-xl bg-[#07111F] border border-white/10 px-4 py-3 space-y-2.5">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <label
                htmlFor="audio-volume-slider"
                className="text-xs font-semibold text-[#AAB8C8] shrink-0"
              >
                Volume
              </label>
              <input
                id="audio-volume-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((savedProgress.muted ? 0 : savedProgress.volume) * 100)}
                onChange={(e) => setAudioVolume(Number(e.target.value) / 100)}
                className="flex-1 accent-[#37D6F4] cursor-pointer"
              />
              <span className="text-xs font-bold text-[#37D6F4] tabular-nums w-9 text-right">
                {Math.round((savedProgress.muted ? 0 : savedProgress.volume) * 100)}%
              </span>
            </div>
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

          <div className="pt-2 space-y-2.5 border-t border-white/10">
            {isPause && (
              <button
                onClick={closeModal}
                className="w-full py-2.5 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Resume Mission</span>
              </button>
            )}

            <button
              onClick={() => setConfirmExit(true)}
              className="w-full py-2.5 rounded-xl bg-[#FF5B68]/15 hover:bg-[#FF5B68]/25 border border-[#FF5B68]/60 text-[#FF5B68] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Game</span>
            </button>

            {isPause &&
              (!confirmAbandon ? (
                <button
                  onClick={() => setConfirmAbandon(true)}
                  className="w-full py-2 rounded-xl bg-[#152A3E] border border-white/15 text-[#AAB8C8] hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Mission Without Saving</span>
                </button>
              ) : (
                <div className="rounded-xl bg-[#FF5B68]/15 border border-[#FF5B68]/40 p-3 text-center space-y-2">
                  <p className="text-xs text-[#F4F7FB] font-semibold">
                    Return to Mission Select without saving current Sol progress?
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
                      Confirm Reset
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

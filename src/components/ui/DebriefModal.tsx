import { Award, BookOpen, RotateCcw, ShieldAlert, Trophy } from 'lucide-react';
import { computeMissionScore } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';

export default function DebriefModal() {
  const missionStatus = useGameStore((s) => s.missionStatus);
  const destination = useGameStore((s) => s.destination);
  const crew = useGameStore((s) => s.crew);
  const resources = useGameStore((s) => s.resources);
  const systems = useGameStore((s) => s.systems);
  const completedScenarios = useGameStore((s) => s.completedScenarios);
  const selectedPlansLog = useGameStore((s) => s.selectedPlansLog);
  const puzzlesCompletedCount = useGameStore((s) => s.puzzlesCompletedCount);
  const savedProgress = useGameStore((s) => s.savedProgress);
  const openModal = useGameStore((s) => s.openModal);
  const resetMission = useGameStore((s) => s.resetMission);

  if (missionStatus !== 'success' && missionStatus !== 'safety-protocol') return null;

  const isSafetyProtocol = missionStatus === 'safety-protocol';
  const breakdown = computeMissionScore({
    crew,
    resources,
    systems,
    emergenciesResolved: completedScenarios.length,
    puzzlesCompleted: puzzlesCompletedCount,
    safetyProtocolActivated: isSafetyProtocol,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden my-auto">
        <div
          className={`px-6 py-5 border-b border-white/10 flex items-center justify-between ${
            isSafetyProtocol ? 'bg-[#FFB84D]/15' : 'bg-[#37D67A]/15'
          }`}
        >
          <div className="flex items-center gap-3">
            {isSafetyProtocol ? (
              <ShieldAlert className="w-7 h-7 text-[#FFB84D]" />
            ) : (
              <Trophy className="w-7 h-7 text-[#37D67A]" />
            )}
            <div>
              <h2 className="text-xl font-extrabold text-[#F4F7FB]">
                {isSafetyProtocol
                  ? 'Mission Safety Protocol Activated'
                  : 'Mission Completed: Crew Returned Safely!'}
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                {destination === 'mars' ? 'Mars Outpost (0.38g)' : 'Lunar Outpost (0.16g)'} ·{' '}
                {crew.length} of {crew.length} crew members safe
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#AAB8C8]">Mission Score</p>
            <p className="text-2xl font-extrabold text-[#37D6F4] tabular-nums">
              {breakdown.total} / 100
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 100-Point Educational Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3">
              <p className="text-[11px] text-[#AAB8C8]">Crew Safety</p>
              <p className="text-lg font-bold text-[#37D67A] tabular-nums">{breakdown.crewSafety} / 40</p>
            </div>
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3">
              <p className="text-[11px] text-[#AAB8C8]">System Stability</p>
              <p className="text-lg font-bold text-[#37D6F4] tabular-nums">{breakdown.systemStability} / 25</p>
            </div>
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3">
              <p className="text-[11px] text-[#AAB8C8]">Resource Efficiency</p>
              <p className="text-lg font-bold text-[#FFB84D] tabular-nums">{breakdown.resourceEfficiency} / 20</p>
            </div>
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3">
              <p className="text-[11px] text-[#AAB8C8]">Contingency Plans</p>
              <p className="text-lg font-bold text-[#F4F7FB] tabular-nums">{breakdown.contingencyPlanning} / 15</p>
            </div>
          </div>

          {/* Remaining Resources */}
          <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
              Final Habitat Reserves
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm tabular-nums">
              <div>Oxygen: <span className="font-bold text-[#37D6F4]">{resources.oxygen}%</span></div>
              <div>Water: <span className="font-bold text-[#37D6F4]">{resources.water}%</span></div>
              <div>Battery: <span className="font-bold text-[#FFB84D]">{resources.battery}%</span></div>
              <div>Food: <span className="font-bold text-[#37D67A]">{resources.food}%</span></div>
            </div>
          </div>

          {/* Decisions & Learning Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
                Decisions & Repairs ({puzzlesCompletedCount} puzzles solved)
              </h3>
              {selectedPlansLog.length === 0 ? (
                <p className="text-xs text-[#AAB8C8]">
                  Tip: Next run, execute Plan A, B, or C whenever an alert activates!
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs text-[#F4F7FB]">
                  {selectedPlansLog.map((entry, idx) => (
                    <li key={idx}>
                      • {entry.title}: <span className="text-[#37D6F4] font-bold">Plan {entry.plan}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-[#152A3E] border border-[#37D6F4]/30 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#37D6F4] mb-1.5">
                Space Science Takeaway
              </h3>
              <p className="text-xs text-[#F4F7FB] leading-relaxed">
                {isSafetyProtocol
                  ? 'Real NASA crews practice emergency evacuations and backup Plan B/C routes. Check which resource ran low first and try pausing Greenhouse lights during dust storms!'
                  : 'Great command! You balanced Water Electrolysis (O₂), CO₂ Scrubbing, Solar Power budgets, and Water-Barrier Radiation Shielding.'}
              </p>
            </div>
          </div>

          {/* Unlocked Achievements */}
          <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#FFB84D]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8]">
                Earned Cadet Badges
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedProgress.unlockedAchievements.map((badge) => (
                <span
                  key={badge}
                  className="text-xs font-semibold text-[#FFB84D] bg-[#FFB84D]/10 border border-[#FFB84D]/30 rounded-lg px-2.5 py-1"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={() => openModal('manual')}
              className="px-4 py-2.5 rounded-xl bg-[#152A3E] border border-white/15 text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#37D6F4]" />
              <span>Review Manual</span>
            </button>
            <button
              onClick={() => resetMission(false)}
              className="px-4 py-2.5 rounded-xl bg-[#37D6F4] hover:bg-[#5ae0f7] text-[#07111F] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Mission</span>
            </button>
            <button
              onClick={() => resetMission(true)}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-xs font-bold cursor-pointer"
            >
              Mission Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

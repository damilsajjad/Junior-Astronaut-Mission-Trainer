import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Trophy,
  XCircle,
} from 'lucide-react';
import { computeMissionScore } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';

export default function DebriefModal() {
  const missionStatus = useGameStore((s) => s.missionStatus);
  const missionOutcome = useGameStore((s) => s.missionOutcome);
  const destination = useGameStore((s) => s.destination);
  const sol = useGameStore((s) => s.sol);
  const maxSols = useGameStore((s) => s.maxSols);
  const crew = useGameStore((s) => s.crew);
  const resources = useGameStore((s) => s.resources);
  const systems = useGameStore((s) => s.systems);
  const objectives = useGameStore((s) => s.objectives);
  const safetyReason = useGameStore((s) => s.safetyReason);
  const completedScenarios = useGameStore((s) => s.completedScenarios);
  const selectedPlansLog = useGameStore((s) => s.selectedPlansLog);
  const puzzlesCompletedCount = useGameStore((s) => s.puzzlesCompletedCount);
  const savedProgress = useGameStore((s) => s.savedProgress);
  const openModal = useGameStore((s) => s.openModal);
  const resetMission = useGameStore((s) => s.resetMission);

  if (missionStatus !== 'success' && missionStatus !== 'safety-protocol') return null;

  const isSafetyProtocol = missionStatus === 'safety-protocol' || missionOutcome === 'safety-protocol';
  const isVictory = !isSafetyProtocol && missionOutcome === 'victory';

  const breakdown = computeMissionScore({
    crew,
    resources,
    systems,
    emergenciesResolved: completedScenarios.length,
    puzzlesCompleted: puzzlesCompletedCount,
    researchProgress: objectives.researchProgress,
    safetyProtocolActivated: isSafetyProtocol,
  });

  const bannerBg = isSafetyProtocol
    ? 'bg-[#FF5B68]/15'
    : isVictory
      ? 'bg-[#37D67A]/15'
      : 'bg-[#FFB84D]/15';

  const headline = isSafetyProtocol
    ? 'Failure · Mission Safety Protocol Activated'
    : isVictory
      ? 'Victory · All 10-Sol Objectives Completed!'
      : 'Partial Result · Crew Survived 10 Sols';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden my-auto">
        <div className={`px-6 py-5 border-b border-white/10 flex items-center justify-between ${bannerBg}`}>
          <div className="flex items-center gap-3">
            {isSafetyProtocol ? (
              <ShieldAlert className="w-7 h-7 text-[#FF5B68]" />
            ) : isVictory ? (
              <Trophy className="w-7 h-7 text-[#37D67A]" />
            ) : (
              <AlertCircle className="w-7 h-7 text-[#FFB84D]" />
            )}
            <div>
              <h2 className="text-xl font-extrabold text-[#F4F7FB]">{headline}</h2>
              <p className="text-xs text-[#AAB8C8]">
                {destination === 'mars' ? 'Mars Outpost (0.38g)' : 'Lunar Outpost (0.16g)'} · Sol {sol} of {maxSols} ·{' '}
                {crew.filter((c) => c.health > 0).length} of {crew.length} crew members evacuated/safe
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

        <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto">
          {(safetyReason || isSafetyProtocol) && (
            <div className="rounded-xl bg-[#FF5B68]/15 border border-[#FF5B68]/40 p-3.5 text-xs font-semibold text-[#FF5B68]">
              Stage 3 Safety Protocol Triggered · Earth Rescue Launched — Cause:{' '}
              {safetyReason || 'Critical life-support or crew safety threshold breached.'}
            </div>
          )}

          {/* 3 Mission Objectives Checklist */}
          <div className="rounded-xl bg-[#07111F] border border-white/10 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#37D6F4]">
              Mission Objectives Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 flex items-center gap-2">
                {objectives.lifeSupportMaintained ? (
                  <CheckCircle2 className="w-4 h-4 text-[#37D67A] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF5B68] shrink-0" />
                )}
                <div>
                  <p className="font-bold text-[#F4F7FB]">Life Support Stable</p>
                  <p className="text-[11px] text-[#AAB8C8]">
                    {objectives.lifeSupportMaintained ? 'Completed' : 'Degraded at mission end'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 flex items-center gap-2">
                {objectives.researchCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-[#37D67A] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FFB84D] shrink-0" />
                )}
                <div>
                  <p className="font-bold text-[#F4F7FB]">Research Task</p>
                  <p className="text-[11px] text-[#AAB8C8]">
                    {objectives.researchProgress}% / 100%
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 flex items-center gap-2">
                {objectives.survivedAllDays ? (
                  <CheckCircle2 className="w-4 h-4 text-[#37D67A] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF5B68] shrink-0" />
                )}
                <div>
                  <p className="font-bold text-[#F4F7FB]">10-Sol Endurance</p>
                  <p className="text-[11px] text-[#AAB8C8]">
                    {objectives.survivedAllDays ? 'Survived Sol 10' : `Stopped on Sol ${sol}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

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

          {/* Crew Condition + Remaining Resources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
                Crew Condition (4 Astronauts)
              </h3>
              <div className="space-y-2 text-xs">
                {crew.map((c) => (
                  <div key={c.id} className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#F4F7FB] font-semibold">
                        {c.label} <span className="text-[#AAB8C8]">({c.assignedTask})</span>
                      </span>
                      <span className="font-bold text-[#37D67A] tabular-nums">
                        {Math.round(c.health)}% HP
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#AAB8C8] tabular-nums">
                      <span>H₂O <strong className="text-[#37D6F4]">{Math.round(c.hydration)}%</strong></span>
                      <span>Food <strong className="text-[#37D67A]">{Math.round(c.nutrition)}%</strong></span>
                      <span>Stam <strong className="text-[#FFB84D]">{Math.round(c.energy)}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
                Final Habitat Reserves
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                <div>Oxygen: <span className="font-bold text-[#37D6F4]">{Math.round(resources.oxygen)}%</span></div>
                <div>Water: <span className="font-bold text-[#37D6F4]">{Math.round(resources.water)}%</span></div>
                <div>Battery: <span className="font-bold text-[#FFB84D]">{Math.round(resources.battery)}%</span></div>
                <div>Food: <span className="font-bold text-[#37D67A]">{Math.round(resources.food)}%</span></div>
                <div>CO₂: <span className="font-bold text-white">{Math.round(resources.co2)}%</span></div>
                <div>Pressure: <span className="font-bold text-white">{Math.round(resources.habitatPressure)}%</span></div>
                <div>Temp Safety: <span className="font-bold text-white">{Math.round(resources.temperatureSafety)}%</span></div>
                <div>Shield: <span className="font-bold text-[#37D6F4]">{Math.round(resources.radiationProtection)}%</span></div>
              </div>
            </div>
          </div>

          {/* Decisions & Lessons Learned */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
                Decisions & Repairs ({puzzlesCompletedCount} puzzles solved)
              </h3>
              {selectedPlansLog.length === 0 ? (
                <p className="text-xs text-[#AAB8C8]">
                  Tip: Execute Plan A, B, or C whenever an emergency activates so it doesn’t escalate!
                </p>
              ) : (
                <ul className="space-y-1 text-xs text-[#F4F7FB] max-h-28 overflow-y-auto">
                  {selectedPlansLog.map((entry, idx) => (
                    <li key={idx}>
                      • Sol {entry.sol} · {entry.title} ({entry.severity}):{' '}
                      <span className="text-[#37D6F4] font-bold">Plan {entry.plan}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl bg-[#152A3E] border border-[#37D6F4]/30 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#37D6F4] mb-1.5">
                Lessons Learned
              </h3>
              <p className="text-xs text-[#F4F7FB] leading-relaxed">
                {isSafetyProtocol
                  ? 'Safety Protocol protects astronauts when a life-support limit breaks. Check which system lost power or water input first, pause Research/Greenhouse during dust storms, and fix emergencies before they escalate!'
                  : isVictory
                    ? 'Outstanding command! You kept all 9 machines healthy, powered Research to 100%, adapted to forecasts, and balanced Water Electrolysis, CO₂ Scrubbing, and Solar budgets across all 10 Sols.'
                    : 'Your crew survived all 10 Sols! Next mission, assign Nova to Research (or boost Research at the console) and repair degraded systems before End of Sol 10 for full Victory.'}
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

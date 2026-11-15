import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  FlaskConical,
  HeartPulse,
  Power,
  ShieldCheck,
  Sprout,
  Users,
  X,
} from 'lucide-react';
import {
  buildMachineCatalog,
  evaluateThresholds,
  getPowerBreakdown,
  previewDailyRates,
} from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import { CrewTask, SystemToggleState } from '../../types/game';

const TASK_OPTIONS: { value: CrewTask; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance (+Cond)' },
  { value: 'research', label: 'Research (+Sci%)' },
  { value: 'greenhouse', label: 'Greenhouse (+Crops)' },
  { value: 'rest', label: 'Rest (+Heal/Stam)' },
];

export default function MissionControlModal() {
  const activeModal = useGameStore((s) => s.activeModal);
  const destination = useGameStore((s) => s.destination);
  const difficulty = useGameStore((s) => s.difficulty);
  const sol = useGameStore((s) => s.sol);
  const maxSols = useGameStore((s) => s.maxSols);
  const resources = useGameStore((s) => s.resources);
  const character = useGameStore((s) => s.character);
  const systems = useGameStore((s) => s.systems);
  const machineConditions = useGameStore((s) => s.machineConditions);
  const toggles = useGameStore((s) => s.toggles);
  const crew = useGameStore((s) => s.crew);
  const greenhouseState = useGameStore((s) => s.greenhouseState);
  const waterCycle = useGameStore((s) => s.waterCycle);
  const objectives = useGameStore((s) => s.objectives);
  const forecast = useGameStore((s) => s.forecast);
  const emergency = useGameStore((s) => s.emergency);
  const dustStormDaysRemaining = useGameStore((s) => s.dustStormDaysRemaining);
  const activeLeak = useGameStore((s) => s.activeLeak);
  const activeRadiationHazard = useGameStore((s) => s.activeRadiationHazard);

  const toggleSystemPower = useGameStore((s) => s.toggleSystemPower);
  const setCrewTask = useGameStore((s) => s.setCrewTask);
  const endMissionDay = useGameStore((s) => s.endMissionDay);
  const closeModal = useGameStore((s) => s.closeModal);

  const isReportMode = activeModal === 'end-day-report';

  const preview = previewDailyRates(destination, toggles, systems, dustStormDaysRemaining, {
    resources,
    machineConditions,
    crew,
    difficulty,
    activeLeak,
    activeRadiationHazard,
    emergency,
    greenhouseState,
    waterCycle,
  });

  const catalog = buildMachineCatalog({
    systems,
    machineConditions,
    toggles,
    resources,
    dustStormDaysRemaining,
    destination,
    greenhouseState,
    waterCycle,
  });

  const power = getPowerBreakdown({
    destination,
    toggles,
    systems,
    machineConditions,
    resources,
    dustStormDaysRemaining,
    emergency,
  });
  const activeDrawMap = new Map(power.machines.map((row) => [row.id, row.activeDraw]));

  const alerts = evaluateThresholds(resources, character);
  const foodDaysLeft = Math.max(0, Math.floor(resources.food / 7));

  const statusTone = (status: string) => {
    if (status === 'Operational') return 'text-[#37D67A]';
    if (status === 'Warning') return 'text-[#FFB84D]';
    return 'text-[#FF5B68]';
  };

  const fmtDelta = (val: number, inverseGood = false) => {
    const sign = val > 0 ? `+${val}` : `${val}`;
    const good = inverseGood ? val <= 0 : val >= 0;
    return (
      <span className={good ? 'text-[#37D67A] font-bold' : 'text-[#FF5B68] font-bold'}>
        {sign}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">
                {isReportMode
                  ? `Pre-End-Day Operational Report · Sol ${sol} of ${maxSols}`
                  : `Mission Control & All 9 Systems · Sol ${sol} of ${maxSols}`}
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                {isReportMode
                  ? 'Review projected End-of-Sol resource changes, warnings, and power toggles before advancing!'
                  : 'Inspect all 9 habitat machines, manage power priorities, and monitor all 4 astronauts'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close dashboard"
            className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mission Objectives + Next-Sol Forecast Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#07111F] border border-[#37D6F4]/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#37D6F4] flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4" /> 3 Mission Objectives
                </span>
                <span className="text-[11px] font-bold text-[#AAB8C8] tabular-nums">
                  Sol {sol}/{maxSols}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#F4F7FB]">1. Restore & Maintain Life Support</span>
                  <span className={objectives.lifeSupportMaintained ? 'text-[#37D67A] font-bold' : 'text-[#FFB84D] font-bold'}>
                    {objectives.lifeSupportMaintained ? 'Stable' : 'Needs Care'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F4F7FB]">2. Research Equipment Task</span>
                  <span className={objectives.researchCompleted ? 'text-[#37D67A] font-bold' : 'text-[#37D6F4] font-bold'}>
                    {objectives.researchProgress}% ({preview.researchGain > 0 ? `+${preview.researchGain}%/Sol` : 'OFF'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F4F7FB]">3. Maintain Outpost Through Sol {maxSols}</span>
                  <span className="text-[#FFB84D] font-bold">
                    {maxSols - sol} {maxSols - sol === 1 ? 'Sol' : 'Sols'} left
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-[#FFB84D]/35 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#FFB84D]">
                  Tomorrow Forecast & Active Alerts
                </span>
                {forecast && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#152A3E] text-[#37D6F4]">
                    {forecast.severity === 'calm' ? 'Calm Skies' : `${forecast.severity} forecast`}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[#F4F7FB]">
                {forecast ? forecast.advisory : 'Mission complete after Sol 10 End-of-Day debrief!'}
              </p>
              {emergency?.active && (
                <div className="rounded-lg bg-[#FF5B68]/15 border border-[#FF5B68]/40 px-2.5 py-1.5 text-[11px] text-[#FF5B68] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Active {emergency.severity.toUpperCase()} emergency unaddressed — will{' '}
                    {emergency.daysActive >= 1 ? 'continue escalating' : 'escalate tomorrow'}!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4 Primary Gauges + Projected Deltas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D6F4]">Life Support</span>
                <HeartPulse className="w-4 h-4 text-[#37D6F4]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {Math.round(resources.oxygen)}% <span className="text-xs font-normal text-[#AAB8C8]">O₂ ({fmtDelta(preview.netOxygen)})</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between">
                  <span>Potable Water</span>
                  <span className="text-white">{Math.round(resources.water)}% ({fmtDelta(preview.netWater)})</span>
                </div>
                <div className="flex justify-between">
                  <span>CO₂ Level</span>
                  <span className="text-white">{Math.round(resources.co2)}% ({fmtDelta(preview.netCo2, true)})</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#FFB84D]">Power Grid</span>
                <span
                  className={`text-[10px] font-extrabold uppercase ${
                    power.status === 'charging'
                      ? 'text-[#37D67A]'
                      : power.status === 'discharging'
                        ? 'text-[#FF5B68]'
                        : 'text-[#AAB8C8]'
                  }`}
                >
                  {power.status === 'charging'
                    ? 'Charging'
                    : power.status === 'discharging'
                      ? 'Discharging'
                      : 'Balanced'}
                </span>
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {Math.round(resources.battery)}% <span className="text-xs font-normal text-[#AAB8C8]">({fmtDelta(power.netPower)}/Sol)</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between">
                  <span>Solar ({power.solarEfficiencyPct}%)</span>
                  <span className="text-[#37D67A]">+{Math.round(power.solarGeneration)} PWR</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Load{power.batteryLeak > 0 ? ' + Fault' : ''}</span>
                  <span className="text-[#FFB84D]">-{Math.round(power.totalConsumption + power.batteryLeak)} PWR</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                  <div
                    className="h-full bg-[#37D67A] transition-all"
                    style={{ width: `${Math.min(100, Math.round((power.solarGeneration / 30) * 100))}%` }}
                  />
                  <div
                    className="h-full bg-[#FF7A3D] transition-all"
                    style={{ width: `${Math.min(100, Math.round(((power.totalConsumption + power.batteryLeak) / 30) * 100))}%` }}
                  />
                </div>
                {power.solarDamaged && (
                  <p className="text-[10px] font-bold text-[#FF5B68]">
                    Solar damaged! Turn OFF extra machines to save Battery.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D67A]">Crew Safety</span>
                <ShieldCheck className="w-4 h-4 text-[#37D67A]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {Math.round(resources.habitatPressure)}% <span className="text-xs font-normal text-[#AAB8C8]">Press ({fmtDelta(preview.netPressure)})</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between"><span>Temp Safety</span><span className="text-white">{Math.round(resources.temperatureSafety)}% ({fmtDelta(preview.netTemperature)})</span></div>
                <div className="flex justify-between"><span>Radiation Shield</span><span className="text-white">{Math.round(resources.radiationProtection)}% ({fmtDelta(preview.netRadiation)})</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-[#37D67A]/35 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D67A]">Food & Crops</span>
                <Sprout className="w-4 h-4 text-[#37D67A]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {Math.round(resources.food)}% <span className="text-xs font-normal text-[#AAB8C8]">({foodDaysLeft}d · {fmtDelta(preview.netFood)})</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between">
                  <span>Crop Growth</span>
                  <span className={greenhouseState.stage === 'ready' ? 'text-[#37D67A] font-bold' : 'text-[#37D6F4]'}>
                    {Math.round(greenhouseState.growthProgress)}% ({greenhouseState.stage})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-[#37D6F4]" /> Solid Waste</span>
                  <span className={waterCycle.solidWasteLevel >= 80 ? 'text-[#FF5B68] font-bold' : 'text-white'}>
                    {Math.round(waterCycle.solidWasteLevel)}% (Sealed)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Paused & Missing Input Warnings */}
          {(preview.autoPausedSystems.length > 0 || preview.unmetInputNotes.length > 0) && (
            <div className="rounded-xl bg-[#FFB84D]/15 border border-[#FFB84D]/45 p-3 space-y-1 text-xs text-[#FFB84D]">
              <p className="font-extrabold uppercase text-[11px]">Projected End-of-Sol Warnings</p>
              {preview.autoPausedSystems.map((n, i) => (
                <p key={`ap-${i}`}>• {n}</p>
              ))}
              {preview.unmetInputNotes.map((n, i) => (
                <p key={`ui-${i}`}>• {n}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* All 9 Habitat Systems + Research Toggle */}
            <div className="lg:col-span-2 rounded-xl bg-[#07111F] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F4F7FB]">All 9 Habitat Machines & Switches</h3>
                <span className="text-xs text-[#AAB8C8] tabular-nums">
                  Projected Net Battery: {preview.netBattery >= 0 ? `+${preview.netBattery}` : preview.netBattery}/Sol
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {catalog.map((m) => {
                  const toggleKey = m.id as keyof SystemToggleState;
                  const isOn = m.hasPowerSwitch ? toggles[toggleKey] : true;
                  const liveDraw = activeDrawMap.get(m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-[#0D1B2A] border border-white/10 px-3 py-2 gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#F4F7FB] truncate">{m.name}</p>
                        <p className={`text-[11px] font-bold ${statusTone(m.status)}`}>
                          {m.status} · {m.condition}% ·{' '}
                          {m.id === 'solarArray'
                            ? `+${Math.round(power.solarGeneration)} PWR`
                            : m.powerRequirement > 0
                              ? `${liveDraw ?? 0} PWR${!isOn ? ' (OFF)' : ''}`
                              : m.inputsDesc}
                        </p>
                        {m.fault && (
                          <p className="text-[10px] text-[#FF5B68] truncate">{m.fault}</p>
                        )}
                      </div>
                      {m.hasPowerSwitch && (
                        <button
                          onClick={() => toggleSystemPower(toggleKey)}
                          className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                            isOn
                              ? 'bg-[#37D67A]/20 text-[#37D67A] border border-[#37D67A]/40'
                              : 'bg-white/10 text-[#AAB8C8] border border-white/10'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isOn ? 'ON' : 'OFF'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#0D1B2A] border border-[#37D6F4]/30 px-3 py-2 text-xs">
                <div>
                  <p className="font-semibold text-[#F4F7FB]">
                    Research Equipment & Science Array ({toggles.researchSystems ? '4 PWR' : '0 PWR · OFF'})
                  </p>
                  <p className="text-[11px] text-[#AAB8C8]">
                    Advances Research Objective (+{preview.researchGain}%/Sol) · Lowest power priority
                  </p>
                </div>
                <button
                  onClick={() => toggleSystemPower('researchSystems')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
                    toggles.researchSystems
                      ? 'bg-[#37D67A]/20 text-[#37D67A] border border-[#37D67A]/40'
                      : 'bg-white/10 text-[#AAB8C8] border border-white/10'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{toggles.researchSystems ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Crew Assignments & Individual Needs (4 Astronauts) + Threshold Alerts */}
            <div className="space-y-4">
              <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#F4F7FB] mb-2.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#37D6F4]" /> Crew Vitals & Tasks (4 Astronauts)
                </h3>
                <div className="space-y-2.5 text-xs">
                  {crew.map((c) => (
                    <div key={c.id} className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#F4F7FB] font-semibold">
                          {c.label} <span className="text-[10px] text-[#AAB8C8]">({c.role})</span>
                        </span>
                        <span
                          className={`font-bold uppercase tabular-nums ${
                            c.status === 'safe-shelter'
                              ? 'text-[#37D6F4]'
                              : c.status === 'healthy'
                                ? 'text-[#37D67A]'
                                : 'text-[#FFB84D]'
                          }`}
                        >
                          {Math.round(c.health)}% HP
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[#AAB8C8] tabular-nums">
                        <div>H₂O <strong className="text-[#37D6F4]">{Math.round(c.hydration)}%</strong></div>
                        <div>Food <strong className="text-[#37D67A]">{Math.round(c.nutrition)}%</strong></div>
                        <div>Stam <strong className="text-[#FFB84D]">{Math.round(c.energy)}%</strong></div>
                      </div>
                      {!c.isPlayer && (
                        <select
                          aria-label={`Assign task for ${c.label}`}
                          value={c.assignedTask}
                          onChange={(e) => setCrewTask(c.id, e.target.value as CrewTask)}
                          className="w-full rounded-md bg-[#07111F] border border-white/15 px-2 py-1 text-[11px] text-[#37D6F4] font-semibold cursor-pointer"
                        >
                          {TASK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              Task: {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#F4F7FB] mb-2">Threshold Alerts</h3>
                {alerts.length === 0 ? (
                  <p className="text-xs text-[#37D67A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All resource reserves within normal range.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className={`rounded-lg px-2.5 py-1.5 text-xs border ${
                          a.severity === 'critical'
                            ? 'bg-[#FF5B68]/15 border-[#FF5B68]/40 text-[#FF5B68]'
                            : 'bg-[#FFB84D]/15 border-[#FFB84D]/40 text-[#FFB84D]'
                        }`}
                      >
                        <span className="font-bold">{a.label}: </span>
                        {a.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={closeModal}
              className="px-4 py-2.5 rounded-xl bg-[#152A3E] border border-white/15 text-sm font-semibold text-[#F4F7FB] cursor-pointer"
            >
              Back to Cabin
            </button>
            <button
              onClick={() => {
                closeModal();
                endMissionDay();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-sm font-extrabold cursor-pointer shadow-lg"
            >
              {sol >= maxSols
                ? `Complete Sol ${sol} & View Debrief →`
                : `Confirm & Advance to Sol ${sol + 1} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

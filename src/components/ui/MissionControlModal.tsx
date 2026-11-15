import { Activity, BatteryCharging, HeartPulse, Power, ShieldCheck, Sprout, X } from 'lucide-react';
import { evaluateThresholds, previewDailyRates } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';

export default function MissionControlModal() {
  const destination = useGameStore((s) => s.destination);
  const sol = useGameStore((s) => s.sol);
  const maxSols = useGameStore((s) => s.maxSols);
  const resources = useGameStore((s) => s.resources);
  const character = useGameStore((s) => s.character);
  const systems = useGameStore((s) => s.systems);
  const toggles = useGameStore((s) => s.toggles);
  const crew = useGameStore((s) => s.crew);
  const dustStormDaysRemaining = useGameStore((s) => s.dustStormDaysRemaining);
  const toggleSystemPower = useGameStore((s) => s.toggleSystemPower);
  const endMissionDay = useGameStore((s) => s.endMissionDay);
  const closeModal = useGameStore((s) => s.closeModal);

  const preview = previewDailyRates(destination, toggles, systems, dustStormDaysRemaining);
  const alerts = evaluateThresholds(resources, character);
  const foodDaysLeft = Math.max(0, Math.floor(resources.food / Math.max(4, toggles.greenhouse ? 4 : 8)));

  const statusTone = (status: string) => {
    if (status === 'Operational') return 'text-[#37D67A]';
    if (status === 'Warning') return 'text-[#FFB84D]';
    return 'text-[#FF5B68]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">
                Mission Control Dashboard · Sol {sol} of {maxSols}
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                Manage power priorities, inspect all 8 habitat subsystems, and advance mission day
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

        <div className="p-6 overflow-y-auto space-y-5">
          {/* 3 Primary Gauges + Food Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D6F4]">Life Support</span>
                <HeartPulse className="w-4 h-4 text-[#37D6F4]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {resources.oxygen}% <span className="text-xs font-normal text-[#AAB8C8]">O₂</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between"><span>Water Reserve</span><span className="text-white">{resources.water}%</span></div>
                <div className="flex justify-between"><span>CO₂ Level (lower better)</span><span className={resources.co2 >= 50 ? 'text-[#FFB84D]' : 'text-[#37D67A]'}>{resources.co2}%</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#FFB84D]">Power Grid</span>
                <BatteryCharging className="w-4 h-4 text-[#FFB84D]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {resources.battery}% <span className="text-xs font-normal text-[#AAB8C8]">Battery</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between"><span>Solar Generation</span><span className="text-[#37D67A]">+{preview.solarGain}/Sol</span></div>
                <div className="flex justify-between"><span>System Drain</span><span className="text-[#FFB84D]">-{preview.totalDrain}/Sol</span></div>
              </div>
            </div>

            <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D67A]">Crew Safety</span>
                <ShieldCheck className="w-4 h-4 text-[#37D67A]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {resources.habitatPressure}% <span className="text-xs font-normal text-[#AAB8C8]">Press.</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8] tabular-nums">
                <div className="flex justify-between"><span>Temp Safety</span><span className="text-white">{resources.temperatureSafety}%</span></div>
                <div className="flex justify-between"><span>Radiation Shield</span><span className="text-white">{resources.radiationProtection}%</span></div>
              </div>
            </div>

            {/* Separate Food Card (PRD §8.3) */}
            <div className="rounded-xl bg-[#07111F] border border-[#37D67A]/35 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#37D67A]">Food Supply</span>
                <Sprout className="w-4 h-4 text-[#37D67A]" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums text-white mt-1">
                {resources.food}% <span className="text-xs font-normal text-[#AAB8C8]">({foodDaysLeft}d left)</span>
              </p>
              <div className="mt-2 space-y-1 text-xs text-[#AAB8C8]">
                <div className="flex justify-between">
                  <span>Greenhouse</span>
                  <span className={toggles.greenhouse ? 'text-[#37D67A]' : 'text-[#FFB84D]'}>
                    {toggles.greenhouse ? '+4 Food/Sol' : 'Paused'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Crew Use</span>
                  <span className="text-white">-8 Food/Sol</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* System Condition + Power Toggles */}
            <div className="lg:col-span-2 rounded-xl bg-[#07111F] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F4F7FB]">Habitat Systems & Power Switches</h3>
                <span className="text-xs text-[#AAB8C8] tabular-nums">
                  Net Battery/Sol: {preview.netBattery >= 0 ? `+${preview.netBattery}` : preview.netBattery}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(
                  [
                    ['oxygenGenerator', 'Oxygen Generator (6 PWR)', true],
                    ['co2Scrubber', 'CO₂ Scrubber (4 PWR)', true],
                    ['waterRecycler', 'Water Recycler (4 PWR)', true],
                    ['greenhouse', 'Greenhouse Rack (4 PWR)', true],
                    ['powerPanel', 'Power Distribution Panel', false],
                    ['solarArray', 'Solar Array', false],
                    ['pressureSystem', 'Habitat Pressure System', false],
                    ['radiationShelter', 'Radiation Shelter', false],
                  ] as const
                ).map(([key, label, hasToggle]) => {
                  const status = systems[key];
                  const toggleKey = key as keyof typeof toggles;
                  const isOn = hasToggle ? toggles[toggleKey] : true;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg bg-[#0D1B2A] border border-white/10 px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-[#F4F7FB]">{label}</p>
                        <p className={`text-[11px] font-bold ${statusTone(status)}`}>{status}</p>
                      </div>
                      {hasToggle && (
                        <button
                          onClick={() => toggleSystemPower(toggleKey)}
                          className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer ${
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
              <div className="flex items-center justify-between rounded-lg bg-[#0D1B2A] border border-white/10 px-3 py-2 text-xs">
                <div>
                  <p className="font-semibold text-[#F4F7FB]">Research & Optional Sensors (4 PWR)</p>
                  <p className="text-[11px] text-[#AAB8C8]">Lowest priority—pause first during dust storms</p>
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

            {/* Crew Status + Threshold Alerts */}
            <div className="space-y-4">
              <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#F4F7FB] mb-2">Crew Status (4 Astronauts)</h3>
                <div className="space-y-2 text-xs">
                  {crew.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <span className="text-[#F4F7FB] font-medium">{c.label}</span>
                      <span
                        className={`font-bold uppercase ${
                          c.status === 'safe-shelter'
                            ? 'text-[#37D6F4]'
                            : c.status === 'healthy'
                              ? 'text-[#37D67A]'
                              : 'text-[#FFB84D]'
                        }`}
                      >
                        {c.status === 'safe-shelter' ? 'Sheltered' : c.status} · {c.health}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#07111F] border border-white/10 p-4">
                <h3 className="text-sm font-bold text-[#F4F7FB] mb-2">Threshold Alerts</h3>
                {alerts.length === 0 ? (
                  <p className="text-xs text-[#37D67A]">All resource reserves within normal range.</p>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
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
              className="px-6 py-2.5 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-sm font-bold cursor-pointer"
            >
              End Sol {sol} (Advance Simulation)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

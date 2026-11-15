import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Backpack,
  BatteryCharging,
  BookOpen,
  Eye,
  Heart,
  Minus,
  Pause,
  RotateCcw,
  Shield,
  Thermometer,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { evaluateThresholds } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import HabitatCanvas from '../scene/HabitatCanvas';
import CapcomGuidePanel from '../ui/CapcomGuidePanel';

function statusColor(val: number, warn: number, crit: number, higherIsWorse = false) {
  if (higherIsWorse) {
    if (val >= crit) return '#FF5B68';
    if (val >= warn) return '#FFB84D';
    return '#37D67A';
  }
  if (val <= crit) return '#FF5B68';
  if (val <= warn) return '#FFB84D';
  return '#37D67A';
}

function CharacterHistoryStrip() {
  const history = useGameStore((s) => s.statusHistory);
  if (history.length === 0) return null;

  return (
    <div className="pt-1.5 border-t border-white/10">
      <div className="flex items-center justify-between text-[10px] text-[#AAB8C8] mb-1">
        <span>Recent Status Trend ({history.length}/10)</span>
        <span className="text-[#37D67A]">HP · EN · HY</span>
      </div>
      <svg viewBox="0 0 200 30" className="w-full h-7 bg-[#07111F] rounded-lg border border-white/10 p-0.5">
        {history.map((pt, idx) => {
          const x = idx * 20 + 2;
          const hBar = Math.max(2, (pt.health / 100) * 24);
          const eBar = Math.max(2, (pt.energy / 100) * 24);
          const yBar = Math.max(2, (pt.hydration / 100) * 24);
          return (
            <g key={pt.step}>
              <rect x={x} y={26 - hBar} width="4" height={hBar} rx="1" fill="#37D67A" />
              <rect x={x + 5} y={26 - eBar} width="4" height={eBar} rx="1" fill="#FFB84D" />
              <rect x={x + 10} y={26 - yBar} width="4" height={yBar} rx="1" fill="#37D6F4" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function GameplayHUD() {
  const destination = useGameStore((s) => s.destination);
  const viewMode = useGameStore((s) => s.viewMode);
  const sol = useGameStore((s) => s.sol);
  const maxSols = useGameStore((s) => s.maxSols);
  const missionScore = useGameStore((s) => s.missionScore);
  const missionElapsedSeconds = useGameStore((s) => s.missionElapsedSeconds);
  const resources = useGameStore((s) => s.resources);
  const character = useGameStore((s) => s.character);
  const characterTrends = useGameStore((s) => s.characterTrends);
  const toggles = useGameStore((s) => s.toggles);
  const emergency = useGameStore((s) => s.emergency);
  const nearbyStation = useGameStore((s) => s.nearbyStation);
  const nearbyPickupUid = useGameStore((s) => s.nearbyPickupUid);
  const waterBlocksReinforced = useGameStore((s) => s.waterBlocksReinforced);
  const toastMessage = useGameStore((s) => s.toastMessage);
  const savedProgress = useGameStore((s) => s.savedProgress);

  const setViewMode = useGameStore((s) => s.setViewMode);
  const openModal = useGameStore((s) => s.openModal);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleSystemPower = useGameStore((s) => s.toggleSystemPower);
  const interactWithNearby = useGameStore((s) => s.interactWithNearby);
  const reinforceWaterBlock = useGameStore((s) => s.reinforceWaterBlock);
  const endMissionDay = useGameStore((s) => s.endMissionDay);
  const setTouchMoveVector = useGameStore((s) => s.setTouchMoveVector);
  const tickMissionTimer = useGameStore((s) => s.tickMissionTimer);
  const clearToast = useGameStore((s) => s.clearToast);

  const [resetCamTrigger, setResetCamTrigger] = useState(0);
  const [showTouchPad, setShowTouchPad] = useState(false);

  // Detect touch device automatically
  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setShowTouchPad(true);
    }
  }, []);

  // Mission timer tick (pauses automatically in Exterior view, modals, or puzzles inside store)
  useEffect(() => {
    const id = window.setInterval(() => tickMissionTimer(), 1000);
    return () => window.clearInterval(id);
  }, [tickMissionTimer]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => clearToast(), 3800);
    return () => window.clearTimeout(t);
  }, [toastMessage, clearToast]);

  // Keyboard shortcuts (E, I, M, Tab, Esc)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const store = useGameStore.getState();
      if (e.code === 'KeyE') {
        store.interactWithNearby();
      } else if (e.code === 'KeyI') {
        store.activeModal === 'inventory' ? store.closeModal() : store.openModal('inventory');
      } else if (e.code === 'KeyM') {
        store.activeModal === 'manual' ? store.closeModal() : store.openModal('manual');
      } else if (e.code === 'Tab') {
        e.preventDefault();
        store.activeModal === 'dashboard' ? store.closeModal() : store.openModal('dashboard');
      } else if (e.code === 'Escape') {
        if (store.activePuzzle) {
          store.closePuzzle();
        } else if (store.activeModal) {
          store.closeModal();
        } else {
          store.openModal('pause');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const joyRef = useRef<HTMLDivElement>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const handleJoystick = (clientX: number, clientY: number) => {
    const rect = joyRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    setTouchMoveVector({ x: dx / maxR, y: dy / maxR });
  };

  const isMars = destination === 'mars';
  const activeScenario = emergency ? SCENARIO_BY_ID[emergency.scenarioId] : null;
  const alerts = evaluateThresholds(resources, character);

  const mins = String(Math.floor(missionElapsedSeconds / 60)).padStart(2, '0');
  const secs = String(missionElapsedSeconds % 60).padStart(2, '0');
  const alertMins = '00';
  const alertSecs = String(emergency?.countdownSeconds ?? 25).padStart(2, '0');

  const renderTrend = (delta: number) => {
    if (delta > 0) return <ArrowUp className="w-3 h-3 text-[#37D67A]" />;
    if (delta < 0) return <ArrowDown className="w-3 h-3 text-[#FF5B68]" />;
    return <Minus className="w-3 h-3 text-[#AAB8C8]" />;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07111F] select-none">
      {/* FULL-SCREEN 3D VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <HabitatCanvas resetCamTrigger={resetCamTrigger} />
      </div>

      {/* TOP HUD BAR (Matching Mars & Moon Reference Screenshots) */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Top Left Brand */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-[#0D1B2A]/92 border border-white/15 px-3.5 py-2 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-[#FF7A3D]/20 border border-[#FF7A3D] flex items-center justify-center text-[#FF7A3D] font-extrabold text-xs">
            A
          </div>
          <div>
            <p className="text-xs sm:text-sm font-extrabold tracking-wide text-[#F4F7FB] leading-none">
              ASTRO-CADET: {isMars ? 'MARS' : 'LUNAR'} MISSION CONTROL
            </p>
            <p className="text-[10px] text-[#37D6F4] font-semibold mt-0.5">
              SOL {sol} OF {maxSols} · {viewMode === 'interior' ? 'INTERIOR DECK' : 'EXTERIOR 360°'}
            </p>
          </div>
        </div>

        {/* Top Center Telemetry + View Switch */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <div className="rounded-xl bg-[#0D1B2A]/92 border border-white/15 px-3.5 py-1.5 flex items-center gap-3 text-xs font-bold tabular-nums">
            <span className="text-[#F4F7FB]">
              TIME: <span className="text-[#37D6F4]">{mins}:{secs}</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[#F4F7FB]">
              GRAVITY: <span className="text-[#FFB84D]">{isMars ? '0.38g' : '0.16g'}</span>
            </span>
          </div>

          <div className="rounded-xl bg-[#0D1B2A]/95 border border-white/15 p-1 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setViewMode('interior')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'interior'
                  ? 'bg-[#37D6F4] text-[#07111F]'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              INTERIOR VIEW
            </button>
            <button
              onClick={() => setViewMode('exterior')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'exterior'
                  ? 'bg-[#37D6F4] text-[#07111F]'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>EXTERIOR 360° VIEW</span>
            </button>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => openModal('manual')}
            title="Repair Manual (M)"
            className="h-9 px-2.5 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#37D6F4]" />
            <span className="hidden md:inline">Manual (M)</span>
          </button>
          <button
            onClick={() => openModal('inventory')}
            title="Inventory (I)"
            className="h-9 px-2.5 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer"
          >
            <Backpack className="w-3.5 h-3.5 text-[#37D67A]" />
            <span className="hidden md:inline">Bag (I)</span>
          </button>
          <button
            onClick={() => openModal('dashboard')}
            title="Mission Control Dashboard (Tab)"
            className="h-9 px-2.5 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-[#FFB84D]" />
            <span className="hidden md:inline">Systems</span>
          </button>
          <button
            onClick={toggleMute}
            aria-label={savedProgress.muted ? 'Unmute audio' : 'Mute audio'}
            className="h-9 w-9 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer"
          >
            {savedProgress.muted ? (
              <VolumeX className="w-4 h-4 text-[#AAB8C8]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#37D6F4]" />
            )}
          </button>
          <button
            onClick={() => openModal('pause')}
            aria-label="Pause Mission"
            className="h-9 w-9 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer"
          >
            <Pause className="w-4 h-4 text-[#F4F7FB]" />
          </button>
        </div>
      </header>

      {/* INTERIOR VIEW FLANKING PANELS (Matching Mars & Moon Reference Screenshots) */}
      {viewMode === 'interior' && (
        <>
          {/* LEFT PANEL: Power & Life Support + Food + Character Status */}
          <aside className="hidden sm:flex flex-col gap-2.5 absolute top-16 left-3.5 bottom-20 w-64 z-10 overflow-y-auto pr-1 pointer-events-auto">
            <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-3.5 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#F4F7FB]">
                  Power & Life Support
                </h2>
                <button
                  onClick={() => openModal('dashboard')}
                  className="text-[10px] font-bold text-[#37D6F4] hover:underline cursor-pointer"
                >
                  Details
                </button>
              </div>

              {/* Gauge 1: Power Grid */}
              <div className="rounded-xl bg-[#152A3E]/80 border border-white/10 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <BatteryCharging className="w-3.5 h-3.5 text-[#FFB84D]" />
                    POWER GRID
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: statusColor(resources.battery, 35, 15) }}
                  >
                    {resources.battery}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${resources.battery}%`,
                      backgroundColor: statusColor(resources.battery, 35, 15),
                    }}
                  />
                </div>
              </div>

              {/* Gauge 2: Life Support (O2, Water, CO2) */}
              <div className="rounded-xl bg-[#152A3E]/80 border border-white/10 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <Wind className="w-3.5 h-3.5 text-[#37D6F4]" />
                    OXYGEN FLOW
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: statusColor(resources.oxygen, 40, 20) }}
                  >
                    {resources.oxygen}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${resources.oxygen}%`,
                      backgroundColor: statusColor(resources.oxygen, 40, 20),
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>H₂O: <strong className="text-white">{resources.water}%</strong></span>
                  <span>
                    CO₂:{' '}
                    <strong style={{ color: statusColor(resources.co2, 50, 75, true) }}>
                      {resources.co2}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Gauge 3: Crew Safety (Temp + Radiation + Pressure) */}
              <div className="rounded-xl bg-[#152A3E]/80 border border-white/10 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <Thermometer className="w-3.5 h-3.5 text-[#FF7A3D]" />
                    CREW SAFETY
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: statusColor(resources.radiationProtection, 60, 35) }}
                  >
                    {resources.radiationProtection}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${resources.radiationProtection}%`,
                      backgroundColor: statusColor(resources.radiationProtection, 60, 35),
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>Press: <strong className="text-white">{resources.habitatPressure}%</strong></span>
                  <span>Temp: <strong className="text-white">{resources.temperatureSafety}%</strong></span>
                </div>
              </div>

              {/* Separate Food Supply Card (PRD §8.3) */}
              <div className="rounded-xl bg-[#152A3E]/80 border border-[#37D67A]/30 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#37D67A]">FOOD SUPPLY</span>
                  <span className="tabular-nums text-white">{resources.food}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#AAB8C8]">
                  <span>Greenhouse: {toggles.greenhouse ? '+4/Sol' : 'Paused'}</span>
                  <button
                    onClick={() => toggleSystemPower('greenhouse')}
                    className="px-1.5 py-0.5 rounded bg-[#0D1B2A] border border-white/15 text-[10px] font-bold text-[#37D6F4] cursor-pointer"
                  >
                    {toggles.greenhouse ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>

              {/* Astronaut Personal Status Bars + 10-step History Strip */}
              <div className="rounded-xl bg-[#07111F]/90 border border-white/10 p-2.5 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#AAB8C8]">
                  Cadet Vitals
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] tabular-nums">
                  <div className="rounded bg-[#0D1B2A] p-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#AAB8C8]">HP</span>
                      {renderTrend(characterTrends.health)}
                    </div>
                    <p
                      className="font-extrabold text-xs"
                      style={{ color: statusColor(character.health, 40, 20) }}
                    >
                      {Math.round(character.health)}%
                    </p>
                  </div>
                  <div className="rounded bg-[#0D1B2A] p-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#AAB8C8]">EN</span>
                      {renderTrend(characterTrends.energy)}
                    </div>
                    <p
                      className="font-extrabold text-xs"
                      style={{ color: statusColor(character.energy, 40, 20) }}
                    >
                      {Math.round(character.energy)}%
                    </p>
                  </div>
                  <div className="rounded bg-[#0D1B2A] p-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#AAB8C8]">H₂O</span>
                      {renderTrend(characterTrends.hydration)}
                    </div>
                    <p
                      className="font-extrabold text-xs"
                      style={{ color: statusColor(character.hydration, 40, 20) }}
                    >
                      {Math.round(character.hydration)}%
                    </p>
                  </div>
                </div>
                <CharacterHistoryStrip />
              </div>
            </div>

            {/* Bottom-left Life Support Status Box matching Reference */}
            <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-3.5 space-y-1 shadow-xl">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#F4F7FB]">
                Life Support Status
              </h3>
              <p className="text-xs font-bold text-[#37D67A]">
                OXYGEN: {resources.oxygen > 40 ? 'SAFE' : resources.oxygen > 20 ? 'WARNING' : 'CRITICAL'}
              </p>
              <p className="text-xs font-bold text-[#FFB84D]">
                {activeScenario ? `[ALERT] ${activeScenario.shortLabel}` : 'SYSTEMS STABLE'}
              </p>
              <p className="text-[11px] text-[#AAB8C8]">
                {alerts.length > 0
                  ? alerts[0].message
                  : `ATMOSPHERE: ${isMars ? 'CO₂ RICH' : 'LUNAR VACUUM'}`}
              </p>
            </div>
          </aside>

          {/* RIGHT PANEL: Solar Flare / Active Emergency + CAPCOM Mission Guide */}
          <aside className="hidden sm:flex flex-col gap-2.5 absolute top-16 right-3.5 bottom-20 w-72 z-10 overflow-y-auto pl-1 pointer-events-auto">
            {activeScenario ? (
              <div className="rounded-2xl bg-[#0D1B2A]/95 border-2 border-[#FF7A3D]/80 p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFB84D] uppercase">
                    <AlertTriangle className="w-4 h-4 text-[#FF7A3D]" />
                    {activeScenario.shortLabel}
                  </span>
                  <span className="text-[10px] font-bold text-[#FF5B68]">HIGH</span>
                </div>

                <div className="rounded-xl bg-[#07111F] border border-[#FFB84D]/30 py-2.5 text-center">
                  <p className="text-2xl font-extrabold text-[#FFB84D] tabular-nums tracking-wider">
                    {alertMins}:{alertSecs}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#AAB8C8]">
                    To Impact · Danger Level: High
                  </p>
                </div>

                <p className="text-xs text-[#F4F7FB] leading-snug">
                  {activeScenario.title}: {activeScenario.introStory}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openModal('manual')}
                    className="py-2 rounded-xl bg-[#152A3E] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] hover:bg-[#1b3650] cursor-pointer"
                  >
                    Manual (M)
                  </button>
                  <button
                    onClick={() => openModal('plan-decision')}
                    className="py-2 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-xs font-extrabold text-white cursor-pointer"
                  >
                    Plan A / B / C
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0D1B2A]/92 border border-[#37D67A]/40 p-3.5 space-y-2 shadow-xl">
                <p className="text-xs font-extrabold text-[#37D67A] flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  ALL ALERTS RESOLVED
                </p>
                <p className="text-xs text-[#AAB8C8]">
                  Collect food/tools inside the cabin or click End Sol {sol} below to advance!
                </p>
              </div>
            )}

            <CapcomGuidePanel />
          </aside>
        </>
      )}

      {/* EXTERIOR 360° ORBIT VIEW OVERLAY */}
      {viewMode === 'exterior' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#0D1B2A]/92 border border-[#37D6F4]/50 px-4 py-2.5 shadow-xl">
          <span className="text-xs font-bold text-[#37D6F4]">
            360° Orbit Inspection · Drag to rotate, Scroll/Pinch to zoom · Resource timers paused
          </span>
          <button
            onClick={() => setResetCamTrigger((n) => n + 1)}
            className="px-3 py-1.5 rounded-xl bg-[#152A3E] border border-white/15 text-xs font-bold text-[#F4F7FB] hover:border-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Camera</span>
          </button>
          <button
            onClick={() => setViewMode('interior')}
            className="px-3 py-1.5 rounded-xl bg-[#FF7A3D] text-xs font-bold text-white cursor-pointer"
          >
            Return to Interior View
          </button>
        </div>
      )}

      {/* TABLET / TOUCH CONTROLS */}
      {showTouchPad && viewMode === 'interior' && (
        <div className="sm:hidden fixed bottom-24 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
          <div
            ref={joyRef}
            onPointerDown={(e) => handleJoystick(e.clientX, e.clientY)}
            onPointerMove={(e) => e.buttons > 0 && handleJoystick(e.clientX, e.clientY)}
            onPointerUp={() => {
              setJoyKnob({ x: 0, y: 0 });
              setTouchMoveVector({ x: 0, y: 0 });
            }}
            onPointerCancel={() => {
              setJoyKnob({ x: 0, y: 0 });
              setTouchMoveVector({ x: 0, y: 0 });
            }}
            className="pointer-events-auto relative w-24 h-24 rounded-full bg-[#0D1B2A]/85 border-2 border-[#37D6F4]/60 flex items-center justify-center touch-none"
          >
            <div
              className="w-10 h-10 rounded-full bg-[#37D6F4] shadow-lg"
              style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            />
          </div>

          <button
            onClick={interactWithNearby}
            className="pointer-events-auto h-16 px-5 rounded-2xl bg-[#FF7A3D] text-white font-extrabold text-sm shadow-xl active:scale-95"
          >
            INTERACT
          </button>
        </div>
      )}

      {/* TOAST CONFIRMATION */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-[#0D1B2A]/95 border border-[#37D6F4] px-4 py-2 text-xs sm:text-sm font-bold text-[#F4F7FB] shadow-2xl">
          {toastMessage}
        </div>
      )}

      {/* BOTTOM MISSION PROGRESS & PRIMARY ACTION BAR (Matching Reference Screenshots) */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-4 py-2.5 bg-[#0D1B2A]/92 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-[#AAB8C8] uppercase">Mission Progress</span>
              <span className="text-[#37D67A] tabular-nums">
                ASTRONAUT HEALTH: {Math.round(character.health)}%
              </span>
            </div>
            <div className="w-40 sm:w-56 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#37D6F4] transition-all"
                style={{ width: `${(sol / maxSols) * 100}%` }}
              />
            </div>
          </div>
          <Heart className="w-4 h-4 text-[#FF5B68] hidden sm:block" />
        </div>

        {/* Center Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(nearbyStation || nearbyPickupUid) && viewMode === 'interior' && (
            <button
              onClick={interactWithNearby}
              className="px-4 py-2.5 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] font-extrabold text-xs sm:text-sm cursor-pointer shadow-lg"
            >
              Interact (E)
            </button>
          )}

          {waterBlocksReinforced < 3 && viewMode === 'interior' && (
            <button
              onClick={reinforceWaterBlock}
              className="px-5 py-2.5 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white font-extrabold text-xs sm:text-sm cursor-pointer shadow-lg"
            >
              REINFORCE SHELTER ({waterBlocksReinforced}/3)
            </button>
          )}

          {activeScenario && (
            <button
              onClick={() => openModal('plan-decision')}
              className="px-4 py-2.5 rounded-xl bg-[#FFB84D] hover:bg-[#ffc66e] text-[#07111F] font-extrabold text-xs sm:text-sm cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Resolve Alert</span>
            </button>
          )}

          <button
            onClick={endMissionDay}
            className="px-4 py-2.5 rounded-xl bg-[#152A3E] hover:bg-[#1e3a56] border border-[#37D6F4]/60 text-[#37D6F4] font-extrabold text-xs sm:text-sm cursor-pointer"
          >
            End Sol {sol} →
          </button>
        </div>

        <div className="text-right">
          <p className="text-xs sm:text-sm font-extrabold text-[#FFB84D] tabular-nums">
            SCORE: {missionScore.toLocaleString()} PTS
          </p>
          <p className="text-[10px] text-[#AAB8C8]">WASD Move · E Interact · M Manual</p>
        </div>
      </footer>
    </div>
  );
}

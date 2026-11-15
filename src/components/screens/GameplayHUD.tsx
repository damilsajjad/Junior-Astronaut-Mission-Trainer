import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Backpack,
  BatteryCharging,
  BookOpen,
  Droplets,
  Eye,
  Heart,
  LogOut,
  Minus,
  Pause,
  Recycle,
  RotateCcw,
  Shield,
  Sprout,
  Sun,
  Thermometer,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
} from 'lucide-react';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import {
  INTERACTION_DISTANCE,
  SOL_DURATION_SECONDS,
  countFoodItems,
  evaluateThresholds,
  getPowerBreakdown,
} from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import { StationId } from '../../types/game';
import HabitatCanvas, { HABITAT_STATIONS } from '../scene/HabitatCanvas';
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
        <span>Vitals History ({history.length}/10)</span>
        <span className="text-[#37D67A]">HP · STAM · H₂O</span>
      </div>
      <svg viewBox="0 0 200 28" className="w-full h-7 bg-[#07111F] rounded-lg border border-white/10 p-0.5">
        {history.map((pt, idx) => {
          const x = idx * 20 + 2;
          const hBar = Math.max(2, (pt.health / 100) * 22);
          const eBar = Math.max(2, (pt.energy / 100) * 22);
          const yBar = Math.max(2, (pt.hydration / 100) * 22);
          return (
            <g key={pt.step}>
              <rect x={x} y={24 - hBar} width="4" height={hBar} rx="1" fill="#37D67A" />
              <rect x={x + 5} y={24 - eBar} width="4" height={eBar} rx="1" fill="#FFB84D" />
              <rect x={x + 10} y={24 - yBar} width="4" height={yBar} rx="1" fill="#37D6F4" />
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
  const solElapsedSeconds = useGameStore((s) => s.solElapsedSeconds);
  const maxSols = useGameStore((s) => s.maxSols);
  const missionScore = useGameStore((s) => s.missionScore);
  const missionElapsedSeconds = useGameStore((s) => s.missionElapsedSeconds);
  const resources = useGameStore((s) => s.resources);
  const character = useGameStore((s) => s.character);
  const crew = useGameStore((s) => s.crew);
  const greenhouseState = useGameStore((s) => s.greenhouseState);
  const waterCycle = useGameStore((s) => s.waterCycle);
  const safety = useGameStore((s) => s.safety);
  const liveTrends = useGameStore((s) => s.liveTrends);
  const systems = useGameStore((s) => s.systems);
  const machineConditions = useGameStore((s) => s.machineConditions);
  const toggles = useGameStore((s) => s.toggles);
  const emergency = useGameStore((s) => s.emergency);
  const dustStormDaysRemaining = useGameStore((s) => s.dustStormDaysRemaining);
  const inventory = useGameStore((s) => s.inventory);
  const sharedFoodStorage = useGameStore((s) => s.sharedFoodStorage);
  const objectives = useGameStore((s) => s.objectives);
  const forecast = useGameStore((s) => s.forecast);
  const nearbyStation = useGameStore((s) => s.nearbyStation);
  const nearbyPickupUid = useGameStore((s) => s.nearbyPickupUid);
  const waterBlocksReinforced = useGameStore((s) => s.waterBlocksReinforced);
  const stationPulse = useGameStore((s) => s.stationPulse);
  const toastMessage = useGameStore((s) => s.toastMessage);
  const savedProgress = useGameStore((s) => s.savedProgress);

  const setViewMode = useGameStore((s) => s.setViewMode);
  const openModal = useGameStore((s) => s.openModal);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleSystemPower = useGameStore((s) => s.toggleSystemPower);
  const interactWithNearby = useGameStore((s) => s.interactWithNearby);
  const performQuickStationAction = useGameStore((s) => s.performQuickStationAction);
  const setMoveTarget = useGameStore((s) => s.setMoveTarget);
  const openEndDayReport = useGameStore((s) => s.openEndDayReport);
  const runResearchPulse = useGameStore((s) => s.runResearchPulse);
  const setTouchMoveVector = useGameStore((s) => s.setTouchMoveVector);
  const tickContinuousSimulation = useGameStore((s) => s.tickContinuousSimulation);
  const clearToast = useGameStore((s) => s.clearToast);

  const [resetCamTrigger, setResetCamTrigger] = useState(0);
  const [showTouchPad, setShowTouchPad] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      setShowTouchPad(true);
    }
  }, []);

  // Single authoritative continuous simulation loop (1s interval, never paused while exploring/walking)
  useEffect(() => {
    const tId = window.setInterval(() => tickContinuousSimulation(1), 1000);
    return () => {
      window.clearInterval(tId);
    };
  }, [tickContinuousSimulation]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => clearToast(), 3600);
    return () => window.clearTimeout(t);
  }, [toastMessage, clearToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const store = useGameStore.getState();
      if (e.code === 'KeyE') {
        store.interactWithNearby();
      } else if (e.code === 'KeyV') {
        store.setViewMode(store.viewMode === 'first-person' ? 'interior' : 'first-person');
      } else if (e.code === 'KeyI') {
        store.activeModal === 'inventory' ? store.closeModal() : store.openModal('inventory');
      } else if (e.code === 'KeyM') {
        store.activeModal === 'manual' ? store.closeModal() : store.openModal('manual');
      } else if (e.code === 'Tab') {
        e.preventDefault();
        store.activeModal === 'dashboard' ? store.closeModal() : store.openModal('dashboard');
      } else if (e.code === 'Escape') {
        if (store.activePuzzle) store.closePuzzle();
        else if (store.activeModal) store.closeModal();
        else store.openModal('pause');
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

  // Fingertip action helper: walk to machine if far, or run/inspect it right away if nearby!
  const handleFingertipMachine = (sid: StationId, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    const st = HABITAT_STATIONS.find((s) => s.id === sid);
    if (!st) return;
    const dist = Math.hypot(character.position.x - st.x, character.position.z - st.z);
    if (dist <= INTERACTION_DISTANCE) {
      performQuickStationAction(sid);
    } else {
      setMoveTarget({ x: st.walkX, z: st.walkZ, stationId: sid });
    }
  };

  const isMars = destination === 'mars';
  const isInsideView = viewMode === 'interior' || viewMode === 'first-person';
  const activeScenario = emergency ? SCENARIO_BY_ID[emergency.scenarioId] : null;
  const alerts = evaluateThresholds(resources, character);
  const power = getPowerBreakdown({
    destination,
    toggles,
    systems,
    machineConditions,
    resources,
    dustStormDaysRemaining,
    emergency,
  });
  const bagFoodCount = countFoodItems(inventory);
  const lockerFoodCount = countFoodItems(sharedFoodStorage);
  const mins = String(Math.floor(missionElapsedSeconds / 60)).padStart(2, '0');
  const secs = String(missionElapsedSeconds % 60).padStart(2, '0');
  const alertSecs = String(Math.ceil(emergency?.countdownSeconds ?? 25)).padStart(2, '0');
  const solPct = Math.min(100, Math.round((solElapsedSeconds / SOL_DURATION_SECONDS) * 100));

  const trendBadge = (delta: number, inverse = false) => {
    const good = inverse ? delta < 0 : delta > 0;
    const bad = inverse ? delta > 0 : delta < 0;
    if (good) return <ArrowUp className="w-3 h-3 text-[#37D67A]" />;
    if (bad) return <ArrowDown className="w-3 h-3 text-[#FF5B68]" />;
    return <Minus className="w-3 h-3 text-[#AAB8C8]" />;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07111F] select-none">
      {/* FULL-SCREEN 3D VIEWPORT */}
      <div className="absolute inset-0 z-0">
        <HabitatCanvas resetCamTrigger={resetCamTrigger} />
      </div>

      {/* TOP HUD BAR */}
      <header className="absolute top-0 left-0 right-0 z-20 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-[#0D1B2A]/92 border border-[#37D6F4]/30 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF7A3D] to-[#37D6F4] flex items-center justify-center text-[#07111F] font-extrabold text-sm">
            A
          </div>
          <div>
            <p className="text-xs sm:text-sm font-extrabold tracking-wide text-[#F4F7FB] leading-none">
              ASTRO-CADET: {isMars ? 'MARS' : 'LUNAR'} COMMAND
            </p>
            <p className="text-[10px] text-[#37D6F4] font-bold mt-0.5 tabular-nums">
              SOL {sol}/{maxSols} ({solPct}%) ·{' '}
              {viewMode === 'first-person'
                ? 'DRAG TO LOOK · WASD WALK · CLICK MACHINE'
                : viewMode === 'interior'
                  ? 'CLICK FLOOR OR WASD TO MOVE'
                  : '360° ORBIT'}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 px-3.5 py-1.5 flex items-center gap-3 text-xs font-bold tabular-nums shadow-lg">
            <span className="text-[#F4F7FB]">
              TIME <span className="text-[#37D6F4]">{mins}:{secs}</span>
            </span>
            <span className="text-white/20">|</span>
            <span className="text-[#F4F7FB]">
              GRAVITY <span className="text-[#FFB84D]">{isMars ? '0.38g' : '0.16g'}</span>
            </span>
          </div>

          <div className="rounded-2xl bg-[#0D1B2A]/95 border border-white/15 p-1 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setViewMode('interior')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'interior'
                  ? 'bg-[#37D6F4] text-[#07111F] shadow-md'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setViewMode('first-person')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'first-person'
                  ? 'bg-[#FF7A3D] text-white shadow-md'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              1ST PERSON (V)
            </button>
            <button
              onClick={() => setViewMode('exterior')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === 'exterior'
                  ? 'bg-[#37D6F4] text-[#07111F] shadow-md'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>EXTERIOR 360°</span>
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => openModal('manual')}
            className="h-9 px-3 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#37D6F4]" />
            <span className="hidden md:inline">Guide (M)</span>
          </button>
          <button
            onClick={() => openModal('inventory')}
            className="h-9 px-3 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Backpack className="w-3.5 h-3.5 text-[#37D67A]" />
            <span className="hidden md:inline">Bag (I)</span>
          </button>
          <button
            onClick={() => openModal('dashboard')}
            className="h-9 px-3 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] text-xs font-bold text-[#F4F7FB] flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Activity className="w-3.5 h-3.5 text-[#FFB84D]" />
            <span className="hidden md:inline">Systems</span>
          </button>
          <button
            onClick={toggleMute}
            aria-label={savedProgress.muted ? 'Unmute audio' : 'Mute audio'}
            className="h-9 w-9 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer shadow-lg"
          >
            {savedProgress.muted ? (
              <VolumeX className="w-4 h-4 text-[#AAB8C8]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#37D6F4]" />
            )}
          </button>
          <button
            onClick={() => openModal('pause')}
            title="Pause & Settings (Esc)"
            aria-label="Pause Mission"
            className="h-9 w-9 rounded-xl bg-[#0D1B2A]/92 border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer shadow-lg"
          >
            <Pause className="w-4 h-4 text-[#F4F7FB]" />
          </button>
          <button
            onClick={() => openModal('exit-confirm')}
            title="Exit Game"
            aria-label="Exit Game"
            className="h-9 w-9 rounded-xl bg-[#0D1B2A]/92 border border-[#FF5B68]/45 hover:border-[#FF5B68] hover:bg-[#FF5B68]/15 flex items-center justify-center cursor-pointer shadow-lg transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#FF5B68]" />
          </button>
        </div>
      </header>

      {/* FIRST-PERSON VISOR RETICLE & HINT */}
      {viewMode === 'first-person' && (
        <>
          <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border border-[#37D6F4]/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#37D6F4]" />
            </div>
          </div>
          <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded-xl bg-[#0D1B2A]/88 border border-[#FF7A3D]/55 px-3.5 py-1 text-[11px] font-bold text-[#F4F7FB] shadow-lg whitespace-nowrap">
            1st-Person Helmet View · Drag to look 360° · WASD walk · Click machine or press E
          </div>
        </>
      )}

      {/* INTERIOR / FIRST-PERSON FLANKING HUD */}
      {isInsideView && (
        <>
          {/* LEFT PANEL: Live Visual Gauges + 4-Astronaut Crew Strip */}
          <aside className="hidden sm:flex flex-col gap-2.5 absolute top-16 left-3.5 bottom-24 w-64 z-10 overflow-y-auto pr-1 pointer-events-auto">
            <div className="hud-panel rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#F4F7FB]">
                  Power & Life Support
                </h2>
                <button
                  onClick={() => openModal('dashboard')}
                  className="text-[10px] font-bold text-[#37D6F4] hover:underline cursor-pointer"
                >
                  All 9 Systems
                </button>
              </div>

              {/* Power Grid */}
              <div className="hud-subcard rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <BatteryCharging className="w-3.5 h-3.5 text-[#FFB84D]" />
                    BATTERY
                  </span>
                  <span
                    className="text-[10px] font-extrabold tabular-nums"
                    style={{
                      color:
                        power.status === 'charging'
                          ? '#37D67A'
                          : power.status === 'discharging'
                            ? '#FF5B68'
                            : '#AAB8C8',
                    }}
                  >
                    {power.netPower > 0 ? `+${Math.round(power.netPower)}` : Math.round(power.netPower)}{' '}
                    {power.status === 'charging' ? '▲ CHG' : power.status === 'discharging' ? '▼ DRAIN' : '• BAL'}
                  </span>
                  <span className="flex items-center gap-0.5 tabular-nums" style={{ color: statusColor(resources.battery, 35, 15) }}>
                    {trendBadge(liveTrends.battery)}
                    {Math.round(resources.battery)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="progress-sheen h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(resources.battery)}%`,
                      backgroundColor: statusColor(resources.battery, 35, 15),
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>
                    Solar <strong className="text-[#37D67A]">+{Math.round(power.solarGeneration)}</strong>
                  </span>
                  <span>
                    Use <strong className="text-[#FFB84D]">-{Math.round(power.totalConsumption + power.batteryLeak)}</strong> PWR
                  </span>
                </div>
                {(power.solarDamaged || power.netPower < 0) && (
                  <div className="pt-1 border-t border-white/10 space-y-1">
                    <p className="text-[9px] font-bold text-[#FFB84D] leading-tight">
                      {power.solarDamaged
                        ? `Solar ${power.solarEfficiencyPct}% output! Fix Solar or turn OFF machines:`
                        : 'Battery draining! Tap to turn OFF extra loads:'}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => toggleSystemPower('researchSystems')}
                        className={`py-0.5 px-1 rounded text-[9px] font-bold cursor-pointer border ${
                          toggles.researchSystems
                            ? 'bg-[#152A3E] border-[#37D6F4]/50 text-[#37D6F4]'
                            : 'bg-white/5 border-white/15 text-[#AAB8C8]'
                        }`}
                      >
                        Sci {toggles.researchSystems ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => toggleSystemPower('greenhouse')}
                        className={`py-0.5 px-1 rounded text-[9px] font-bold cursor-pointer border ${
                          toggles.greenhouse
                            ? 'bg-[#152A3E] border-[#37D67A]/50 text-[#37D67A]'
                            : 'bg-white/5 border-white/15 text-[#AAB8C8]'
                        }`}
                      >
                        Crop {toggles.greenhouse ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => toggleSystemPower('waterRecycler')}
                        className={`py-0.5 px-1 rounded text-[9px] font-bold cursor-pointer border ${
                          toggles.waterRecycler
                            ? 'bg-[#152A3E] border-[#38BDF8]/50 text-[#38BDF8]'
                            : 'bg-white/5 border-white/15 text-[#AAB8C8]'
                        }`}
                      >
                        H₂O {toggles.waterRecycler ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Life Support (O2, H2O, CO2) */}
              <div className="hud-subcard rounded-xl p-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <Wind className="w-3.5 h-3.5 text-[#37D6F4]" />
                    OXYGEN
                  </span>
                  <span className="flex items-center gap-1 tabular-nums" style={{ color: statusColor(resources.oxygen, 40, 20) }}>
                    {trendBadge(liveTrends.oxygen)}
                    {Math.round(resources.oxygen)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="progress-sheen h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(resources.oxygen)}%`,
                      backgroundColor: statusColor(resources.oxygen, 40, 20),
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>H₂O: <strong className="text-white">{Math.round(resources.water)}%</strong></span>
                  <span className="flex items-center gap-0.5">
                    CO₂:
                    <strong style={{ color: statusColor(resources.co2, 50, 75, true) }}>
                      {Math.round(resources.co2)}%
                    </strong>
                    {trendBadge(liveTrends.co2, true)}
                  </span>
                </div>
              </div>

              {/* Crew Safety */}
              <div className="hud-subcard rounded-xl p-2 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-[#F4F7FB]">
                    <Thermometer className="w-3.5 h-3.5 text-[#FF7A3D]" />
                    SHIELD & SAFETY
                  </span>
                  <span className="flex items-center gap-1 tabular-nums" style={{ color: statusColor(resources.radiationProtection, 60, 35) }}>
                    {trendBadge(liveTrends.radiation)}
                    {Math.round(resources.radiationProtection)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="progress-sheen h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(resources.radiationProtection)}%`,
                      backgroundColor: statusColor(resources.radiationProtection, 60, 35),
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>Press: <strong className="text-white">{Math.round(resources.habitatPressure)}%</strong></span>
                  <span>Temp: <strong style={{ color: statusColor(resources.temperatureSafety, 70, 45) }}>{Math.round(resources.temperatureSafety)}%</strong></span>
                  <span>H₂O Wall: <strong className="text-[#37D6F4]">{waterBlocksReinforced}/3</strong></span>
                </div>
              </div>

              {/* Hydroponic Greenhouse & Food Supply Card */}
              <div className="hud-subcard rounded-xl border-[#37D67A]/35 p-2 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#37D67A]">FOOD & CROPS</span>
                  <span className="flex items-center gap-1 tabular-nums text-white">
                    {trendBadge(liveTrends.food)}
                    {Math.round(resources.food)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>
                    Bag <strong className="text-white">{bagFoodCount}</strong> · Locker{' '}
                    <strong className="text-[#37D67A]">{lockerFoodCount}</strong>
                  </span>
                  <button
                    onClick={() => openModal('station-inspect', 'food-cabinet')}
                    className="sci-btn px-2 py-0.5 rounded-md bg-[#07111F] border border-[#37D67A]/40 text-[10px] font-bold text-[#37D67A] cursor-pointer"
                  >
                    Locker
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>
                    Crops:{' '}
                    <strong
                      className={
                        greenhouseState.stage === 'ready'
                          ? 'text-[#37D67A]'
                          : greenhouseState.stage === 'unhealthy'
                            ? 'text-[#FF5B68]'
                            : 'text-[#37D6F4]'
                      }
                    >
                      {greenhouseState.stage === 'ready'
                        ? 'READY!'
                        : `${Math.round(greenhouseState.growthProgress)}%`}
                    </strong>
                  </span>
                  <button
                    onClick={() => toggleSystemPower('greenhouse')}
                    className="sci-btn px-2 py-0.5 rounded-md bg-[#07111F] border border-white/15 text-[10px] font-bold text-[#37D6F4] cursor-pointer"
                  >
                    {toggles.greenhouse ? 'Pause' : 'Start'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#AAB8C8] tabular-nums">
                  <span>Solid Waste (Sealed)</span>
                  <span className={waterCycle.solidWasteLevel >= 80 ? 'text-[#FF5B68] font-bold' : 'text-white'}>
                    {Math.round(waterCycle.solidWasteLevel)}%
                  </span>
                </div>
              </div>

              {/* All 4 Astronauts Individual Vitals */}
              <div className="rounded-xl bg-[#07111F]/90 border border-white/10 p-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#AAB8C8]">
                  <span>4-Astronaut Crew</span>
                  <span style={{ color: statusColor(character.health, 40, 20) }}>
                    YOU {Math.round(character.health)}%
                  </span>
                </div>
                <div className="space-y-1">
                  {crew.map((c) => (
                    <div key={c.id} className="rounded bg-[#0D1B2A] px-2 py-1 text-[10px] tabular-nums">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[#F4F7FB] truncate">{c.label}</span>
                        <span style={{ color: statusColor(c.health, 45, 25) }}>
                          {Math.round(c.health)}% HP
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-[#AAB8C8] mt-0.5">
                        <span>H₂O <strong className="text-[#37D6F4]">{Math.round(c.hydration)}%</strong></span>
                        <span>Food <strong className="text-[#37D67A]">{Math.round(c.nutrition)}%</strong></span>
                        <span>Stam <strong className="text-[#FFB84D]">{Math.round(c.energy)}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
                <CharacterHistoryStrip />
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="rounded-2xl bg-[#FF5B68]/15 border border-[#FF5B68]/50 p-3 text-xs text-[#F4F7FB]">
                <p className="font-extrabold text-[#FF5B68]">{alerts[0].label}</p>
                <p className="text-[11px] mt-0.5">{alerts[0].message}</p>
              </div>
            )}
          </aside>

          {/* RIGHT PANEL: 3-Stage Safety Alert + Active Scenario Emergency + CAPCOM AI Guide */}
          <aside className="hidden sm:flex flex-col gap-2.5 absolute top-16 right-3.5 bottom-24 w-72 z-10 overflow-y-auto pl-1 pointer-events-auto">
            {/* 3-Stage Safety System Banner */}
            {safety.stage !== 'normal' && (
              <div
                className={`rounded-2xl p-3 border space-y-1 ${
                  safety.stage === 'emergency'
                    ? 'bg-[#FF5B68]/20 border-[#FF5B68] animate-pulse'
                    : 'bg-[#FFB84D]/15 border-[#FFB84D]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className={safety.stage === 'emergency' ? 'text-[#FF5B68]' : 'text-[#FFB84D]'}>
                    {safety.stage === 'emergency'
                      ? 'STAGE 2: CRITICAL EMERGENCY'
                      : 'STAGE 1: SAFETY WARNING'}
                  </span>
                  {safety.stage === 'emergency' && (
                    <span className="text-sm font-mono font-extrabold text-white bg-[#FF5B68] px-2 py-0.5 rounded-md tabular-nums">
                      00:{String(Math.ceil(safety.countdownSeconds)).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#F4F7FB] leading-snug">
                  {safety.reason || 'Stabilize critical life support before Safety Protocol engages!'}
                </p>
              </div>
            )}

            {activeScenario ? (
              <div className="hud-panel-amber rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFB84D] uppercase truncate">
                    <AlertTriangle className="w-4 h-4 text-[#FF7A3D] shrink-0" />
                    {activeScenario.shortLabel}
                  </span>
                  <span className="text-[10px] font-extrabold text-[#FF5B68] uppercase shrink-0">
                    {emergency?.severity} {emergency && emergency.daysActive >= 1 ? '· ESCALATED' : ''}
                  </span>
                </div>

                <div className="rounded-xl bg-[#07111F]/90 border border-[#FFB84D]/35 py-2 text-center">
                  <p className="text-xl font-extrabold text-[#FFB84D] tabular-nums tracking-wider">
                    00:{alertSecs}
                  </p>
                  <p className="text-[10px] font-bold text-[#AAB8C8]">
                    {emergency && emergency.daysActive >= 1
                      ? 'Escalated fault! Address immediately!'
                      : 'Fix machine or select Plan A/B/C!'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openModal('manual')}
                    className="sci-btn py-2 rounded-xl bg-[#152A3E] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] cursor-pointer"
                  >
                    Manual (M)
                  </button>
                  <button
                    onClick={() => openModal('plan-decision')}
                    className="sci-btn py-2 rounded-xl bg-gradient-to-r from-[#FF7A3D] to-[#ff5b37] text-xs font-extrabold text-white cursor-pointer"
                  >
                    Plan A / B / C
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#0D1B2A]/92 border border-[#37D67A]/40 p-3 text-xs text-[#37D67A] font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Continuous live simulation active · Sol advances automatically!</span>
              </div>
            )}

            {/* Objectives & Next-Sol Forecast Card */}
            <div className="hud-panel rounded-2xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-[#37D6F4]">
                  Objectives · Sol {sol}/{maxSols}
                </span>
                <span className="font-bold text-[#37D67A] tabular-nums">
                  Sci {objectives.researchProgress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-[#37D67A] transition-all"
                  style={{ width: `${objectives.researchProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#AAB8C8]">
                  Life Support:{' '}
                  <strong className={objectives.lifeSupportMaintained ? 'text-[#37D67A]' : 'text-[#FFB84D]'}>
                    {objectives.lifeSupportMaintained ? 'Stable' : 'Repair'}
                  </strong>
                </span>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    runResearchPulse();
                  }}
                  className="px-2 py-1 rounded-lg bg-[#152A3E] border border-[#37D6F4]/40 text-[10px] font-bold text-[#37D6F4] hover:bg-[#1e3c58] cursor-pointer"
                >
                  {objectives.researchCompleted ? 'Sci 100% ✓' : 'Scan Sci +20%'}
                </button>
              </div>
              {forecast && (
                <p className="text-[10px] text-[#FFB84D] leading-snug pt-1 border-t border-white/10">
                  Forecast Sol {forecast.nextSol}: {forecast.advisory}
                </p>
              )}
            </div>

            <CapcomGuidePanel />
          </aside>
        </>
      )}

      {/* EXTERIOR 360° ORBIT CONTROLS */}
      {viewMode === 'exterior' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#0D1B2A]/92 border border-[#37D6F4]/50 px-4 py-2.5 shadow-xl">
          <span className="text-xs font-bold text-[#37D6F4]">
            360° Orbit View · Live simulation continues running
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
            Return to Interior
          </button>
        </div>
      )}

      {/* TABLET / TOUCH CONTROLS */}
      {showTouchPad && isInsideView && (
        <div className="sm:hidden fixed bottom-28 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
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
            USE / FIX
          </button>
        </div>
      )}

      {/* FLOATING ACTION CONFIRMATION PULSE */}
      {stationPulse && Date.now() - stationPulse.ts < 2600 && (
        <div
          className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-[#0D1B2A]/95 border px-4 py-1.5 text-sm font-extrabold shadow-2xl"
          style={{ borderColor: stationPulse.color, color: stationPulse.color }}
        >
          {stationPulse.text}
        </div>
      )}

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-[#0D1B2A]/95 border border-[#37D6F4] px-4 py-2 text-xs sm:text-sm font-bold text-[#F4F7FB] shadow-2xl">
          {toastMessage}
        </div>
      )}

      {/* CLASH-OF-CLANS FINGERTIP MACHINE ACTION BAR + MISSION PROGRESS FOOTER */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 px-3 sm:px-4 py-2 bg-[#0D1B2A]/95 border-t border-[#37D6F4]/25 flex flex-wrap items-center justify-between gap-2 shadow-[0_-8px_28px_rgba(0,0,0,0.5)]">
        {/* Progress & Health */}
        <div className="flex items-center gap-2.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tabular-nums">
              <span className="text-[#AAB8C8]">SOL {sol}/{maxSols}</span>
              <span className="text-[#37D67A]">HP {Math.round(character.health)}%</span>
            </div>
            <div className="w-24 sm:w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#37D6F4] transition-all"
                style={{ width: `${(sol / maxSols) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* One-Click Fingertip Machine Actions (6 Arcade Cabinets + Crew Facilities) */}
        {isInsideView && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {(nearbyStation || nearbyPickupUid) && (
              <button
                onClick={(e) => {
                  e.currentTarget.blur();
                  interactWithNearby();
                }}
                className="sci-btn px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#37D6F4] to-[#4388F5] text-[#07111F] font-extrabold text-xs cursor-pointer"
              >
                Use Nearby (E)
              </button>
            )}

            <button
              onClick={(e) => handleFingertipMachine('oxygen-generator', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.oxygenGenerator !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF5B68] border-white text-white'
                  : 'bg-[#152A3E] border-[#37D6F4]/55 text-[#37D6F4]'
              }`}
            >
              {systems.oxygenGenerator !== 'Operational' ? <Wrench className="w-3.5 h-3.5" /> : <Wind className="w-3.5 h-3.5" />}
              <span>{systems.oxygenGenerator !== 'Operational' ? 'Fix O₂' : 'O₂ Gen'}</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('co2-scrubber', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.co2Scrubber !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF5B68] border-white text-white'
                  : 'bg-[#152A3E] border-[#37D67A]/55 text-[#37D67A]'
              }`}
            >
              {systems.co2Scrubber !== 'Operational' ? <Wrench className="w-3.5 h-3.5" /> : <Wind className="w-3.5 h-3.5" />}
              <span>{systems.co2Scrubber !== 'Operational' ? 'Fix CO₂' : 'CO₂ Scrub'}</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('water-recycler', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.waterRecycler !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF5B68] border-white text-white'
                  : 'bg-[#152A3E] border-[#37D6F4]/55 text-[#37D6F4]'
              }`}
            >
              <Recycle className="w-3.5 h-3.5" />
              <span>{systems.waterRecycler !== 'Operational' ? 'Fix H₂O' : 'H₂O Recyc'}</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('greenhouse', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.greenhouse !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF5B68] border-white text-white'
                  : greenhouseState.stage === 'ready'
                    ? 'bg-[#37D67A] border-white text-[#07111F]'
                    : 'bg-[#152A3E] border-[#37D67A]/55 text-[#37D67A]'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>
                {systems.greenhouse !== 'Operational'
                  ? 'Fix Crops'
                  : greenhouseState.stage === 'ready'
                    ? 'Harvest!'
                    : 'Greenhouse'}
              </span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('solar-array', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.solarArray !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF7A3D] border-white text-white'
                  : 'bg-[#152A3E] border-[#FFB84D]/55 text-[#FFB84D]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>{systems.solarArray !== 'Operational' ? 'Fix Solar' : 'Solar'}</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('battery-system', e)}
              className={`sci-btn px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer border ${
                systems.batterySystem !== 'Operational'
                  ? 'sci-btn-urgent bg-[#FF7A3D] border-white text-white'
                  : 'bg-[#152A3E] border-[#FFB84D]/55 text-[#FFB84D]'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>{systems.batterySystem !== 'Operational' ? 'Fix Batt' : 'Battery'}</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('water-dispenser', e)}
              className="sci-btn px-2.5 py-1.5 rounded-xl bg-[#152A3E] border border-[#38BDF8]/55 text-[#38BDF8] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Drink</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('water-blocks', e)}
              className="sci-btn px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7A3D] to-[#f95f24] text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Shield ({waterBlocksReinforced}/3)</span>
            </button>

            <button
              onClick={(e) => handleFingertipMachine('crew-bunks', e)}
              className="sci-btn px-2.5 py-1.5 rounded-xl bg-[#152A3E] border border-[#FF5B68]/55 text-[#FF5B68] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Rest</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                openEndDayReport();
              }}
              className="sci-btn px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#37D67A] to-[#22c55e] text-[#07111F] font-extrabold text-xs cursor-pointer"
            >
              Report & Next Sol →
            </button>
          </div>
        )}

        <div className="text-right">
          <p className="text-xs font-extrabold text-[#FFB84D] tabular-nums">
            {missionScore.toLocaleString()} PTS
          </p>
        </div>
      </footer>
    </div>
  );
}

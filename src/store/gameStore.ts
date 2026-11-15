import { create } from 'zustand';
import {
  ASSEMBLY_RECIPES,
  CARGO_LIMIT,
  GAME_ITEMS,
  INVENTORY_SLOT_LIMIT,
  ITEM_BY_ID,
  SHARED_FOOD_CAPACITY,
  getRecommendedLoadout,
  isFoodItem,
  isLockerStorable,
} from '../data/items';
import { SCENARIO_BY_ID } from '../data/scenarios';
import {
  ScheduledEventSpec,
  generateMissionTimeline,
  getForecastForNextSol,
} from '../engine/eventDirector';
import {
  INITIAL_CHARACTER_STATE,
  INITIAL_GREENHOUSE_STATE,
  INITIAL_MACHINE_CONDITIONS,
  INITIAL_TUTORIAL_RESOURCES,
  INITIAL_WATER_CYCLE_STATE,
  MAX_MISSION_DAYS,
  SOL_DURATION_SECONDS,
  clamp,
  clampFloat,
  computeFoodPercentFromItems,
  computeMissionScore,
  countFoodItems,
  determineMissionOutcome,
  evaluateObjectives,
  isMachineHealthy,
  previewDailyRates,
  stepContinuousSimulation,
} from '../engine/simulation';
import {
  ActionAnimState,
  CharacterState,
  ChatMessage,
  CrewMemberState,
  CrewTask,
  Destination,
  DifficultyMode,
  EmergencyState,
  ForecastInfo,
  GreenhouseCropState,
  InventoryItem,
  MachineConditionMap,
  MissionEventLog,
  MissionObjectivesState,
  MissionOutcome,
  MissionStatus,
  PlanId,
  PuzzleId,
  RepairAnimState,
  ResourceState,
  SafetySystemState,
  SavedMissionSnapshot,
  SavedProgress,
  StationId,
  StatusHistoryPoint,
  SystemConditionMap,
  SystemId,
  SystemToggleState,
  ViewMode,
  WaterCycleState,
  WorldPickup,
} from '../types/game';
import { SoundId, playSound, playTone, setAudioConfig, syncAmbience } from '../utils/sound';

const STORAGE_KEY = 'orbital_survival_progress_v1';
const MISSION_SAVE_KEY = 'orbital_survival_saved_mission_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  bestScore: 3450,
  completedMissions: 1,
  unlockedAchievements: ['Earth Guardian', 'Lunar Survivor'],
  lastDestination: 'mars',
  muted: false,
  volume: 0.7,
  musicMuted: false,
  musicVolume: 0.35,
  reducedMotion: false,
  lowGraphics: false,
  introWatchedMars: false,
  introWatchedMoon: false,
};

function loadSavedProgress(): SavedProgress {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_PROGRESS;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements
        : DEFAULT_PROGRESS.unlockedAchievements,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgressToStorage(progress: SavedProgress) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  } catch {
    // Graceful fallback
  }
}

function loadSavedMissionSnapshot(): SavedMissionSnapshot | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(MISSION_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedMissionSnapshot>;
    if (!parsed || typeof parsed.sol !== 'number' || !parsed.resources || !parsed.systems) {
      return null;
    }
    return parsed as SavedMissionSnapshot;
  } catch {
    return null;
  }
}

function saveMissionSnapshotToStorage(snapshot: SavedMissionSnapshot) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MISSION_SAVE_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // Graceful fallback
  }
}

function clearSavedMissionSnapshot() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(MISSION_SAVE_KEY);
    }
  } catch {
    // Graceful fallback
  }
}

const INITIAL_SYSTEMS: SystemConditionMap = {
  oxygenGenerator: 'Operational',
  co2Scrubber: 'Operational',
  waterRecycler: 'Operational',
  solarArray: 'Operational',
  batterySystem: 'Operational',
  greenhouse: 'Operational',
  pressureSystem: 'Operational',
  temperatureControl: 'Operational',
  radiationShelter: 'Operational',
};

const INITIAL_TOGGLES: SystemToggleState = {
  oxygenGenerator: true,
  co2Scrubber: true,
  waterRecycler: true,
  greenhouse: true,
  solarArray: true,
  batterySystem: true,
  temperatureControl: true,
  researchSystems: true,
};

const INITIAL_CREW: CrewMemberState[] = [
  {
    id: 'player',
    label: 'Cadet Commander',
    role: 'Mission Lead',
    isPlayer: true,
    health: 100,
    hydration: 96,
    nutrition: 94,
    energy: 100,
    assignedTask: 'maintenance',
    status: 'healthy',
  },
  {
    id: 'crew-1',
    label: 'Astra',
    role: 'Life Support Tech',
    isPlayer: false,
    health: 100,
    hydration: 92,
    nutrition: 90,
    energy: 95,
    assignedTask: 'maintenance',
    status: 'healthy',
  },
  {
    id: 'crew-2',
    label: 'Nova',
    role: 'Science & Power Eng',
    isPlayer: false,
    health: 100,
    hydration: 90,
    nutrition: 88,
    energy: 94,
    assignedTask: 'research',
    status: 'healthy',
  },
  {
    id: 'crew-3',
    label: 'Orbit',
    role: 'Botany & Med Spec',
    isPlayer: false,
    health: 100,
    hydration: 94,
    nutrition: 93,
    energy: 96,
    assignedTask: 'greenhouse',
    status: 'healthy',
  },
];

const INITIAL_SHARED_FOOD_STORAGE: InventoryItem[] = [
  { id: 'meal-pack', quantity: 5 },
  { id: 'fresh-crop', quantity: 2 },
];

function addItemToList(items: InventoryItem[], itemId: string, qty = 1): InventoryItem[] {
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx >= 0) {
    return items.map((i, k) => (k === idx ? { ...i, quantity: i.quantity + qty } : i));
  }
  return [...items, { id: itemId, quantity: qty }];
}

function removeItemFromList(items: InventoryItem[], itemId: string, qty = 1): InventoryItem[] {
  return items
    .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - qty } : i))
    .filter((i) => i.quantity > 0);
}

function pickFoodItemId(items: InventoryItem[], preferredId?: string): string | null {
  if (preferredId && isFoodItem(preferredId)) {
    const match = items.find((i) => i.id === preferredId && i.quantity > 0);
    if (match) return match.id;
  }
  const fresh = items.find((i) => i.id === 'fresh-crop' && i.quantity > 0);
  if (fresh) return fresh.id;
  const meal = items.find((i) => i.id === 'meal-pack' && i.quantity > 0);
  return meal ? meal.id : null;
}

const INITIAL_WORLD_PICKUPS: WorldPickup[] = [
  { uid: 'wp-meal-1', itemId: 'meal-pack', label: 'Meal Pack', zone: 'interior', position: { x: 2.35, y: 0.4, z: -0.95 }, collected: false },
  { uid: 'wp-water-1', itemId: 'water-pack', label: 'Water Pack', zone: 'interior', position: { x: 3.05, y: 0.4, z: -0.65 }, collected: false },
  { uid: 'wp-repair-1', itemId: 'repair-kit', label: 'Repair Kit', zone: 'interior', position: { x: -2.15, y: 0.4, z: -0.85 }, collected: false },
  { uid: 'wp-filter-1', itemId: 'spare-co2-filter', label: 'Spare CO₂ Filter', zone: 'interior', position: { x: -0.85, y: 0.4, z: -0.95 }, collected: false },
  { uid: 'wp-airlock-parts', itemId: 'spare-parts', label: 'Spare Hardware Crate', zone: 'airlock-bay', position: { x: -4.1, y: 0.4, z: 1.35 }, collected: false },
  { uid: 'wp-airlock-batt', itemId: 'emergency-battery', label: 'Airlock Emergency Battery', zone: 'airlock-bay', position: { x: 4.05, y: 0.4, z: 1.35 }, collected: false },
  { uid: 'wp-airlock-parts-2', itemId: 'spare-parts', label: 'Outer Sealant Kit', zone: 'airlock-bay', position: { x: -3.65, y: 0.4, z: 0.9 }, collected: false },
];

export type ActiveModal =
  | null
  | 'inventory'
  | 'manual'
  | 'dashboard'
  | 'plan-decision'
  | 'station-inspect'
  | 'end-day-report'
  | 'science'
  | 'pause'
  | 'settings'
  | 'exit-confirm';

export type StationPulse = {
  stationId: StationId;
  text: string;
  color: string;
  ts: number;
};

export type LiveTrends = {
  oxygen: number;
  battery: number;
  radiation: number;
  food: number;
  co2: number;
  health: number;
  energy: number;
};

export type ActivePuzzlePayload = {
  id: PuzzleId;
  instanceSeed: number;
  scenarioId?: string;
  stationId?: StationId;
  targetSystem?: SystemId;
  standalonePractice?: boolean;
};

function makeSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 999983)) >>> 0;
}

function stationForSystem(sys?: SystemId): StationId {
  switch (sys) {
    case 'oxygenGenerator':
      return 'oxygen-generator';
    case 'co2Scrubber':
      return 'co2-scrubber';
    case 'waterRecycler':
      return 'water-recycler';
    case 'greenhouse':
      return 'greenhouse';
    case 'solarArray':
      return 'solar-array';
    case 'batterySystem':
      return 'battery-system';
    case 'radiationShelter':
      return 'radiation-shelter';
    case 'temperatureControl':
      return 'crew-bunks';
    default:
      return 'mission-control';
  }
}

export type GameStore = {
  destination: Destination;
  viewMode: ViewMode;
  missionStatus: MissionStatus;
  missionOutcome: MissionOutcome;
  difficulty: DifficultyMode;
  missionSeed: number;
  sol: number;
  solElapsedSeconds: number;
  maxSols: number;
  missionScore: number;
  missionElapsedSeconds: number;

  resources: ResourceState;
  character: CharacterState;
  characterTrends: { health: number; energy: number; hydration: number };
  liveTrends: LiveTrends;
  statusHistory: StatusHistoryPoint[];
  crew: CrewMemberState[];
  inventory: InventoryItem[];
  sharedFoodStorage: InventoryItem[];
  worldPickups: WorldPickup[];

  systems: SystemConditionMap;
  machineConditions: MachineConditionMap;
  toggles: SystemToggleState;
  greenhouseState: GreenhouseCropState;
  waterCycle: WaterCycleState;
  safety: SafetySystemState;
  repairAnim: RepairAnimState;
  actionAnim: ActionAnimState;

  dustStormDaysRemaining: number;
  activeLeak: boolean;
  activeRadiationHazard: boolean;
  waterBlocksReinforced: number;

  eventTimeline: Record<number, ScheduledEventSpec | null>;
  forecast: ForecastInfo | null;
  objectives: MissionObjectivesState;

  emergency: EmergencyState | null;
  completedScenarios: string[];
  selectedPlansLog: { sol: number; scenarioId: string; title: string; plan: PlanId; severity: string }[];
  puzzlesCompletedCount: number;
  safetyReason: string | null;

  activeModal: ActiveModal;
  inspectedStationId: StationId | null;
  activePuzzle: ActivePuzzlePayload | null;
  puzzlePaused: boolean;
  manualContextStation: StationId | null;

  nearbyStation: StationId | null;
  nearbyPickupUid: string | null;
  moveTarget: { x: number; z: number; stationId?: StationId } | null;
  stationPulse: StationPulse | null;
  toastMessage: string | null;
  capcomMessage: string;
  eventLog: MissionEventLog[];

  loadoutSelection: Record<string, number>;
  savedProgress: SavedProgress;
  savedMission: SavedMissionSnapshot | null;
  exitNotice: { saved: boolean; sol: number | null; destination: Destination } | null;
  touchMoveVector: { x: number; y: number };

  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  setMissionStatus: (status: MissionStatus) => void;
  selectDestination: (dest: Destination) => void;
  setDifficulty: (diff: DifficultyMode) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleMute: () => void;
  toggleSfxMute: () => void;
  setAudioVolume: (volume: number) => void;
  toggleMusicMute: () => void;
  setMusicVolume: (volume: number) => void;
  toggleReducedMotion: () => void;
  toggleLowGraphics: () => void;

  setLoadoutQty: (itemId: string, qty: number) => void;
  applyRecommendedLoadout: () => void;
  startMissionFromLoadout: (replayIntro?: boolean, customSeed?: number) => void;
  finishCinematicToBriefing: () => void;
  finishRescueCinematic: () => void;
  beginActiveGameplay: () => void;
  startPracticePuzzle: (puzzleId: PuzzleId) => void;

  openModal: (modal: ActiveModal, stationId?: StationId | null) => void;
  closeModal: () => void;

  setTouchMoveVector: (vec: { x: number; y: number }) => void;
  setMoveTarget: (target: { x: number; z: number; stationId?: StationId } | null) => void;
  updatePlayerPosition: (pos: { x: number; y: number; z: number }, distanceMoved: number) => void;
  setNearbyInteractable: (station: StationId | null, pickupUid: string | null) => void;
  interactWithNearby: () => void;
  performQuickStationAction: (stationId: StationId) => void;
  maintainSystem: (systemId: SystemId, useRepairKit?: boolean) => void;
  openMachineRepairPuzzle: (systemId: SystemId, stationId?: StationId) => void;
  reinforceWaterBlock: () => void;

  harvestGreenhouse: () => void;
  drinkAtWaterDispenser: (crewId?: string) => void;
  eatCrewMeal: (crewId?: string, opts?: { source?: 'auto' | 'backpack' | 'storage'; itemId?: string }) => void;
  useToiletFacility: () => void;
  emptySolidWaste: () => void;

  useInventoryItem: (itemId: string) => void;
  dropInventoryItem: (itemId: string) => void;
  depositFoodToSharedStorage: (itemId: string, qty?: number) => void;
  withdrawFoodFromSharedStorage: (itemId: string, qty?: number) => void;
  crewCollectDroppedFood: (pickupUid: string, crewId: string) => void;
  craftAssemblyRecipe: (recipeId: string) => void;
  restAtCrewBunk: () => void;
  toggleSystemPower: (key: keyof SystemToggleState) => void;
  setCrewTask: (crewId: string, task: CrewTask) => void;
  runResearchPulse: () => void;

  chooseEmergencyPlan: (planId: PlanId) => void;
  completePuzzle: (success: boolean) => void;
  closePuzzle: () => void;

  openEndDayReport: () => void;
  endMissionDay: () => void;
  tickContinuousSimulation: (dtSec?: number) => void;
  tickMissionTimer: () => void;
  tickLiveSimulation: () => void;
  clearToast: () => void;
  showToast: (msg: string) => void;

  sendChatMessage: (text: string, quickHint?: boolean) => Promise<void>;
  exitGameSafely: () => void;
  resumeSavedMission: () => void;
  dismissExitNotice: () => void;
  resetMission: (returnToSelect?: boolean) => void;
};

const initialSaved = loadSavedProgress();
setAudioConfig({
  muted: initialSaved.muted,
  volume: initialSaved.volume ?? 0.7,
  musicMuted: initialSaved.musicMuted ?? false,
  musicVolume: initialSaved.musicVolume ?? 0.35,
});
const initialSavedMission = loadSavedMissionSnapshot();

function syncTrendsFromPreview(state: GameStore): LiveTrends {
  const preview = previewDailyRates(
    state.destination,
    state.toggles,
    state.systems,
    state.dustStormDaysRemaining,
    {
      resources: state.resources,
      machineConditions: state.machineConditions,
      crew: state.crew,
      difficulty: state.difficulty,
      activeLeak: state.activeLeak,
      activeRadiationHazard: state.activeRadiationHazard,
      emergency: state.emergency,
      greenhouseState: state.greenhouseState,
      waterCycle: state.waterCycle,
    }
  );
  return {
    oxygen: preview.netOxygen >= 0 ? 1 : -1,
    battery: preview.netBattery >= 0 ? 1 : -1,
    radiation: preview.netRadiation >= 0 ? 1 : -1,
    food: preview.netFood >= 0 ? 1 : -1,
    co2: preview.netCo2 > 0 ? 1 : -1,
    health: state.emergency?.active ? -1 : 1,
    energy: state.character.energy < 95 ? -1 : 0,
  };
}

function triggerEventFromSpec(
  spec: ScheduledEventSpec,
  systems: SystemConditionMap,
  conditions: MachineConditionMap,
  destination: Destination
): {
  emergency: EmergencyState;
  nextSystems: SystemConditionMap;
  nextConditions: MachineConditionMap;
  dustDays: number;
  leak: boolean;
  radHazard: boolean;
  capcom: string;
} {
  const sc = SCENARIO_BY_ID[spec.scenarioId];
  const nextSystems = { ...systems };
  const nextConditions = { ...conditions };

  const sevStatus = spec.severity === 'minor' ? 'Warning' : 'Repair Required';
  const condHit = spec.severity === 'severe' ? 42 : spec.severity === 'moderate' ? 28 : 16;

  for (const sys of sc.affectedSystems) {
    nextSystems[sys] = sevStatus;
    nextConditions[sys] = clamp(nextConditions[sys] - condHit, 18, 100);
  }

  return {
    emergency: {
      scenarioId: sc.id,
      eventType: sc.eventType,
      severity: spec.severity,
      durationDays: spec.durationDays,
      daysActive: 0,
      warningStage: 'active',
      active: true,
      selectedPlan: null,
      puzzleCompleted: false,
      countdownSeconds: 30,
    },
    nextSystems,
    nextConditions,
    dustDays: sc.eventType === 'mars-dust-storm' && destination === 'mars' ? spec.durationDays : 0,
    leak: sc.eventType === 'habitat-pressure-leak',
    radHazard: sc.eventType === 'moon-radiation-alert',
    capcom: `[${spec.severity.toUpperCase()} ALERT] ${sc.capcomAlert}`,
  };
}

function puzzleForSystem(sys: SystemId): PuzzleId {
  if (sys === 'co2Scrubber') return 'co2-filter-adapter';
  if (sys === 'waterRecycler' || sys === 'pressureSystem') return 'hull-patch';
  if (sys === 'solarArray' || sys === 'temperatureControl' || sys === 'greenhouse') {
    return 'diagnostic-sequence';
  }
  return 'circuit-reconnect';
}

export const useGameStore = create<GameStore>((set, get) => ({
  destination: initialSaved.lastDestination,
  viewMode: 'interior',
  missionStatus: 'destination-select',
  missionOutcome: 'victory',
  difficulty: 'cadet',
  missionSeed: 104729,
  sol: 1,
  solElapsedSeconds: 0,
  maxSols: MAX_MISSION_DAYS,
  missionScore: 1850,
  missionElapsedSeconds: 0,

  resources: { ...INITIAL_TUTORIAL_RESOURCES },
  character: { ...INITIAL_CHARACTER_STATE },
  characterTrends: { health: 0, energy: 0, hydration: 0 },
  liveTrends: { oxygen: 1, battery: -1, radiation: -1, food: -1, co2: -1, health: 0, energy: 0 },
  statusHistory: [{ step: 1, label: 'Start', health: 100, energy: 100, hydration: 96 }],
  crew: INITIAL_CREW.map((c) => ({ ...c })),
  inventory: [],
  sharedFoodStorage: INITIAL_SHARED_FOOD_STORAGE.map((i) => ({ ...i })),
  worldPickups: INITIAL_WORLD_PICKUPS.map((w) => ({ ...w })),

  systems: { ...INITIAL_SYSTEMS },
  machineConditions: { ...INITIAL_MACHINE_CONDITIONS },
  toggles: { ...INITIAL_TOGGLES },
  greenhouseState: { ...INITIAL_GREENHOUSE_STATE },
  waterCycle: { ...INITIAL_WATER_CYCLE_STATE },
  safety: { stage: 'normal', reason: null, triggerMetric: null, countdownSeconds: 0 },
  repairAnim: null,
  actionAnim: null,

  dustStormDaysRemaining: 0,
  activeLeak: false,
  activeRadiationHazard: false,
  waterBlocksReinforced: 1,

  eventTimeline: {},
  forecast: null,
  objectives: {
    lifeSupportMaintained: true,
    researchProgress: 0,
    researchCompleted: false,
    survivedAllDays: false,
  },

  emergency: null,
  completedScenarios: [],
  selectedPlansLog: [],
  puzzlesCompletedCount: 0,
  safetyReason: null,

  activeModal: null,
  inspectedStationId: null,
  activePuzzle: null,
  puzzlePaused: false,
  manualContextStation: null,

  nearbyStation: null,
  nearbyPickupUid: null,
  moveTarget: null,
  stationPulse: null,
  toastMessage: null,
  capcomMessage:
    'Welcome, Cadet! Survive 10 Sols, run the 6 habitat machines, harvest crops, and complete Research!',
  eventLog: [],

  loadoutSelection: getRecommendedLoadout(),
  savedProgress: initialSaved,
  savedMission: initialSavedMission,
  exitNotice: null,
  touchMoveVector: { x: 0, y: 0 },

  chatMessages: [
    {
      id: 'capcom-welcome',
      role: 'model',
      text: 'Hi Cadet! I am CAPCOM, your Junior Flight Director. Walk up to the 6 arcade life-support cabinets, Water Dispenser, or Toilet & Waste Bay—I am here whenever you need help!',
      timestamp: 'Sol 1',
      source: 'capcom-local',
    },
  ],
  isChatLoading: false,

  setMissionStatus: (status) => set({ missionStatus: status }),

  selectDestination: (dest) => {
    const prev = get().savedProgress;
    const updated = { ...prev, lastDestination: dest };
    saveProgressToStorage(updated);
    playTone('click', prev.muted, prev.volume);
    set({
      destination: dest,
      savedProgress: updated,
      capcomMessage:
        dest === 'mars'
          ? 'Mars selected! Expect 0.38g gravity and Martian dust storms over your 10-Sol mission.'
          : 'Moon selected! Expect 0.16g low gravity and Solar Flare radiation events over your 10-Sol mission.',
    });
  },

  setDifficulty: (diff) => set({ difficulty: diff }),

  setViewMode: (mode) => {
    const state = get();
    playTone('click', state.savedProgress.muted, state.savedProgress.volume);
    set({
      viewMode: mode,
      puzzlePaused: mode === 'exterior' && state.activePuzzle !== null,
    });
  },

  toggleMute: () => {
    const prev = get().savedProgress;
    const anyAudioOn = !prev.muted || !prev.musicMuted;
    const nextMuted = anyAudioOn;
    const updated = { ...prev, muted: nextMuted, musicMuted: nextMuted };
    saveProgressToStorage(updated);
    setAudioConfig({
      muted: updated.muted,
      volume: updated.volume,
      musicMuted: updated.musicMuted,
      musicVolume: updated.musicVolume,
    });
    syncAmbience(get().missionStatus === 'active', updated.muted, updated.volume);
    set({ savedProgress: updated });
  },

  toggleSfxMute: () => {
    const prev = get().savedProgress;
    const updated = { ...prev, muted: !prev.muted };
    saveProgressToStorage(updated);
    setAudioConfig({ muted: updated.muted, volume: updated.volume });
    syncAmbience(get().missionStatus === 'active', updated.muted, updated.volume);
    set({ savedProgress: updated });
  },

  setAudioVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, Math.round(volume * 100) / 100));
    const prev = get().savedProgress;
    const updated = {
      ...prev,
      volume: clamped,
      muted: clamped <= 0 ? true : false,
    };
    saveProgressToStorage(updated);
    setAudioConfig({ muted: updated.muted, volume: updated.volume });
    syncAmbience(get().missionStatus === 'active', updated.muted, updated.volume);
    set({ savedProgress: updated });
  },

  toggleMusicMute: () => {
    const prev = get().savedProgress;
    const updated = { ...prev, musicMuted: !prev.musicMuted };
    saveProgressToStorage(updated);
    setAudioConfig({
      musicMuted: updated.musicMuted,
      musicVolume: updated.musicVolume,
    });
    set({ savedProgress: updated });
  },

  setMusicVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, Math.round(volume * 100) / 100));
    const prev = get().savedProgress;
    const updated = {
      ...prev,
      musicVolume: clamped,
      musicMuted: clamped <= 0 ? true : false,
    };
    saveProgressToStorage(updated);
    setAudioConfig({
      musicMuted: updated.musicMuted,
      musicVolume: updated.musicVolume,
    });
    set({ savedProgress: updated });
  },

  toggleReducedMotion: () => {
    const prev = get().savedProgress;
    const updated = { ...prev, reducedMotion: !prev.reducedMotion };
    saveProgressToStorage(updated);
    set({ savedProgress: updated });
  },

  toggleLowGraphics: () => {
    const prev = get().savedProgress;
    const updated = { ...prev, lowGraphics: !prev.lowGraphics };
    saveProgressToStorage(updated);
    set({ savedProgress: updated });
  },

  setLoadoutQty: (itemId, qty) => {
    const state = get();
    const clampedQty = Math.max(0, Math.min(5, qty));
    const next = { ...state.loadoutSelection, [itemId]: clampedQty };
    const totalPoints = GAME_ITEMS.reduce(
      (sum, item) => sum + (next[item.id] || 0) * item.cargoCost,
      0
    );
    if (totalPoints > CARGO_LIMIT) {
      playTone('error', state.savedProgress.muted);
      set({ toastMessage: `Cargo limit is ${CARGO_LIMIT} points! Remove an item first.` });
      return;
    }
    playTone('click', state.savedProgress.muted);
    set({ loadoutSelection: next });
  },

  applyRecommendedLoadout: () => {
    playTone('click', get().savedProgress.muted);
    set({
      loadoutSelection: getRecommendedLoadout(),
      toastMessage: 'Recommended 17-point NASA Cadet Loadout equipped!',
    });
  },

  startMissionFromLoadout: (replayIntro = false, customSeed?: number) => {
    const state = get();
    const dest = state.destination;
    const inv: InventoryItem[] = [];
    for (const item of GAME_ITEMS) {
      const q = state.loadoutSelection[item.id] || 0;
      if (q > 0) inv.push({ id: item.id, quantity: q });
    }

    const seed = customSeed ?? makeSeed();
    const timeline = generateMissionTimeline(dest, seed, state.difficulty);
    const starterSpec = timeline[1] ?? {
      sol: 1,
      scenarioId: dest === 'mars' ? 'mars-dust-storm' : 'moon-radiation-alert',
      severity: 'minor' as const,
      durationDays: dest === 'mars' ? 2 : 1,
    };

    const triggered = triggerEventFromSpec(
      starterSpec,
      { ...INITIAL_SYSTEMS },
      { ...INITIAL_MACHINE_CONDITIONS },
      dest
    );
    const forecast = getForecastForNextSol(1, MAX_MISSION_DAYS, timeline);

    const introWatched =
      dest === 'mars'
        ? state.savedProgress.introWatchedMars
        : state.savedProgress.introWatchedMoon;

    const starterSharedStorage = INITIAL_SHARED_FOOD_STORAGE.map((i) => ({ ...i }));
    const initialResources: ResourceState = {
      ...INITIAL_TUTORIAL_RESOURCES,
      battery: dest === 'mars' ? 68 : 78,
      radiationProtection: dest === 'moon' ? 64 : 80,
      food: computeFoodPercentFromItems(starterSharedStorage, inv),
    };

    playTone('success', state.savedProgress.muted, state.savedProgress.volume);
    clearSavedMissionSnapshot();

    set({
      savedMission: null,
      exitNotice: null,
      missionStatus: replayIntro || !introWatched ? 'intro' : 'briefing',
      missionOutcome: 'victory',
      missionSeed: seed,
      eventTimeline: timeline,
      forecast,
      viewMode: 'interior',
      sol: 1,
      solElapsedSeconds: 0,
      maxSols: MAX_MISSION_DAYS,
      missionScore: 1850,
      missionElapsedSeconds: 0,
      resources: initialResources,
      character: { ...INITIAL_CHARACTER_STATE },
      characterTrends: { health: 0, energy: 0, hydration: 0 },
      liveTrends: {
        oxygen: 1,
        battery: dest === 'mars' ? -1 : 1,
        radiation: dest === 'moon' ? -1 : 1,
        food: -1,
        co2: -1,
        health: 0,
        energy: 0,
      },
      statusHistory: [{ step: 1, label: 'Sol 1', health: 100, energy: 100, hydration: 96 }],
      crew: INITIAL_CREW.map((c) => ({ ...c })),
      inventory: inv,
      sharedFoodStorage: starterSharedStorage,
      worldPickups: INITIAL_WORLD_PICKUPS.map((w) => ({ ...w })),
      systems: triggered.nextSystems,
      machineConditions: triggered.nextConditions,
      toggles: { ...INITIAL_TOGGLES },
      greenhouseState: { ...INITIAL_GREENHOUSE_STATE },
      waterCycle: { ...INITIAL_WATER_CYCLE_STATE },
      safety: { stage: 'normal', reason: null, triggerMetric: null, countdownSeconds: 0 },
      repairAnim: null,
      actionAnim: null,
      dustStormDaysRemaining: triggered.dustDays,
      activeLeak: triggered.leak,
      activeRadiationHazard: triggered.radHazard,
      waterBlocksReinforced: 1,
      objectives: {
        lifeSupportMaintained: true,
        researchProgress: 0,
        researchCompleted: false,
        survivedAllDays: false,
      },
      completedScenarios: [],
      selectedPlansLog: [],
      puzzlesCompletedCount: 0,
      safetyReason: null,
      activeModal: null,
      inspectedStationId: null,
      activePuzzle: null,
      puzzlePaused: false,
      moveTarget: null,
      stationPulse: null,
      emergency: triggered.emergency,
      capcomMessage: triggered.capcom,
      eventLog: [
        {
          id: `evt-start-${seed}`,
          sol: 1,
          title: SCENARIO_BY_ID[starterSpec.scenarioId].title,
          detail: SCENARIO_BY_ID[starterSpec.scenarioId].introStory,
          severity: 'warning',
        },
      ],
    });
  },

  finishCinematicToBriefing: () => {
    const state = get();
    const updatedProgress = {
      ...state.savedProgress,
      introWatchedMars: state.destination === 'mars' ? true : state.savedProgress.introWatchedMars,
      introWatchedMoon: state.destination === 'moon' ? true : state.savedProgress.introWatchedMoon,
    };
    saveProgressToStorage(updatedProgress);
    set({
      savedProgress: updatedProgress,
      missionStatus: 'briefing',
    });
  },

  finishRescueCinematic: () => {
    syncAmbience(false);
    set({ missionStatus: 'safety-protocol' });
  },

  beginActiveGameplay: () => {
    const sp = get().savedProgress;
    playTone('click', sp.muted, sp.volume);
    syncAmbience(true, sp.muted, sp.volume);
    set({ missionStatus: 'active' });
  },

  startPracticePuzzle: (puzzleId) => {
    const sp = get().savedProgress;
    playTone('click', sp.muted, sp.volume);
    set({
      activePuzzle: { id: puzzleId, instanceSeed: makeSeed(), standalonePractice: true },
    });
  },

  openModal: (modal, stationId = null) => {
    const state = get();
    const sp = state.savedProgress;
    if (modal === 'inventory') {
      playSound('inventory-open', { muted: sp.muted, volume: sp.volume });
    } else if (modal === 'station-inspect' && stationId) {
      const opSoundMap: Partial<Record<StationId, SoundId>> = {
        'oxygen-generator': 'op-oxygen',
        'co2-scrubber': 'op-co2',
        'water-recycler': 'op-water',
        greenhouse: 'op-greenhouse',
        'solar-array': 'op-solar',
      };
      const sysMap: Partial<Record<StationId, SystemId>> = {
        'oxygen-generator': 'oxygenGenerator',
        'co2-scrubber': 'co2Scrubber',
        'water-recycler': 'waterRecycler',
        greenhouse: 'greenhouse',
        'solar-array': 'solarArray',
      };
      const sId = sysMap[stationId];
      const opSound = opSoundMap[stationId];
      if (
        sId &&
        opSound &&
        state.toggles[sId as keyof SystemToggleState] &&
        isMachineHealthy(state.systems[sId], state.machineConditions[sId])
      ) {
        playSound(opSound, { muted: sp.muted, volume: sp.volume });
      } else {
        playTone('click', sp.muted, sp.volume);
      }
    } else {
      playTone('click', sp.muted, sp.volume);
    }

    if (modal === 'pause' || modal === 'settings' || modal === 'exit-confirm') {
      syncAmbience(false);
    }

    set({
      activeModal: modal,
      inspectedStationId: modal === 'station-inspect' ? stationId : state.inspectedStationId,
      manualContextStation: stationId ?? state.manualContextStation,
    });
  },

  closeModal: () => {
    const state = get();
    const sp = state.savedProgress;
    if (state.activeModal === 'inventory') {
      playSound('inventory-close', { muted: sp.muted, volume: sp.volume });
    }
    if (state.missionStatus === 'active') {
      syncAmbience(true, sp.muted, sp.volume);
    }
    set({ activeModal: null });
  },

  setTouchMoveVector: (vec) => set({ touchMoveVector: vec }),
  setMoveTarget: (target) => set({ moveTarget: target }),

  updatePlayerPosition: (pos, distanceMoved) => {
    const state = get();
    if (distanceMoved <= 0.0001) {
      set({ character: { ...state.character, position: pos } });
      return;
    }
    const staminaCost = distanceMoved * 0.16;
    const nextCrew = state.crew.map((m) =>
      m.isPlayer ? { ...m, energy: clampFloat(m.energy - staminaCost) } : m
    );
    const nextEnergy = nextCrew.find((m) => m.isPlayer)?.energy ?? Math.max(0, state.character.energy - staminaCost);
    set({
      crew: nextCrew,
      character: {
        ...state.character,
        position: pos,
        energy: nextEnergy,
      },
    });
  },

  setNearbyInteractable: (station, pickupUid) => {
    const state = get();
    if (state.nearbyStation !== station || state.nearbyPickupUid !== pickupUid) {
      set({ nearbyStation: station, nearbyPickupUid: pickupUid });
    }
  },

  reinforceWaterBlock: () => {
    const state = get();
    if (state.waterBlocksReinforced >= 3) {
      set({
        toastMessage: 'All 3 Water Storage Bags are positioned along the Radiation Shelter wall!',
      });
      return;
    }
    const nextBlocks = state.waterBlocksReinforced + 1;
    const nextRad = clampFloat(state.resources.radiationProtection + 12);
    const nextCrew = state.crew.map((c) => ({ ...c, health: clampFloat(c.health + 4) }));
    playTone('success', state.savedProgress.muted);
    set({
      waterBlocksReinforced: nextBlocks,
      missionScore: state.missionScore + 150,
      resources: {
        ...state.resources,
        radiationProtection: nextRad,
      },
      crew: nextCrew,
      character: { ...state.character, health: nextCrew[0].health },
      systems: {
        ...state.systems,
        radiationShelter: nextBlocks >= 3 ? 'Operational' : state.systems.radiationShelter,
      },
      machineConditions: {
        ...state.machineConditions,
        radiationShelter: nextBlocks >= 3 ? 100 : clamp(state.machineConditions.radiationShelter + 15),
      },
      activeRadiationHazard: nextBlocks >= 3 ? false : state.activeRadiationHazard,
      stationPulse: {
        stationId: 'water-blocks',
        text: `+12% SHIELD (${nextBlocks}/3 WATER BAGS)`,
        color: '#37D6F4',
        ts: Date.now(),
      },
      toastMessage: `Water Storage Bag ${nextBlocks}/3 positioned! Radiation Shield +12%`,
      capcomMessage:
        nextBlocks >= 3
          ? 'Awesome job, Cadet! Water bags and structural walls are shielding the shelter!'
          : `Water bag ${nextBlocks} of 3 positioned! Add ${3 - nextBlocks} more for extra solar-storm shielding.`,
    });
  },

  harvestGreenhouse: () => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    if (state.greenhouseState.stage !== 'ready' && state.greenhouseState.growthProgress < 100) {
      playSound('error', { muted, volume });
      set({
        toastMessage: `Crops are still growing (${Math.round(state.greenhouseState.growthProgress)}%). Wait until 100% READY!`,
      });
      return;
    }

    const yieldUnits = 2;
    const now = Date.now();
    let nextInv = [...state.inventory];
    let nextShared = [...state.sharedFoodStorage];
    let nextPickups = [...state.worldPickups];

    const hasCropSlot = nextInv.some((i) => i.id === 'fresh-crop');
    let destText = 'Backpack';
    if (hasCropSlot || nextInv.length < INVENTORY_SLOT_LIMIT) {
      nextInv = addItemToList(nextInv, 'fresh-crop', yieldUnits);
    } else {
      const sharedUnits = nextShared.reduce((s, i) => s + i.quantity, 0);
      if (sharedUnits + yieldUnits <= SHARED_FOOD_CAPACITY) {
        nextShared = addItemToList(nextShared, 'fresh-crop', yieldUnits);
        destText = 'Shared Food Locker';
      } else {
        for (let k = 0; k < yieldUnits; k++) {
          nextPickups.push({
            uid: `drop-crop-${now}-${k}`,
            itemId: 'fresh-crop',
            label: 'Fresh Harvest',
            zone: 'interior',
            position: { x: 0.4 + k * 0.35, y: 0.4, z: -1.1 },
            collected: false,
          });
        }
        destText = 'Greenhouse Floor';
      }
    }

    const nextFoodPct = computeFoodPercentFromItems(nextShared, nextInv);
    playSound('item-pickup', { muted, volume });
    set({
      inventory: nextInv,
      sharedFoodStorage: nextShared,
      worldPickups: nextPickups,
      resources: {
        ...state.resources,
        food: nextFoodPct,
      },
      greenhouseState: {
        ...state.greenhouseState,
        growthProgress: 0,
        stage: 'growing',
        nutrients: clampFloat(state.greenhouseState.nutrients - 12, 35, 100),
        harvestedCycles: state.greenhouseState.harvestedCycles + 1,
      },
      actionAnim: {
        type: 'pickup',
        targetCrewId: 'player',
        stationId: 'greenhouse',
        itemId: 'fresh-crop',
        startedAt: now,
        endsAt: now + 1300,
      },
      missionScore: state.missionScore + 140,
      stationPulse: {
        stationId: 'greenhouse',
        text: `+${yieldUnits} FRESH HARVEST -> ${destText.toUpperCase()}`,
        color: '#37D67A',
        ts: now,
      },
      toastMessage: `Harvested +${yieldUnits} Fresh Harvest into ${destText}! Eat or store in Food Locker.`,
    });
  },

  drinkAtWaterDispenser: (crewId) => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    if (state.resources.water < 3) {
      playSound('error', { muted, volume });
      set({ toastMessage: 'Potable water tank too low (<3%)! Keep Water Recycler running.' });
      return;
    }
    const targetId = crewId || 'player';
    const nextCrew = state.crew.map((c) =>
      c.id === targetId ? { ...c, hydration: clampFloat(c.hydration + 28) } : c
    );
    const pCrew = nextCrew.find((c) => c.isPlayer) ?? nextCrew[0];
    const now = Date.now();
    playSound('drink-water', { muted, volume });
    set({
      resources: {
        ...state.resources,
        water: clampFloat(state.resources.water - 3.0),
      },
      crew: nextCrew,
      character: { ...state.character, hydration: pCrew.hydration },
      actionAnim: {
        type: 'drink',
        targetCrewId: targetId,
        stationId: 'water-dispenser',
        startedAt: now,
        endsAt: now + 1500,
      },
      stationPulse: {
        stationId: 'water-dispenser',
        text: '-3% TANK · +28% HYDRATION',
        color: '#37D6F4',
        ts: now,
      },
      toastMessage: `${nextCrew.find((c) => c.id === targetId)?.label || 'Astronaut'} drank purified water (-3% tank, +28% Hydration).`,
    });
  },

  eatCrewMeal: (crewId, opts) => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    const sourcePref = opts?.source ?? 'auto';
    const preferredItem = opts?.itemId;

    let nextInv = [...state.inventory];
    let nextShared = [...state.sharedFoodStorage];
    let consumedId: string | null = null;
    let consumedFrom = '';

    if (sourcePref === 'backpack') {
      consumedId = pickFoodItemId(nextInv, preferredItem);
      if (consumedId) {
        nextInv = removeItemFromList(nextInv, consumedId, 1);
        consumedFrom = 'Backpack';
      }
    } else if (sourcePref === 'storage') {
      consumedId = pickFoodItemId(nextShared, preferredItem);
      if (consumedId) {
        nextShared = removeItemFromList(nextShared, consumedId, 1);
        consumedFrom = 'Shared Food Locker';
      }
    } else {
      consumedId = pickFoodItemId(nextShared, preferredItem);
      if (consumedId) {
        nextShared = removeItemFromList(nextShared, consumedId, 1);
        consumedFrom = 'Shared Food Locker';
      } else {
        consumedId = pickFoodItemId(nextInv, preferredItem);
        if (consumedId) {
          nextInv = removeItemFromList(nextInv, consumedId, 1);
          consumedFrom = 'Backpack';
        }
      }
    }

    if (!consumedId) {
      playSound('error', { muted, volume });
      set({
        toastMessage:
          'No food items in Backpack or Shared Food Locker! Grow & harvest Greenhouse crops first.',
      });
      return;
    }

    const targetId = crewId || 'player';
    const nutGain = consumedId === 'fresh-crop' ? 28 : 24;
    const itemLabel = ITEM_BY_ID[consumedId]?.name || 'Food';
    // Eating updates NUTRITION only (stamina recovers gradually from nutrition + rest!)
    const nextCrew = state.crew.map((c) =>
      c.id === targetId ? { ...c, nutrition: clampFloat(c.nutrition + nutGain) } : c
    );
    const pCrew = nextCrew.find((c) => c.isPlayer) ?? nextCrew[0];
    const now = Date.now();
    const nextFoodPct = computeFoodPercentFromItems(nextShared, nextInv);

    playSound('eat-food', { muted, volume });
    set({
      inventory: nextInv,
      sharedFoodStorage: nextShared,
      resources: {
        ...state.resources,
        food: nextFoodPct,
      },
      crew: nextCrew,
      character: { ...state.character, nutrition: pCrew.nutrition },
      actionAnim: {
        type: 'eat',
        targetCrewId: targetId,
        stationId: 'food-cabinet',
        itemId: consumedId,
        startedAt: now,
        endsAt: now + 1500,
      },
      stationPulse: {
        stationId: 'food-cabinet',
        text: `ATE ${itemLabel.toUpperCase()} · +${nutGain}% NUTRITION`,
        color: '#37D67A',
        ts: now,
      },
      toastMessage: `${nextCrew.find((c) => c.id === targetId)?.label || 'Astronaut'} ate 1x ${itemLabel} from ${consumedFrom} (+${nutGain}% Nutrition).`,
    });
  },

  useToiletFacility: () => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    playSound('op-water', { muted, volume });
    // Liquid waste enters urineBuffer for Water Recycler; solid waste enters sealed separate containment!
    set({
      waterCycle: {
        ...state.waterCycle,
        urineBuffer: clampFloat(state.waterCycle.urineBuffer + 12),
        solidWasteLevel: clampFloat(state.waterCycle.solidWasteLevel + 8),
      },
      stationPulse: {
        stationId: 'toilet-facility',
        text: 'LIQUID -> RECYCLER · SOLID SEALED',
        color: '#37D6F4',
        ts: Date.now(),
      },
      toastMessage: 'Waste separated: Urine sent to Water Recycler line; Solid Waste sealed separately.',
    });
  },

  emptySolidWaste: () => {
    const state = get();
    playSound('success', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
    set({
      waterCycle: {
        ...state.waterCycle,
        solidWasteLevel: 0,
      },
      missionScore: state.missionScore + 50,
      toastMessage: 'Sealed Solid Waste canister transferred to exterior storage.',
    });
  },

  openMachineRepairPuzzle: (systemId, stationId) => {
    const state = get();
    const pId = puzzleForSystem(systemId);
    const matchingScenario =
      state.emergency && SCENARIO_BY_ID[state.emergency.scenarioId]?.affectedSystems.includes(systemId)
        ? state.emergency.scenarioId
        : undefined;

    playSound('click', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
    set({
      activeModal: null,
      activePuzzle: {
        id: pId,
        instanceSeed: makeSeed(),
        scenarioId: matchingScenario,
        stationId: stationId ?? stationForSystem(systemId),
        targetSystem: systemId,
      },
      puzzlePaused: false,
    });
  },

  maintainSystem: (systemId, useRepairKit = false) => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    if (useRepairKit) {
      const kitSlot = state.inventory.find((i) => i.id === 'repair-kit');
      if (!kitSlot || kitSlot.quantity < 1) {
        playSound('error', { muted, volume });
        set({ toastMessage: 'No Repair Kit in inventory! Solve the repair puzzle or assemble one.' });
        return;
      }
      const nextInv = removeItemFromList(state.inventory, 'repair-kit', 1);
      playSound('repair-tool', { muted, volume });
      playSound('repair-success', { muted, volume });
      const now = Date.now();
      const targetSt = stationForSystem(systemId);
      set({
        inventory: nextInv,
        systems: { ...state.systems, [systemId]: 'Operational' },
        machineConditions: {
          ...state.machineConditions,
          [systemId]: clamp(state.machineConditions[systemId] + 38),
        },
        repairAnim: {
          stationId: targetSt,
          startedAt: now,
          endsAt: now + 2200,
        },
        actionAnim: {
          type: 'repair',
          targetCrewId: 'player',
          stationId: targetSt,
          startedAt: now,
          endsAt: now + 2200,
        },
        missionScore: state.missionScore + 120,
        toastMessage: `Used Repair Kit: ${systemId} restored (+38% condition)!`,
      });
      return;
    }

    if (state.character.energy < 10) {
      playSound('error', { muted, volume });
      set({ toastMessage: 'Astronaut stamina too low (<10%)! Eat food & rest at Med Bay.' });
      return;
    }

    playSound('repair-tool', { muted, volume });
    playSound('repair-success', { muted, volume });
    const nextCond = clamp(state.machineConditions[systemId] + 18);
    const now = Date.now();
    const targetSt = stationForSystem(systemId);
    const nextCrew = state.crew.map((c) =>
      c.isPlayer ? { ...c, energy: clampFloat(c.energy - 8) } : c
    );
    set({
      crew: nextCrew,
      character: { ...state.character, energy: nextCrew[0].energy },
      machineConditions: { ...state.machineConditions, [systemId]: nextCond },
      systems: {
        ...state.systems,
        [systemId]:
          (state.systems[systemId] === 'Warning' || state.systems[systemId] === 'Repair Required') &&
          nextCond >= 70
            ? 'Operational'
            : state.systems[systemId],
      },
      repairAnim: {
        stationId: targetSt,
        startedAt: now,
        endsAt: now + 1800,
      },
      actionAnim: {
        type: 'repair',
        targetCrewId: 'player',
        stationId: targetSt,
        startedAt: now,
        endsAt: now + 1800,
      },
      missionScore: state.missionScore + 60,
      toastMessage: `Routine maintenance done! Condition is now ${nextCond}%.`,
    });
  },

  performQuickStationAction: (stationId) => {
    const state = get();
    const muted = state.savedProgress.muted;

    if (stationId === 'oxygen-generator') {
      if (state.systems.oxygenGenerator !== 'Operational') {
        get().openMachineRepairPuzzle('oxygenGenerator', stationId);
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'co2-scrubber') {
      if (state.systems.co2Scrubber !== 'Operational') {
        get().openMachineRepairPuzzle('co2Scrubber', stationId);
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'water-recycler') {
      if (state.systems.waterRecycler !== 'Operational') {
        get().openMachineRepairPuzzle('waterRecycler', stationId);
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'greenhouse') {
      if (state.systems.greenhouse !== 'Operational') {
        get().openMachineRepairPuzzle('greenhouse', stationId);
        return;
      }
      if (state.greenhouseState.stage === 'ready') {
        get().harvestGreenhouse();
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'solar-array') {
      if (state.systems.solarArray !== 'Operational') {
        get().openMachineRepairPuzzle('solarArray', stationId);
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'battery-system') {
      if (state.systems.batterySystem !== 'Operational') {
        get().openMachineRepairPuzzle('batterySystem', stationId);
        return;
      }
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'water-dispenser') {
      get().drinkAtWaterDispenser('player');
    } else if (stationId === 'toilet-facility') {
      playTone('click', muted);
      set({
        activeModal: 'station-inspect',
        inspectedStationId: stationId,
        manualContextStation: stationId,
      });
    } else if (stationId === 'water-blocks') {
      get().reinforceWaterBlock();
    } else if (stationId === 'crew-bunks') {
      get().restAtCrewBunk();
    } else if (stationId === 'radiation-shelter') {
      if (state.emergency?.active && state.emergency.scenarioId === 'moon-radiation-alert') {
        set({ activeModal: 'plan-decision' });
      } else {
        playTone('success', muted);
        const nextCrew = state.crew.map((c) => ({
          ...c,
          status: 'safe-shelter' as const,
          health: clampFloat(c.health + 6),
        }));
        set({
          crew: nextCrew,
          character: { ...state.character, health: nextCrew[0].health },
          stationPulse: { stationId, text: 'CREW SHELTERED', color: '#FFB84D', ts: Date.now() },
          toastMessage: 'All 4 astronauts moved inside structural Radiation Shelter!',
        });
      }
    } else if (stationId === 'manual-terminal') {
      get().openModal('manual', stationId);
    } else if (stationId === 'mission-control') {
      get().openModal('dashboard');
    } else if (stationId === 'food-cabinet') {
      get().openModal('station-inspect', 'food-cabinet');
    } else if (stationId === 'tool-cabinet') {
      get().openModal('inventory');
    }
  },

  interactWithNearby: () => {
    const state = get();
    if (state.missionStatus !== 'active' || state.viewMode === 'exterior') return;

    if (state.nearbyPickupUid) {
      const target = state.worldPickups.find(
        (w) => w.uid === state.nearbyPickupUid && !w.collected
      );
      if (target) {
        const existingIdx = state.inventory.findIndex((i) => i.id === target.itemId);
        if (existingIdx === -1 && state.inventory.length >= INVENTORY_SLOT_LIMIT) {
          playSound('error', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
          set({ toastMessage: 'Backpack full (12 slots). Use, drop, or store an item first.' });
          return;
        }
        const nextInv = addItemToList(state.inventory, target.itemId, 1);
        const nextPickups = state.worldPickups.map((w) =>
          w.uid === target.uid ? { ...w, collected: true } : w
        );
        const now = Date.now();
        playSound('item-pickup', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
        set({
          inventory: nextInv,
          worldPickups: nextPickups,
          resources: {
            ...state.resources,
            food: isFoodItem(target.itemId)
              ? computeFoodPercentFromItems(state.sharedFoodStorage, nextInv)
              : state.resources.food,
          },
          actionAnim: {
            type: 'pickup',
            targetCrewId: 'player',
            itemId: target.itemId,
            startedAt: now,
            endsAt: now + 900,
          },
          nearbyPickupUid: null,
          missionScore: state.missionScore + 50,
          toastMessage: `${target.label} picked up into Backpack!`,
        });
        return;
      }
    }

    const station = state.nearbyStation;
    if (!station) return;

    // Arcade machines, Water Dispenser, Toilet & Waste Bay, Food Locker, and Shelter open inspection modal on E
    if (
      station === 'oxygen-generator' ||
      station === 'co2-scrubber' ||
      station === 'water-recycler' ||
      station === 'greenhouse' ||
      station === 'solar-array' ||
      station === 'battery-system' ||
      station === 'water-dispenser' ||
      station === 'toilet-facility' ||
      station === 'food-cabinet' ||
      station === 'radiation-shelter'
    ) {
      get().openModal('station-inspect', station);
      return;
    }

    get().performQuickStationAction(station);
  },

  useInventoryItem: (itemId) => {
    const state = get();
    const slot = state.inventory.find((i) => i.id === itemId);
    if (!slot || slot.quantity <= 0) return;
    const def = ITEM_BY_ID[itemId];
    if (!def) return;

    // Food items route through eatCrewMeal so eating anim + nutrition + food reserve stay 100% consistent!
    if (isFoodItem(itemId)) {
      get().eatCrewMeal('player', { source: 'backpack', itemId });
      return;
    }

    const prevChar = state.character;
    const nextChar = { ...prevChar };
    const nextRes = { ...state.resources };
    let nextCrew = [...state.crew];
    let consumed = false;
    let msg = '';
    let soundToPlay: SoundId = 'item-pickup';
    let animType: 'drink' | 'pickup' | null = null;

    if (itemId === 'water-pack') {
      nextCrew = nextCrew.map((c) =>
        c.isPlayer ? { ...c, hydration: clampFloat(c.hydration + 25) } : c
      );
      nextChar.hydration = nextCrew[0].hydration;
      nextRes.water = clampFloat(nextRes.water + 6);
      consumed = true;
      soundToPlay = 'drink-water';
      animType = 'drink';
      msg = 'Drank Water Pack: Hydration +25% & Potable Water +6%!';
    } else if (itemId === 'medical-kit') {
      nextCrew = nextCrew.map((c) => ({ ...c, health: clampFloat(c.health + 20) }));
      nextChar.health = nextCrew[0].health;
      consumed = true;
      soundToPlay = 'success';
      msg = 'Used Medical Kit: All 4 Astronauts Health +20%!';
    } else if (itemId === 'emergency-oxygen') {
      nextRes.oxygen = clampFloat(nextRes.oxygen + 25);
      consumed = true;
      soundToPlay = 'op-oxygen';
      msg = 'Activated Emergency Oxygen Reserve: Oxygen +25%!';
    } else if (itemId === 'emergency-battery') {
      nextRes.battery = clampFloat(nextRes.battery + 25);
      consumed = true;
      soundToPlay = 'machine-on';
      msg = 'Activated Emergency Battery Module: Battery +25%!';
    } else if (itemId === 'radiation-panel') {
      nextRes.radiationProtection = clampFloat(nextRes.radiationProtection + 20);
      consumed = true;
      soundToPlay = 'success';
      msg = 'Deployed Consumable Radiation Liner: Storm Protection +20%!';
    } else {
      set({
        toastMessage: `${def.name} is used during machine repairs or component assembly.`,
      });
      return;
    }

    if (!consumed) return;

    const nextInv = removeItemFromList(state.inventory, itemId, 1);
    const now = Date.now();
    const nextHistory = [
      ...state.statusHistory,
      {
        step: state.statusHistory.length + 1,
        label: def.name.split(' ')[0],
        health: Math.round(nextChar.health),
        energy: Math.round(nextChar.energy),
        hydration: Math.round(nextChar.hydration),
      },
    ].slice(-10);

    playSound(soundToPlay, { muted: state.savedProgress.muted, volume: state.savedProgress.volume });

    set({
      inventory: nextInv,
      character: nextChar,
      crew: nextCrew,
      resources: nextRes,
      actionAnim: animType
        ? {
            type: animType,
            targetCrewId: 'player',
            itemId,
            startedAt: now,
            endsAt: now + 1400,
          }
        : state.actionAnim,
      characterTrends: {
        health: Math.round(nextChar.health - prevChar.health),
        energy: Math.round(nextChar.energy - prevChar.energy),
        hydration: Math.round(nextChar.hydration - prevChar.hydration),
      },
      statusHistory: nextHistory,
      toastMessage: msg,
    });
  },

  dropInventoryItem: (itemId) => {
    const state = get();
    const slot = state.inventory.find((i) => i.id === itemId);
    const def = ITEM_BY_ID[itemId];
    if (!slot || slot.quantity <= 0 || !def) return;

    const nextInv = removeItemFromList(state.inventory, itemId, 1);
    const now = Date.now();
    const jitterAngle = ((state.worldPickups.length * 1.7) % (Math.PI * 2));
    const dropX = Math.max(-4.2, Math.min(4.2, state.character.position.x + Math.cos(jitterAngle) * 0.55));
    const dropZ = Math.max(-1.9, Math.min(1.9, state.character.position.z + Math.sin(jitterAngle) * 0.55));

    const newPickup: WorldPickup = {
      uid: `drop-${now}-${Math.random().toString(36).slice(2, 6)}`,
      itemId,
      label: def.name,
      zone: 'interior',
      position: { x: dropX, y: 0.4, z: dropZ },
      collected: false,
    };

    playSound('item-drop', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
    set({
      inventory: nextInv,
      worldPickups: [...state.worldPickups, newPickup],
      resources: {
        ...state.resources,
        food: isFoodItem(itemId)
          ? computeFoodPercentFromItems(state.sharedFoodStorage, nextInv)
          : state.resources.food,
      },
      actionAnim: {
        type: 'drop',
        targetCrewId: 'player',
        itemId,
        startedAt: now,
        endsAt: now + 900,
      },
      toastMessage: `Dropped 1x ${def.name} on the habitat floor! Crewmates or you can pick it back up.`,
    });
  },

  depositFoodToSharedStorage: (itemId, qty = 1) => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    if (!isLockerStorable(itemId)) {
      playSound('error', { muted, volume });
      set({ toastMessage: 'Only Food & Drinking Packs can be stored in the Shared Food Locker.' });
      return;
    }
    const held = state.inventory.find((i) => i.id === itemId)?.quantity ?? 0;
    const moveQty = Math.min(qty, held);
    if (moveQty <= 0) return;

    const storedTotal = state.sharedFoodStorage.reduce((s, i) => s + i.quantity, 0);
    if (storedTotal + moveQty > SHARED_FOOD_CAPACITY) {
      playSound('error', { muted, volume });
      set({ toastMessage: `Shared Food Locker full (${SHARED_FOOD_CAPACITY} items max).` });
      return;
    }

    const nextInv = removeItemFromList(state.inventory, itemId, moveQty);
    const nextShared = addItemToList(state.sharedFoodStorage, itemId, moveQty);
    const defName = ITEM_BY_ID[itemId]?.name || itemId;
    playSound('item-pickup', { muted, volume });
    set({
      inventory: nextInv,
      sharedFoodStorage: nextShared,
      resources: {
        ...state.resources,
        food: computeFoodPercentFromItems(nextShared, nextInv),
      },
      toastMessage: `Stored ${moveQty}x ${defName} into Shared Food Locker!`,
    });
  },

  withdrawFoodFromSharedStorage: (itemId, qty = 1) => {
    const state = get();
    const { muted, volume } = state.savedProgress;
    const storedQty = state.sharedFoodStorage.find((i) => i.id === itemId)?.quantity ?? 0;
    const moveQty = Math.min(qty, storedQty);
    if (moveQty <= 0) return;

    const hasSlot = state.inventory.some((i) => i.id === itemId);
    if (!hasSlot && state.inventory.length >= INVENTORY_SLOT_LIMIT) {
      playSound('error', { muted, volume });
      set({ toastMessage: 'Backpack full (12 slots). Use or drop an item first.' });
      return;
    }

    const nextShared = removeItemFromList(state.sharedFoodStorage, itemId, moveQty);
    const nextInv = addItemToList(state.inventory, itemId, moveQty);
    const defName = ITEM_BY_ID[itemId]?.name || itemId;
    playSound('item-pickup', { muted, volume });
    set({
      inventory: nextInv,
      sharedFoodStorage: nextShared,
      resources: {
        ...state.resources,
        food: computeFoodPercentFromItems(nextShared, nextInv),
      },
      toastMessage: `Moved ${moveQty}x ${defName} to your Backpack!`,
    });
  },

  crewCollectDroppedFood: (pickupUid, crewId) => {
    const state = get();
    const pickup = state.worldPickups.find((w) => w.uid === pickupUid && !w.collected);
    if (!pickup || !isFoodItem(pickup.itemId)) return;

    const member = state.crew.find((c) => c.id === crewId && !c.isPlayer);
    if (!member) return;

    const nextPickups = state.worldPickups.map((w) =>
      w.uid === pickupUid ? { ...w, collected: true } : w
    );
    const now = Date.now();
    const { muted, volume } = state.savedProgress;

    if (member.nutrition < 78) {
      const nutGain = pickup.itemId === 'fresh-crop' ? 28 : 24;
      const nextCrew = state.crew.map((c) =>
        c.id === crewId ? { ...c, nutrition: clampFloat(c.nutrition + nutGain) } : c
      );
      playSound('eat-food', { muted, volume });
      set({
        worldPickups: nextPickups,
        crew: nextCrew,
        actionAnim: {
          type: 'eat',
          targetCrewId: crewId,
          itemId: pickup.itemId,
          startedAt: now,
          endsAt: now + 1500,
        },
        toastMessage: `${member.label} picked up and ate ${pickup.label} (+${nutGain}% Nutrition)!`,
      });
    } else {
      const nextShared = addItemToList(state.sharedFoodStorage, pickup.itemId, 1);
      playSound('item-pickup', { muted, volume });
      set({
        worldPickups: nextPickups,
        sharedFoodStorage: nextShared,
        resources: {
          ...state.resources,
          food: computeFoodPercentFromItems(nextShared, state.inventory),
        },
        toastMessage: `${member.label} picked up ${pickup.label} and stored it in the Food Locker!`,
      });
    }
  },

  craftAssemblyRecipe: (recipeId) => {
    const state = get();
    const recipe = ASSEMBLY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;

    for (const ing of recipe.ingredients) {
      const held = state.inventory.find((i) => i.id === ing.itemId)?.quantity ?? 0;
      if (held < ing.qty) {
        playTone('error', state.savedProgress.muted);
        set({ toastMessage: `Missing components to assemble ${recipe.outputName}!` });
        return;
      }
    }

    let nextInv = [...state.inventory];
    for (const ing of recipe.ingredients) {
      nextInv = nextInv
        .map((i) => (i.id === ing.itemId ? { ...i, quantity: i.quantity - ing.qty } : i))
        .filter((i) => i.quantity > 0);
    }

    const outIdx = nextInv.findIndex((i) => i.id === recipe.outputItemId);
    if (outIdx >= 0) {
      nextInv[outIdx] = { ...nextInv[outIdx], quantity: nextInv[outIdx].quantity + 1 };
    } else {
      nextInv.push({ id: recipe.outputItemId, quantity: 1 });
    }

    playTone('success', state.savedProgress.muted);
    set({
      inventory: nextInv,
      missionScore: state.missionScore + 100,
      toastMessage: `Assembled 1x ${recipe.outputName}! Ready for mission repairs.`,
    });
  },

  restAtCrewBunk: () => {
    const state = get();
    const prevChar = state.character;
    const nextCrew = state.crew.map((c) => {
      const staminaGain = c.nutrition >= 25 ? 18 : 6;
      return {
        ...c,
        energy: clampFloat(c.energy + staminaGain),
        health: clampFloat(c.health + 10),
      };
    });
    const nextChar = {
      ...prevChar,
      energy: nextCrew[0].energy,
      health: nextCrew[0].health,
    };
    const nextHistory = [
      ...state.statusHistory,
      {
        step: state.statusHistory.length + 1,
        label: 'Rest',
        health: Math.round(nextChar.health),
        energy: Math.round(nextChar.energy),
        hydration: Math.round(nextChar.hydration),
      },
    ].slice(-10);

    playTone('success', state.savedProgress.muted);

    set({
      character: nextChar,
      crew: nextCrew,
      characterTrends: {
        health: Math.round(nextChar.health - prevChar.health),
        energy: Math.round(nextChar.energy - prevChar.energy),
        hydration: 0,
      },
      statusHistory: nextHistory,
      stationPulse: { stationId: 'crew-bunks', text: '+18 STAMINA · +10 HP', color: '#37D67A', ts: Date.now() },
      toastMessage: 'Crew rested at Med & Rest Bay! Stamina and Health recovered.',
    });
  },

  toggleSystemPower: (key) => {
    const state = get();
    const nextVal = !state.toggles[key];
    playSound(nextVal ? 'machine-on' : 'machine-off', {
      muted: state.savedProgress.muted,
      volume: state.savedProgress.volume,
    });
    const nextToggles = { ...state.toggles, [key]: nextVal };
    const nextState = { ...state, toggles: nextToggles };
    set({
      toggles: nextToggles,
      liveTrends: syncTrendsFromPreview(nextState),
      toastMessage: `${key.replace(/([A-Z])/g, ' $1').trim()} switched ${nextVal ? 'ON' : 'OFF'}.`,
    });
  },

  setCrewTask: (crewId, task) => {
    const state = get();
    playTone('click', state.savedProgress.muted);
    set({
      crew: state.crew.map((c) => (c.id === crewId ? { ...c, assignedTask: task } : c)),
      toastMessage: `Crew assignment updated to ${task.toUpperCase()}!`,
    });
  },

  runResearchPulse: () => {
    const state = get();
    const muted = state.savedProgress.muted;
    if (!state.toggles.researchSystems) {
      playTone('error', muted);
      set({ toastMessage: 'Switch Research Equipment ON first!' });
      return;
    }
    if (state.resources.battery < 5 || state.character.energy < 10) {
      playTone('error', muted);
      set({ toastMessage: 'Need >=5% Battery and >=10% Astronaut Stamina to scan science data!' });
      return;
    }
    const nextProgress = clamp(state.objectives.researchProgress + 20);
    const nextCrew = state.crew.map((c) =>
      c.isPlayer ? { ...c, energy: clampFloat(c.energy - 8) } : c
    );
    playTone('success', muted);
    set({
      resources: { ...state.resources, battery: clampFloat(state.resources.battery - 5) },
      crew: nextCrew,
      character: { ...state.character, energy: nextCrew[0].energy },
      objectives: {
        ...state.objectives,
        researchProgress: nextProgress,
        researchCompleted: nextProgress >= 100,
      },
      missionScore: state.missionScore + 120,
      toastMessage:
        nextProgress >= 100
          ? 'Research Objective 100% Complete! Amazing science, Cadet!'
          : `Research data uploaded! Progress: ${nextProgress}%`,
    });
  },

  chooseEmergencyPlan: (planId) => {
    const state = get();
    if (!state.emergency) return;
    const scenario = SCENARIO_BY_ID[state.emergency.scenarioId];
    if (!scenario) return;
    const plan = scenario.plans[planId];

    if (plan.requiredItemId) {
      const invItem = state.inventory.find((i) => i.id === plan.requiredItemId);
      const reqQty = plan.requiredItemQty ?? 1;
      if (!invItem || invItem.quantity < reqQty) {
        playTone('error', state.savedProgress.muted);
        const itemName = ITEM_BY_ID[plan.requiredItemId]?.name || plan.requiredItemId;
        set({
          toastMessage: `Missing ${itemName}! Choose Plan B, Plan C, or assemble one in your Bag.`,
        });
        return;
      }
    }

    let nextInv = [...state.inventory];
    if (plan.requiredItemId) {
      const reqQty = plan.requiredItemQty ?? 1;
      nextInv = nextInv
        .map((i) =>
          i.id === plan.requiredItemId ? { ...i, quantity: i.quantity - reqQty } : i
        )
        .filter((i) => i.quantity > 0);
    }

    if (plan.requiresPuzzle) {
      playTone('click', state.savedProgress.muted);
      set({
        inventory: nextInv,
        emergency: { ...state.emergency, selectedPlan: planId },
        activeModal: null,
        activePuzzle: {
          id: plan.requiresPuzzle,
          instanceSeed: makeSeed(),
          scenarioId: scenario.id,
          stationId: stationForSystem(scenario.affectedSystems[0]),
          targetSystem: scenario.affectedSystems[0],
        },
        puzzlePaused: false,
      });
      return;
    }

    const nextRes = { ...state.resources };
    if (plan.resourceDelta.oxygen) nextRes.oxygen = clampFloat(nextRes.oxygen + plan.resourceDelta.oxygen);
    if (plan.resourceDelta.water) nextRes.water = clampFloat(nextRes.water + plan.resourceDelta.water);
    if (plan.resourceDelta.battery) nextRes.battery = clampFloat(nextRes.battery + plan.resourceDelta.battery);
    if (plan.resourceDelta.food) nextRes.food = clampFloat(nextRes.food + plan.resourceDelta.food);
    if (plan.resourceDelta.co2) nextRes.co2 = clampFloat(nextRes.co2 + plan.resourceDelta.co2);
    if (plan.resourceDelta.habitatPressure)
      nextRes.habitatPressure = clampFloat(nextRes.habitatPressure + plan.resourceDelta.habitatPressure);
    if (plan.resourceDelta.temperatureSafety)
      nextRes.temperatureSafety = clampFloat(nextRes.temperatureSafety + plan.resourceDelta.temperatureSafety);
    if (plan.resourceDelta.radiationProtection)
      nextRes.radiationProtection = clampFloat(
        nextRes.radiationProtection + plan.resourceDelta.radiationProtection
      );

    const nextSystems = { ...state.systems };
    const nextConditions = { ...state.machineConditions };
    if (plan.restoresSystem) {
      nextSystems[plan.restoresSystem] = 'Operational';
      nextConditions[plan.restoresSystem] = Math.max(nextConditions[plan.restoresSystem], 88);
    }
    for (const sys of scenario.affectedSystems) {
      if (planId === 'A' || planId === 'B') {
        nextSystems[sys] = 'Operational';
        nextConditions[sys] = Math.max(nextConditions[sys], 84);
      } else {
        nextSystems[sys] = nextSystems[sys] === 'Repair Required' ? 'Warning' : nextSystems[sys];
      }
    }

    const nextToggles = { ...state.toggles };
    if (plan.requiresLowPower || planId === 'C') {
      nextToggles.greenhouse = false;
      nextToggles.researchSystems = false;
    }
    if (scenario.id === 'mars-dust-storm' && planId === 'B') {
      nextToggles.researchSystems = false;
    }

    const nextCrew = plan.activatesShelter
      ? state.crew.map((c) => ({ ...c, status: 'safe-shelter' as const, health: clampFloat(c.health + 8) }))
      : state.crew;

    const pointsAwarded = planId === 'A' ? 350 : planId === 'B' ? 280 : 200;
    playSound('emergency-resolved', {
      muted: state.savedProgress.muted,
      volume: state.savedProgress.volume,
    });

    set({
      inventory: nextInv,
      resources: nextRes,
      character: { ...state.character, health: nextCrew[0].health },
      systems: nextSystems,
      machineConditions: nextConditions,
      toggles: nextToggles,
      crew: nextCrew,
      dustStormDaysRemaining:
        scenario.id === 'mars-dust-storm' && planId === 'A' ? 0 : state.dustStormDaysRemaining,
      activeLeak: scenario.id === 'habitat-pressure-leak' ? false : state.activeLeak,
      activeRadiationHazard:
        scenario.id === 'moon-radiation-alert' ? false : state.activeRadiationHazard,
      emergency: null,
      activeModal: null,
      completedScenarios: [...state.completedScenarios, scenario.id],
      selectedPlansLog: [
        ...state.selectedPlansLog,
        {
          sol: state.sol,
          scenarioId: scenario.id,
          title: scenario.title,
          plan: planId,
          severity: state.emergency.severity,
        },
      ],
      missionScore: state.missionScore + pointsAwarded,
      capcomMessage: scenario.capcomSuccess,
      toastMessage: `${plan.title} complete! (+${pointsAwarded} PTS)`,
    });
  },

  completePuzzle: (success) => {
    const state = get();
    const puzzle = state.activePuzzle;
    if (!puzzle) return;

    if (!success) {
      playSound('error', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
      set({
        capcomMessage: 'Good try, Cadet! Check the hint or Repair Manual (M) and try again — the mission stays safe!',
      });
      return;
    }

    playSound('repair-tool', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });
    playSound('repair-success', { muted: state.savedProgress.muted, volume: state.savedProgress.volume });

    if (puzzle.standalonePractice) {
      set({
        activePuzzle: null,
        puzzlesCompletedCount: state.puzzlesCompletedCount + 1,
        missionScore: state.missionScore + 200,
        toastMessage: 'Academy Training Simulation passed! (+200 PTS)',
      });
      return;
    }

    const scenarioId = puzzle.scenarioId || state.emergency?.scenarioId;
    const scenario = scenarioId ? SCENARIO_BY_ID[scenarioId] : undefined;
    const planId = state.emergency?.selectedPlan || 'A';
    const plan = scenario?.plans[planId];

    const nextRes = { ...state.resources };
    if (plan?.resourceDelta) {
      if (plan.resourceDelta.oxygen) nextRes.oxygen = clampFloat(nextRes.oxygen + plan.resourceDelta.oxygen);
      if (plan.resourceDelta.water) nextRes.water = clampFloat(nextRes.water + plan.resourceDelta.water);
      if (plan.resourceDelta.battery) nextRes.battery = clampFloat(nextRes.battery + plan.resourceDelta.battery);
      if (plan.resourceDelta.co2) nextRes.co2 = clampFloat(nextRes.co2 + plan.resourceDelta.co2);
      if (plan.resourceDelta.habitatPressure)
        nextRes.habitatPressure = clampFloat(nextRes.habitatPressure + plan.resourceDelta.habitatPressure);
      if (plan.resourceDelta.temperatureSafety)
        nextRes.temperatureSafety = clampFloat(nextRes.temperatureSafety + plan.resourceDelta.temperatureSafety);
    }

    const nextSystems = { ...state.systems };
    const nextConditions = { ...state.machineConditions };
    if (puzzle.targetSystem) {
      nextSystems[puzzle.targetSystem] = 'Operational';
      nextConditions[puzzle.targetSystem] = Math.max(nextConditions[puzzle.targetSystem], 94);
    }
    if (scenario) {
      for (const s of scenario.affectedSystems) {
        nextSystems[s] = 'Operational';
        nextConditions[s] = Math.max(nextConditions[s], 92);
      }
    } else if (puzzle.id === 'circuit-reconnect' && !puzzle.targetSystem) {
      nextSystems.oxygenGenerator = 'Operational';
      nextSystems.solarArray = 'Operational';
      nextSystems.batterySystem = 'Operational';
      nextSystems.temperatureControl = 'Operational';
      nextConditions.oxygenGenerator = 95;
      nextConditions.solarArray = 95;
      nextConditions.batterySystem = 95;
      nextConditions.temperatureControl = 95;
    } else if (puzzle.id === 'co2-filter-adapter' && !puzzle.targetSystem) {
      nextSystems.co2Scrubber = 'Operational';
      nextConditions.co2Scrubber = 95;
    } else if (puzzle.id === 'hull-patch' && !puzzle.targetSystem) {
      nextSystems.pressureSystem = 'Operational';
      nextSystems.waterRecycler = 'Operational';
      nextConditions.pressureSystem = 95;
      nextConditions.waterRecycler = 95;
    }

    const now = Date.now();
    const animStation: StationId =
      puzzle.stationId ??
      (puzzle.targetSystem ? stationForSystem(puzzle.targetSystem) : 'mission-control');

    if (scenario && state.emergency?.scenarioId === scenario.id) {
      playSound('emergency-resolved', {
        muted: state.savedProgress.muted,
        volume: state.savedProgress.volume,
      });
    }

    set({
      activePuzzle: null,
      puzzlePaused: false,
      resources: nextRes,
      systems: nextSystems,
      machineConditions: nextConditions,
      repairAnim: {
        stationId: animStation,
        startedAt: now,
        endsAt: now + 2400,
      },
      actionAnim: {
        type: 'repair',
        targetCrewId: 'player',
        stationId: animStation,
        startedAt: now,
        endsAt: now + 2400,
      },
      dustStormDaysRemaining:
        scenario?.id === 'mars-dust-storm' ? 0 : state.dustStormDaysRemaining,
      activeLeak: scenario?.id === 'habitat-pressure-leak' ? false : state.activeLeak,
      emergency: scenario && state.emergency?.scenarioId === scenario.id ? null : state.emergency,
      puzzlesCompletedCount: state.puzzlesCompletedCount + 1,
      completedScenarios:
        scenario && !state.completedScenarios.includes(scenario.id)
          ? [...state.completedScenarios, scenario.id]
          : state.completedScenarios,
      selectedPlansLog: scenario
        ? [
            ...state.selectedPlansLog,
            {
              sol: state.sol,
              scenarioId: scenario.id,
              title: scenario.title,
              plan: planId,
              severity: state.emergency?.severity || 'moderate',
            },
          ]
        : state.selectedPlansLog,
      missionScore: state.missionScore + 400,
      capcomMessage:
        scenario?.capcomSuccess || 'Repair puzzle completed! Watch your astronaut lock the hardware back online.',
      toastMessage: 'Repair Complete! Astronaut restoring machine (+400 PTS)',
    });
  },

  closePuzzle: () => set({ activePuzzle: null, puzzlePaused: false }),

  openEndDayReport: () => {
    playTone('click', get().savedProgress.muted);
    set({ activeModal: 'end-day-report' });
  },

  endMissionDay: () => {
    const state = get();
    if (state.missionStatus !== 'active') return;

    // Advance only the remaining fraction of the current Sol so continuous math never double-charges!
    const remainingFracSec = Math.max(2, SOL_DURATION_SECONDS - state.solElapsedSeconds);
    const result = stepContinuousSimulation(
      {
        destination: state.destination,
        difficulty: state.difficulty,
        resources: state.resources,
        character: state.character,
        crew: state.crew,
        toggles: state.toggles,
        systems: state.systems,
        machineConditions: state.machineConditions,
        greenhouseState: state.greenhouseState,
        waterCycle: state.waterCycle,
        safety: state.safety,
        dustStormDaysRemaining: state.dustStormDaysRemaining,
        activeLeak: state.activeLeak,
        activeRadiationHazard: state.activeRadiationHazard,
        emergency: state.emergency,
      },
      remainingFracSec
    );

    const nextResearch = clamp(state.objectives.researchProgress + result.researchGain);
    const nextSol = state.sol + 1;
    const nextDust = Math.max(0, state.dustStormDaysRemaining - 1);

    const nextHistory = [
      ...state.statusHistory,
      {
        step: state.statusHistory.length + 1,
        label: `Sol ${Math.min(nextSol, state.maxSols)}`,
        health: Math.round(result.nextCharacter.health),
        energy: Math.round(result.nextCharacter.energy),
        hydration: Math.round(result.nextCharacter.hydration),
      },
    ].slice(-10);

    // Stage 3 Failure -> Earth Rescue Rocket Cinematic!
    if (result.nextSafety.stage === 'failure') {
      playTone('alert', state.savedProgress.muted);
      const evalObj = evaluateObjectives({
        systems: result.nextSystems,
        machineConditions: result.nextMachineConditions,
        resources: result.nextResources,
        researchProgress: nextResearch,
        sol: state.sol,
        maxSols: state.maxSols,
        safetyProtocolActivated: true,
      });
      set({
        resources: result.nextResources,
        character: result.nextCharacter,
        crew: result.nextCrew,
        toggles: result.nextToggles,
        systems: result.nextSystems,
        machineConditions: result.nextMachineConditions,
        greenhouseState: result.nextGreenhouse,
        waterCycle: result.nextWaterCycle,
        safety: result.nextSafety,
        objectives: evalObj,
        missionOutcome: 'safety-protocol',
        safetyReason: result.nextSafety.reason,
        statusHistory: nextHistory,
        activeModal: null,
        activePuzzle: null,
        missionStatus: 'rescue-cinematic',
        capcomMessage:
          result.nextSafety.reason ||
          'Stage 3 Safety Protocol: Crew secured and Earth Rescue launched!',
      });
      return;
    }

    // End of Day 10 Completion (Victory vs Partial Result)
    if (state.sol >= state.maxSols) {
      const evalObj = evaluateObjectives({
        systems: result.nextSystems,
        machineConditions: result.nextMachineConditions,
        resources: result.nextResources,
        researchProgress: nextResearch,
        sol: state.maxSols,
        maxSols: state.maxSols,
        safetyProtocolActivated: false,
      });
      const outcome = determineMissionOutcome(evalObj, false);

      const breakdown = computeMissionScore({
        crew: result.nextCrew,
        resources: result.nextResources,
        systems: result.nextSystems,
        emergenciesResolved: state.completedScenarios.length,
        puzzlesCompleted: state.puzzlesCompletedCount,
        researchProgress: nextResearch,
        safetyProtocolActivated: false,
      });
      const finalScore = state.missionScore + breakdown.total * 20;

      const earnedBadges = new Set(state.savedProgress.unlockedAchievements);
      earnedBadges.add('Mission Survivor');
      if (outcome === 'victory') earnedBadges.add('10-Sol Commander');
      if (state.puzzlesCompletedCount >= 1) earnedBadges.add('Emergency Engineer');
      if (state.waterBlocksReinforced >= 3) earnedBadges.add('Radiation Guardian');
      if (breakdown.resourceEfficiency >= 15) earnedBadges.add('Smart Resource Manager');

      const updatedProgress: SavedProgress = {
        ...state.savedProgress,
        bestScore: Math.max(state.savedProgress.bestScore, finalScore),
        completedMissions: state.savedProgress.completedMissions + 1,
        unlockedAchievements: Array.from(earnedBadges),
      };
      saveProgressToStorage(updatedProgress);
      clearSavedMissionSnapshot();
      playTone('success', state.savedProgress.muted);

      set({
        savedMission: null,
        resources: result.nextResources,
        character: result.nextCharacter,
        crew: result.nextCrew,
        toggles: result.nextToggles,
        systems: result.nextSystems,
        machineConditions: result.nextMachineConditions,
        greenhouseState: result.nextGreenhouse,
        waterCycle: result.nextWaterCycle,
        safety: result.nextSafety,
        objectives: evalObj,
        missionOutcome: outcome,
        statusHistory: nextHistory,
        missionScore: finalScore,
        savedProgress: updatedProgress,
        activeModal: null,
        missionStatus: 'success',
        capcomMessage:
          outcome === 'victory'
            ? 'VICTORY! All 3 mission objectives completed across 10 Sols with your crew safe!'
            : 'Crew survived 10 Sols! Review incomplete objectives in the Debrief for full Victory next run.',
      });
      return;
    }

    // Advance to nextSol: escalate ignored emergency OR trigger dynamically scheduled Sol event
    let nextEmergency = state.emergency;
    let nextSystems = { ...result.nextSystems };
    let nextConditions = { ...result.nextMachineConditions };
    let nextDustDays = nextDust;
    let nextActiveLeak = state.activeLeak;
    let nextRadHazard = state.activeRadiationHazard;
    let nextCapcom =
      result.autoPausedNotes[0] ||
      `Sol ${nextSol} underway! Keep machines maintained and watch crop harvest status.`;
    const nextLog = [...state.eventLog];

    if (nextEmergency && nextEmergency.active) {
      const nextDaysActive = nextEmergency.daysActive + 1;
      const escalatedSeverity =
        nextEmergency.severity === 'minor' ? 'moderate' : 'severe';
      nextEmergency = {
        ...nextEmergency,
        daysActive: nextDaysActive,
        severity: escalatedSeverity,
        warningStage: 'escalated',
        countdownSeconds: 20,
      };
      nextCapcom = `ESCALATION ALERT! Ignored ${SCENARIO_BY_ID[nextEmergency.scenarioId]?.shortLabel || 'emergency'} grew worse (${escalatedSeverity.toUpperCase()})! Fix it now!`;
      playTone('alert', state.savedProgress.muted);
    } else {
      const scheduled = state.eventTimeline[nextSol];
      if (scheduled) {
        const triggered = triggerEventFromSpec(
          scheduled,
          nextSystems,
          nextConditions,
          state.destination
        );
        nextEmergency = triggered.emergency;
        nextSystems = triggered.nextSystems;
        nextConditions = triggered.nextConditions;
        nextDustDays = Math.max(nextDustDays, triggered.dustDays);
        nextActiveLeak = nextActiveLeak || triggered.leak;
        nextRadHazard = nextRadHazard || triggered.radHazard;
        nextCapcom = triggered.capcom;
        nextLog.push({
          id: `evt-sol-${nextSol}-${Date.now()}`,
          sol: nextSol,
          title: SCENARIO_BY_ID[scheduled.scenarioId].title,
          detail: `${scheduled.severity.toUpperCase()} event: ${SCENARIO_BY_ID[scheduled.scenarioId].introStory}`,
          severity: scheduled.severity === 'severe' ? 'critical' : 'warning',
        });
        const evSound: SoundId =
          scheduled.scenarioId === 'solar-power-reduction' || scheduled.scenarioId === 'mars-dust-storm'
            ? 'warn-solar-damage'
            : scheduled.scenarioId === 'moon-radiation-alert'
              ? 'warn-radiation'
              : scheduled.scenarioId === 'habitat-pressure-leak'
                ? 'warn-o2-leak'
                : 'warn-machine-fail';
        playSound(evSound, {
          muted: state.savedProgress.muted,
          volume: state.savedProgress.volume,
        });
      }
    }

    const nextForecast = getForecastForNextSol(nextSol, state.maxSols, state.eventTimeline);
    const nextObj = evaluateObjectives({
      systems: nextSystems,
      machineConditions: nextConditions,
      resources: result.nextResources,
      researchProgress: nextResearch,
      sol: nextSol,
      maxSols: state.maxSols,
      safetyProtocolActivated: false,
    });

    const previewAfter = syncTrendsFromPreview({
      ...state,
      resources: result.nextResources,
      toggles: result.nextToggles,
      systems: nextSystems,
      machineConditions: nextConditions,
      greenhouseState: result.nextGreenhouse,
      waterCycle: result.nextWaterCycle,
      dustStormDaysRemaining: nextDustDays,
      activeLeak: nextActiveLeak,
      activeRadiationHazard: nextRadHazard,
      emergency: nextEmergency,
    });

    set({
      sol: nextSol,
      solElapsedSeconds: 0,
      resources: result.nextResources,
      character: result.nextCharacter,
      crew: result.nextCrew,
      toggles: result.nextToggles,
      systems: nextSystems,
      machineConditions: nextConditions,
      greenhouseState: result.nextGreenhouse,
      waterCycle: result.nextWaterCycle,
      safety: result.nextSafety,
      dustStormDaysRemaining: nextDustDays,
      activeLeak: nextActiveLeak,
      activeRadiationHazard: nextRadHazard,
      statusHistory: nextHistory,
      emergency: nextEmergency,
      forecast: nextForecast,
      objectives: nextObj,
      liveTrends: previewAfter,
      eventLog: nextLog,
      activeModal: null,
      missionScore: state.missionScore + 250,
      capcomMessage: nextCapcom,
      toastMessage: result.autoPausedNotes[0] || `Sol ${nextSol}/${state.maxSols} started!`,
    });
  },

  /**
   * Authoritative continuous simulation loop (1s interval).
   * Runs continuously during active gameplay — NEVER paused when walking, exploring,
   * inspecting exterior 360° view, or checking machine panels!
   * Only paused when game is paused/settings modal or outside active mission.
   */
  tickContinuousSimulation: (dtSec = 1) => {
    const state = get();
    if (
      state.missionStatus !== 'active' ||
      state.activeModal === 'pause' ||
      state.activeModal === 'settings' ||
      state.activeModal === 'exit-confirm'
    ) {
      return;
    }

    const nowMs = Date.now();
    const nextElapsed = state.missionElapsedSeconds + dtSec;
    const nextSolElapsed = state.solElapsedSeconds + dtSec;

    // Clear expired physical repair/action animations cleanly
    const nextRepairAnim =
      state.repairAnim && nowMs >= state.repairAnim.endsAt ? null : state.repairAnim;
    const nextActionAnim =
      state.actionAnim && nowMs >= state.actionAnim.endsAt ? null : state.actionAnim;

    const sim = stepContinuousSimulation(
      {
        destination: state.destination,
        difficulty: state.difficulty,
        resources: state.resources,
        character: state.character,
        crew: state.crew,
        toggles: state.toggles,
        systems: state.systems,
        machineConditions: state.machineConditions,
        greenhouseState: state.greenhouseState,
        waterCycle: state.waterCycle,
        safety: state.safety,
        dustStormDaysRemaining: state.dustStormDaysRemaining,
        activeLeak: state.activeLeak,
        activeRadiationHazard: state.activeRadiationHazard,
        emergency: state.emergency,
      },
      dtSec
    );

    // Sync continuous crew food usage against real stored food items (no infinite phantom food!)
    let nextSharedFood = [...state.sharedFoodStorage];
    let nextInv = [...state.inventory];
    const totalFoodUnits = countFoodItems(nextSharedFood) + countFoodItems(nextInv);
    if (totalFoodUnits === 0) {
      sim.nextResources.food = 0;
    } else if (sim.nextResources.food <= (totalFoodUnits - 1) * 10) {
      const targetId = pickFoodItemId(nextSharedFood) || pickFoodItemId(nextInv);
      if (targetId) {
        if (pickFoodItemId(nextSharedFood, targetId)) {
          nextSharedFood = removeItemFromList(nextSharedFood, targetId, 1);
        } else {
          nextInv = removeItemFromList(nextInv, targetId, 1);
        }
      }
      if (countFoodItems(nextSharedFood) + countFoodItems(nextInv) === 0) {
        sim.nextResources.food = 0;
      }
    }

    const nextResearch = clampFloat(state.objectives.researchProgress + sim.researchGain);

    let nextEmergency = state.emergency;
    if (nextEmergency && nextEmergency.active && nextEmergency.countdownSeconds > 0) {
      nextEmergency = {
        ...nextEmergency,
        countdownSeconds: Math.max(0, nextEmergency.countdownSeconds - dtSec),
      };
    }

    const { muted, volume } = state.savedProgress;

    // Stage 3 Mission Failure -> Safe State -> Earth Emergency Rescue Rocket Cinematic!
    if (sim.nextSafety.stage === 'failure') {
      syncAmbience(false);
      playSound('alarm-critical', { muted, volume, bypassCooldown: true });
      const evalObj = evaluateObjectives({
        systems: sim.nextSystems,
        machineConditions: sim.nextMachineConditions,
        resources: sim.nextResources,
        researchProgress: nextResearch,
        sol: state.sol,
        maxSols: state.maxSols,
        safetyProtocolActivated: true,
      });
      clearSavedMissionSnapshot();
      set({
        savedMission: null,
        missionElapsedSeconds: nextElapsed,
        solElapsedSeconds: nextSolElapsed,
        resources: sim.nextResources,
        character: sim.nextCharacter,
        crew: sim.nextCrew,
        inventory: nextInv,
        sharedFoodStorage: nextSharedFood,
        toggles: sim.nextToggles,
        systems: sim.nextSystems,
        machineConditions: sim.nextMachineConditions,
        greenhouseState: sim.nextGreenhouse,
        waterCycle: sim.nextWaterCycle,
        safety: sim.nextSafety,
        repairAnim: null,
        actionAnim: null,
        objectives: evalObj,
        missionOutcome: 'safety-protocol',
        safetyReason: sim.nextSafety.reason,
        activeModal: null,
        activePuzzle: null,
        missionStatus: 'rescue-cinematic',
        capcomMessage:
          sim.nextSafety.reason ||
          'Stage 3 Failure: Crew secured in shelter; Earth Rescue rocket launched!',
      });
      return;
    }

    // Edge-triggered warning & critical alarm sounds (respecting cooldowns; never harsh loops!)
    if (sim.nextSafety.stage === 'emergency' && state.safety.stage !== 'emergency') {
      playSound('alarm-critical', { muted, volume });
    } else if (sim.nextSafety.stage === 'warning' && state.safety.stage === 'normal') {
      playSound('warn-general', { muted, volume });
    } else if (sim.nextResources.oxygen <= 22 && state.resources.oxygen > 22) {
      playSound('warn-low-o2', { muted, volume });
    } else if (sim.nextResources.battery <= 20 && state.resources.battery > 20) {
      playSound('warn-low-battery', { muted, volume });
    } else if (sim.nextResources.radiationProtection <= 42 && state.resources.radiationProtection > 42) {
      playSound('warn-radiation', { muted, volume });
    } else if (sim.nextResources.habitatPressure <= 70 && state.resources.habitatPressure > 70) {
      playSound('warn-o2-leak', { muted, volume });
    } else if (
      sim.nextSystems.solarArray !== 'Operational' &&
      state.systems.solarArray === 'Operational'
    ) {
      playSound('warn-solar-damage', { muted, volume });
    } else {
      const newlyFailed = (Object.keys(sim.nextSystems) as SystemId[]).some(
        (k) => state.systems[k] === 'Operational' && sim.nextSystems[k] !== 'Operational'
      );
      if (newlyFailed) {
        playSound('warn-machine-fail', { muted, volume });
      }
    }

    const nextObj = evaluateObjectives({
      systems: sim.nextSystems,
      machineConditions: sim.nextMachineConditions,
      resources: sim.nextResources,
      researchProgress: nextResearch,
      sol: state.sol,
      maxSols: state.maxSols,
      safetyProtocolActivated: false,
    });

    const trends = syncTrendsFromPreview({
      ...state,
      resources: sim.nextResources,
      character: sim.nextCharacter,
      toggles: sim.nextToggles,
      systems: sim.nextSystems,
      machineConditions: sim.nextMachineConditions,
      greenhouseState: sim.nextGreenhouse,
      waterCycle: sim.nextWaterCycle,
      emergency: nextEmergency,
    });

    set({
      missionElapsedSeconds: nextElapsed,
      solElapsedSeconds: nextSolElapsed,
      resources: sim.nextResources,
      character: sim.nextCharacter,
      crew: sim.nextCrew,
      inventory: nextInv,
      sharedFoodStorage: nextSharedFood,
      toggles: sim.nextToggles,
      systems: sim.nextSystems,
      machineConditions: sim.nextMachineConditions,
      greenhouseState: sim.nextGreenhouse,
      waterCycle: sim.nextWaterCycle,
      safety: sim.nextSafety,
      repairAnim: nextRepairAnim,
      actionAnim: nextActionAnim,
      emergency: nextEmergency,
      objectives: nextObj,
      liveTrends: trends,
    });

    // Auto-advance Sol seamlessly when SOL_DURATION_SECONDS completes!
    if (nextSolElapsed >= SOL_DURATION_SECONDS) {
      get().endMissionDay();
    }
  },

  tickMissionTimer: () => {
    get().tickContinuousSimulation(1);
  },

  tickLiveSimulation: () => {
    const state = get();
    if (state.missionStatus !== 'active') return;
    set({ liveTrends: syncTrendsFromPreview(state) });
  },

  clearToast: () => set({ toastMessage: null }),
  showToast: (msg) => set({ toastMessage: msg }),

  sendChatMessage: async (text, quickHint = false) => {
    const state = get();
    const trimmed = text.trim();
    if (!trimmed || state.isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: `Sol ${state.sol}`,
    };

    set({ chatMessages: [...state.chatMessages, userMsg], isChatLoading: true });

    try {
      const activeScenario = state.emergency
        ? SCENARIO_BY_ID[state.emergency.scenarioId]
        : null;

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: state.chatMessages.slice(-10).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          message: trimmed,
          mode: quickHint ? 'quick-hint' : 'standard',
          gameContext: {
            destination: state.destination,
            sol: state.sol,
            difficulty: state.difficulty,
            resources: state.resources,
            activeEmergency: activeScenario
              ? {
                  title: activeScenario.title,
                  problem: activeScenario.introStory,
                  selectedPlan: state.emergency?.selectedPlan ?? null,
                }
              : null,
          },
        }),
      });

      const data = (await resp.json()) as { reply?: string; source?: string; error?: string };
      const botMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || data.error || 'Copy that, Cadet! Keep monitoring life support.',
        timestamp: `Sol ${state.sol}`,
        source: data.source,
      };

      set({
        chatMessages: [...get().chatMessages, botMsg],
        isChatLoading: false,
      });
    } catch {
      set({
        chatMessages: [
          ...get().chatMessages,
          {
            id: `m-err-${Date.now()}`,
            role: 'model',
            text: 'Radio signal static! Check your connection or open the Repair Manual (M) for offline guidance.',
            timestamp: `Sol ${state.sol}`,
          },
        ],
        isChatLoading: false,
      });
    }
  },

  exitGameSafely: () => {
    const state = get();
    const isInMission =
      state.missionStatus === 'active' ||
      state.missionStatus === 'paused' ||
      state.missionStatus === 'briefing';

    const updatedProgress: SavedProgress = {
      ...state.savedProgress,
      lastDestination: state.destination,
      bestScore: isInMission
        ? Math.max(state.savedProgress.bestScore, state.missionScore)
        : state.savedProgress.bestScore,
    };
    saveProgressToStorage(updatedProgress);

    let nextSavedMission = state.savedMission;
    if (isInMission) {
      const snapshot: SavedMissionSnapshot = {
        savedAt: Date.now(),
        destination: state.destination,
        difficulty: state.difficulty,
        missionSeed: state.missionSeed,
        sol: state.sol,
        solElapsedSeconds: state.solElapsedSeconds,
        maxSols: state.maxSols,
        missionScore: state.missionScore,
        missionElapsedSeconds: state.missionElapsedSeconds,
        resources: { ...state.resources },
        character: {
          ...state.character,
          position: { ...state.character.position },
        },
        crew: state.crew.map((c) => ({ ...c })),
        inventory: state.inventory.map((i) => ({ ...i })),
        sharedFoodStorage: state.sharedFoodStorage.map((i) => ({ ...i })),
        worldPickups: state.worldPickups.map((w) => ({ ...w, position: { ...w.position } })),
        systems: { ...state.systems },
        machineConditions: { ...state.machineConditions },
        toggles: { ...state.toggles },
        greenhouseState: { ...state.greenhouseState },
        waterCycle: { ...state.waterCycle },
        safety: { ...state.safety },
        dustStormDaysRemaining: state.dustStormDaysRemaining,
        activeLeak: state.activeLeak,
        activeRadiationHazard: state.activeRadiationHazard,
        waterBlocksReinforced: state.waterBlocksReinforced,
        eventTimeline: { ...state.eventTimeline },
        forecast: state.forecast ? { ...state.forecast } : null,
        objectives: { ...state.objectives },
        emergency: state.emergency ? { ...state.emergency } : null,
        completedScenarios: [...state.completedScenarios],
        selectedPlansLog: state.selectedPlansLog.map((p) => ({ ...p })),
        puzzlesCompletedCount: state.puzzlesCompletedCount,
        statusHistory: state.statusHistory.map((h) => ({ ...h })),
        eventLog: state.eventLog.map((e) => ({ ...e })),
        viewMode: state.viewMode,
      };
      saveMissionSnapshotToStorage(snapshot);
      nextSavedMission = snapshot;
    }

    syncAmbience(false);
    playTone('click', updatedProgress.muted, updatedProgress.volume);
    set({
      savedProgress: updatedProgress,
      savedMission: nextSavedMission,
      missionStatus: 'destination-select',
      viewMode: 'interior',
      activeModal: null,
      inspectedStationId: null,
      activePuzzle: null,
      puzzlePaused: false,
      repairAnim: null,
      actionAnim: null,
      moveTarget: null,
      exitNotice: {
        saved: isInMission,
        sol: isInMission ? state.sol : null,
        destination: state.destination,
      },
    });
  },

  resumeSavedMission: () => {
    const state = get();
    const snap = state.savedMission || loadSavedMissionSnapshot();
    if (!snap) return;

    playTone('success', state.savedProgress.muted, state.savedProgress.volume);
    syncAmbience(true, state.savedProgress.muted, state.savedProgress.volume);
    const restoredSharedFood = snap.sharedFoodStorage
      ? snap.sharedFoodStorage.map((i) => ({ ...i }))
      : INITIAL_SHARED_FOOD_STORAGE.map((i) => ({ ...i }));
    const restored: Partial<GameStore> = {
      destination: snap.destination,
      difficulty: snap.difficulty,
      missionSeed: snap.missionSeed,
      sol: snap.sol,
      solElapsedSeconds: snap.solElapsedSeconds,
      maxSols: snap.maxSols,
      missionScore: snap.missionScore,
      missionElapsedSeconds: snap.missionElapsedSeconds,
      resources: { ...snap.resources },
      character: { ...snap.character, position: { ...snap.character.position } },
      crew: snap.crew.map((c) => ({ ...c })),
      inventory: snap.inventory.map((i) => ({ ...i })),
      sharedFoodStorage: restoredSharedFood,
      worldPickups: snap.worldPickups.map((w) => ({ ...w, position: { ...w.position } })),
      systems: { ...snap.systems },
      machineConditions: { ...snap.machineConditions },
      toggles: { ...snap.toggles },
      greenhouseState: { ...snap.greenhouseState },
      waterCycle: { ...snap.waterCycle },
      safety: { ...snap.safety },
      dustStormDaysRemaining: snap.dustStormDaysRemaining,
      activeLeak: snap.activeLeak,
      activeRadiationHazard: snap.activeRadiationHazard,
      waterBlocksReinforced: snap.waterBlocksReinforced,
      eventTimeline: { ...snap.eventTimeline },
      forecast: snap.forecast ? { ...snap.forecast } : null,
      objectives: { ...snap.objectives },
      emergency: snap.emergency ? { ...snap.emergency } : null,
      completedScenarios: [...snap.completedScenarios],
      selectedPlansLog: snap.selectedPlansLog.map((p) => ({ ...p })),
      puzzlesCompletedCount: snap.puzzlesCompletedCount,
      statusHistory: snap.statusHistory.map((h) => ({ ...h })),
      eventLog: snap.eventLog.map((e) => ({ ...e })),
      viewMode: snap.viewMode || 'interior',
      missionStatus: 'active',
      activeModal: null,
      inspectedStationId: null,
      activePuzzle: null,
      puzzlePaused: false,
      repairAnim: null,
      actionAnim: null,
      moveTarget: null,
      exitNotice: null,
      toastMessage: `Resumed saved ${snap.destination === 'mars' ? 'Mars' : 'Lunar'} mission at Sol ${snap.sol}!`,
    };
    set(restored);
  },

  dismissExitNotice: () => set({ exitNotice: null }),

  resetMission: (returnToSelect = true) => {
    syncAmbience(false);
    set({
      missionStatus: returnToSelect ? 'destination-select' : 'loadout',
      viewMode: 'interior',
      activeModal: null,
      inspectedStationId: null,
      activePuzzle: null,
      puzzlePaused: false,
      emergency: null,
      repairAnim: null,
      actionAnim: null,
      moveTarget: null,
      exitNotice: null,
    });
  },
}));

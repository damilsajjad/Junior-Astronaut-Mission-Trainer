import { create } from 'zustand';
import {
  CARGO_LIMIT,
  GAME_ITEMS,
  INVENTORY_SLOT_LIMIT,
  ITEM_BY_ID,
  getRecommendedLoadout,
} from '../data/items';
import { SCENARIO_BY_ID, SCENARIOS } from '../data/scenarios';
import {
  INITIAL_CHARACTER_STATE,
  INITIAL_TUTORIAL_RESOURCES,
  calculateEndOfDay,
  clamp,
  computeMissionScore,
} from '../engine/simulation';
import {
  CharacterState,
  ChatMessage,
  CrewMemberState,
  Destination,
  DifficultyMode,
  EmergencyState,
  InventoryItem,
  MissionEventLog,
  MissionStatus,
  PlanId,
  PuzzleId,
  ResourceState,
  SavedProgress,
  StationId,
  StatusHistoryPoint,
  SystemConditionMap,
  SystemToggleState,
  ViewMode,
  WorldPickup,
} from '../types/game';
import { playTone } from '../utils/sound';

const STORAGE_KEY = 'orbital_survival_progress_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  bestScore: 3450,
  completedMissions: 1,
  unlockedAchievements: ['Earth Guardian', 'Lunar Survivor'],
  lastDestination: 'mars',
  muted: true,
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
    // Graceful in-memory fallback when LocalStorage is disabled
  }
}

const INITIAL_SYSTEMS: SystemConditionMap = {
  oxygenGenerator: 'Operational',
  co2Scrubber: 'Operational',
  waterRecycler: 'Operational',
  powerPanel: 'Operational',
  solarArray: 'Operational',
  greenhouse: 'Operational',
  pressureSystem: 'Operational',
  radiationShelter: 'Operational',
};

const INITIAL_TOGGLES: SystemToggleState = {
  oxygenGenerator: true,
  co2Scrubber: true,
  waterRecycler: true,
  greenhouse: true,
  researchSystems: true,
};

const INITIAL_CREW: CrewMemberState[] = [
  { id: 'player', label: 'Cadet Commander', role: 'Mission Lead', isPlayer: true, health: 100, status: 'healthy' },
  { id: 'crew-1', label: 'Crew Member 1', role: 'Life Support Tech', isPlayer: false, health: 100, status: 'healthy' },
  { id: 'crew-2', label: 'Crew Member 2', role: 'Power Engineer', isPlayer: false, health: 100, status: 'healthy' },
  { id: 'crew-3', label: 'Crew Member 3', role: 'Botany & Med Spec', isPlayer: false, health: 100, status: 'healthy' },
];

const INITIAL_WORLD_PICKUPS: WorldPickup[] = [
  { uid: 'wp-meal-1', itemId: 'meal-pack', label: 'Meal Pack', position: { x: 1.6, y: 0.4, z: -1.1 }, collected: false },
  { uid: 'wp-water-1', itemId: 'water-pack', label: 'Water Pack', position: { x: 2.2, y: 0.4, z: -0.9 }, collected: false },
  { uid: 'wp-repair-1', itemId: 'repair-kit', label: 'Repair Kit', position: { x: -1.3, y: 0.4, z: -1.2 }, collected: false },
  { uid: 'wp-filter-1', itemId: 'spare-co2-filter', label: 'Spare CO₂ Filter', position: { x: -0.2, y: 0.4, z: -1.3 }, collected: false },
];

export type ActiveModal =
  | null
  | 'inventory'
  | 'manual'
  | 'dashboard'
  | 'plan-decision'
  | 'science'
  | 'pause'
  | 'settings';

export type GameStore = {
  destination: Destination;
  viewMode: ViewMode;
  missionStatus: MissionStatus;
  difficulty: DifficultyMode;
  sol: number;
  maxSols: number;
  missionScore: number;
  missionElapsedSeconds: number;

  resources: ResourceState;
  character: CharacterState;
  characterTrends: { health: number; energy: number; hydration: number };
  statusHistory: StatusHistoryPoint[];
  crew: CrewMemberState[];
  inventory: InventoryItem[];
  worldPickups: WorldPickup[];

  systems: SystemConditionMap;
  toggles: SystemToggleState;
  dustStormDaysRemaining: number;
  activeLeak: boolean;
  activeRadiationHazard: boolean;
  waterBlocksReinforced: number;

  emergency: EmergencyState | null;
  completedScenarios: string[];
  selectedPlansLog: { scenarioId: string; title: string; plan: PlanId }[];
  puzzlesCompletedCount: number;

  activeModal: ActiveModal;
  activePuzzle: { id: PuzzleId; scenarioId?: string; standalonePractice?: boolean } | null;
  puzzlePaused: boolean;
  manualContextStation: StationId | null;

  nearbyStation: StationId | null;
  nearbyPickupUid: string | null;
  toastMessage: string | null;
  capcomMessage: string;
  eventLog: MissionEventLog[];

  loadoutSelection: Record<string, number>;
  savedProgress: SavedProgress;

  // Virtual joystick vector for tablet/touch movement
  touchMoveVector: { x: number; y: number };

  // Multi-turn Gemini CAPCOM chat history
  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  // Actions
  setMissionStatus: (status: MissionStatus) => void;
  selectDestination: (dest: Destination) => void;
  setDifficulty: (diff: DifficultyMode) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleMute: () => void;
  toggleReducedMotion: () => void;
  toggleLowGraphics: () => void;

  setLoadoutQty: (itemId: string, qty: number) => void;
  applyRecommendedLoadout: () => void;
  startMissionFromLoadout: (replayIntro?: boolean) => void;
  finishCinematicToBriefing: () => void;
  beginActiveGameplay: () => void;
  startPracticePuzzle: (puzzleId: PuzzleId) => void;

  openModal: (modal: ActiveModal, stationId?: StationId | null) => void;
  closeModal: () => void;

  setTouchMoveVector: (vec: { x: number; y: number }) => void;
  updatePlayerPosition: (pos: { x: number; y: number; z: number }, distanceMoved: number) => void;
  setNearbyInteractable: (station: StationId | null, pickupUid: string | null) => void;
  interactWithNearby: () => void;
  reinforceWaterBlock: () => void;

  useInventoryItem: (itemId: string) => void;
  restAtCrewBunk: () => void;
  toggleSystemPower: (key: keyof SystemToggleState) => void;

  chooseEmergencyPlan: (planId: PlanId) => void;
  completePuzzle: (success: boolean) => void;
  closePuzzle: () => void;

  endMissionDay: () => void;
  tickMissionTimer: () => void;
  clearToast: () => void;
  showToast: (msg: string) => void;

  sendChatMessage: (text: string, quickHint?: boolean) => Promise<void>;
  resetMission: (returnToSelect?: boolean) => void;
};

const initialSaved = loadSavedProgress();

export const useGameStore = create<GameStore>((set, get) => ({
  destination: initialSaved.lastDestination,
  viewMode: 'interior',
  missionStatus: 'destination-select',
  difficulty: 'cadet',
  sol: 1,
  maxSols: 5,
  missionScore: 1850,
  missionElapsedSeconds: 252,

  resources: { ...INITIAL_TUTORIAL_RESOURCES },
  character: { ...INITIAL_CHARACTER_STATE },
  characterTrends: { health: 0, energy: 0, hydration: 0 },
  statusHistory: [
    { step: 1, label: 'Start', health: 100, energy: 100, hydration: 100 },
  ],
  crew: INITIAL_CREW.map((c) => ({ ...c })),
  inventory: [],
  worldPickups: INITIAL_WORLD_PICKUPS.map((w) => ({ ...w })),

  systems: { ...INITIAL_SYSTEMS },
  toggles: { ...INITIAL_TOGGLES },
  dustStormDaysRemaining: 0,
  activeLeak: false,
  activeRadiationHazard: false,
  waterBlocksReinforced: 1,

  emergency: null,
  completedScenarios: [],
  selectedPlansLog: [],
  puzzlesCompletedCount: 0,

  activeModal: null,
  activePuzzle: null,
  puzzlePaused: false,
  manualContextStation: null,

  nearbyStation: null,
  nearbyPickupUid: null,
  toastMessage: null,
  capcomMessage:
    'Welcome, Cadet! Choose Mars or Moon, pack your 17 Cargo Points, and keep all 4 life-support pillars green!',
  eventLog: [],

  loadoutSelection: getRecommendedLoadout(),
  savedProgress: initialSaved,
  touchMoveVector: { x: 0, y: 0 },

  chatMessages: [
    {
      id: 'capcom-welcome',
      role: 'model',
      text: 'Hi Cadet! I am CAPCOM, your Junior Flight Director. Ask me anything about Oxygen electrolysis, CO₂ scrubbers, solar power, or radiation water blocks!',
      timestamp: '00:00',
      source: 'capcom-local',
    },
  ],
  isChatLoading: false,

  setMissionStatus: (status) => set({ missionStatus: status }),

  selectDestination: (dest) => {
    const prev = get().savedProgress;
    const updated = { ...prev, lastDestination: dest };
    saveProgressToStorage(updated);
    playTone('click', prev.muted);
    set({
      destination: dest,
      savedProgress: updated,
      capcomMessage:
        dest === 'mars'
          ? 'Mars selected! Expect 0.38g gravity and Martian dust storms that cut solar power.'
          : 'Moon selected! Expect 0.16g low gravity and sudden Solar Flare radiation alerts.',
    });
  },

  setDifficulty: (diff) => set({ difficulty: diff }),

  setViewMode: (mode) => {
    const state = get();
    playTone('click', state.savedProgress.muted);
    set({
      viewMode: mode,
      puzzlePaused: mode === 'exterior' && state.activePuzzle !== null ? true : false,
    });
  },

  toggleMute: () => {
    const prev = get().savedProgress;
    const updated = { ...prev, muted: !prev.muted };
    saveProgressToStorage(updated);
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

  startMissionFromLoadout: (replayIntro = false) => {
    const state = get();
    const dest = state.destination;
    const inv: InventoryItem[] = [];
    for (const item of GAME_ITEMS) {
      const q = state.loadoutSelection[item.id] || 0;
      if (q > 0) inv.push({ id: item.id, quantity: q });
    }

    const introWatched =
      dest === 'mars'
        ? state.savedProgress.introWatchedMars
        : state.savedProgress.introWatchedMoon;

    const firstScenarioId = dest === 'mars' ? 'mars-dust-storm' : 'moon-radiation-alert';
    const firstScenario = SCENARIO_BY_ID[firstScenarioId];

    const nextSystems = { ...INITIAL_SYSTEMS };
    if (firstScenarioId === 'mars-dust-storm') {
      nextSystems.solarArray = 'Warning';
    } else if (firstScenarioId === 'moon-radiation-alert') {
      nextSystems.radiationShelter = 'Warning';
    }

    playTone('success', state.savedProgress.muted);

    set({
      missionStatus: replayIntro || !introWatched ? 'intro' : 'briefing',
      viewMode: 'interior',
      sol: 1,
      missionScore: 1850,
      missionElapsedSeconds: 0,
      resources: { ...INITIAL_TUTORIAL_RESOURCES },
      character: { ...INITIAL_CHARACTER_STATE },
      characterTrends: { health: 0, energy: 0, hydration: 0 },
      statusHistory: [{ step: 1, label: 'Sol 1', health: 100, energy: 100, hydration: 100 }],
      crew: INITIAL_CREW.map((c) => ({ ...c })),
      inventory: inv,
      worldPickups: INITIAL_WORLD_PICKUPS.map((w) => ({ ...w })),
      systems: nextSystems,
      toggles: { ...INITIAL_TOGGLES },
      dustStormDaysRemaining: dest === 'mars' ? 2 : 0,
      activeLeak: false,
      activeRadiationHazard: dest === 'moon',
      waterBlocksReinforced: 1,
      completedScenarios: [],
      selectedPlansLog: [],
      puzzlesCompletedCount: 0,
      activeModal: null,
      activePuzzle: null,
      puzzlePaused: false,
      emergency: {
        scenarioId: firstScenario.id,
        active: true,
        selectedPlan: null,
        puzzleCompleted: false,
        countdownSeconds: 25,
      },
      capcomMessage: firstScenario.capcomAlert,
      eventLog: [
        {
          id: `evt-start-${Date.now()}`,
          sol: 1,
          title: firstScenario.title,
          detail: firstScenario.introStory,
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

  beginActiveGameplay: () => {
    playTone('click', get().savedProgress.muted);
    set({ missionStatus: 'active' });
  },

  startPracticePuzzle: (puzzleId) => {
    playTone('click', get().savedProgress.muted);
    set({
      activePuzzle: { id: puzzleId, standalonePractice: true },
    });
  },

  openModal: (modal, stationId = null) => {
    playTone('click', get().savedProgress.muted);
    set({
      activeModal: modal,
      manualContextStation: stationId ?? get().manualContextStation,
    });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  setTouchMoveVector: (vec) => set({ touchMoveVector: vec }),

  updatePlayerPosition: (pos, distanceMoved) => {
    const state = get();
    if (distanceMoved <= 0.0001) {
      set({ character: { ...state.character, position: pos } });
      return;
    }
    // Walking slowly reduces Energy/Stamina (~0.4 per world unit)
    const energyLoss = distanceMoved * 0.35;
    const nextEnergy = Math.max(0, state.character.energy - energyLoss);
    set({
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
        toastMessage: 'All 3 Water-Barrier Blocks are already locked against the Shield Wall!',
      });
      return;
    }
    const nextBlocks = state.waterBlocksReinforced + 1;
    const nextRad = clamp(state.resources.radiationProtection + 8);
    playTone('success', state.savedProgress.muted);
    set({
      waterBlocksReinforced: nextBlocks,
      missionScore: state.missionScore + 150,
      resources: {
        ...state.resources,
        radiationProtection: nextRad,
      },
      systems: {
        ...state.systems,
        radiationShelter: nextBlocks >= 3 ? 'Operational' : state.systems.radiationShelter,
      },
      toastMessage: `Water-Barrier Block ${nextBlocks}/3 stacked! Radiation Protection +8% (+150 pts)`,
      capcomMessage:
        nextBlocks >= 3
          ? 'Awesome job, Cadet! All 3 Water-Barrier Blocks are shielding the shelter wall!'
          : `Block ${nextBlocks} of 3 secured! Reinforce ${3 - nextBlocks} more to maximize radiation protection.`,
    });
  },

  interactWithNearby: () => {
    const state = get();
    if (state.missionStatus !== 'active' || state.viewMode !== 'interior') return;

    // 1. Check nearby world pickup first
    if (state.nearbyPickupUid) {
      const target = state.worldPickups.find(
        (w) => w.uid === state.nearbyPickupUid && !w.collected
      );
      if (target) {
        const existingIdx = state.inventory.findIndex((i) => i.id === target.itemId);
        if (existingIdx === -1 && state.inventory.length >= INVENTORY_SLOT_LIMIT) {
          playTone('error', state.savedProgress.muted);
          set({ toastMessage: 'Inventory full (12 slots). Use or store an item first.' });
          return;
        }
        const nextInv = [...state.inventory];
        if (existingIdx >= 0) {
          nextInv[existingIdx] = {
            ...nextInv[existingIdx],
            quantity: nextInv[existingIdx].quantity + 1,
          };
        } else {
          nextInv.push({ id: target.itemId, quantity: 1 });
        }
        const nextPickups = state.worldPickups.map((w) =>
          w.uid === target.uid ? { ...w, collected: true } : w
        );
        playTone('pickup', state.savedProgress.muted);
        set({
          inventory: nextInv,
          worldPickups: nextPickups,
          nearbyPickupUid: null,
          missionScore: state.missionScore + 50,
          toastMessage: `${target.label} added to inventory!`,
        });
        return;
      }
    }

    // 2. Check nearby station
    const station = state.nearbyStation;
    if (!station) return;

    playTone('click', state.savedProgress.muted);

    if (station === 'manual-terminal') {
      set({ activeModal: 'manual', manualContextStation: station });
    } else if (station === 'mission-control') {
      set({ activeModal: 'dashboard' });
    } else if (station === 'food-cabinet' || station === 'tool-cabinet') {
      set({ activeModal: 'inventory' });
    } else if (station === 'crew-bunks') {
      get().restAtCrewBunk();
    } else if (station === 'water-blocks') {
      get().reinforceWaterBlock();
    } else if (station === 'radiation-shelter') {
      if (state.emergency?.active && state.emergency.scenarioId === 'moon-radiation-alert') {
        set({ activeModal: 'plan-decision' });
      } else {
        set({
          crew: state.crew.map((c) => ({ ...c, status: 'safe-shelter' })),
          toastMessage: 'Crew checked into Radiation Shelter bay!',
        });
      }
    } else if (station === 'oxygen-generator') {
      if (state.emergency?.active && state.emergency.scenarioId === 'o2-circuit-failure') {
        set({ activeModal: 'plan-decision' });
      } else {
        set({ activeModal: 'manual', manualContextStation: 'oxygen-generator' });
      }
    } else if (station === 'co2-scrubber') {
      if (state.emergency?.active && state.emergency.scenarioId === 'co2-scrubber-failure') {
        set({ activeModal: 'plan-decision' });
      } else {
        set({ activeModal: 'manual', manualContextStation: 'co2-scrubber' });
      }
    } else if (station === 'power-panel') {
      if (state.emergency?.active && state.emergency.scenarioId === 'mars-dust-storm') {
        set({ activeModal: 'plan-decision' });
      } else {
        set({ activeModal: 'dashboard' });
      }
    } else if (station === 'greenhouse' || station === 'water-recycler') {
      set({ activeModal: 'dashboard' });
    }
  },

  useInventoryItem: (itemId) => {
    const state = get();
    const slot = state.inventory.find((i) => i.id === itemId);
    if (!slot || slot.quantity <= 0) return;
    const def = ITEM_BY_ID[itemId];
    if (!def) return;

    const prevChar = state.character;
    let nextChar = { ...prevChar };
    let nextRes = { ...state.resources };
    let consumed = false;
    let msg = '';

    if (itemId === 'meal-pack') {
      nextChar.energy = clamp(prevChar.energy + 20);
      consumed = true;
      msg = 'Ate Meal Pack: Energy/Stamina +20!';
    } else if (itemId === 'water-pack') {
      nextChar.hydration = clamp(prevChar.hydration + 25);
      consumed = true;
      msg = 'Drank Water Pack: Hydration +25!';
    } else if (itemId === 'medical-kit') {
      nextChar.health = clamp(prevChar.health + 20);
      consumed = true;
      msg = 'Used Medical Kit: Health +20!';
    } else if (itemId === 'emergency-oxygen') {
      nextRes.oxygen = clamp(nextRes.oxygen + 25);
      consumed = true;
      msg = 'Activated Emergency Oxygen Reserve: Oxygen +25%!';
    } else if (itemId === 'emergency-battery') {
      nextRes.battery = clamp(nextRes.battery + 25);
      consumed = true;
      msg = 'Activated Emergency Battery Module: Battery +25%!';
    } else if (itemId === 'radiation-panel') {
      nextRes.radiationProtection = clamp(nextRes.radiationProtection + 20);
      consumed = true;
      msg = 'Installed Radiation Shielding Panel: Protection +20%!';
    } else {
      set({
        toastMessage: `${def.name} is used automatically when executing an emergency Repair Plan.`,
      });
      return;
    }

    if (!consumed) return;

    const nextInv = state.inventory
      .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0);

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

    playTone('pickup', state.savedProgress.muted);

    set({
      inventory: nextInv,
      character: nextChar,
      resources: nextRes,
      characterTrends: {
        health: Math.round(nextChar.health - prevChar.health),
        energy: Math.round(nextChar.energy - prevChar.energy),
        hydration: Math.round(nextChar.hydration - prevChar.hydration),
      },
      statusHistory: nextHistory,
      toastMessage: msg,
    });
  },

  restAtCrewBunk: () => {
    const state = get();
    const prevChar = state.character;
    const nextEnergy = clamp(prevChar.energy + 30);
    const nextChar = { ...prevChar, energy: nextEnergy };
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
      characterTrends: {
        health: 0,
        energy: Math.round(nextEnergy - prevChar.energy),
        hydration: 0,
      },
      statusHistory: nextHistory,
      toastMessage: 'Rested at Crew Bunks: Energy/Stamina +30!',
    });
  },

  toggleSystemPower: (key) => {
    const state = get();
    playTone('click', state.savedProgress.muted);
    const nextVal = !state.toggles[key];
    set({
      toggles: { ...state.toggles, [key]: nextVal },
      toastMessage: `${key.replace(/([A-Z])/g, ' $1').trim()} switched ${nextVal ? 'ON' : 'OFF'}.`,
    });
  },

  chooseEmergencyPlan: (planId) => {
    const state = get();
    if (!state.emergency) return;
    const scenario = SCENARIO_BY_ID[state.emergency.scenarioId];
    if (!scenario) return;
    const plan = scenario.plans[planId];

    // Validate required item
    if (plan.requiredItemId) {
      const invItem = state.inventory.find((i) => i.id === plan.requiredItemId);
      const reqQty = plan.requiredItemQty ?? 1;
      if (!invItem || invItem.quantity < reqQty) {
        playTone('error', state.savedProgress.muted);
        const itemName = ITEM_BY_ID[plan.requiredItemId]?.name || plan.requiredItemId;
        set({
          toastMessage: `Missing ${itemName}! Check inventory or choose another plan.`,
        });
        return;
      }
    }

    // Consume item if required
    let nextInv = [...state.inventory];
    if (plan.requiredItemId) {
      const reqQty = plan.requiredItemQty ?? 1;
      nextInv = nextInv
        .map((i) =>
          i.id === plan.requiredItemId ? { ...i, quantity: i.quantity - reqQty } : i
        )
        .filter((i) => i.quantity > 0);
    }

    // If plan requires an interactive puzzle, launch puzzle modal
    if (plan.requiresPuzzle) {
      playTone('click', state.savedProgress.muted);
      set({
        inventory: nextInv,
        emergency: { ...state.emergency, selectedPlan: planId },
        activeModal: null,
        activePuzzle: {
          id: plan.requiresPuzzle,
          scenarioId: scenario.id,
        },
        puzzlePaused: false,
      });
      return;
    }

    // Apply immediate plan effects
    const nextRes = { ...state.resources };
    if (plan.resourceDelta.oxygen) nextRes.oxygen = clamp(nextRes.oxygen + plan.resourceDelta.oxygen);
    if (plan.resourceDelta.water) nextRes.water = clamp(nextRes.water + plan.resourceDelta.water);
    if (plan.resourceDelta.battery) nextRes.battery = clamp(nextRes.battery + plan.resourceDelta.battery);
    if (plan.resourceDelta.food) nextRes.food = clamp(nextRes.food + plan.resourceDelta.food);
    if (plan.resourceDelta.co2) nextRes.co2 = clamp(nextRes.co2 + plan.resourceDelta.co2);
    if (plan.resourceDelta.habitatPressure)
      nextRes.habitatPressure = clamp(nextRes.habitatPressure + plan.resourceDelta.habitatPressure);
    if (plan.resourceDelta.temperatureSafety)
      nextRes.temperatureSafety = clamp(nextRes.temperatureSafety + plan.resourceDelta.temperatureSafety);
    if (plan.resourceDelta.radiationProtection)
      nextRes.radiationProtection = clamp(
        nextRes.radiationProtection + plan.resourceDelta.radiationProtection
      );

    const nextSystems = { ...state.systems };
    if (plan.restoresSystem) {
      nextSystems[plan.restoresSystem] = 'Operational';
    }
    for (const sys of scenario.affectedSystems) {
      if (planId === 'A' || planId === 'B') {
        nextSystems[sys] = 'Operational';
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
      ? state.crew.map((c) => ({ ...c, status: 'safe-shelter' as const }))
      : state.crew;

    const pointsAwarded = planId === 'A' ? 350 : planId === 'B' ? 280 : 200;
    playTone('success', state.savedProgress.muted);

    set({
      inventory: nextInv,
      resources: nextRes,
      systems: nextSystems,
      toggles: nextToggles,
      crew: nextCrew,
      dustStormDaysRemaining:
        scenario.id === 'mars-dust-storm' && planId === 'A'
          ? 0
          : state.dustStormDaysRemaining,
      activeLeak: scenario.id === 'habitat-pressure-leak' ? false : state.activeLeak,
      activeRadiationHazard:
        scenario.id === 'moon-radiation-alert' ? false : state.activeRadiationHazard,
      emergency: null,
      activeModal: null,
      completedScenarios: [...state.completedScenarios, scenario.id],
      selectedPlansLog: [
        ...state.selectedPlansLog,
        { scenarioId: scenario.id, title: scenario.title, plan: planId },
      ],
      missionScore: state.missionScore + pointsAwarded,
      capcomMessage: scenario.capcomSuccess,
      toastMessage: `${plan.title} complete! (+${pointsAwarded} PTS)`,
      eventLog: [
        ...state.eventLog,
        {
          id: `evt-res-${Date.now()}`,
          sol: state.sol,
          title: `Resolved: ${scenario.title} (Plan ${planId})`,
          detail: scenario.scienceExplanation,
          severity: 'success',
        },
      ],
    });
  },

  completePuzzle: (success) => {
    const state = get();
    const puzzle = state.activePuzzle;
    if (!puzzle) return;

    if (!success) {
      playTone('error', state.savedProgress.muted);
      set({
        capcomMessage:
          'Good try, Cadet! Check the Repair Manual (M) for a diagram and try again!',
      });
      return;
    }

    playTone('success', state.savedProgress.muted);

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
      if (plan.resourceDelta.oxygen) nextRes.oxygen = clamp(nextRes.oxygen + plan.resourceDelta.oxygen);
      if (plan.resourceDelta.battery) nextRes.battery = clamp(nextRes.battery + plan.resourceDelta.battery);
      if (plan.resourceDelta.co2) nextRes.co2 = clamp(nextRes.co2 + plan.resourceDelta.co2);
      if (plan.resourceDelta.habitatPressure)
        nextRes.habitatPressure = clamp(nextRes.habitatPressure + plan.resourceDelta.habitatPressure);
    }

    const nextSystems = { ...state.systems };
    if (scenario) {
      for (const s of scenario.affectedSystems) {
        nextSystems[s] = 'Operational';
      }
    }

    set({
      activePuzzle: null,
      puzzlePaused: false,
      resources: nextRes,
      systems: nextSystems,
      dustStormDaysRemaining:
        scenario?.id === 'mars-dust-storm' ? 0 : state.dustStormDaysRemaining,
      activeLeak: scenario?.id === 'habitat-pressure-leak' ? false : state.activeLeak,
      emergency: null,
      puzzlesCompletedCount: state.puzzlesCompletedCount + 1,
      completedScenarios: scenario
        ? [...state.completedScenarios, scenario.id]
        : state.completedScenarios,
      selectedPlansLog: scenario
        ? [...state.selectedPlansLog, { scenarioId: scenario.id, title: scenario.title, plan: planId }]
        : state.selectedPlansLog,
      missionScore: state.missionScore + 400,
      capcomMessage:
        scenario?.capcomSuccess || 'Repair puzzle completed! System restored to Operational.',
      toastMessage: 'Repair Complete! System Operational (+400 PTS)',
      eventLog: scenario
        ? [
            ...state.eventLog,
            {
              id: `evt-puz-${Date.now()}`,
              sol: state.sol,
              title: `Repaired: ${scenario.title}`,
              detail: scenario.scienceExplanation,
              severity: 'success',
            },
          ]
        : state.eventLog,
    });
  },

  closePuzzle: () => set({ activePuzzle: null, puzzlePaused: false }),

  endMissionDay: () => {
    const state = get();
    if (state.missionStatus !== 'active') return;

    const result = calculateEndOfDay({
      destination: state.destination,
      resources: state.resources,
      character: state.character,
      crew: state.crew,
      toggles: state.toggles,
      systems: state.systems,
      dustStormDaysRemaining: state.dustStormDaysRemaining,
      activeLeak: state.activeLeak,
      activeRadiationHazard: state.activeRadiationHazard,
    });

    const nextSol = state.sol + 1;
    const nextDust = Math.max(0, state.dustStormDaysRemaining - 1);

    const nextHistory = [
      ...state.statusHistory,
      {
        step: state.statusHistory.length + 1,
        label: `Sol ${nextSol}`,
        health: Math.round(result.nextCharacter.health),
        energy: Math.round(result.nextCharacter.energy),
        hydration: Math.round(result.nextCharacter.hydration),
      },
    ].slice(-10);

    if (result.safetyProtocolTriggered) {
      playTone('alert', state.savedProgress.muted);
      set({
        resources: result.nextResources,
        character: result.nextCharacter,
        crew: result.nextCrew,
        toggles: result.nextToggles,
        statusHistory: nextHistory,
        missionStatus: 'safety-protocol',
        capcomMessage:
          result.safetyReason ||
          'Mission Safety Protocol Activated: crew safely relocated to backup module.',
      });
      return;
    }

    // Check mission victory (completed 5 Sols)
    if (nextSol > state.maxSols) {
      const breakdown = computeMissionScore({
        crew: result.nextCrew,
        resources: result.nextResources,
        systems: state.systems,
        emergenciesResolved: state.completedScenarios.length,
        puzzlesCompleted: state.puzzlesCompletedCount,
        safetyProtocolActivated: false,
      });
      const finalScore = state.missionScore + breakdown.total * 20;

      const earnedBadges = new Set(state.savedProgress.unlockedAchievements);
      earnedBadges.add('Mission Survivor');
      if (state.puzzlesCompletedCount >= 1) earnedBadges.add('Emergency Engineer');
      if (state.waterBlocksReinforced >= 3) earnedBadges.add('Radiation Guardian');
      if (breakdown.resourceEfficiency >= 15) earnedBadges.add('Smart Resource Manager');
      if (state.completedScenarios.length >= 2) earnedBadges.add('Lifeboat Hero');

      const updatedProgress: SavedProgress = {
        ...state.savedProgress,
        bestScore: Math.max(state.savedProgress.bestScore, finalScore),
        completedMissions: state.savedProgress.completedMissions + 1,
        unlockedAchievements: Array.from(earnedBadges),
      };
      saveProgressToStorage(updatedProgress);
      playTone('success', state.savedProgress.muted);

      set({
        resources: result.nextResources,
        character: result.nextCharacter,
        crew: result.nextCrew,
        toggles: result.nextToggles,
        statusHistory: nextHistory,
        missionScore: finalScore,
        savedProgress: updatedProgress,
        missionStatus: 'success',
        capcomMessage:
          'Mission Complete, Commander! You kept the crew safe and balanced every habitat system!',
      });
      return;
    }

    // Trigger next uncompleted scenario if no emergency is currently active
    let nextEmergency = state.emergency;
    let nextSystems = { ...state.systems };
    let nextActiveLeak = state.activeLeak;
    let nextCapcom =
      result.autoPausedNotes[0] ||
      `Sol ${nextSol} underway! Inspect your gauges and collect any needed supplies.`;

    if (!nextEmergency) {
      const candidate = SCENARIOS.find(
        (s) =>
          !state.completedScenarios.includes(s.id) &&
          (s.destination === 'both' || s.destination === state.destination)
      );
      if (candidate) {
        nextEmergency = {
          scenarioId: candidate.id,
          active: true,
          selectedPlan: null,
          puzzleCompleted: false,
          countdownSeconds: 25,
        };
        for (const sys of candidate.affectedSystems) {
          nextSystems[sys] = 'Repair Required';
        }
        if (candidate.id === 'habitat-pressure-leak') {
          nextActiveLeak = true;
        }
        nextCapcom = candidate.capcomAlert;
        playTone('alert', state.savedProgress.muted);
      }
    }

    set({
      sol: nextSol,
      resources: result.nextResources,
      character: result.nextCharacter,
      crew: result.nextCrew,
      toggles: result.nextToggles,
      systems: nextSystems,
      dustStormDaysRemaining: nextDust,
      activeLeak: nextActiveLeak,
      statusHistory: nextHistory,
      emergency: nextEmergency,
      missionScore: state.missionScore + 250,
      capcomMessage: nextCapcom,
      toastMessage:
        result.autoPausedNotes[0] || `Advanced to Sol ${nextSol}. Daily simulation updated.`,
    });
  },

  tickMissionTimer: () => {
    const state = get();
    if (
      state.missionStatus !== 'active' ||
      state.viewMode !== 'interior' ||
      state.activeModal !== null ||
      state.activePuzzle !== null
    ) {
      return;
    }
    const nextElapsed = state.missionElapsedSeconds + 1;
    let nextEmergency = state.emergency;
    if (nextEmergency && nextEmergency.active && nextEmergency.countdownSeconds > 0) {
      nextEmergency = {
        ...nextEmergency,
        countdownSeconds: nextEmergency.countdownSeconds - 1,
      };
    }
    set({
      missionElapsedSeconds: nextElapsed,
      emergency: nextEmergency,
    });
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

    const nextMessages = [...state.chatMessages, userMsg];
    set({ chatMessages: nextMessages, isChatLoading: true });

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

  resetMission: (returnToSelect = true) => {
    set({
      missionStatus: returnToSelect ? 'destination-select' : 'loadout',
      viewMode: 'interior',
      activeModal: null,
      activePuzzle: null,
      puzzlePaused: false,
      emergency: null,
    });
  },
}));

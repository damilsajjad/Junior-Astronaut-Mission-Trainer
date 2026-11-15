export type Destination = 'mars' | 'moon';
export type ViewMode = 'interior' | 'first-person' | 'exterior';
export type DifficultyMode = 'cadet' | 'commander';

export type MissionStatus =
  | 'title'
  | 'destination-select'
  | 'loadout'
  | 'intro'
  | 'briefing'
  | 'active'
  | 'paused'
  | 'rescue-cinematic'
  | 'success'
  | 'safety-protocol';

export type MissionOutcome = 'victory' | 'partial' | 'safety-protocol';

export type PlanId = 'A' | 'B' | 'C';

export type PuzzleId =
  | 'circuit-reconnect'
  | 'co2-filter-adapter'
  | 'hull-patch'
  | 'diagnostic-sequence';

export type SystemId =
  | 'oxygenGenerator'
  | 'co2Scrubber'
  | 'waterRecycler'
  | 'solarArray'
  | 'batterySystem'
  | 'greenhouse'
  | 'pressureSystem'
  | 'temperatureControl'
  | 'radiationShelter';

export type SystemStatus =
  | 'Operational'
  | 'Warning'
  | 'Damaged'
  | 'Offline'
  | 'Repair Required';

export type MachineState = {
  id: SystemId;
  name: string;
  status: SystemStatus;
  condition: number; // 0-100
  powerRequirement: number;
  inputsDesc: string;
  outputDesc: string;
  fault: string | null;
  hasPowerSwitch: boolean;
  priority: number;
};

export type ResourceState = {
  oxygen: number;
  water: number;
  battery: number;
  food: number;
  co2: number;
  habitatPressure: number;
  temperatureSafety: number;
  radiationProtection: number;
};

export type CharacterState = {
  health: number;
  energy: number;
  hydration: number;
  nutrition: number;
  position: { x: number; y: number; z: number };
};

export type StatusHistoryPoint = {
  step: number;
  label: string;
  health: number;
  energy: number;
  hydration: number;
};

export type CrewTask = 'maintenance' | 'research' | 'greenhouse' | 'rest';

export type CrewMemberState = {
  id: string;
  label: string;
  role: string;
  isPlayer: boolean;
  health: number;
  hydration: number;
  nutrition: number;
  energy: number; // Physical stamina (distinct from electrical Battery)
  assignedTask: CrewTask;
  status: 'healthy' | 'warning' | 'needs-rest' | 'safe-shelter';
};

export type CropStage = 'growing' | 'ready' | 'unhealthy';

export type GreenhouseCropState = {
  growthProgress: number; // 0-100
  stage: CropStage;
  moisture: number; // 0-100
  nutrients: number; // 0-100
  harvestedCycles: number;
};

export type WaterCycleState = {
  urineBuffer: number; // 0-100 liquid waste awaiting processing
  humidityCondensate: number; // 0-100 cabin humidity condensate
  filtrationProgress: number; // 0-100 active filtration cycle
  purifyingBuffer: number; // 0-100 undergoing purification
  potableQuality: number; // 0-100 quality assurance metric
  solidWasteLevel: number; // 0-100 sealed separate solid containment (never enters water recovery)
};

export type SafetyStage = 'normal' | 'warning' | 'emergency' | 'failure';

export type SafetySystemState = {
  stage: SafetyStage;
  reason: string | null;
  triggerMetric: string | null;
  countdownSeconds: number;
};

export type RepairAnimState = {
  stationId: StationId;
  startedAt: number;
  endsAt: number;
} | null;

export type ActionAnimState = {
  type: 'drink' | 'eat' | 'pickup' | 'drop' | 'repair';
  targetCrewId?: string;
  stationId?: StationId;
  itemId?: string;
  startedAt: number;
  endsAt: number;
} | null;

export type InventoryItem = {
  id: string;
  quantity: number;
};

export type EventSeverity = 'minor' | 'moderate' | 'severe';

export type DynamicEventType =
  | 'mars-dust-storm'
  | 'moon-radiation-alert'
  | 'solar-power-reduction'
  | 'o2-circuit-failure'
  | 'co2-scrubber-failure'
  | 'habitat-pressure-leak'
  | 'water-recycler-failure'
  | 'battery-malfunction'
  | 'temperature-control-failure';

export type EmergencyState = {
  scenarioId: string;
  eventType: DynamicEventType;
  severity: EventSeverity;
  durationDays: number;
  daysActive: number;
  warningStage: 'forecast' | 'active' | 'escalated';
  active: boolean;
  selectedPlan: PlanId | null;
  puzzleCompleted: boolean;
  countdownSeconds: number;
};

export type ForecastInfo = {
  nextSol: number;
  eventId: string | null;
  title: string;
  severity: EventSeverity | 'calm';
  advisory: string;
};

export type MissionObjectivesState = {
  lifeSupportMaintained: boolean;
  researchProgress: number; // 0-100
  researchCompleted: boolean;
  survivedAllDays: boolean;
};

export type SystemToggleState = {
  oxygenGenerator: boolean;
  co2Scrubber: boolean;
  waterRecycler: boolean;
  greenhouse: boolean;
  solarArray: boolean;
  batterySystem: boolean;
  temperatureControl: boolean;
  researchSystems: boolean;
};

export type SystemConditionMap = Record<SystemId, SystemStatus>;
export type MachineConditionMap = Record<SystemId, number>;

export type StationId =
  | 'mission-control'
  | 'oxygen-generator'
  | 'co2-scrubber'
  | 'water-recycler'
  | 'greenhouse'
  | 'solar-array'
  | 'battery-system'
  | 'water-dispenser'
  | 'toilet-facility'
  | 'food-cabinet'
  | 'tool-cabinet'
  | 'crew-bunks'
  | 'manual-terminal'
  | 'radiation-shelter'
  | 'water-blocks';

export type WorldPickup = {
  uid: string;
  itemId: string;
  label: string;
  zone: 'interior' | 'airlock-bay';
  position: { x: number; y: number; z: number };
  collected: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  source?: string;
};

export type MissionEventLog = {
  id: string;
  sol: number;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
};

export type PlanOptionConfig = {
  id: PlanId;
  title: string;
  description: string;
  requiredItemId?: string;
  requiredItemQty?: number;
  requiresPuzzle?: PuzzleId;
  requiresLowPower?: boolean;
  effectSummary: string;
  resourceDelta: Partial<ResourceState>;
  restoresSystem?: SystemId;
  activatesShelter?: boolean;
};

export type ScenarioConfig = {
  id: string;
  eventType: DynamicEventType;
  title: string;
  shortLabel: string;
  destination: Destination | 'both';
  introStory: string;
  triggerSol: number;
  affectedSystems: SystemId[];
  solarModifier?: number;
  dustStormDays?: number;
  pressureLeakPerTurn?: number;
  plans: Record<PlanId, PlanOptionConfig>;
  puzzleId: PuzzleId;
  scienceExplanation: string;
  capcomAlert: string;
  capcomSuccess: string;
  sourceUrls: { label: string; url: string }[];
};

export type SavedProgress = {
  bestScore: number;
  completedMissions: number;
  unlockedAchievements: string[];
  lastDestination: Destination;
  muted: boolean;
  volume: number;
  reducedMotion: boolean;
  lowGraphics: boolean;
  introWatchedMars: boolean;
  introWatchedMoon: boolean;
};

export type ScheduledEventSpec = {
  sol: number;
  scenarioId: string;
  severity: EventSeverity;
  durationDays: number;
};

export type SavedMissionSnapshot = {
  savedAt: number;
  destination: Destination;
  difficulty: DifficultyMode;
  missionSeed: number;
  sol: number;
  solElapsedSeconds: number;
  maxSols: number;
  missionScore: number;
  missionElapsedSeconds: number;
  resources: ResourceState;
  character: CharacterState;
  crew: CrewMemberState[];
  inventory: InventoryItem[];
  sharedFoodStorage?: InventoryItem[];
  worldPickups: WorldPickup[];
  systems: SystemConditionMap;
  machineConditions: MachineConditionMap;
  toggles: SystemToggleState;
  greenhouseState: GreenhouseCropState;
  waterCycle: WaterCycleState;
  safety: SafetySystemState;
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
  statusHistory: StatusHistoryPoint[];
  eventLog: MissionEventLog[];
  viewMode: ViewMode;
};

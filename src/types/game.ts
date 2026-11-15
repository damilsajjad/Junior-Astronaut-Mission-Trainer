export type Destination = 'mars' | 'moon';
export type ViewMode = 'interior' | 'exterior';
export type DifficultyMode = 'cadet' | 'commander';

export type MissionStatus =
  | 'title'
  | 'destination-select'
  | 'loadout'
  | 'intro'
  | 'briefing'
  | 'active'
  | 'paused'
  | 'success'
  | 'safety-protocol';

export type PlanId = 'A' | 'B' | 'C';

export type PuzzleId = 'circuit-reconnect' | 'co2-filter-adapter' | 'hull-patch';

export type SystemId =
  | 'oxygenGenerator'
  | 'co2Scrubber'
  | 'waterRecycler'
  | 'powerPanel'
  | 'solarArray'
  | 'greenhouse'
  | 'pressureSystem'
  | 'radiationShelter';

export type SystemStatus =
  | 'Operational'
  | 'Warning'
  | 'Damaged'
  | 'Offline'
  | 'Repair Required';

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
  position: { x: number; y: number; z: number };
};

export type StatusHistoryPoint = {
  step: number;
  label: string;
  health: number;
  energy: number;
  hydration: number;
};

export type CrewMemberState = {
  id: string;
  label: string;
  role: string;
  isPlayer: boolean;
  health: number;
  status: 'healthy' | 'warning' | 'needs-rest' | 'safe-shelter';
};

export type InventoryItem = {
  id: string;
  quantity: number;
};

export type EmergencyState = {
  scenarioId: string;
  active: boolean;
  selectedPlan: PlanId | null;
  puzzleCompleted: boolean;
  countdownSeconds: number;
};

export type SystemToggleState = {
  oxygenGenerator: boolean;
  co2Scrubber: boolean;
  waterRecycler: boolean;
  greenhouse: boolean;
  researchSystems: boolean;
};

export type SystemConditionMap = Record<SystemId, SystemStatus>;

export type StationId =
  | 'mission-control'
  | 'oxygen-generator'
  | 'co2-scrubber'
  | 'power-panel'
  | 'water-recycler'
  | 'greenhouse'
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
  reducedMotion: boolean;
  lowGraphics: boolean;
  introWatchedMars: boolean;
  introWatchedMoon: boolean;
};

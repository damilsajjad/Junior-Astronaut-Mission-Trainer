import {
  CharacterState,
  CrewMemberState,
  Destination,
  DifficultyMode,
  EmergencyState,
  GreenhouseCropState,
  MachineConditionMap,
  MachineState,
  MissionObjectivesState,
  MissionOutcome,
  ResourceState,
  SafetySystemState,
  SystemConditionMap,
  SystemId,
  SystemToggleState,
  WaterCycleState,
} from '../types/game';
import { severityMultiplier } from './eventDirector';

export const PLAYER_SPEED = 3.0; // world units per second
export const INTERACTION_DISTANCE = 2.0; // world units
export const MAX_MISSION_DAYS = 10;
export const SOL_DURATION_SECONDS = 48; // 1 simulated Sol = 48 real-time seconds

/**
 * Single authoritative baseline rates per Sol.
 * Continuous ticks divide per-Sol rates by SOL_DURATION_SECONDS so live gameplay
 * and End-of-Sol projections stay 100% mathematically consistent.
 */
export const SIM_RATES = {
  crewO2UsePerSol: 8.5,
  crewWaterUsePerSol: 6.5,
  crewFoodUsePerSol: 6.5,
  crewCo2OutPerSol: 12.0,
  o2ProducedPerSol: 12.0,
  waterForO2PerSol: 2.2,
  waterRecoveredPerSol: 7.5,
  waterForGreenhousePerSol: 2.0,
  co2RemovedPerSol: 15.0,
  solarBaseGenPerSol: 24.0,
  batteryLeakPerSol: 8.0,
  pressureLossPerLeakSol: 12.0,
  pressureLossNoPowerSol: 6.0,
  tempGainActiveSol: 5.5,
  tempLossOffSol: 10.0,
  tempLossDamagedSol: 14.0,
  radLossActiveSol: 8.0,
  radLossUnshieldedSol: 14.0,
  radPassiveRecoverySol: 3.0,
  greenhouseCropCyclesPerSol: 1.25, // ~38s for one full hydroponic harvest cycle
} as const;

export const INITIAL_TUTORIAL_RESOURCES: ResourceState = {
  oxygen: 84,
  water: 86,
  battery: 78,
  food: 82,
  co2: 24,
  habitatPressure: 100,
  temperatureSafety: 100,
  radiationProtection: 82,
};

export const INITIAL_CHARACTER_STATE: CharacterState = {
  health: 100,
  energy: 100,
  hydration: 100,
  nutrition: 92,
  position: { x: 0, y: 0, z: 0.45 },
};

export const INITIAL_GREENHOUSE_STATE: GreenhouseCropState = {
  growthProgress: 38,
  stage: 'growing',
  moisture: 88,
  nutrients: 92,
  harvestedCycles: 0,
};

export const INITIAL_WATER_CYCLE_STATE: WaterCycleState = {
  urineBuffer: 22,
  humidityCondensate: 18,
  filtrationProgress: 45,
  purifyingBuffer: 14,
  potableQuality: 98,
  solidWasteLevel: 12,
};

export const INITIAL_MACHINE_CONDITIONS: MachineConditionMap = {
  oxygenGenerator: 96,
  co2Scrubber: 95,
  waterRecycler: 96,
  solarArray: 95,
  batterySystem: 96,
  greenhouse: 95,
  pressureSystem: 98,
  temperatureControl: 96,
  radiationShelter: 96,
};

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function clampFloat(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val * 100) / 100));
}

export function isMachineHealthy(status: string, condition: number): boolean {
  return (
    status !== 'Damaged' &&
    status !== 'Offline' &&
    status !== 'Repair Required' &&
    condition > 25
  );
}

export function buildMachineCatalog(params: {
  systems: SystemConditionMap;
  machineConditions: MachineConditionMap;
  toggles: SystemToggleState;
  resources: ResourceState;
  dustStormDaysRemaining: number;
  destination: Destination;
  greenhouseState?: GreenhouseCropState;
  waterCycle?: WaterCycleState;
}): MachineState[] {
  const {
    systems,
    machineConditions,
    toggles,
    resources,
    dustStormDaysRemaining,
    destination,
    greenhouseState,
    waterCycle,
  } = params;
  const solarFault = !isMachineHealthy(systems.solarArray, machineConditions.solarArray);
  const dustCut = destination === 'mars' && dustStormDaysRemaining > 0;

  return [
    {
      id: 'oxygenGenerator',
      name: 'Oxygen Generator (Electrolysis)',
      status: toggles.oxygenGenerator ? systems.oxygenGenerator : 'Offline',
      condition: clamp(machineConditions.oxygenGenerator),
      powerRequirement: 6,
      inputsDesc: '6 PWR + 2.2 H₂O / Sol',
      outputDesc:
        toggles.oxygenGenerator && isMachineHealthy(systems.oxygenGenerator, machineConditions.oxygenGenerator) && resources.water >= 2
          ? `+${SIM_RATES.o2ProducedPerSol} O₂ / Sol`
          : '0 O₂ (OFF, fault, or dry)',
      fault: !isMachineHealthy(systems.oxygenGenerator, machineConditions.oxygenGenerator)
        ? 'Control harness fault — repair circuit'
        : resources.water < 2
          ? 'Missing input: Clean water reserve too low'
          : null,
      hasPowerSwitch: true,
      priority: 2,
    },
    {
      id: 'co2Scrubber',
      name: 'CO₂ Scrubber Air Cleaner',
      status: toggles.co2Scrubber ? systems.co2Scrubber : 'Offline',
      condition: clamp(machineConditions.co2Scrubber),
      powerRequirement: 4,
      inputsDesc: '4 PWR + Filter',
      outputDesc:
        toggles.co2Scrubber && isMachineHealthy(systems.co2Scrubber, machineConditions.co2Scrubber)
          ? `-${SIM_RATES.co2RemovedPerSol} CO₂ / Sol (cleans air)`
          : '0 CO₂ removed (OFF or fault)',
      fault: !isMachineHealthy(systems.co2Scrubber, machineConditions.co2Scrubber)
        ? 'Clogged CO₂ cartridge — swap or adapt filter'
        : null,
      hasPowerSwitch: true,
      priority: 3,
    },
    {
      id: 'waterRecycler',
      name: 'Water Recycler',
      status: toggles.waterRecycler ? systems.waterRecycler : 'Offline',
      condition: clamp(machineConditions.waterRecycler),
      powerRequirement: 4,
      inputsDesc: `4 PWR + Urine/Humidity (${Math.round((waterCycle?.urineBuffer ?? 20) + (waterCycle?.humidityCondensate ?? 15))}%)`,
      outputDesc:
        toggles.waterRecycler && isMachineHealthy(systems.waterRecycler, machineConditions.waterRecycler)
          ? `Purifies -> +${SIM_RATES.waterRecoveredPerSol} Potable H₂O / Sol`
          : '0 H₂O recovered (OFF or fault)',
      fault: !isMachineHealthy(systems.waterRecycler, machineConditions.waterRecycler)
        ? 'Distillation pump fault — seal & repair'
        : null,
      hasPowerSwitch: true,
      priority: 5,
    },
    {
      id: 'greenhouse',
      name: 'Hydroponic Greenhouse',
      status: toggles.greenhouse ? systems.greenhouse : 'Offline',
      condition: clamp(machineConditions.greenhouse),
      powerRequirement: 4,
      inputsDesc: '4 PWR + 2 H₂O / Sol',
      outputDesc:
        greenhouseState?.stage === 'ready'
          ? 'Crops 100% READY — Walk up to Harvest!'
          : toggles.greenhouse && isMachineHealthy(systems.greenhouse, machineConditions.greenhouse) && resources.water >= 2
            ? `Growing (${Math.round(greenhouseState?.growthProgress ?? 0)}%)`
            : 'Growth paused (OFF, fault, or dry)',
      fault: !isMachineHealthy(systems.greenhouse, machineConditions.greenhouse)
        ? 'Grow-light ballast warning'
        : resources.water < 2
          ? 'Missing input: Water needed for hydroponics'
          : greenhouseState?.stage === 'unhealthy'
            ? 'Crops wilting — restore power & water!'
            : null,
      hasPowerSwitch: true,
      priority: 6,
    },
    {
      id: 'solarArray',
      name: 'Solar Power System',
      status: toggles.solarArray ? systems.solarArray : 'Offline',
      condition: clamp(machineConditions.solarArray),
      powerRequirement: 0,
      inputsDesc: 'Sunlight',
      outputDesc: !toggles.solarArray
        ? '0 PWR (Array isolated OFF)'
        : solarFault || dustCut
          ? '+8 to +10 PWR / Sol (Reduced)'
          : `+${SIM_RATES.solarBaseGenPerSol} PWR / Sol`,
      fault: solarFault
        ? 'Dust / gimbal relay fault reducing solar yield'
        : dustCut
          ? 'Martian dust storm blocking sunlight'
          : null,
      hasPowerSwitch: true,
      priority: 0,
    },
    {
      id: 'batterySystem',
      name: 'Battery System',
      status: toggles.batterySystem ? systems.batterySystem : 'Offline',
      condition: clamp(machineConditions.batterySystem),
      powerRequirement: 0,
      inputsDesc: 'Solar Charge Buffer',
      outputDesc: !toggles.batterySystem
        ? 'Discharge locked OFF (emergency reserve)'
        : `Stores & supplies ${Math.round(resources.battery)}% Power`,
      fault: !isMachineHealthy(systems.batterySystem, machineConditions.batterySystem)
        ? 'Overheated cell leaking -8 PWR / Sol'
        : null,
      hasPowerSwitch: true,
      priority: 0,
    },
    {
      id: 'pressureSystem',
      name: 'Habitat Pressure System',
      status: systems.pressureSystem,
      condition: clamp(machineConditions.pressureSystem),
      powerRequirement: 2,
      inputsDesc: '2 PWR / Sol',
      outputDesc: 'Maintains 100% airtight cabin pressure',
      fault: !isMachineHealthy(systems.pressureSystem, machineConditions.pressureSystem)
        ? 'Hull seal breach leaking air pressure'
        : null,
      hasPowerSwitch: false,
      priority: 1,
    },
    {
      id: 'temperatureControl',
      name: 'Temperature Control Loop',
      status: toggles.temperatureControl ? systems.temperatureControl : 'Offline',
      condition: clamp(machineConditions.temperatureControl),
      powerRequirement: 4,
      inputsDesc: '4 PWR / Sol',
      outputDesc: toggles.temperatureControl ? 'Maintains warm cabin (+5.5 Temp)' : 'Heater OFF (-10 Temp/Sol)',
      fault: !isMachineHealthy(systems.temperatureControl, machineConditions.temperatureControl)
        ? 'Thermal coolant valve stuck'
        : null,
      hasPowerSwitch: true,
      priority: 4,
    },
    {
      id: 'radiationShelter',
      name: 'Radiation Shelter & Water Wall',
      status: systems.radiationShelter,
      condition: clamp(machineConditions.radiationShelter),
      powerRequirement: 0,
      inputsDesc: 'Structural Walls + Water Bags',
      outputDesc: `Shielding at ${Math.round(resources.radiationProtection)}%`,
      fault: !isMachineHealthy(systems.radiationShelter, machineConditions.radiationShelter)
        ? 'Deploy shielding liner or position water bags'
        : null,
      hasPowerSwitch: false,
      priority: 0,
    },
  ];
}

export type ResourceAlertInfo = {
  id: string;
  label: string;
  value: number;
  severity: 'warning' | 'critical';
  message: string;
};

export function evaluateThresholds(
  resources: ResourceState,
  character: CharacterState,
  crew?: CrewMemberState[]
): ResourceAlertInfo[] {
  const alerts: ResourceAlertInfo[] = [];

  if (resources.oxygen <= 22) {
    alerts.push({
      id: 'oxygen',
      label: 'Oxygen Critical',
      value: Math.round(resources.oxygen),
      severity: 'critical',
      message: 'Oxygen is critically low! Repair/enable Oxygen Generator or use Emergency O₂.',
    });
  } else if (resources.oxygen <= 40) {
    alerts.push({
      id: 'oxygen',
      label: 'Oxygen Warning',
      value: Math.round(resources.oxygen),
      severity: 'warning',
      message: 'Oxygen reserve is dropping below 40%.',
    });
  }

  if (resources.water <= 20) {
    alerts.push({
      id: 'water',
      label: 'Water Critical',
      value: Math.round(resources.water),
      severity: 'critical',
      message: 'Water reserve is critically low! Electrolysis & Greenhouse need water.',
    });
  } else if (resources.water <= 35) {
    alerts.push({
      id: 'water',
      label: 'Water Warning',
      value: Math.round(resources.water),
      severity: 'warning',
      message: 'Potable water reserve is below 35%. Keep Water Recycler ON.',
    });
  }

  if (resources.battery <= 15) {
    alerts.push({
      id: 'battery',
      label: 'Battery Critical',
      value: Math.round(resources.battery),
      severity: 'critical',
      message: 'Battery critical! Switch OFF Greenhouse & Research to protect life support.',
    });
  } else if (resources.battery <= 35) {
    alerts.push({
      id: 'battery',
      label: 'Battery Warning',
      value: Math.round(resources.battery),
      severity: 'warning',
      message: 'Battery reserve is low (<=35%). Watch power draw.',
    });
  }

  if (resources.food <= 15) {
    alerts.push({
      id: 'food',
      label: 'Food Critical',
      value: Math.round(resources.food),
      severity: 'critical',
      message: 'Food supplies critically low! Grow & harvest Greenhouse crops.',
    });
  } else if (resources.food <= 35) {
    alerts.push({
      id: 'food',
      label: 'Food Warning',
      value: Math.round(resources.food),
      severity: 'warning',
      message: 'Food supply is below 35%. Check Greenhouse harvest.',
    });
  }

  if (resources.co2 >= 75) {
    alerts.push({
      id: 'co2',
      label: 'CO₂ Critical',
      value: Math.round(resources.co2),
      severity: 'critical',
      message: 'Cabin CO₂ is dangerously high! Fix or enable the CO₂ Scrubber!',
    });
  } else if (resources.co2 >= 50) {
    alerts.push({
      id: 'co2',
      label: 'CO₂ Warning',
      value: Math.round(resources.co2),
      severity: 'warning',
      message: 'Carbon dioxide is rising (>=50%). Check the CO₂ Scrubber.',
    });
  }

  if (resources.habitatPressure <= 62) {
    alerts.push({
      id: 'pressure',
      label: 'Pressure Critical',
      value: Math.round(resources.habitatPressure),
      severity: 'critical',
      message: 'Habitat air pressure is critically low! Seal hull breaches immediately.',
    });
  } else if (resources.habitatPressure <= 82) {
    alerts.push({
      id: 'pressure',
      label: 'Pressure Warning',
      value: Math.round(resources.habitatPressure),
      severity: 'warning',
      message: 'Habitat air pressure dropped below 82%.',
    });
  }

  if (resources.temperatureSafety <= 42) {
    alerts.push({
      id: 'temperature',
      label: 'Temperature Critical',
      value: Math.round(resources.temperatureSafety),
      severity: 'critical',
      message: 'Cabin temperature is freezing! Restore Temperature Control power.',
    });
  } else if (resources.temperatureSafety <= 68) {
    alerts.push({
      id: 'temperature',
      label: 'Temperature Warning',
      value: Math.round(resources.temperatureSafety),
      severity: 'warning',
      message: 'Cabin temperature is dropping below 68%.',
    });
  }

  if (resources.radiationProtection <= 32) {
    alerts.push({
      id: 'radiation',
      label: 'Radiation Critical',
      value: Math.round(resources.radiationProtection),
      severity: 'critical',
      message: 'Radiation shielding is critical! Move crew to Shelter & position water bags.',
    });
  } else if (resources.radiationProtection <= 55) {
    alerts.push({
      id: 'radiation',
      label: 'Radiation Warning',
      value: Math.round(resources.radiationProtection),
      severity: 'warning',
      message: 'Radiation protection is below 55%. Check shelter shielding.',
    });
  }

  const minHealth = crew?.length ? Math.min(...crew.map((c) => c.health)) : character.health;
  const minHyd = crew?.length ? Math.min(...crew.map((c) => c.hydration)) : character.hydration;
  const minNutr = crew?.length ? Math.min(...crew.map((c) => c.nutrition)) : character.nutrition;
  const minEn = crew?.length ? Math.min(...crew.map((c) => c.energy)) : character.energy;

  if (minHealth <= 28 || minHyd <= 20 || minNutr <= 20 || minEn <= 18) {
    alerts.push({
      id: 'crew-health',
      label: 'Astronaut Status Critical',
      value: Math.round(Math.min(minHealth, minHyd, minNutr, minEn)),
      severity: 'critical',
      message: 'A crewmate needs Water, Food, Rest, or Medical care!',
    });
  }

  return alerts;
}

/**
 * Evaluates the Three-Stage Safety System:
 * Stage 1 (Warning) -> Stage 2 (Emergency + live countdown) -> Stage 3 (Mission Failure -> Rescue Protocol)
 */
export function evaluateSafetySystem(params: {
  prevSafety: SafetySystemState;
  resources: ResourceState;
  crew: CrewMemberState[];
  dtSec: number;
}): SafetySystemState {
  const { prevSafety, resources, crew, dtSec } = params;
  const minHealth = crew.length > 0 ? Math.min(...crew.map((c) => c.health)) : 100;

  // Immediate unrecoverable floor check (Stage 3)
  if (resources.oxygen <= 0) {
    return {
      stage: 'failure',
      triggerMetric: 'oxygen',
      reason: 'Oxygen reserves reached 0%. Safety Protocol initiated Earth Rescue launch.',
      countdownSeconds: 0,
    };
  }
  if (resources.co2 >= 95) {
    return {
      stage: 'failure',
      triggerMetric: 'co2',
      reason: 'Cabin CO₂ reached toxic levels (>=95%). Crew sealed in safe module for Earth Rescue.',
      countdownSeconds: 0,
    };
  }
  if (resources.habitatPressure <= 35) {
    return {
      stage: 'failure',
      triggerMetric: 'pressure',
      reason: 'Habitat pressure fell below survivable limits (<=35%). Crew sealed in safe backup shelter.',
      countdownSeconds: 0,
    };
  }
  if (resources.temperatureSafety <= 15) {
    return {
      stage: 'failure',
      triggerMetric: 'temperature',
      reason: 'Habitat temperature plunged below survival limits (<=15%). Crew evacuated to thermal core.',
      countdownSeconds: 0,
    };
  }
  if (minHealth <= 10) {
    return {
      stage: 'failure',
      triggerMetric: 'crew-health',
      reason: 'An astronaut’s medical condition reached critical minimum. Emergency Rescue Protocol activated.',
      countdownSeconds: 0,
    };
  }

  // Stage 2 Emergency triggers (recoverable while countdown > 0)
  let emergMetric: string | null = null;
  let emergReason: string | null = null;
  let bufferCountdown = 30;

  if (resources.oxygen <= 18) {
    emergMetric = 'oxygen';
    emergReason = 'STAGE 2 EMERGENCY: Oxygen critically low! Fix O₂ Generator or use Reserve O₂!';
    bufferCountdown = Math.max(12, Math.round(resources.oxygen * 1.5));
  } else if (resources.co2 >= 80) {
    emergMetric = 'co2';
    emergReason = 'STAGE 2 EMERGENCY: Cabin CO₂ dangerous! Restore CO₂ Scrubber immediately!';
    bufferCountdown = Math.max(12, Math.round((95 - resources.co2) * 1.8));
  } else if (resources.habitatPressure <= 55) {
    emergMetric = 'pressure';
    emergReason = 'STAGE 2 EMERGENCY: Hull Pressure failing! Patch the leak immediately!';
    bufferCountdown = Math.max(12, Math.round((resources.habitatPressure - 35) * 1.4));
  } else if (resources.temperatureSafety <= 32) {
    emergMetric = 'temperature';
    emergReason = 'STAGE 2 EMERGENCY: Freezing cabin! Restore Temperature Control power!';
    bufferCountdown = Math.max(12, Math.round((resources.temperatureSafety - 15) * 1.5));
  } else if (minHealth <= 24) {
    emergMetric = 'crew-health';
    emergReason = 'STAGE 2 EMERGENCY: Crew health critical! Hydrate, feed, or heal crewmates!';
    bufferCountdown = Math.max(14, Math.round((minHealth - 10) * 1.8));
  }

  if (emergMetric && emergReason) {
    const nextCountdown =
      prevSafety.stage === 'emergency' && prevSafety.triggerMetric === emergMetric
        ? Math.max(0, prevSafety.countdownSeconds - dtSec)
        : bufferCountdown;

    if (nextCountdown <= 0) {
      return {
        stage: 'failure',
        triggerMetric: emergMetric,
        reason: `${emergReason.replace('STAGE 2 EMERGENCY: ', '')} Countdown expired -> Safe State & Earth Rescue.`,
        countdownSeconds: 0,
      };
    }

    return {
      stage: 'emergency',
      triggerMetric: emergMetric,
      reason: emergReason,
      countdownSeconds: nextCountdown,
    };
  }

  // Stage 1 Warning triggers
  if (
    resources.oxygen <= 40 ||
    resources.co2 >= 52 ||
    resources.habitatPressure <= 80 ||
    resources.temperatureSafety <= 65 ||
    resources.water <= 30 ||
    resources.radiationProtection <= 48 ||
    minHealth <= 48
  ) {
    const reason =
      resources.oxygen <= 40
        ? 'Stage 1 Warning: Oxygen reserve below 40%.'
        : resources.co2 >= 52
          ? 'Stage 1 Warning: Cabin CO₂ rising above 52%.'
          : resources.water <= 30
            ? 'Stage 1 Warning: Water reserve below 30%.'
            : resources.habitatPressure <= 80
              ? 'Stage 1 Warning: Hull pressure dropping.'
              : resources.temperatureSafety <= 65
                ? 'Stage 1 Warning: Cabin cooling down.'
                : resources.radiationProtection <= 48
                  ? 'Stage 1 Warning: Radiation shielding weakened.'
                  : 'Stage 1 Warning: Crew vitals require attention.';

    return {
      stage: 'warning',
      triggerMetric: null,
      reason,
      countdownSeconds: 0,
    };
  }

  return {
    stage: 'normal',
    triggerMetric: null,
    reason: null,
    countdownSeconds: 0,
  };
}

export type ContinuousTickResult = {
  nextResources: ResourceState;
  nextCharacter: CharacterState;
  nextCrew: CrewMemberState[];
  nextToggles: SystemToggleState;
  nextMachineConditions: MachineConditionMap;
  nextSystems: SystemConditionMap;
  nextGreenhouse: GreenhouseCropState;
  nextWaterCycle: WaterCycleState;
  nextSafety: SafetySystemState;
  solarGeneratedPerSol: number;
  powerUsedPerSol: number;
  researchGain: number;
  autoPausedNotes: string[];
  unmetInputNotes: string[];
};

/**
 * Authoritative continuous simulation tick used on every live game second AND internally
 * integrated cleanly with End-of-Sol projections.
 * Never pauses while walking, exploring, or viewing machines.
 */
export function stepContinuousSimulation(
  params: {
    destination: Destination;
    difficulty: DifficultyMode;
    resources: ResourceState;
    character: CharacterState;
    crew: CrewMemberState[];
    toggles: SystemToggleState;
    systems: SystemConditionMap;
    machineConditions: MachineConditionMap;
    greenhouseState: GreenhouseCropState;
    waterCycle: WaterCycleState;
    safety: SafetySystemState;
    dustStormDaysRemaining: number;
    activeLeak: boolean;
    activeRadiationHazard: boolean;
    emergency: EmergencyState | null;
  },
  dtSec: number
): ContinuousTickResult {
  const {
    destination,
    difficulty,
    resources,
    character,
    crew,
    toggles,
    systems,
    machineConditions,
    greenhouseState,
    waterCycle,
    safety,
    dustStormDaysRemaining,
    activeLeak,
    activeRadiationHazard,
    emergency,
  } = params;

  const solFrac = Math.max(0, dtSec) / SOL_DURATION_SECONDS;
  const diffScale = difficulty === 'commander' ? 1.15 : 1.0;

  const nextToggles = { ...toggles };
  const nextConds: MachineConditionMap = { ...machineConditions };
  const nextSystems: SystemConditionMap = { ...systems };
  const autoPausedNotes: string[] = [];
  const unmetInputNotes: string[] = [];

  // 1. Solar Generation & Battery Budget (per-Sol equivalent rate -> scaled by solFrac)
  const solarHealthy = isMachineHealthy(systems.solarArray, nextConds.solarArray);
  const solarEfficiency = Math.max(0.25, nextConds.solarArray / 100);
  const dustCut = destination === 'mars' && dustStormDaysRemaining > 0;
  let solarGenPerSol = nextToggles.solarArray
    ? Math.round(SIM_RATES.solarBaseGenPerSol * solarEfficiency)
    : 0;

  if (nextToggles.solarArray && !solarHealthy) {
    const dmgBase = nextConds.solarArray <= 20 ? 3 : Math.max(4, Math.round(9 * (nextConds.solarArray / 100)));
    solarGenPerSol = dustCut ? Math.max(2, Math.round(dmgBase * 0.6)) : dmgBase;
  } else if (nextToggles.solarArray && dustCut) {
    const stormSev = emergency?.eventType === 'mars-dust-storm' ? severityMultiplier(emergency.severity) : 1.0;
    solarGenPerSol = Math.max(5, Math.round(10 / stormSev));
  }

  const batteryHealthy = isMachineHealthy(systems.batterySystem, nextConds.batterySystem);
  const batteryLeakPerSol = !batteryHealthy ? SIM_RATES.batteryLeakPerSol : 0;
  const batteryUsable = nextToggles.batterySystem ? resources.battery : 0;
  const effectiveSupplyPool = batteryUsable + solarGenPerSol * Math.max(solFrac, 1 / SOL_DURATION_SECONDS);

  // Power Priority Allocation (using instantaneous Sol budget check against battery + solar flow)
  const powerBudgetPerSol = batteryUsable > 1 ? 999 : solarGenPerSol;
  let powerUsedPerSol = 0;

  // Priority 1: Habitat Pressure (2 PWR)
  const pressureHealthy = isMachineHealthy(systems.pressureSystem, nextConds.pressureSystem);
  let pressurePowered = false;
  if (powerBudgetPerSol - powerUsedPerSol >= 2 && (effectiveSupplyPool > 0.05 || solarGenPerSol >= 2)) {
    powerUsedPerSol += 2;
    pressurePowered = true;
  } else {
    autoPausedNotes.push('No power for Habitat Pressure circulation!');
  }

  // Priority 2: Oxygen Generator (6 PWR + Water >= 2)
  const o2Healthy = isMachineHealthy(systems.oxygenGenerator, nextConds.oxygenGenerator);
  let o2Active = false;
  if (nextToggles.oxygenGenerator && o2Healthy) {
    if (resources.water < 2) {
      unmetInputNotes.push('Oxygen Generator lacked Water (<2%) and produced 0 O₂.');
    } else if (powerBudgetPerSol - powerUsedPerSol >= 6) {
      powerUsedPerSol += 6;
      o2Active = true;
    } else {
      autoPausedNotes.push('Low power: Oxygen Generator could not run (needs 6 PWR).');
    }
  }

  // Priority 3: CO2 Scrubber (4 PWR)
  const co2Healthy = isMachineHealthy(systems.co2Scrubber, nextConds.co2Scrubber);
  let co2Active = false;
  if (nextToggles.co2Scrubber && co2Healthy) {
    if (powerBudgetPerSol - powerUsedPerSol >= 4) {
      powerUsedPerSol += 4;
      co2Active = true;
    } else {
      autoPausedNotes.push('Low power: CO₂ Scrubber paused (needs 4 PWR).');
    }
  }

  // Priority 4: Temperature Control (4 PWR)
  const tempHealthy = isMachineHealthy(systems.temperatureControl, nextConds.temperatureControl);
  let tempActive = false;
  if (nextToggles.temperatureControl && tempHealthy) {
    if (powerBudgetPerSol - powerUsedPerSol >= 4) {
      powerUsedPerSol += 4;
      tempActive = true;
    } else {
      autoPausedNotes.push('Low power: Temperature Control paused (needs 4 PWR).');
    }
  }

  // Priority 5: Water Recycler (4 PWR)
  const waterHealthy = isMachineHealthy(systems.waterRecycler, nextConds.waterRecycler);
  let waterActive = false;
  if (nextToggles.waterRecycler && waterHealthy) {
    if (powerBudgetPerSol - powerUsedPerSol >= 4) {
      powerUsedPerSol += 4;
      waterActive = true;
    } else {
      nextToggles.waterRecycler = false;
      autoPausedNotes.push('Low power: Water Recycler paused to protect O₂ & CO₂.');
    }
  }

  // Priority 6: Greenhouse (4 PWR + Water >= 2)
  const greenHealthy = isMachineHealthy(systems.greenhouse, nextConds.greenhouse);
  let greenhouseActive = false;
  if (nextToggles.greenhouse && greenHealthy) {
    if (resources.water < 2) {
      unmetInputNotes.push('Greenhouse lacked Water (<2%) — crops drying.');
    } else if (powerBudgetPerSol - powerUsedPerSol >= 4) {
      powerUsedPerSol += 4;
      greenhouseActive = true;
    } else {
      nextToggles.greenhouse = false;
      autoPausedNotes.push('Low power: Greenhouse paused to protect life support.');
    }
  }

  // Priority 7: Research Equipment (4 PWR)
  let researchActive = false;
  if (nextToggles.researchSystems) {
    if (powerBudgetPerSol - powerUsedPerSol >= 4) {
      powerUsedPerSol += 4;
      researchActive = true;
    } else {
      nextToggles.researchSystems = false;
      autoPausedNotes.push('Low power: Research Equipment paused automatically.');
    }
  }

  const batteryDelta = (solarGenPerSol - powerUsedPerSol - batteryLeakPerSol) * solFrac;
  const nextBattery = nextToggles.batterySystem
    ? clampFloat(resources.battery + batteryDelta)
    : clampFloat(resources.battery - batteryLeakPerSol * solFrac);

  // 2. Crew Assignments & Gradual Wear
  const maintCrewCount = crew.filter((c) => !c.isPlayer && c.assignedTask === 'maintenance' && c.health > 25).length;
  const researchCrewCount = crew.filter((c) => !c.isPlayer && c.assignedTask === 'research' && c.health > 25).length;
  const greenCrewCount = crew.filter((c) => !c.isPlayer && c.assignedTask === 'greenhouse' && c.health > 25).length;

  if (o2Active) nextConds.oxygenGenerator = clampFloat(nextConds.oxygenGenerator - 1.8 * solFrac, 10, 100);
  if (co2Active) nextConds.co2Scrubber = clampFloat(nextConds.co2Scrubber - 2.6 * solFrac, 10, 100);
  if (waterActive) nextConds.waterRecycler = clampFloat(nextConds.waterRecycler - 1.8 * solFrac, 10, 100);
  if (greenhouseActive) nextConds.greenhouse = clampFloat(nextConds.greenhouse - 1.6 * solFrac, 10, 100);

  if (maintCrewCount > 0) {
    const sysKeys = Object.keys(nextConds) as SystemId[];
    let weakest: SystemId = 'oxygenGenerator';
    let minVal = 101;
    for (const k of sysKeys) {
      if (isMachineHealthy(nextSystems[k], nextConds[k]) && nextConds[k] < minVal) {
        minVal = nextConds[k];
        weakest = k;
      }
    }
    nextConds[weakest] = clampFloat(nextConds[weakest] + 6 * maintCrewCount * solFrac);
  }

  // Flag degraded status if condition falls low
  (Object.keys(nextConds) as SystemId[]).forEach((sys) => {
    if (nextConds[sys] <= 25 && nextSystems[sys] === 'Operational') {
      nextSystems[sys] = 'Repair Required';
    }
  });

  const researchGain = researchActive ? (22 + researchCrewCount * 14) * solFrac : 0;

  // 3. Scientific Water-Recovery Pipeline (Urine + Cabin Humidity -> Filtration -> Purification -> Quality Check -> Potable Storage)
  // Solid Waste accumulates in separate containment and NEVER enters water recovery!
  const nextWaterCycle: WaterCycleState = {
    ...waterCycle,
    urineBuffer: clampFloat(waterCycle.urineBuffer + 4.5 * diffScale * solFrac),
    humidityCondensate: clampFloat(waterCycle.humidityCondensate + 3.5 * diffScale * solFrac),
    solidWasteLevel: clampFloat(waterCycle.solidWasteLevel + 3.2 * solFrac),
  };

  let waterRecoveredRate = 0;
  if (waterActive) {
    const totalFeed = nextWaterCycle.urineBuffer + nextWaterCycle.humidityCondensate;
    if (totalFeed > 2) {
      const processedFeed = Math.min(totalFeed, 7.5 * solFrac);
      const urineShare = processedFeed * (nextWaterCycle.urineBuffer / Math.max(0.01, totalFeed));
      const humShare = processedFeed - urineShare;
      nextWaterCycle.urineBuffer = clampFloat(nextWaterCycle.urineBuffer - urineShare);
      nextWaterCycle.humidityCondensate = clampFloat(nextWaterCycle.humidityCondensate - humShare);
      nextWaterCycle.filtrationProgress = clampFloat(
        (nextWaterCycle.filtrationProgress + 85 * solFrac) % 100
      );
      nextWaterCycle.purifyingBuffer = clampFloat(nextWaterCycle.purifyingBuffer + processedFeed * 0.92);
    }
    const purifiedOut = Math.min(nextWaterCycle.purifyingBuffer, SIM_RATES.waterRecoveredPerSol * solFrac);
    nextWaterCycle.purifyingBuffer = clampFloat(nextWaterCycle.purifyingBuffer - purifiedOut);
    nextWaterCycle.potableQuality = clampFloat(94 + (nextConds.waterRecycler / 100) * 6, 65, 100);
    if (nextWaterCycle.potableQuality >= 80) {
      waterRecoveredRate = purifiedOut;
    }
  } else {
    nextWaterCycle.potableQuality = clampFloat(waterCycle.potableQuality - 2 * solFrac, 60, 100);
  }

  // 4. Hydroponic Greenhouse Crop Growth (Time-scaled; NO instant/infinite food!)
  const nextGreenhouse: GreenhouseCropState = { ...greenhouseState };
  if (greenhouseActive && resources.water >= 2) {
    nextGreenhouse.moisture = clampFloat(Math.min(100, greenhouseState.moisture + 12 * solFrac));
    nextGreenhouse.nutrients = clampFloat(Math.max(35, greenhouseState.nutrients - 2.5 * solFrac + greenCrewCount * 2 * solFrac));
    if (nextGreenhouse.stage !== 'ready') {
      const crewBoost = 1 + greenCrewCount * 0.28;
      const growthStep = 100 * SIM_RATES.greenhouseCropCyclesPerSol * crewBoost * solFrac;
      nextGreenhouse.growthProgress = clampFloat(nextGreenhouse.growthProgress + growthStep);
      nextGreenhouse.stage = nextGreenhouse.growthProgress >= 100 ? 'ready' : 'growing';
    }
  } else {
    nextGreenhouse.moisture = clampFloat(greenhouseState.moisture - 14 * solFrac);
    if (nextGreenhouse.moisture < 25 || !greenHealthy) {
      nextGreenhouse.stage = 'unhealthy';
    }
  }

  // 5. Cabin Gases, Water, Food, Pressure, Temp, Radiation
  const crewO2Use = SIM_RATES.crewO2UsePerSol * diffScale * solFrac;
  const crewWaterUse = SIM_RATES.crewWaterUsePerSol * diffScale * solFrac;
  const crewFoodUse = SIM_RATES.crewFoodUsePerSol * diffScale * solFrac;
  const crewCo2Out = SIM_RATES.crewCo2OutPerSol * diffScale * solFrac;

  const o2Produced = o2Active ? SIM_RATES.o2ProducedPerSol * solFrac : 0;
  const waterForO2 = o2Active ? SIM_RATES.waterForO2PerSol * solFrac : 0;
  const waterForGreenhouse = greenhouseActive ? SIM_RATES.waterForGreenhousePerSol * solFrac : 0;
  const co2Removed = co2Active ? SIM_RATES.co2RemovedPerSol * solFrac : 0;

  let nextOxygen = clampFloat(resources.oxygen + o2Produced - crewO2Use);
  let nextWater = clampFloat(
    resources.water + waterRecoveredRate - waterForO2 - waterForGreenhouse - crewWaterUse
  );
  let nextCo2 = clampFloat(resources.co2 + crewCo2Out - co2Removed);
  let nextFood = clampFloat(resources.food - crewFoodUse);

  let nextPressure = clampFloat(
    resources.habitatPressure -
      (activeLeak || !pressureHealthy ? SIM_RATES.pressureLossPerLeakSol * solFrac : 0) -
      (!pressurePowered ? SIM_RATES.pressureLossNoPowerSol * solFrac : 0)
  );
  let nextTemp = clampFloat(
    tempActive
      ? Math.min(100, resources.temperatureSafety + SIM_RATES.tempGainActiveSol * solFrac)
      : resources.temperatureSafety - (!tempHealthy ? SIM_RATES.tempLossDamagedSol : SIM_RATES.tempLossOffSol) * solFrac
  );
  let nextRadiation = clampFloat(
    activeRadiationHazard
      ? resources.radiationProtection -
          (isMachineHealthy(systems.radiationShelter, nextConds.radiationShelter)
            ? SIM_RATES.radLossActiveSol
            : SIM_RATES.radLossUnshieldedSol) *
            solFrac
      : Math.min(100, resources.radiationProtection + SIM_RATES.radPassiveRecoverySol * solFrac)
  );

  // Active emergency ongoing hazard effects
  if (emergency && emergency.active) {
    const sev = severityMultiplier(emergency.severity);
    const escalationBoost = emergency.daysActive >= 1 ? 1.35 : 1.0;
    const dmgFactor = sev * escalationBoost * solFrac;

    if (emergency.eventType === 'habitat-pressure-leak') {
      nextPressure = clampFloat(nextPressure - 8 * dmgFactor);
    } else if (emergency.eventType === 'moon-radiation-alert') {
      nextRadiation = clampFloat(nextRadiation - 10 * dmgFactor);
    } else if (emergency.eventType === 'temperature-control-failure') {
      nextTemp = clampFloat(nextTemp - 9 * dmgFactor);
    } else if (emergency.eventType === 'o2-circuit-failure') {
      nextOxygen = clampFloat(nextOxygen - 4.5 * dmgFactor);
    } else if (emergency.eventType === 'co2-scrubber-failure') {
      nextCo2 = clampFloat(nextCo2 + 5.5 * dmgFactor);
    } else if (emergency.eventType === 'water-recycler-failure') {
      nextWater = clampFloat(nextWater - 4.5 * dmgFactor);
    } else if (emergency.eventType === 'battery-malfunction') {
      nextConds.batterySystem = clampFloat(nextConds.batterySystem - 7 * dmgFactor, 10, 100);
    }
  }

  // 6. Individual Astronaut Conditions (4 distinct crew members!)
  let envHealthDeltaPerSol = 0;
  if (nextOxygen <= 20) envHealthDeltaPerSol -= 22;
  else if (nextOxygen <= 35) envHealthDeltaPerSol -= 8;
  if (nextCo2 >= 75) envHealthDeltaPerSol -= 20;
  else if (nextCo2 >= 60) envHealthDeltaPerSol -= 7;
  if (nextPressure <= 60) envHealthDeltaPerSol -= 18;
  if (nextTemp <= 42) envHealthDeltaPerSol -= 14;
  if (nextRadiation <= 32) envHealthDeltaPerSol -= 14;

  const envSafe =
    envHealthDeltaPerSol === 0 &&
    nextOxygen >= 50 &&
    nextCo2 <= 48 &&
    nextTemp >= 60 &&
    nextPressure >= 75;

  const nextCrew: CrewMemberState[] = crew.map((member) => {
    const taskExertion =
      member.assignedTask === 'maintenance'
        ? 1.18
        : member.assignedTask === 'greenhouse'
          ? 1.08
          : member.assignedTask === 'research'
            ? 0.96
            : 0.68; // rest

    // Individual hydration & nutrition decay
    const hydLoss = (nextWater <= 15 ? 14 : 7.5) * taskExertion * solFrac;
    const nutrLoss = (nextFood <= 15 ? 13 : 6.8) * taskExertion * solFrac;

    // Non-player crew automatically sip/eat small amounts if cabin supplies are available
    const autoDrink = !member.isPlayer && member.hydration < 52 && nextWater >= 18 ? 10 * solFrac : 0;
    const autoEat = !member.isPlayer && member.nutrition < 52 && nextFood >= 10 ? 10 * solFrac : 0;

    const mHydration = clampFloat(member.hydration - hydLoss + autoDrink);
    const mNutrition = clampFloat(member.nutrition - nutrLoss + autoEat);

    // Physical Stamina (energy) depends gradually on nutrition & rest (NEVER instant from eating!)
    let staminaDelta = -6.5 * taskExertion * solFrac;
    if (member.assignedTask === 'rest' && mNutrition >= 30) {
      staminaDelta = 14.0 * solFrac;
    } else if (mNutrition >= 55) {
      staminaDelta += 4.2 * solFrac;
    } else if (mNutrition <= 20) {
      staminaDelta -= 8.0 * solFrac;
    }
    const mEnergy = clampFloat(member.energy + staminaDelta);

    // Individual Health
    let indHealthDelta = envHealthDeltaPerSol;
    if (mHydration <= 15) indHealthDelta -= 14;
    else if (mHydration <= 30) indHealthDelta -= 4;
    if (mNutrition <= 15) indHealthDelta -= 12;
    else if (mNutrition <= 30) indHealthDelta -= 3;
    if (mEnergy <= 10) indHealthDelta -= 4;

    if (indHealthDelta === 0 && envSafe && mHydration >= 35 && mNutrition >= 35) {
      indHealthDelta = member.assignedTask === 'rest' ? 6.5 : 2.2;
    }

    const mHealth = clampFloat(member.health + indHealthDelta * solFrac);

    let status: CrewMemberState['status'] = member.status;
    if (member.status !== 'safe-shelter') {
      if (mHealth <= 45 || mHydration <= 25 || mNutrition <= 25) status = 'warning';
      else if (mEnergy <= 35) status = 'needs-rest';
      else status = 'healthy';
    }

    return {
      ...member,
      health: mHealth,
      hydration: mHydration,
      nutrition: mNutrition,
      energy: mEnergy,
      status,
    };
  });

  const playerMember = nextCrew.find((m) => m.isPlayer) ?? nextCrew[0];
  const nextCharacter: CharacterState = {
    ...character,
    health: playerMember ? playerMember.health : character.health,
    hydration: playerMember ? playerMember.hydration : character.hydration,
    nutrition: playerMember ? playerMember.nutrition : character.nutrition,
    energy: playerMember ? playerMember.energy : character.energy,
  };

  const nextRes: ResourceState = {
    oxygen: nextOxygen,
    water: nextWater,
    battery: nextBattery,
    food: nextFood,
    co2: nextCo2,
    habitatPressure: nextPressure,
    temperatureSafety: nextTemp,
    radiationProtection: nextRadiation,
  };

  const nextSafety = evaluateSafetySystem({
    prevSafety: safety,
    resources: nextRes,
    crew: nextCrew,
    dtSec,
  });

  return {
    nextResources: nextRes,
    nextCharacter,
    nextCrew,
    nextToggles,
    nextMachineConditions: nextConds,
    nextSystems,
    nextGreenhouse,
    nextWaterCycle,
    nextSafety,
    solarGeneratedPerSol: solarGenPerSol,
    powerUsedPerSol,
    researchGain,
    autoPausedNotes,
    unmetInputNotes,
  };
}

export type DailyPreview = {
  solarGain: number;
  totalDrain: number;
  netBattery: number;
  netOxygen: number;
  netWater: number;
  netCo2: number;
  netFood: number;
  netPressure: number;
  netTemperature: number;
  netRadiation: number;
  researchGain: number;
  autoPausedSystems: string[];
  unmetInputNotes: string[];
};

export function previewDailyRates(
  destination: Destination,
  toggles: SystemToggleState,
  systems: SystemConditionMap,
  dustStormDaysRemaining: number,
  options?: {
    resources?: ResourceState;
    machineConditions?: MachineConditionMap;
    crew?: CrewMemberState[];
    difficulty?: DifficultyMode;
    activeLeak?: boolean;
    activeRadiationHazard?: boolean;
    emergency?: EmergencyState | null;
    greenhouseState?: GreenhouseCropState;
    waterCycle?: WaterCycleState;
  }
): DailyPreview {
  const res = options?.resources ?? INITIAL_TUTORIAL_RESOURCES;
  const conds = options?.machineConditions ?? INITIAL_MACHINE_CONDITIONS;
  const crew = options?.crew ?? [];
  const diff = options?.difficulty ?? 'cadet';

  const sim = stepContinuousSimulation(
    {
      destination,
      difficulty: diff,
      resources: res,
      character: INITIAL_CHARACTER_STATE,
      crew:
        crew.length > 0
          ? crew
          : [
              {
                id: 'player',
                label: 'Cadet',
                role: 'Lead',
                isPlayer: true,
                health: 100,
                hydration: 100,
                nutrition: 100,
                energy: 100,
                assignedTask: 'maintenance',
                status: 'healthy',
              },
            ],
      toggles,
      systems,
      machineConditions: conds,
      greenhouseState: options?.greenhouseState ?? INITIAL_GREENHOUSE_STATE,
      waterCycle: options?.waterCycle ?? INITIAL_WATER_CYCLE_STATE,
      safety: { stage: 'normal', reason: null, triggerMetric: null, countdownSeconds: 0 },
      dustStormDaysRemaining,
      activeLeak: options?.activeLeak ?? false,
      activeRadiationHazard: options?.activeRadiationHazard ?? false,
      emergency: options?.emergency ?? null,
    },
    SOL_DURATION_SECONDS
  );

  return {
    solarGain: sim.solarGeneratedPerSol,
    totalDrain: sim.powerUsedPerSol,
    netBattery: Math.round(sim.nextResources.battery - res.battery),
    netOxygen: Math.round(sim.nextResources.oxygen - res.oxygen),
    netWater: Math.round(sim.nextResources.water - res.water),
    netCo2: Math.round(sim.nextResources.co2 - res.co2),
    netFood: Math.round(sim.nextResources.food - res.food),
    netPressure: Math.round(sim.nextResources.habitatPressure - res.habitatPressure),
    netTemperature: Math.round(sim.nextResources.temperatureSafety - res.temperatureSafety),
    netRadiation: Math.round(sim.nextResources.radiationProtection - res.radiationProtection),
    researchGain: Math.round(sim.researchGain),
    autoPausedSystems: sim.autoPausedNotes,
    unmetInputNotes: sim.unmetInputNotes,
  };
}

export function evaluateObjectives(params: {
  systems: SystemConditionMap;
  machineConditions: MachineConditionMap;
  resources: ResourceState;
  researchProgress: number;
  sol: number;
  maxSols: number;
  safetyProtocolActivated: boolean;
}): MissionObjectivesState {
  const { systems, machineConditions, resources, researchProgress, sol, maxSols, safetyProtocolActivated } = params;

  const coreHealthy =
    isMachineHealthy(systems.oxygenGenerator, machineConditions.oxygenGenerator) &&
    isMachineHealthy(systems.co2Scrubber, machineConditions.co2Scrubber) &&
    isMachineHealthy(systems.waterRecycler, machineConditions.waterRecycler) &&
    isMachineHealthy(systems.pressureSystem, machineConditions.pressureSystem) &&
    isMachineHealthy(systems.temperatureControl, machineConditions.temperatureControl);

  const reservesStable =
    resources.oxygen >= 40 &&
    resources.water >= 30 &&
    resources.co2 <= 65 &&
    resources.habitatPressure >= 65 &&
    resources.temperatureSafety >= 50;

  return {
    lifeSupportMaintained: coreHealthy && reservesStable && !safetyProtocolActivated,
    researchProgress: clamp(researchProgress),
    researchCompleted: researchProgress >= 100,
    survivedAllDays: sol >= maxSols && !safetyProtocolActivated,
  };
}

export function determineMissionOutcome(
  objectives: MissionObjectivesState,
  safetyProtocolActivated: boolean
): MissionOutcome {
  if (safetyProtocolActivated) return 'safety-protocol';
  if (objectives.lifeSupportMaintained && objectives.researchCompleted && objectives.survivedAllDays) {
    return 'victory';
  }
  return 'partial';
}

export type ScoreBreakdown = {
  crewSafety: number;
  systemStability: number;
  resourceEfficiency: number;
  contingencyPlanning: number;
  total: number;
};

export function computeMissionScore(params: {
  crew: CrewMemberState[];
  resources: ResourceState;
  systems: SystemConditionMap;
  emergenciesResolved: number;
  puzzlesCompleted: number;
  researchProgress?: number;
  safetyProtocolActivated: boolean;
}): ScoreBreakdown {
  const {
    crew,
    resources,
    systems,
    emergenciesResolved,
    puzzlesCompleted,
    researchProgress = 0,
    safetyProtocolActivated,
  } = params;

  const avgCrewHealth =
    crew.reduce((acc, m) => acc + m.health, 0) / Math.max(1, crew.length);
  const crewSafety = safetyProtocolActivated
    ? Math.min(20, Math.round((avgCrewHealth / 100) * 20))
    : Math.round((avgCrewHealth / 100) * 40);

  const totalSys = Object.keys(systems).length;
  const operationalCount = Object.values(systems).filter((s) => s === 'Operational').length;
  const systemStability = Math.round((operationalCount / Math.max(1, totalSys)) * 25);

  const avgResource =
    (resources.oxygen +
      resources.water +
      resources.battery +
      resources.food +
      (100 - resources.co2)) /
    5;
  const resourceEfficiency = Math.round((avgResource / 100) * 20);

  const researchBonus = researchProgress >= 100 ? 4 : 0;
  const contingencyPlanning = Math.min(
    15,
    emergenciesResolved * 3 + puzzlesCompleted * 3 + researchBonus
  );

  return {
    crewSafety,
    systemStability,
    resourceEfficiency,
    contingencyPlanning,
    total: crewSafety + systemStability + resourceEfficiency + contingencyPlanning,
  };
}

export type MachinePowerRow = {
  id: string;
  label: string;
  toggleKey: keyof SystemToggleState | null;
  isOn: boolean;
  maxDraw: number;
  activeDraw: number;
  status: string;
  condition: number;
  priority: number;
  canToggle: boolean;
};

export type PowerBreakdown = {
  solarGeneration: number;
  solarMax: number;
  solarEfficiencyPct: number;
  solarDamaged: boolean;
  dustStormCut: boolean;
  batteryLevel: number;
  batteryLeak: number;
  totalConsumption: number;
  netPower: number;
  status: 'charging' | 'discharging' | 'balanced';
  machines: MachinePowerRow[];
};

export function getPowerBreakdown(params: {
  destination: Destination;
  toggles: SystemToggleState;
  systems: SystemConditionMap;
  machineConditions: MachineConditionMap;
  resources: ResourceState;
  dustStormDaysRemaining: number;
  emergency: EmergencyState | null;
}): PowerBreakdown {
  const {
    destination,
    toggles,
    systems,
    machineConditions,
    resources,
    dustStormDaysRemaining,
    emergency,
  } = params;

  const solarHealthy = isMachineHealthy(systems.solarArray, machineConditions.solarArray);
  const dustCut = destination === 'mars' && dustStormDaysRemaining > 0;
  const solarEfficiency = Math.max(0.25, machineConditions.solarArray / 100);
  let solarGeneration = toggles.solarArray
    ? Math.round(SIM_RATES.solarBaseGenPerSol * solarEfficiency)
    : 0;
  if (toggles.solarArray && !solarHealthy) {
    const dmgBase =
      machineConditions.solarArray <= 20
        ? 3
        : Math.max(4, Math.round(9 * (machineConditions.solarArray / 100)));
    solarGeneration = dustCut ? Math.max(2, Math.round(dmgBase * 0.6)) : dmgBase;
  } else if (toggles.solarArray && dustCut) {
    const stormSev =
      emergency?.eventType === 'mars-dust-storm' ? severityMultiplier(emergency.severity) : 1.0;
    solarGeneration = Math.max(5, Math.round(10 / stormSev));
  }

  const batteryHealthy = isMachineHealthy(systems.batterySystem, machineConditions.batterySystem);
  const batteryLeak = !batteryHealthy ? SIM_RATES.batteryLeakPerSol : 0;

  const rows: MachinePowerRow[] = [
    {
      id: 'pressureSystem',
      label: 'Habitat Pressure',
      toggleKey: null,
      isOn: true,
      maxDraw: 2,
      activeDraw: 2,
      status: systems.pressureSystem,
      condition: clamp(machineConditions.pressureSystem),
      priority: 1,
      canToggle: false,
    },
    {
      id: 'oxygenGenerator',
      label: 'Oxygen Generator',
      toggleKey: 'oxygenGenerator',
      isOn: toggles.oxygenGenerator,
      maxDraw: 6,
      activeDraw:
        toggles.oxygenGenerator &&
        isMachineHealthy(systems.oxygenGenerator, machineConditions.oxygenGenerator) &&
        resources.water >= 2
          ? 6
          : 0,
      status: toggles.oxygenGenerator ? systems.oxygenGenerator : 'Offline',
      condition: clamp(machineConditions.oxygenGenerator),
      priority: 2,
      canToggle: true,
    },
    {
      id: 'co2Scrubber',
      label: 'CO₂ Scrubber',
      toggleKey: 'co2Scrubber',
      isOn: toggles.co2Scrubber,
      maxDraw: 4,
      activeDraw:
        toggles.co2Scrubber &&
        isMachineHealthy(systems.co2Scrubber, machineConditions.co2Scrubber)
          ? 4
          : 0,
      status: toggles.co2Scrubber ? systems.co2Scrubber : 'Offline',
      condition: clamp(machineConditions.co2Scrubber),
      priority: 3,
      canToggle: true,
    },
    {
      id: 'temperatureControl',
      label: 'Temperature Control',
      toggleKey: 'temperatureControl',
      isOn: toggles.temperatureControl,
      maxDraw: 4,
      activeDraw:
        toggles.temperatureControl &&
        isMachineHealthy(systems.temperatureControl, machineConditions.temperatureControl)
          ? 4
          : 0,
      status: toggles.temperatureControl ? systems.temperatureControl : 'Offline',
      condition: clamp(machineConditions.temperatureControl),
      priority: 4,
      canToggle: true,
    },
    {
      id: 'waterRecycler',
      label: 'Water Recycler',
      toggleKey: 'waterRecycler',
      isOn: toggles.waterRecycler,
      maxDraw: 4,
      activeDraw:
        toggles.waterRecycler &&
        isMachineHealthy(systems.waterRecycler, machineConditions.waterRecycler)
          ? 4
          : 0,
      status: toggles.waterRecycler ? systems.waterRecycler : 'Offline',
      condition: clamp(machineConditions.waterRecycler),
      priority: 5,
      canToggle: true,
    },
    {
      id: 'greenhouse',
      label: 'Hydroponic Greenhouse',
      toggleKey: 'greenhouse',
      isOn: toggles.greenhouse,
      maxDraw: 4,
      activeDraw:
        toggles.greenhouse &&
        isMachineHealthy(systems.greenhouse, machineConditions.greenhouse) &&
        resources.water >= 2
          ? 4
          : 0,
      status: toggles.greenhouse ? systems.greenhouse : 'Offline',
      condition: clamp(machineConditions.greenhouse),
      priority: 6,
      canToggle: true,
    },
    {
      id: 'researchSystems',
      label: 'Research Equipment',
      toggleKey: 'researchSystems',
      isOn: toggles.researchSystems,
      maxDraw: 4,
      activeDraw: toggles.researchSystems ? 4 : 0,
      status: toggles.researchSystems ? 'Operational' : 'Offline',
      condition: 100,
      priority: 7,
      canToggle: true,
    },
  ];

  const totalConsumption = rows.reduce((sum, r) => sum + r.activeDraw, 0);
  const netPower = solarGeneration - totalConsumption - batteryLeak;

  return {
    solarGeneration,
    solarMax: SIM_RATES.solarBaseGenPerSol,
    solarEfficiencyPct: Math.round((solarGeneration / SIM_RATES.solarBaseGenPerSol) * 100),
    solarDamaged: !solarHealthy || emergency?.eventType === 'solar-power-reduction',
    dustStormCut: dustCut,
    batteryLevel: Math.round(resources.battery),
    batteryLeak,
    totalConsumption,
    netPower,
    status: netPower > 0 ? 'charging' : netPower < 0 ? 'discharging' : 'balanced',
    machines: rows,
  };
}

export function countFoodItems(items: { id: string; quantity: number }[]): number {
  return items.reduce(
    (sum, item) => sum + (item.id === 'fresh-crop' || item.id === 'meal-pack' ? item.quantity : 0),
    0
  );
}

export function computeFoodPercentFromItems(
  sharedFoodStorage: { id: string; quantity: number }[],
  inventory: { id: string; quantity: number }[]
): number {
  const totalUnits = countFoodItems(sharedFoodStorage) + countFoodItems(inventory);
  return clampFloat(totalUnits * 10, 0, 100);
}


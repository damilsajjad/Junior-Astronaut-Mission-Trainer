import {
  CharacterState,
  CrewMemberState,
  Destination,
  ResourceState,
  SystemConditionMap,
  SystemToggleState,
} from '../types/game';

export const PLAYER_SPEED = 3.0; // world units per second (PRD §6.1)
export const INTERACTION_DISTANCE = 2.0; // world units (PRD §6.1)

export const INITIAL_TUTORIAL_RESOURCES: ResourceState = {
  oxygen: 80,
  water: 80,
  battery: 80,
  food: 80,
  co2: 20,
  habitatPressure: 100,
  temperatureSafety: 100,
  radiationProtection: 80,
};

export const INITIAL_CHARACTER_STATE: CharacterState = {
  health: 100,
  energy: 100,
  hydration: 100,
  position: { x: 0, y: 0, z: 0.4 },
};

export function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
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
  character: CharacterState
): ResourceAlertInfo[] {
  const alerts: ResourceAlertInfo[] = [];

  if (resources.oxygen <= 20) {
    alerts.push({
      id: 'oxygen',
      label: 'Oxygen Critical',
      value: resources.oxygen,
      severity: 'critical',
      message: 'Oxygen is critically low! Check Oxygen Generator or use Emergency O₂.',
    });
  } else if (resources.oxygen <= 40) {
    alerts.push({
      id: 'oxygen',
      label: 'Oxygen Warning',
      value: resources.oxygen,
      severity: 'warning',
      message: 'Oxygen reserve is dropping below 40%.',
    });
  }

  if (resources.water <= 20) {
    alerts.push({
      id: 'water',
      label: 'Water Critical',
      value: resources.water,
      severity: 'critical',
      message: 'Water reserve is critically low! Keep Water Recycler powered.',
    });
  } else if (resources.water <= 40) {
    alerts.push({
      id: 'water',
      label: 'Water Warning',
      value: resources.water,
      severity: 'warning',
      message: 'Water reserve is below 40%.',
    });
  }

  if (resources.battery <= 15) {
    alerts.push({
      id: 'battery',
      label: 'Battery Critical',
      value: resources.battery,
      severity: 'critical',
      message: 'Battery is critical! Pause Greenhouse & Research systems now.',
    });
  } else if (resources.battery <= 35) {
    alerts.push({
      id: 'battery',
      label: 'Battery Warning',
      value: resources.battery,
      severity: 'warning',
      message: 'Battery reserve is low (<=35%). Watch power draw.',
    });
  }

  if (resources.food <= 15) {
    alerts.push({
      id: 'food',
      label: 'Food Critical',
      value: resources.food,
      severity: 'critical',
      message: 'Food supplies are critically low! Enable Greenhouse when power permits.',
    });
  } else if (resources.food <= 35) {
    alerts.push({
      id: 'food',
      label: 'Food Warning',
      value: resources.food,
      severity: 'warning',
      message: 'Food supply is below 35%.',
    });
  }

  if (resources.co2 >= 75) {
    alerts.push({
      id: 'co2',
      label: 'CO₂ Critical',
      value: resources.co2,
      severity: 'critical',
      message: 'Cabin CO₂ is dangerously high! Fix or enable the CO₂ Scrubber!',
    });
  } else if (resources.co2 >= 50) {
    alerts.push({
      id: 'co2',
      label: 'CO₂ Warning',
      value: resources.co2,
      severity: 'warning',
      message: 'Carbon dioxide is rising (>=50%). Check the CO₂ Scrubber.',
    });
  }

  if (resources.habitatPressure <= 65) {
    alerts.push({
      id: 'pressure',
      label: 'Pressure Critical',
      value: resources.habitatPressure,
      severity: 'critical',
      message: 'Habitat air pressure is critically low! Seal hull breaches immediately.',
    });
  } else if (resources.habitatPressure <= 85) {
    alerts.push({
      id: 'pressure',
      label: 'Pressure Warning',
      value: resources.habitatPressure,
      severity: 'warning',
      message: 'Habitat air pressure dropped below 85%.',
    });
  }

  if (resources.radiationProtection <= 35) {
    alerts.push({
      id: 'radiation',
      label: 'Radiation Critical',
      value: resources.radiationProtection,
      severity: 'critical',
      message: 'Radiation shielding is critical! Reinforce Water-Barrier Blocks.',
    });
  } else if (resources.radiationProtection <= 60) {
    alerts.push({
      id: 'radiation',
      label: 'Radiation Warning',
      value: resources.radiationProtection,
      severity: 'warning',
      message: 'Radiation protection is below 60%. Reinforce shelter blocks.',
    });
  }

  if (character.health <= 20 || character.energy <= 20 || character.hydration <= 20) {
    alerts.push({
      id: 'crew-health',
      label: 'Astronaut Status Critical',
      value: Math.min(character.health, character.energy, character.hydration),
      severity: 'critical',
      message: 'Check Astronaut Health, Energy, or Hydration! Eat a ration or rest.',
    });
  } else if (character.health <= 40 || character.energy <= 40 || character.hydration <= 40) {
    alerts.push({
      id: 'crew-health',
      label: 'Astronaut Status Warning',
      value: Math.min(character.health, character.energy, character.hydration),
      severity: 'warning',
      message: 'Astronaut Energy or Hydration is getting low.',
    });
  }

  return alerts;
}

export type DailyPreview = {
  solarGain: number;
  totalDrain: number;
  netBattery: number;
  netOxygen: number;
  netWater: number;
  netCo2: number;
  netFood: number;
  autoPausedSystems: string[];
};

export function previewDailyRates(
  destination: Destination,
  toggles: SystemToggleState,
  systems: SystemConditionMap,
  dustStormDaysRemaining: number
): DailyPreview {
  const solarBroken = systems.solarArray === 'Damaged' || systems.solarArray === 'Offline';
  const solarGain = solarBroken
    ? 8
    : destination === 'mars' && dustStormDaysRemaining > 0
      ? 8
      : 22;

  const o2Online =
    toggles.oxygenGenerator &&
    systems.oxygenGenerator !== 'Damaged' &&
    systems.oxygenGenerator !== 'Repair Required' &&
    systems.oxygenGenerator !== 'Offline';
  const co2Online =
    toggles.co2Scrubber &&
    systems.co2Scrubber !== 'Damaged' &&
    systems.co2Scrubber !== 'Repair Required' &&
    systems.co2Scrubber !== 'Offline';
  const waterOnline = toggles.waterRecycler && systems.waterRecycler !== 'Offline';
  const greenOnline = toggles.greenhouse && systems.greenhouse !== 'Offline';
  const researchOnline = toggles.researchSystems;

  let drain = 6; // Base habitat heating & air circulation
  if (o2Online) drain += 6;
  if (co2Online) drain += 4;
  if (waterOnline) drain += 4;
  if (greenOnline) drain += 4;
  if (researchOnline) drain += 4;

  const netBattery = solarGain - drain;
  const netOxygen = (o2Online ? 10 : 0) - 8;
  const netWater = (waterOnline ? 6 : 0) - (greenOnline ? 2 : 0) - 8;
  const netCo2 = 12 - (co2Online ? 14 : 0);
  const netFood = (greenOnline ? 4 : 0) - 8;

  return {
    solarGain,
    totalDrain: drain,
    netBattery,
    netOxygen,
    netWater,
    netCo2,
    netFood,
    autoPausedSystems: [],
  };
}

export type EndOfDayResult = {
  nextResources: ResourceState;
  nextCharacter: CharacterState;
  nextCrew: CrewMemberState[];
  nextToggles: SystemToggleState;
  autoPausedNotes: string[];
  safetyProtocolTriggered: boolean;
  safetyReason: string | null;
};

export function calculateEndOfDay(params: {
  destination: Destination;
  resources: ResourceState;
  character: CharacterState;
  crew: CrewMemberState[];
  toggles: SystemToggleState;
  systems: SystemConditionMap;
  dustStormDaysRemaining: number;
  activeLeak: boolean;
  activeRadiationHazard: boolean;
}): EndOfDayResult {
  const {
    destination,
    resources,
    character,
    crew,
    toggles,
    systems,
    dustStormDaysRemaining,
    activeLeak,
    activeRadiationHazard,
  } = params;

  const nextToggles = { ...toggles };
  const autoPausedNotes: string[] = [];

  // 1 & 2. Destination environmental modifier + solar generation
  const solarDamaged = systems.solarArray === 'Damaged' || systems.solarArray === 'Offline';
  const solarGen =
    solarDamaged || (destination === 'mars' && dustStormDaysRemaining > 0) ? 8 : 22;

  let availablePower = resources.battery + solarGen;

  // 3 & 4. Power-priority allocation (PRD §9.5):
  // 1. Oxygen Generator (6)
  // 2. CO2 Scrubber (4)
  // 3. Habitat pressure & essential air circulation + 4. Essential heating (6)
  // 5. Water Recycler (4)
  // 6. Greenhouse (4)
  // 7. Research/optional systems (4)
  const o2CanRun =
    nextToggles.oxygenGenerator &&
    systems.oxygenGenerator !== 'Damaged' &&
    systems.oxygenGenerator !== 'Repair Required' &&
    systems.oxygenGenerator !== 'Offline';
  const co2CanRun =
    nextToggles.co2Scrubber &&
    systems.co2Scrubber !== 'Damaged' &&
    systems.co2Scrubber !== 'Repair Required' &&
    systems.co2Scrubber !== 'Offline';

  let powerUsed = 0;
  let o2Powered = false;
  let co2Powered = false;
  let waterPowered = false;
  let greenhousePowered = false;

  if (o2CanRun && availablePower - powerUsed >= 6) {
    powerUsed += 6;
    o2Powered = true;
  } else if (o2CanRun) {
    autoPausedNotes.push('Battery depleted: Oxygen Generator paused.');
  }

  if (co2CanRun && availablePower - powerUsed >= 4) {
    powerUsed += 4;
    co2Powered = true;
  } else if (co2CanRun) {
    autoPausedNotes.push('Battery depleted: CO₂ Scrubber paused.');
  }

  // Base habitat heating/circulation
  if (availablePower - powerUsed >= 6) {
    powerUsed += 6;
  } else {
    powerUsed = availablePower;
  }

  if (nextToggles.waterRecycler) {
    if (availablePower - powerUsed >= 4) {
      powerUsed += 4;
      waterPowered = true;
    } else {
      nextToggles.waterRecycler = false;
      autoPausedNotes.push('Low battery: Water Recycler paused automatically to protect O₂ & CO₂.');
    }
  }

  if (nextToggles.greenhouse) {
    if (availablePower - powerUsed >= 4) {
      powerUsed += 4;
      greenhousePowered = true;
    } else {
      nextToggles.greenhouse = false;
      autoPausedNotes.push('Low battery: Greenhouse paused automatically to save life support.');
    }
  }

  if (nextToggles.researchSystems) {
    if (availablePower - powerUsed >= 4) {
      powerUsed += 4;
    } else {
      nextToggles.researchSystems = false;
      autoPausedNotes.push('Low battery: Optional Research Systems paused automatically.');
    }
  }

  const nextBattery = clamp(availablePower - powerUsed);

  // 5. Oxygen production and crew use
  const nextOxygen = clamp(resources.oxygen + (o2Powered ? 10 : 0) - 8);

  // 6. Water recovery, greenhouse use, crew water use
  const nextWater = clamp(
    resources.water + (waterPowered ? 6 : 0) - (greenhousePowered ? 2 : 0) - 8
  );

  // 7. CO2 production and removal
  const nextCo2 = clamp(resources.co2 + 12 - (co2Powered ? 14 : 0));

  // 8. Food production and crew food use
  const nextFood = clamp(resources.food + (greenhousePowered ? 4 : 0) - 8);

  // 9. Pressure, temperature, radiation effects
  const nextPressure = clamp(
    resources.habitatPressure - (activeLeak ? 14 : 0)
  );
  const nextTemp = clamp(
    availablePower < 6 ? resources.temperatureSafety - 15 : Math.min(100, resources.temperatureSafety + 2)
  );
  const nextRadiation = clamp(
    activeRadiationHazard ? resources.radiationProtection - 10 : resources.radiationProtection
  );

  // 10. Crew and character condition
  let healthDelta = 0;
  if (nextOxygen <= 15) healthDelta -= 18;
  if (nextCo2 >= 75) healthDelta -= 15;
  if (nextPressure <= 60) healthDelta -= 15;
  if (nextRadiation <= 30) healthDelta -= 12;
  if (nextWater <= 10 || nextFood <= 10) healthDelta -= 8;

  const nextHealth = clamp(character.health + healthDelta);
  const nextEnergy = clamp(character.energy - 8);
  const nextHydration = clamp(character.hydration - 10);

  const nextCharacter: CharacterState = {
    ...character,
    health: nextHealth,
    energy: nextEnergy,
    hydration: nextHydration,
  };

  const nextCrew: CrewMemberState[] = crew.map((member) => {
    const mHealth = member.isPlayer ? nextHealth : clamp(member.health + healthDelta);
    let status: CrewMemberState['status'] = member.status;
    if (member.status !== 'safe-shelter') {
      if (mHealth <= 45) status = 'warning';
      else if (nextEnergy <= 40) status = 'needs-rest';
      else status = 'healthy';
    }
    return { ...member, health: mHealth, status };
  });

  // 11. Mission end / safety protocol conditions (never graphic)
  let safetyProtocolTriggered = false;
  let safetyReason: string | null = null;
  if (nextOxygen <= 0) {
    safetyProtocolTriggered = true;
    safetyReason = 'Oxygen reserves reached 0%. Safety Protocol evacuated the crew to the backup lander.';
  } else if (nextCo2 >= 95) {
    safetyProtocolTriggered = true;
    safetyReason = 'Cabin CO₂ reached critical limits. Safety Protocol moved the crew to the backup module.';
  } else if (nextPressure <= 35) {
    safetyProtocolTriggered = true;
    safetyReason = 'Habitat pressure fell below safe limits. Safety Protocol sealed and evacuated the crew.';
  } else if (nextHealth <= 15) {
    safetyProtocolTriggered = true;
    safetyReason = 'Crew condition required medical evacuation. Safety Protocol safely returned the crew.';
  }

  return {
    nextResources: {
      oxygen: nextOxygen,
      water: nextWater,
      battery: nextBattery,
      food: nextFood,
      co2: nextCo2,
      habitatPressure: nextPressure,
      temperatureSafety: nextTemp,
      radiationProtection: nextRadiation,
    },
    nextCharacter,
    nextCrew,
    nextToggles,
    autoPausedNotes,
    safetyProtocolTriggered,
    safetyReason,
  };
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
  safetyProtocolActivated: boolean;
}): ScoreBreakdown {
  const { crew, resources, systems, emergenciesResolved, puzzlesCompleted, safetyProtocolActivated } = params;

  const avgCrewHealth =
    crew.reduce((acc, m) => acc + m.health, 0) / Math.max(1, crew.length);
  const crewSafety = safetyProtocolActivated
    ? Math.min(20, Math.round((avgCrewHealth / 100) * 20))
    : Math.round((avgCrewHealth / 100) * 40);

  const operationalCount = Object.values(systems).filter((s) => s === 'Operational').length;
  const systemStability = Math.round((operationalCount / 8) * 25);

  const avgResource =
    (resources.oxygen +
      resources.water +
      resources.battery +
      resources.food +
      (100 - resources.co2)) /
    5;
  const resourceEfficiency = Math.round((avgResource / 100) * 20);

  const contingencyPlanning = Math.min(
    15,
    emergenciesResolved * 5 + puzzlesCompleted * 4
  );

  return {
    crewSafety,
    systemStability,
    resourceEfficiency,
    contingencyPlanning,
    total: crewSafety + systemStability + resourceEfficiency + contingencyPlanning,
  };
}

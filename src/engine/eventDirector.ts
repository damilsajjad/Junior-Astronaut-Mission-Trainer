import { SCENARIOS, SCENARIO_BY_ID } from '../data/scenarios';
import {
  Destination,
  DifficultyMode,
  EventSeverity,
  ForecastInfo,
} from '../types/game';

export type ScheduledEventSpec = {
  sol: number;
  scenarioId: string;
  severity: EventSeverity;
  durationDays: number;
};

/**
 * Deterministic 32-bit PRNG (Mulberry32) so identical seeds produce identical event timelines,
 * while different seeds vary event order, timing, severity, and duration across playthroughs.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function severityMultiplier(severity: EventSeverity): number {
  if (severity === 'minor') return 0.7;
  if (severity === 'severe') return 1.45;
  return 1.0;
}

/**
 * Generates a balanced, deterministic 10-day environmental & equipment event schedule.
 * - Mars pool includes Mars Dust Storms + equipment faults (excludes Moon-only solar flare event).
 * - Moon pool includes Lunar Solar Flare radiation + equipment faults (excludes Mars-only dust storms).
 * - Avoids immediate back-to-back repeats and ensures calm preparation/research Sols.
 */
export function generateMissionTimeline(
  destination: Destination,
  seed: number,
  difficulty: DifficultyMode
): Record<number, ScheduledEventSpec | null> {
  const rng = createSeededRng(seed);
  const timeline: Record<number, ScheduledEventSpec | null> = {};

  // Sol 1 starter: destination-flavored onboarding event (never extreme on Sol 1)
  const starterId = destination === 'mars' ? 'mars-dust-storm' : 'moon-radiation-alert';
  timeline[1] = {
    sol: 1,
    scenarioId: starterId,
    severity: difficulty === 'commander' ? 'moderate' : 'minor',
    durationDays: destination === 'mars' ? 2 : 1,
  };

  // Destination-filtered pool of remaining scenarios
  const pool = SCENARIOS.filter(
    (s) => s.destination === 'both' || s.destination === destination
  ).map((s) => s.id);

  // Choose 3 calm preparation / research / supply days among Sols 2..10
  // (e.g., always ensure Sol 2 or Sol 3 has breathing room, plus two more calm Sols)
  const calmCandidates = [2, 3, 5, 7, 9, 10];
  const shuffledCalm = [...calmCandidates].sort(() => rng() - 0.5);
  const calmDays = new Set<number>([shuffledCalm[0], shuffledCalm[1], shuffledCalm[2]]);
  // Prevent impossible back-to-back severe stacking right after Sol 1 in cadet mode
  if (difficulty === 'cadet' && !calmDays.has(2) && !calmDays.has(3)) {
    calmDays.add(2);
  }

  let lastScenarioId = starterId;
  let bag: string[] = [];

  for (let sol = 2; sol <= 10; sol++) {
    if (calmDays.has(sol)) {
      timeline[sol] = null;
      continue;
    }

    if (bag.length === 0) {
      bag = [...pool].sort(() => rng() - 0.5);
    }

    let pickedIdx = bag.findIndex((id) => id !== lastScenarioId);
    if (pickedIdx === -1) pickedIdx = 0;
    const scenarioId = bag.splice(pickedIdx, 1)[0];
    lastScenarioId = scenarioId;

    // Graduated severity: early days favor minor/moderate; later days can roll severe
    const roll = rng();
    let severity: EventSeverity = 'moderate';
    if (sol <= 3) {
      severity = roll < 0.65 ? 'minor' : 'moderate';
    } else if (sol <= 6) {
      severity = roll < 0.3 ? 'minor' : roll < 0.8 ? 'moderate' : 'severe';
    } else {
      const severeChance = difficulty === 'commander' ? 0.45 : 0.3;
      severity = roll < 0.2 ? 'minor' : roll < 1 - severeChance ? 'moderate' : 'severe';
    }

    const baseDuration = scenarioId === 'mars-dust-storm' ? 2 : 1;
    const durationDays =
      scenarioId === 'mars-dust-storm' && severity === 'severe'
        ? 3
        : severity === 'severe' && rng() > 0.5
          ? 2
          : baseDuration;

    timeline[sol] = {
      sol,
      scenarioId,
      severity,
      durationDays,
    };
  }

  return timeline;
}

export function getForecastForNextSol(
  currentSol: number,
  maxSols: number,
  timeline: Record<number, ScheduledEventSpec | null>
): ForecastInfo | null {
  const nextSol = currentSol + 1;
  if (nextSol > maxSols) return null;

  const spec = timeline[nextSol];
  if (!spec) {
    return {
      nextSol,
      eventId: null,
      title: 'Clear Conditions & Maintenance Window',
      severity: 'calm',
      advisory: `Sol ${nextSol} forecast: Clear skies! Good chance to run Research, grow Food, and repair systems.`,
    };
  }

  const sc = SCENARIO_BY_ID[spec.scenarioId];
  return {
    nextSol,
    eventId: spec.scenarioId,
    title: sc ? sc.title : spec.scenarioId,
    severity: spec.severity,
    advisory: `Sol ${nextSol} forecast (${spec.severity.toUpperCase()}): Watch ${sc?.shortLabel || 'system telemetry'} and keep spares ready.`,
  };
}

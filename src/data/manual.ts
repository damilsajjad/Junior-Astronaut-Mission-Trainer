import { PuzzleId, StationId } from '../types/game';

export type ManualPage = {
  id: string;
  stationIds: StationId[];
  title: string;
  subtitle: string;
  kidSummary: string;
  glossaryTerm: { word: string; meaning: string };
  steps: string[];
  hint: string;
  fullSolution: string;
  diagramType: 'electrolysis' | 'co2-scrubber' | 'power-circuit' | 'radiation-shield' | 'hull-patch' | 'greenhouse';
  relatedPuzzle?: PuzzleId;
};

export const MANUAL_PAGES: ManualPage[] = [
  {
    id: 'oxygen-generator',
    stationIds: ['oxygen-generator'],
    title: 'Water Electrolysis Oxygen Generator',
    subtitle: 'Makes fresh breathable oxygen from water using electricity',
    kidSummary:
      'The oxygen machine makes fresh oxygen from water using electricity. It splits H₂O into oxygen for the crew to breathe and hydrogen gas that gets vented safely.',
    glossaryTerm: {
      word: 'Electrolysis',
      meaning: 'Using electricity to split water (H₂O) into Oxygen and Hydrogen.',
    },
    steps: [
      'Check that Battery Reserve has power for the Oxygen Generator.',
      'Open the lower harness cover on the Oxygen Generator.',
      'Connect each colored wire to its matching port: RED to PWR+, YELLOW to CTRL, and BLACK to GND.',
      'Confirm the green electrolysis indicator lights up!',
    ],
    hint: 'Match each wire by both color AND label: Red -> PWR+, Yellow -> CTRL, Black -> GND.',
    fullSolution:
      'Full Solution: Drag or click RED wire -> PWR+ port, YELLOW wire -> CTRL port, and BLACK wire -> GND port. Never cross-connect colors!',
    diagramType: 'electrolysis',
    relatedPuzzle: 'circuit-reconnect',
  },
  {
    id: 'co2-scrubber',
    stationIds: ['co2-scrubber'],
    title: 'CO₂ Scrubber Air Cleaner',
    subtitle: 'Removes carbon dioxide from cabin air (does NOT make oxygen)',
    kidSummary:
      'The air cleaner removes carbon dioxide so the cabin air stays safer to breathe. Important science rule: a CO₂ scrubber cleans CO₂ out of air—it does NOT turn CO₂ into oxygen!',
    glossaryTerm: {
      word: 'Carbon Dioxide (CO₂)',
      meaning: 'The gas people breathe out. Too much CO₂ makes cabin air unhealthy.',
    },
    steps: [
      'Turn off the fan intake before opening the filter housing.',
      'Place the Seal Gasket onto the round blower outlet first.',
      'Attach the Square-to-Round Adapter so the square cartridge fits the round pipe.',
      'Slide in the LiOH CO₂ Cartridge and snap the HEPA Pre-Filter on top!',
    ],
    hint: 'Think about airflow from bottom to top: Seal Gasket -> Adapter -> LiOH Cartridge -> HEPA Pre-Filter.',
    fullSolution:
      'Full Solution Order (Slot 1 to 4): 1) Seal Gasket, 2) Square-to-Round Adapter, 3) LiOH CO₂ Cartridge, 4) HEPA Pre-Filter.',
    diagramType: 'co2-scrubber',
    relatedPuzzle: 'co2-filter-adapter',
  },
  {
    id: 'power-panel',
    stationIds: ['power-panel', 'water-recycler', 'mission-control'],
    title: 'Power Distribution & Solar Array',
    subtitle: 'Balances solar power generation with critical life support',
    kidSummary:
      'Solar panels charge our battery bank. During a Mars dust storm or lunar night, we must power Oxygen and CO₂ Scrubbers first, and pause optional lights like the Greenhouse.',
    glossaryTerm: {
      word: 'Load Shedding',
      meaning: 'Turning off optional machines so emergency life-support systems keep running.',
    },
    steps: [
      'Check Solar Generation vs. Total System Drain in Power & Life Support.',
      'If power is low, switch OFF Research Systems and Greenhouse first.',
      'If a circuit breaker tripped, match RED (PWR+), YELLOW (CTRL), and BLACK (GND) in the Power Panel.',
      'Keep Oxygen Generator and CO₂ Scrubber ON at all times!',
    ],
    hint: 'Always protect Oxygen and CO₂ Scrubbers before the Greenhouse. In the circuit puzzle, match Red->PWR+, Yellow->CTRL, Black->GND.',
    fullSolution:
      'Full Solution: Pause Greenhouse/Research when solar drops, or connect RED->PWR+, YELLOW->CTRL, BLACK->GND on the Power Panel.',
    diagramType: 'power-circuit',
    relatedPuzzle: 'circuit-reconnect',
  },
  {
    id: 'radiation-shelter',
    stationIds: ['radiation-shelter', 'water-blocks'],
    title: 'Radiation Shelter & Water-Barrier Blocks',
    subtitle: 'Protects the crew during Solar Particle Events',
    kidSummary:
      'Solar flares send fast invisible particles through space. Hydrogen-rich materials like water-barrier blocks absorb radiation! Stack water blocks around the shelter wall to protect the crew.',
    glossaryTerm: {
      word: 'Solar Particle Event',
      meaning: 'A burst of high-energy radiation sent from the Sun during a solar storm.',
    },
    steps: [
      'Listen for the Solar Flare / Radiation Alert warning.',
      'Click or interact with the glowing Water-Barrier Blocks inside the module.',
      'Reinforce all 3 Water-Barrier Blocks against the glowing Shield Wall.',
      'Keep all 4 astronauts inside the protected shelter bay until the alert clears.',
    ],
    hint: 'Walk near the cyan Water-Barrier Blocks (right side) or click "REINFORCE SHELTER" to stack all 3 blocks!',
    fullSolution:
      'Full Solution: Reinforce all 3 Water-Barrier Blocks or choose Plan A/B in the Solar Flare alert panel to shield the crew.',
    diagramType: 'radiation-shield',
  },
  {
    id: 'pressure-hull',
    stationIds: ['tool-cabinet', 'crew-bunks', 'manual-terminal'],
    title: 'Habitat Pressure & Hull Patching',
    subtitle: 'Keeps cabin air sealed inside the habitat',
    kidSummary:
      'Our module holds breathable air pressure like a space balloon. If a tiny rock chips the hull, we align a composite Hull Patch directly over the leak circle to stop air from escaping.',
    glossaryTerm: {
      word: 'Bulkhead Isolation',
      meaning: 'Closing an airtight door between rooms so a leak stays trapped in one small zone.',
    },
    steps: [
      'Check Habitat Pressure on the Crew Safety gauge.',
      'Locate the glowing breach spot in the Hull Patch scanner.',
      'Drag the composite Hull Patch directly onto the center of the leak target.',
      'Hold until the airtight seal indicator turns green!',
    ],
    hint: 'Center the orange Hull Patch right over the glowing blue leak ring until alignment reaches 90%+.',
    fullSolution:
      'Full Solution: Drag the Hull Patch over the target leak circle and click Seal Breach when the ring turns green.',
    diagramType: 'hull-patch',
    relatedPuzzle: 'hull-patch',
  },
  {
    id: 'greenhouse',
    stationIds: ['greenhouse', 'food-cabinet'],
    title: 'Space Greenhouse & Food Storage',
    subtitle: 'Grows fresh plants using water and grow-light power',
    kidSummary:
      'Space greenhouses grow leafy plants that add +4 Food each Sol! Remember that grow lights use battery power and plants drink a little water—so pause the Greenhouse if Battery drops low.',
    glossaryTerm: {
      word: 'Hydroponics',
      meaning: 'Growing plants in nutrient-rich water without needing heavy soil.',
    },
    steps: [
      'Visit the Food Cabinet to pick up Meal Packs and Water Packs.',
      'Check the Greenhouse rack to see daily food growth (+4 Food/Sol).',
      'Watch Battery and Water: Greenhouse uses -4 Battery and -2 Water per Sol.',
      'Switch Greenhouse OFF temporarily during power emergencies.',
    ],
    hint: 'Turn Greenhouse OFF only when Battery is low, and turn it back ON once solar power recovers.',
    fullSolution:
      'Full Solution: Keep Greenhouse ON when Battery >= 40% and Water >= 35%. Collect Meal Packs from the Food Cabinet for extra astronaut stamina.',
    diagramType: 'greenhouse',
  },
];

export function getManualPageForContext(
  stationId?: StationId | null,
  emergencyScenarioId?: string | null
): ManualPage {
  if (stationId) {
    const match = MANUAL_PAGES.find((p) => p.stationIds.includes(stationId));
    if (match) return match;
  }
  if (emergencyScenarioId) {
    if (emergencyScenarioId === 'o2-circuit-failure') return MANUAL_PAGES[0];
    if (emergencyScenarioId === 'co2-scrubber-failure') return MANUAL_PAGES[1];
    if (emergencyScenarioId === 'mars-dust-storm') return MANUAL_PAGES[2];
    if (emergencyScenarioId === 'moon-radiation-alert') return MANUAL_PAGES[3];
    if (emergencyScenarioId === 'habitat-pressure-leak') return MANUAL_PAGES[4];
  }
  return MANUAL_PAGES[0];
}

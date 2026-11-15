import { PuzzleId, StationId } from '../types/game';

export type ManualDiagramType =
  | 'electrolysis'
  | 'co2-scrubber'
  | 'power-circuit'
  | 'water-recycler'
  | 'battery-bank'
  | 'temperature-control'
  | 'radiation-shield'
  | 'hull-patch'
  | 'greenhouse';

export type ManualPage = {
  id: string;
  stationIds: StationId[];
  title: string;
  subtitle: string;
  kidSummary: string;
  onOffRule: string;
  inputsOutputs: string;
  maintenanceGuide: string;
  requiredComponents: string;
  whyItMatters: string;
  glossaryTerm: { word: string; meaning: string };
  steps: string[];
  hint: string;
  fullSolution: string;
  diagramType: ManualDiagramType;
  relatedPuzzle?: PuzzleId;
};

export const MANUAL_PAGES: ManualPage[] = [
  {
    id: 'oxygen-generator',
    stationIds: ['oxygen-generator'],
    title: '1. Oxygen Generator (Electrolysis)',
    subtitle: 'Makes breathable oxygen from water using electricity',
    kidSummary:
      'The oxygen cabinet makes fresh oxygen from clean water using electricity. It splits H₂O into breathable O₂ for the crew and safely vents hydrogen gas.',
    onOffRule: 'Walk to the Oxygen Generator cabinet (E) or open Systems -> toggle ON. Keep ON unless battery drops to 0%.',
    inputsOutputs: 'Inputs: 6 PWR + 2.2 Water/Sol -> Output: +12 Oxygen/Sol (0 O₂ if OFF, damaged, or Water < 2%).',
    maintenanceGuide: 'Keep condition above 70%. Walk to the Oxygen Generator (E) for crew maintenance (+18% condition) or apply a Repair Kit (+38%).',
    requiredComponents: 'Repair Kit or Cable Connector Kit (for randomized harness circuit repair).',
    whyItMatters: 'Continuously, the 4 astronauts consume ~8.5 Oxygen per Sol. Without active electrolysis, cabin O₂ drops toward Stage 1 Warning and Stage 2 Emergency.',
    glossaryTerm: {
      word: 'Electrolysis',
      meaning: 'Using electricity to split water (H₂O) into Oxygen and Hydrogen.',
    },
    steps: [
      'Check that Battery Reserve has at least 6 PWR and Potable Water is >= 2%.',
      'Walk to the Oxygen Generator arcade cabinet (E) and make sure its physical switch is ON.',
      'If a circuit fault occurs, open the repair puzzle and match each wire color to its matching port.',
      'Watch the astronaut complete the physical wrench repair and check that the warning triangle clears!',
    ],
    hint: 'Match each colored harness lead to the same-colored port (wire order randomizes each fault!).',
    fullSolution:
      'Full Solution: Keep Water >= 2% and Battery >= 6 PWR. Match each colored wire (Red/Yellow/Black) to its matching destination port.',
    diagramType: 'electrolysis',
    relatedPuzzle: 'circuit-reconnect',
  },
  {
    id: 'co2-scrubber',
    stationIds: ['co2-scrubber'],
    title: '2. CO₂ Scrubber Air Cleaner',
    subtitle: 'Removes carbon dioxide from cabin air (does NOT make oxygen)',
    kidSummary:
      'The air cleaner removes carbon dioxide so cabin air stays safe to breathe. Important science rule: a CO₂ scrubber cleans CO₂ out of air—it does NOT turn CO₂ into oxygen!',
    onOffRule: 'Inspect the CO₂ Scrubber cabinet (E) or Systems -> toggle CO₂ Scrubber ON.',
    inputsOutputs: 'Inputs: 4 PWR + Filter -> Output: -15 CO₂/Sol (cleans air; produces 0 O₂).',
    maintenanceGuide: 'Scrubber filters wear down gradually while running. Perform routine maintenance or assign Astra to Maintenance.',
    requiredComponents: 'Spare CO₂ Filter (Plan A) or Spare Hardware & Consumable Liner to assemble one.',
    whyItMatters: 'The 4-person crew exhales CO₂ continuously. High CO₂ (>=75%) injures crew health and triggers Stage 2 Emergency -> Rescue Protocol at 95%.',
    glossaryTerm: {
      word: 'Carbon Dioxide (CO₂)',
      meaning: 'The gas people breathe out. Too much CO₂ makes cabin air unhealthy.',
    },
    steps: [
      'Turn off the fan intake before opening the filter housing.',
      'Place the Seal Gasket onto the round blower outlet first (Slot 1).',
      'Attach the Square-to-Round Adapter (Slot 2) so the square cartridge fits the round pipe.',
      'Slide in the LiOH CO₂ Cartridge (Slot 3) and snap the HEPA Pre-Filter on top (Slot 4)!',
    ],
    hint: 'Think about airflow from bottom to top: Seal Gasket -> Adapter -> LiOH Cartridge -> HEPA Pre-Filter.',
    fullSolution:
      'Full Solution Order (Slot 1 to 4): 1) Seal Gasket, 2) Square-to-Round Adapter, 3) LiOH CO₂ Cartridge, 4) HEPA Pre-Filter.',
    diagramType: 'co2-scrubber',
    relatedPuzzle: 'co2-filter-adapter',
  },
  {
    id: 'water-recycler',
    stationIds: ['water-recycler', 'water-dispenser', 'toilet-facility'],
    title: '3. Water Recycler, Dispenser & Waste Bay',
    subtitle: 'Purifies urine & humidity condensate; keeps solid waste sealed separately',
    kidSummary:
      'In space, every drop of liquid is recovered scientifically! The Toilet & Waste Bay sends liquid urine and cabin humidity condensate to the Water Recycler, which filters, purifies, and quality-checks it before sending clean water to the Water Dispenser. Solid waste stays sealed separately and never enters drinking water.',
    onOffRule: 'Inspect the Water Recycler cabinet (E) -> keep switch ON whenever Battery permits.',
    inputsOutputs: 'Inputs: 4 PWR + Urine & Humidity Condensate -> Output: Filtration -> Purification -> Quality Check -> Potable Tank (+7.5 H₂O/Sol).',
    maintenanceGuide: 'Visit the Toilet & Waste Bay to empty sealed solid waste canisters, and visit the Water Dispenser to hydrate astronauts!',
    requiredComponents: 'Repair Kit or Spare Hardware & Sealant (for pump seal leaks).',
    whyItMatters: 'Astronauts need drinking water to keep Hydration healthy, AND both Oxygen Generator and Greenhouse require clean water!',
    glossaryTerm: {
      word: 'Closed-Loop Water Recovery',
      meaning: 'Filtering and purifying urine and cabin humidity through multiple safety checks into clean drinking water, while sealing solid waste separately.',
    },
    steps: [
      'Check the Toilet & Waste Bay to see Urine + Humidity lines feeding the Water Recycler, separate from Solid Waste.',
      'Walk to the Water Recycler cabinet (E) and verify it is ON and healthy.',
      'If pump seals leak, complete the Hull & Seal Patch alignment or use a Repair Kit.',
      'Walk to the Water Dispenser whenever an astronaut needs a drink!',
    ],
    hint: 'Remember: Solid waste never goes into water recovery—only liquid waste & humidity go through filtration, purification, and quality checks.',
    fullSolution:
      'Full Solution: Keep Water Recycler ON, repair pump leaks immediately, empty Solid Waste when full, and hydrate astronauts at the Water Dispenser.',
    diagramType: 'water-recycler',
    relatedPuzzle: 'hull-patch',
  },
  {
    id: 'greenhouse',
    stationIds: ['greenhouse', 'food-cabinet'],
    title: '4. Space Greenhouse & Crop Harvest',
    subtitle: 'Grows real hydroponic crops over time using water and grow-light power',
    kidSummary:
      'Space greenhouses grow leafy plants over time—never instantly! Keep the Greenhouse powered and watered so crops grow from 0% to 100% READY, then walk up to the Greenhouse to harvest fresh Food. Eating meals restores Nutrition, which slowly rebuilds physical stamina.',
    onOffRule: 'Inspect Greenhouse cabinet (E) -> keep Grow Lights ON while Water >= 2% and Battery >= 35%.',
    inputsOutputs: 'Inputs: 4 PWR + 2 Water/Sol -> Crop Growth 0%..100% -> Harvest +18 Food to Habitat Supply.',
    maintenanceGuide: 'Keep grow-light ballast healthy and assign Orbit to Greenhouse for faster crop growth.',
    requiredComponents: 'No spare parts for normal farming; Meal Packs restore Nutrition (which gradually restores Stamina).',
    whyItMatters: 'The crew eats food continuously. If Greenhouse is unpowered or dry, crops turn unhealthy and pause growth.',
    glossaryTerm: {
      word: 'Hydroponics',
      meaning: 'Growing plants in nutrient-rich water without needing heavy soil.',
    },
    steps: [
      'Keep Battery and Water healthy so Greenhouse moisture stays high.',
      'Watch crop growth climb toward 100% READY.',
      'Walk to the Greenhouse cabinet (E) and click Harvest Crops when 100% READY!',
      'Pause Greenhouse during severe dust storms if Oxygen or CO₂ needs the electricity.',
    ],
    hint: 'Crops must reach 100% READY before harvesting—you cannot create infinite instant food!',
    fullSolution:
      'Full Solution: Keep Greenhouse ON with Water >= 2%, harvest whenever crops hit 100%, and feed crewmates to sustain Nutrition & Stamina.',
    diagramType: 'greenhouse',
  },
  {
    id: 'solar-array',
    stationIds: ['solar-array', 'mission-control'],
    title: '5. Solar Power System',
    subtitle: 'Generates continuous electricity from sunlight',
    kidSummary:
      'Solar wings convert sunlight into electricity! During a Mars dust storm or solar gimbal fault, solar power drops sharply—so switching OFF optional cabinets protects life support first.',
    onOffRule: 'Inspect the Solar Power System cabinet (E) to toggle array connection or run Solar diagnostics.',
    inputsOutputs: 'Input: Sunlight -> Output: +24 PWR/Sol normal (+5 to +10 PWR/Sol during Mars dust storms or faults).',
    maintenanceGuide: 'Priority order: Pressure -> O₂ -> CO₂ -> Temp -> Water -> Greenhouse -> Research.',
    requiredComponents: 'Repair Kit or Cable Connector Kit for circuit/gimbal restoration.',
    whyItMatters: 'If Battery + Solar cannot cover total machine power draw, lower-priority cabinets pause automatically to protect Pressure and Oxygen.',
    glossaryTerm: {
      word: 'Load Shedding',
      meaning: 'Switching off optional machines so critical life-support machines keep running.',
    },
    steps: [
      'Check Solar Generation vs. Total Drain in Systems Dashboard.',
      'During dust storms or solar drops, switch OFF Research and Greenhouse first.',
      'Repair any Solar Array fault at the Solar cabinet using Circuit or Diagnostic puzzles.',
      'Keep Pressure, Oxygen Generator, and CO₂ Scrubber powered first!',
    ],
    hint: 'Always pause Research (4 PWR) and Greenhouse (4 PWR) before Oxygen or CO₂ run out of power.',
    fullSolution:
      'Full Solution: Toggle OFF Research/Greenhouse during low solar periods and repair Solar Array faults immediately.',
    diagramType: 'power-circuit',
    relatedPuzzle: 'diagnostic-sequence',
  },
  {
    id: 'battery-bank',
    stationIds: ['battery-system'],
    title: '6. Battery System',
    subtitle: 'Stores solar electricity and feeds habitat cabinets continuously',
    kidSummary:
      'The Battery System cabinet stores extra electricity made by the Solar Array so life-support cabinets keep running even when dust storms block the sun.',
    onOffRule: 'Inspect the Battery System cabinet (E) to check cell health, charge rate, or isolate discharge.',
    inputsOutputs: 'Input: Solar surplus -> Output: Supplies stored PWR (damaged cells leak -8 PWR/Sol!).',
    maintenanceGuide: 'Keep Battery condition above 70% via maintenance at the Battery System cabinet or a Repair Kit.',
    requiredComponents: 'Repair Kit, Emergency Battery Module (+25% reserve), or Cable Connector Kit.',
    whyItMatters: 'An overheated or damaged Battery System leaks charge continuously and risks browning out Oxygen and Temperature Control.',
    glossaryTerm: {
      word: 'Thermal Runaway',
      meaning: 'When a damaged battery cell overheats and loses stored electrical energy.',
    },
    steps: [
      'Check Battery System condition at the Battery arcade cabinet (E).',
      'If a Battery Malfunction triggers, solve the randomized Circuit Reconnect puzzle.',
      'Use an Emergency Battery Module from your Bag if reserve drops under 20%.',
    ],
    hint: 'Fix Battery Malfunctions quickly—damaged cells leak stored power every second!',
    fullSolution:
      'Full Solution: Complete the Circuit Reconnect puzzle at the Battery cabinet or deploy an Emergency Battery Module.',
    diagramType: 'battery-bank',
    relatedPuzzle: 'circuit-reconnect',
  },
  {
    id: 'pressure-hull',
    stationIds: ['tool-cabinet', 'manual-terminal'],
    title: '7. Habitat Pressure System',
    subtitle: 'Seals and regulates breathable air pressure inside the cabin',
    kidSummary:
      'Our habitat holds breathable air pressure like a strong space submarine. If a micrometeorite chips the hull, air escapes continuously until we align a Hull Patch over the leak!',
    onOffRule: 'Priority 1 system (2 PWR/Sol). Always powered first when any electricity exists.',
    inputsOutputs: 'Input: 2 PWR/Sol -> Output: Maintains 100% Cabin Pressure.',
    maintenanceGuide: 'Seal any pressure leak immediately before Stage 2 Emergency counts down!',
    requiredComponents: 'Hull Patch Kit (Plan A) or 2x Spare Hardware & Sealant assembled in Bag.',
    whyItMatters: 'If Habitat Pressure falls to 35% or lower, Safety Protocol initiates crew shelter & Earth Rescue launch.',
    glossaryTerm: {
      word: 'Bulkhead Isolation',
      meaning: 'Closing an airtight hatch so a pressure leak stays contained.',
    },
    steps: [
      'Watch Habitat Pressure on the Left HUD Safety card.',
      'If a Pressure Leak occurs, collect or assemble a Hull Patch Kit or select Plan B/C.',
      'Drag the composite Hull Patch over the randomized leak ring until alignment turns green.',
    ],
    hint: 'Center the orange Hull Patch over the glowing blue leak ring until alignment turns green.',
    fullSolution:
      'Full Solution: Align the Hull Patch over the target leak circle and click Lock Hull Seal.',
    diagramType: 'hull-patch',
    relatedPuzzle: 'hull-patch',
  },
  {
    id: 'temperature-control',
    stationIds: ['crew-bunks', 'mission-control'],
    title: '8. Temperature Control Loop',
    subtitle: 'Keeps cabin warm against freezing Moon and Mars nights',
    kidSummary:
      'Space outside the habitat is freezing cold! The Temperature Control loop circulates warm coolant around the cabin walls so the crew stays warm and healthy.',
    onOffRule: 'Toggle Temperature Control ON/OFF in Systems Dashboard.',
    inputsOutputs: 'Input: 4 PWR/Sol -> Output: +5.5 Temp Safety/Sol (-10/Sol if OFF, -14/Sol if damaged).',
    maintenanceGuide: 'Keep coolant valves above 70% condition via maintenance or diagnostic repair.',
    requiredComponents: 'Repair Kit or Diagnostic reset for heater controller faults.',
    whyItMatters: 'Freezing cabin temperatures (<=42%) injure astronaut health and trigger Stage 2 Emergency.',
    glossaryTerm: {
      word: 'Thermal Control Loop',
      meaning: 'Pipes and heaters that move heat evenly through a spacecraft.',
    },
    steps: [
      'Check Temp Safety % on the Safety HUD.',
      'Ensure Temperature Control is switched ON (uses 4 PWR/Sol).',
      'If a Temperature Control Failure occurs, fix the heater valve via Plan A/B/C or diagnostic repair.',
    ],
    hint: 'Keep Temperature Control ON whenever Battery permits—pause Research or Greenhouse first instead!',
    fullSolution:
      'Full Solution: Keep Temperature Control ON and run the Thermal Diagnostic sequence when a valve sticks.',
    diagramType: 'temperature-control',
    relatedPuzzle: 'diagnostic-sequence',
  },
  {
    id: 'radiation-shelter',
    stationIds: ['radiation-shelter', 'water-blocks'],
    title: '9. Radiation Shelter & Consumable Liners',
    subtitle: 'Continuous structural shelter protection + deployable storm liners',
    kidSummary:
      'Solar flares shoot invisible high-energy particles through space. Our structural Radiation Shelter walls provide continuous base protection without wearing out, and astronauts also position water storage bags and deploy consumable polyethylene liners during intense storms!',
    onOffRule: 'Structural Shelter is always ready (0 PWR). Move crew inside and deploy consumable liners during solar flares.',
    inputsOutputs: 'Structural Walls (permanent base) + Water Bags + Consumable Polyethylene Liners.',
    maintenanceGuide: 'Click Shield / Water Bags to position storage tanks and use Consumable Radiation Liners from your Bag.',
    requiredComponents: 'Consumable Radiation Liner (optional Plan B / Inventory boost) + water storage bags.',
    whyItMatters: 'During Solar Radiation Alerts, unshielded crews lose radiation protection and suffer health injury.',
    glossaryTerm: {
      word: 'Solar Particle Event',
      meaning: 'A burst of high-energy radiation sent from the Sun during a solar storm.',
    },
    steps: [
      'Listen for the Solar Flare / Radiation Alert warning.',
      'Position water storage bags along the right Shield Wall.',
      'Move crew into the Radiation Shelter or deploy a Consumable Radiation Liner during severe flares!',
    ],
    hint: 'Structural shelter walls do not wear out after 3 uses—water bags and consumable liners add extra storm protection!',
    fullSolution:
      'Full Solution: Position water storage bags and select Plan A or Plan B (consumable liner) during Solar Radiation Alerts.',
    diagramType: 'radiation-shield',
  },
];

export function getManualPageForContext(
  stationId?: StationId | null,
  emergencyScenarioId?: string | null
): ManualPage {
  if (emergencyScenarioId) {
    if (emergencyScenarioId === 'o2-circuit-failure') return MANUAL_PAGES[0];
    if (emergencyScenarioId === 'co2-scrubber-failure') return MANUAL_PAGES[1];
    if (emergencyScenarioId === 'water-recycler-failure') return MANUAL_PAGES[2];
    if (emergencyScenarioId === 'mars-dust-storm' || emergencyScenarioId === 'solar-power-reduction')
      return MANUAL_PAGES[4];
    if (emergencyScenarioId === 'battery-malfunction') return MANUAL_PAGES[5];
    if (emergencyScenarioId === 'habitat-pressure-leak') return MANUAL_PAGES[6];
    if (emergencyScenarioId === 'temperature-control-failure') return MANUAL_PAGES[7];
    if (emergencyScenarioId === 'moon-radiation-alert') return MANUAL_PAGES[8];
  }
  if (stationId) {
    const match = MANUAL_PAGES.find((p) => p.stationIds.includes(stationId));
    if (match) return match;
  }
  return MANUAL_PAGES[0];
}

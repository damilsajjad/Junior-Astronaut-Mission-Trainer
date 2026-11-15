import { ScenarioConfig } from '../types/game';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'mars-dust-storm',
    title: 'Mars Great Dust Storm',
    shortLabel: 'MARS DUST STORM',
    destination: 'mars',
    introStory:
      'A regional Martian dust storm is sweeping across the crater rim! Fine rust dust is coating the solar panels, dropping solar power generation from +22 to +8 points per Sol for 2 Sols.',
    triggerSol: 1,
    affectedSystems: ['solarArray', 'powerPanel', 'greenhouse'],
    solarModifier: 8,
    dustStormDays: 2,
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Cadet, the Martian dust storm is blocking sunlight! Our batteries are limited. Keep life support running and pause the greenhouse lights, or inspect the Power Panel!',
    capcomSuccess:
      'Power systems stabilized! In real Mars missions like Opportunity and InSight, dust on solar arrays makes power budgets the top survival priority.',
    scienceExplanation:
      'Martian dust storms lift fine iron-oxide dust high into the thin CO₂ atmosphere, reducing sunlight reaching solar arrays. Mission teams manage strict power priorities so life support stays online.',
    sourceUrls: [
      {
        label: 'NASA ECLSS Subsystems',
        url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/',
      },
      {
        label: 'NASA Mars Trek',
        url: 'https://trek.nasa.gov/mars/',
      },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Inspect & Reset Solar Array',
        description:
          'Use a Repair Kit and complete the Power Distribution Panel circuit reconnect puzzle to clear dust-fault relays and restore full +22 solar generation.',
        requiredItemId: 'repair-kit',
        requiredItemQty: 1,
        requiresPuzzle: 'circuit-reconnect',
        effectSummary: 'Restores normal +22 solar generation and +10 Battery',
        resourceDelta: { battery: 10 },
        restoresSystem: 'solarArray',
      },
      B: {
        id: 'B',
        title: 'Plan B: Activate Emergency Battery Module',
        description:
          'Install one Emergency Battery Module (+25 Battery) and pause optional systems while waiting out the dust storm.',
        requiredItemId: 'emergency-battery',
        requiredItemQty: 1,
        effectSummary: '+25 Battery reserve, pauses Research systems',
        resourceDelta: { battery: 25 },
        restoresSystem: 'powerPanel',
      },
      C: {
        id: 'C',
        title: 'Plan C: Low-Power Survival Mode',
        description:
          'No parts needed. Pause the Greenhouse and optional equipment for now to protect Oxygen Generator and CO₂ Scrubber power.',
        requiresLowPower: true,
        effectSummary: 'Saves 8 Battery/Sol by pausing Greenhouse & Research',
        resourceDelta: { battery: 6 },
      },
    },
  },
  {
    id: 'moon-radiation-alert',
    title: 'Solar Flare & Lunar Radiation Alert',
    shortLabel: 'SOLAR FLARE ALERT',
    destination: 'moon',
    introStory:
      'Space weather sensors detected a fast Solar Particle Event heading toward the Moon! Without Earth’s thick magnetic field, high-energy solar radiation will spike soon.',
    triggerSol: 1,
    affectedSystems: ['radiationShelter'],
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Cadet! A solar flare is approaching fast! Drag or reinforce the glowing Water-Barrier Blocks at the Radiation Shelter, and get the crew protected!',
    capcomSuccess:
      'Shelter reinforced! Water and hydrogen-rich plastics are great at blocking space radiation—astronauts on Artemis and ISS use water walls and cargo bags as storm shelters.',
    scienceExplanation:
      'Because the Moon lacks a global magnetic field and dense atmosphere, solar flares create sudden radiation hazards. Water-barrier blocks contain hydrogen atoms that effectively slow down solar protons.',
    sourceUrls: [
      {
        label: 'NASA Orion Crew Systems & Radiation Shelter',
        url: 'https://www.nasa.gov/reference/crew-systems/',
      },
      {
        label: 'NASA Moon Trek',
        url: 'https://trek.nasa.gov/moon/',
      },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Shelter Crew & Reinforce Water Wall',
        description:
          'Move the crew into the Radiation Shelter zone and stack Water-Barrier Blocks to shield the habitat.',
        effectSummary: '+25 Radiation Protection, crew safely sheltered',
        resourceDelta: { radiationProtection: 25 },
        restoresSystem: 'radiationShelter',
        activatesShelter: true,
      },
      B: {
        id: 'B',
        title: 'Plan B: Install Radiation Shielding Panel',
        description:
          'Deploy a carried Radiation Shielding Panel onto the shelter bulkhead for extra particle absorption.',
        requiredItemId: 'radiation-panel',
        requiredItemQty: 1,
        effectSummary: '+30 Radiation Protection, +5 Crew Safety',
        resourceDelta: { radiationProtection: 30, temperatureSafety: 5 },
        restoresSystem: 'radiationShelter',
        activatesShelter: true,
      },
      C: {
        id: 'C',
        title: 'Plan C: Cancel EVAs & Interior Lockdown',
        description:
          'Keep all crew inside the inner bulkhead core and power down non-essential exterior sensors.',
        effectSummary: '+12 Radiation Protection, safe interior hold',
        resourceDelta: { radiationProtection: 12 },
        activatesShelter: true,
      },
    },
  },
  {
    id: 'o2-circuit-failure',
    title: 'Oxygen Generator Circuit Failure',
    shortLabel: 'O2 CIRCUIT FAILURE',
    destination: 'both',
    introStory:
      'The Water Electrolysis Oxygen Generator tripped its control harness and stopped splitting water into oxygen! Cabin O₂ production is offline until fixed.',
    triggerSol: 2,
    affectedSystems: ['oxygenGenerator', 'powerPanel'],
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Warning, Cadet! Our Oxygen Generator lost its control circuit. Check the Repair Manual (M) and reconnect the color-coded wires, or tap our backup O₂ reserve!',
    capcomSuccess:
      'Great engineering! Remember: the Oxygen Generator uses electricity to split water (H₂O) into breathable oxygen and hydrogen gas.',
    scienceExplanation:
      'On the International Space Station, the Oxygen Generation System uses electrolysis—passing an electric current through clean water to separate oxygen for the crew to breathe.',
    sourceUrls: [
      {
        label: 'NASA ECLSS Life Support',
        url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/',
      },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Reconnect Color-Coded Game Circuit',
        description:
          'Open the circuit repair puzzle and match Red, Yellow, and Black harness leads to restore the Oxygen Generator.',
        requiresPuzzle: 'circuit-reconnect',
        effectSummary: 'Restores Oxygen Generator (+10 O₂/Sol) and +8 Oxygen',
        resourceDelta: { oxygen: 8 },
        restoresSystem: 'oxygenGenerator',
      },
      B: {
        id: 'B',
        title: 'Plan B: Release Emergency Oxygen Reserve',
        description:
          'Consume one Emergency Oxygen Reserve canister to immediately refill cabin oxygen (+25 O₂) and buy repair time.',
        requiredItemId: 'emergency-oxygen',
        requiredItemQty: 1,
        effectSummary: '+25 Oxygen reserve immediately',
        resourceDelta: { oxygen: 25 },
        restoresSystem: 'oxygenGenerator',
      },
      C: {
        id: 'C',
        title: 'Plan C: Survival Conservation Mode',
        description:
          'Reduce crew exertion and pause optional systems to slow oxygen consumption while troubleshooting.',
        effectSummary: '+10 Oxygen conserved, pauses optional systems',
        resourceDelta: { oxygen: 10 },
      },
    },
  },
  {
    id: 'co2-scrubber-failure',
    title: 'CO₂ Scrubber Filter Failure',
    shortLabel: 'CO₂ SCRUBBER ALERT',
    destination: 'both',
    introStory:
      'Carbon dioxide is rising inside the module because the CO₂ Scrubber filter airflow path is clogged! We must clear or adapt the filter right away.',
    triggerSol: 3,
    affectedSystems: ['co2Scrubber'],
    puzzleId: 'co2-filter-adapter',
    capcomAlert:
      'Alert! Carbon dioxide is building up! Replace the cartridge (Plan A) or build an Apollo 13-style emergency filter adapter (Plan B)!',
    capcomSuccess:
      'Airflow restored! Remember: a CO₂ Scrubber removes carbon dioxide from cabin air—it does NOT convert CO₂ into oxygen.',
    scienceExplanation:
      'During Apollo 13, astronauts had square CO₂ cartridges and round filter sockets. Ground engineers invented an adapter out of plastic bags, cardboard, and duct tape to keep cabin CO₂ safe.',
    sourceUrls: [
      {
        label: 'NASA Apollo 13 Mission',
        url: 'https://www.nasa.gov/mission/apollo-13/',
      },
      {
        label: 'NASA CO2 Filter Incident',
        url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/',
      },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Install Spare CO₂ Filter',
        description:
          'Use one Spare CO₂ Filter from inventory to swap the clogged cartridge cleanly.',
        requiredItemId: 'spare-co2-filter',
        requiredItemQty: 1,
        effectSummary: 'Drops CO₂ by -22 and restores CO₂ Scrubber',
        resourceDelta: { co2: -22 },
        restoresSystem: 'co2Scrubber',
      },
      B: {
        id: 'B',
        title: 'Plan B: Build Apollo 13 Filter Adapter',
        description:
          'Complete the interactive CO₂ Filter & Adapter Puzzle using onboard ducted adapter pieces to restore airflow.',
        requiresPuzzle: 'co2-filter-adapter',
        effectSummary: 'Drops CO₂ by -20 and restores CO₂ Scrubber',
        resourceDelta: { co2: -20 },
        restoresSystem: 'co2Scrubber',
      },
      C: {
        id: 'C',
        title: 'Plan C: Move Crew to Safe Habitat Bay',
        description:
          'Move the crew into the auxiliary sealed shelter bay and lower activity to slow CO₂ buildup.',
        effectSummary: 'Drops CO₂ by -10 and protects crew',
        resourceDelta: { co2: -10 },
        activatesShelter: true,
      },
    },
  },
  {
    id: 'habitat-pressure-leak',
    title: 'Habitat Pressure Leak',
    shortLabel: 'HULL PRESSURE LEAK',
    destination: 'both',
    introStory:
      'A tiny micrometeoroid nicked an exterior habitat seam! Cabin air pressure is slowly dropping until we seal the breach or isolate the bay.',
    triggerSol: 4,
    affectedSystems: ['pressureSystem'],
    pressureLeakPerTurn: 14,
    puzzleId: 'hull-patch',
    capcomAlert:
      'Cadet, pressure sensors show a small hull leak! Apply a Hull Patch Kit (Plan A) or seal the bulkhead hatch (Plan B) to protect our air!',
    capcomSuccess:
      'Hull sealed! Spacecraft use multi-layer Whipple shields and segmented bulkheads so a leak in one area does not empty the entire station.',
    scienceExplanation:
      'Space habitats stay pressurized at Earth-like levels so astronauts can breathe normally. Isolating a leaky compartment and applying composite patches keeps the rest of the crew safe.',
    sourceUrls: [
      {
        label: 'NASA ECLSS & Habitat Pressure',
        url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/',
      },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Patch the Breach',
        description:
          'Use a Hull Patch Kit and complete the Hull Patch alignment puzzle to permanently seal the exterior panel.',
        requiredItemId: 'hull-patch-kit',
        requiredItemQty: 1,
        requiresPuzzle: 'hull-patch',
        effectSummary: 'Restores Habitat Pressure (+20) and stops leak',
        resourceDelta: { habitatPressure: 20, oxygen: 5 },
        restoresSystem: 'pressureSystem',
      },
      B: {
        id: 'B',
        title: 'Plan B: Isolate Damaged Compartment',
        description:
          'Close the bulkhead seal around the damaged bay to stop pressure loss without using a patch kit.',
        effectSummary: 'Stops leak and stabilizes pressure (+12)',
        resourceDelta: { habitatPressure: 12 },
        restoresSystem: 'pressureSystem',
      },
      C: {
        id: 'C',
        title: 'Plan C: Emergency Shelter Containment',
        description:
          'Move all crew into the inner Radiation/Pressure Shelter while running backup air circulation.',
        effectSummary: 'Keeps crew safe and adds +8 Pressure',
        resourceDelta: { habitatPressure: 8 },
        activatesShelter: true,
      },
    },
  },
];

export const SCENARIO_BY_ID: Record<string, ScenarioConfig> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s])
);

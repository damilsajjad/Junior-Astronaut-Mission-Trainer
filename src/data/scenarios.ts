import { ScenarioConfig } from '../types/game';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'mars-dust-storm',
    eventType: 'mars-dust-storm',
    title: 'Mars Great Dust Storm',
    shortLabel: 'MARS DUST STORM',
    destination: 'mars',
    introStory:
      'A regional Martian dust storm is sweeping across the crater rim! Fine iron-oxide dust coats the solar panels, reducing solar generation by 50–70% until cleared or waited out.',
    triggerSol: 1,
    affectedSystems: ['solarArray', 'greenhouse'],
    solarModifier: 8,
    dustStormDays: 2,
    puzzleId: 'diagnostic-sequence',
    capcomAlert:
      'Cadet, the Martian dust storm is blocking sunlight! Switch OFF optional machines or run the Solar Diagnostic & Relay sequence!',
    capcomSuccess:
      'Power systems stabilized! In real Mars missions like Opportunity and InSight, dust on solar arrays makes power budgets the top survival priority.',
    scienceExplanation:
      'Martian dust storms lift fine iron-oxide dust high into the thin CO₂ atmosphere, reducing sunlight reaching solar arrays. Mission teams manage strict power priorities so life support stays online.',
    sourceUrls: [
      { label: 'NASA ECLSS Subsystems', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
      { label: 'NASA Mars Trek', url: 'https://trek.nasa.gov/mars/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Run Solar Diagnostic & Clear Gimbal',
        description:
          'Use a Repair Kit and complete the Solar Diagnostic puzzle to clear dust-fault relays and restore solar efficiency.',
        requiredItemId: 'repair-kit',
        requiredItemQty: 1,
        requiresPuzzle: 'diagnostic-sequence',
        effectSummary: 'Restores Solar Array & adds +10 Battery',
        resourceDelta: { battery: 10 },
        restoresSystem: 'solarArray',
      },
      B: {
        id: 'B',
        title: 'Plan B: Activate Emergency Battery Module',
        description:
          'Install one Emergency Battery Module (+25 Battery) and pause Research systems while waiting out the dust storm.',
        requiredItemId: 'emergency-battery',
        requiredItemQty: 1,
        effectSummary: '+25 Battery reserve, pauses Research systems',
        resourceDelta: { battery: 25 },
        restoresSystem: 'batterySystem',
      },
      C: {
        id: 'C',
        title: 'Plan C: Low-Power Survival Mode',
        description:
          'No parts needed. Pause Greenhouse and Research immediately to protect Oxygen Generator and CO₂ Scrubber power.',
        requiresLowPower: true,
        effectSummary: 'Saves power by pausing optional systems (+6 Battery)',
        resourceDelta: { battery: 6 },
      },
    },
  },
  {
    id: 'moon-radiation-alert',
    eventType: 'moon-radiation-alert',
    title: 'Solar Flare & Lunar Radiation Alert',
    shortLabel: 'SOLAR FLARE ALERT',
    destination: 'moon',
    introStory:
      'Space weather sensors detected a fast Solar Particle Event heading toward the Moon! Without Earth’s thick magnetic field, radiation exposure rises unless the crew shelters behind water storage bags and shielding liners.',
    triggerSol: 1,
    affectedSystems: ['radiationShelter'],
    puzzleId: 'diagnostic-sequence',
    capcomAlert:
      'Cadet! A solar flare is approaching fast! Move crew into the Radiation Shelter and position water bags or deploy a shielding liner!',
    capcomSuccess:
      'Shelter protected! Water and hydrogen-rich polyethylene liners absorb space radiation—astronauts on Artemis and ISS use water walls and polyethylene blankets as storm shelters.',
    scienceExplanation:
      'Because the Moon lacks a global magnetic field and dense atmosphere, solar flares create sudden radiation hazards. Water bags and polyethylene liners contain hydrogen atoms that slow down solar protons.',
    sourceUrls: [
      { label: 'NASA Orion Crew Systems', url: 'https://www.nasa.gov/reference/crew-systems/' },
      { label: 'NASA Moon Trek', url: 'https://trek.nasa.gov/moon/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Shelter Crew & Position Water Wall',
        description:
          'Move the crew into the structural Radiation Shelter zone and position water storage bags along the bulkhead.',
        effectSummary: '+25 Radiation Protection, crew safely sheltered',
        resourceDelta: { radiationProtection: 25 },
        restoresSystem: 'radiationShelter',
        activatesShelter: true,
      },
      B: {
        id: 'B',
        title: 'Plan B: Deploy Consumable Shielding Liner',
        description:
          'Unpack and secure one deployable consumable polyethylene Radiation Shielding Liner onto the shelter wall for extra particle absorption.',
        requiredItemId: 'radiation-panel',
        requiredItemQty: 1,
        effectSummary: '+32 Radiation Protection, +6 Temp Safety',
        resourceDelta: { radiationProtection: 32, temperatureSafety: 6 },
        restoresSystem: 'radiationShelter',
        activatesShelter: true,
      },
      C: {
        id: 'C',
        title: 'Plan C: Interior Core Lockdown',
        description:
          'Keep all crew inside the inner bulkhead core and power down exterior research sensors.',
        requiresLowPower: true,
        effectSummary: '+14 Radiation Protection, safe interior hold',
        resourceDelta: { radiationProtection: 14 },
        activatesShelter: true,
      },
    },
  },
  {
    id: 'solar-power-reduction',
    eventType: 'solar-power-reduction',
    title: 'Solar Panel Tracking & Power Drop',
    shortLabel: 'SOLAR POWER DROP',
    destination: 'both',
    introStory:
      'Static regolith grime and a jammed sun-tracking actuator lowered Solar Array efficiency! Solar generation will stay low until the array is serviced.',
    triggerSol: 2,
    affectedSystems: ['solarArray'],
    solarModifier: 10,
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Power alert, Cadet! Solar output dropped because the sun-tracking drive stalled. Reconnect the solar relay or ration battery power!',
    capcomSuccess:
      'Solar tracking restored! Keeping solar panels pointed directly at the Sun maximizes continuous energy harvest.',
    scienceExplanation:
      'Spacecraft solar arrays use gimbal motors to track the Sun. Fine lunar regolith or Martian dust can jam joints or coat cells, cutting voltage until cleaned or rerouted.',
    sourceUrls: [
      { label: 'NASA Solar Power Systems', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Reconnect Solar Gimbal Circuit',
        description:
          'Complete the circuit reconnect puzzle to reset the solar tracking controller.',
        requiresPuzzle: 'circuit-reconnect',
        effectSummary: 'Restores full Solar Array (+10 Battery)',
        resourceDelta: { battery: 10 },
        restoresSystem: 'solarArray',
      },
      B: {
        id: 'B',
        title: 'Plan B: Swap Backup Power Cell',
        description:
          'Consume 1 Emergency Battery Module to boost reserves while maintenance clears the array.',
        requiredItemId: 'emergency-battery',
        requiredItemQty: 1,
        effectSummary: '+25 Battery & stabilizes Solar Array',
        resourceDelta: { battery: 25 },
        restoresSystem: 'batterySystem',
      },
      C: {
        id: 'C',
        title: 'Plan C: Shed Optional Loads',
        description:
          'Pause Greenhouse and Research Equipment to keep Oxygen & CO₂ Scrubber running safely.',
        requiresLowPower: true,
        effectSummary: 'Pauses optional systems (+8 Battery conserved)',
        resourceDelta: { battery: 8 },
      },
    },
  },
  {
    id: 'o2-circuit-failure',
    eventType: 'o2-circuit-failure',
    title: 'Oxygen Generator Circuit Failure',
    shortLabel: 'O₂ CIRCUIT FAILURE',
    destination: 'both',
    introStory:
      'The Water Electrolysis Oxygen Generator tripped its control harness and stopped splitting water into oxygen! Cabin O₂ production is offline until fixed.',
    triggerSol: 2,
    affectedSystems: ['oxygenGenerator'],
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Warning, Cadet! Our Oxygen Generator lost its control circuit. Walk to the Oxygen cabinet to reconnect wires or tap our backup O₂ reserve!',
    capcomSuccess:
      'Great engineering! The Oxygen Generator uses electricity to split water (H₂O) into breathable oxygen and hydrogen gas.',
    scienceExplanation:
      'On the International Space Station, the Oxygen Generation System uses electrolysis—passing an electric current through clean water to separate oxygen for the crew to breathe.',
    sourceUrls: [
      { label: 'NASA ECLSS Life Support', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Reconnect Oxygen Circuit',
        description:
          'Open the circuit repair puzzle and match the randomized color-coded harness leads to restore the Oxygen Generator.',
        requiresPuzzle: 'circuit-reconnect',
        effectSummary: 'Restores Oxygen Generator and adds +10 Oxygen',
        resourceDelta: { oxygen: 10 },
        restoresSystem: 'oxygenGenerator',
      },
      B: {
        id: 'B',
        title: 'Plan B: Release Emergency Oxygen Reserve',
        description:
          'Consume one Emergency Oxygen Reserve canister to immediately refill cabin oxygen (+25 O₂) and restart the unit.',
        requiredItemId: 'emergency-oxygen',
        requiredItemQty: 1,
        effectSummary: '+25 Oxygen reserve & restarts Oxygen Generator',
        resourceDelta: { oxygen: 25 },
        restoresSystem: 'oxygenGenerator',
      },
      C: {
        id: 'C',
        title: 'Plan C: Survival Conservation Mode',
        description:
          'Reduce crew exertion and pause optional systems to slow oxygen consumption while bypassing the fault.',
        requiresLowPower: true,
        effectSummary: '+8 Oxygen conserved, pauses optional systems',
        resourceDelta: { oxygen: 8 },
      },
    },
  },
  {
    id: 'co2-scrubber-failure',
    eventType: 'co2-scrubber-failure',
    title: 'CO₂ Scrubber Filter Blockage',
    shortLabel: 'CO₂ FILTER BLOCKED',
    destination: 'both',
    introStory:
      'Carbon dioxide is rising inside the module because the CO₂ Scrubber filter airflow path is clogged! Clear or adapt the filter right away.',
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
      { label: 'NASA Apollo 13 Mission', url: 'https://www.nasa.gov/mission/apollo-13/' },
      { label: 'NASA CO2 Filter Incident', url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Install Spare CO₂ Filter',
        description: 'Use one Spare CO₂ Filter from inventory to swap the clogged cartridge cleanly.',
        requiredItemId: 'spare-co2-filter',
        requiredItemQty: 1,
        effectSummary: 'Drops CO₂ by -22 and restores CO₂ Scrubber',
        resourceDelta: { co2: -22 },
        restoresSystem: 'co2Scrubber',
      },
      B: {
        id: 'B',
        title: 'Plan B: Build Apollo 13 Filter Adapter',
        description: 'Complete the interactive CO₂ Filter & Adapter Puzzle to restore airflow.',
        requiresPuzzle: 'co2-filter-adapter',
        effectSummary: 'Drops CO₂ by -20 and restores CO₂ Scrubber',
        resourceDelta: { co2: -20 },
        restoresSystem: 'co2Scrubber',
      },
      C: {
        id: 'C',
        title: 'Plan C: Move Crew to Safe Shelter Bay',
        description: 'Move the crew into the auxiliary shelter bay and lower activity to slow CO₂ buildup.',
        effectSummary: 'Drops CO₂ by -10 and protects crew',
        resourceDelta: { co2: -10 },
        activatesShelter: true,
      },
    },
  },
  {
    id: 'habitat-pressure-leak',
    eventType: 'habitat-pressure-leak',
    title: 'Habitat Pressure Leak',
    shortLabel: 'HULL PRESSURE LEAK',
    destination: 'both',
    introStory:
      'A tiny micrometeoroid nicked an exterior habitat seam! Cabin air pressure is dropping continuously until we seal the breach or isolate the bay.',
    triggerSol: 4,
    affectedSystems: ['pressureSystem'],
    pressureLeakPerTurn: 14,
    puzzleId: 'hull-patch',
    capcomAlert:
      'Cadet, pressure sensors show a hull leak! Apply a Hull Patch Kit (Plan A) or isolate the bulkhead hatch (Plan B) immediately!',
    capcomSuccess:
      'Hull sealed! Spacecraft use multi-layer Whipple shields and segmented bulkheads so a leak in one area does not empty the entire station.',
    scienceExplanation:
      'Space habitats stay pressurized at Earth-like levels so astronauts can breathe normally. Isolating a leaky compartment and applying composite patches keeps the rest of the crew safe.',
    sourceUrls: [
      { label: 'NASA ECLSS & Habitat Pressure', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
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
          'Close the bulkhead seal around the damaged bay to stop pressure loss without a patch kit.',
        effectSummary: 'Stops leak and stabilizes pressure (+12)',
        resourceDelta: { habitatPressure: 12 },
        restoresSystem: 'pressureSystem',
      },
      C: {
        id: 'C',
        title: 'Plan C: Emergency Shelter Containment',
        description:
          'Move all crew into the inner Pressure Shelter while running backup air circulation.',
        effectSummary: 'Keeps crew safe and adds +8 Pressure',
        resourceDelta: { habitatPressure: 8 },
        activatesShelter: true,
      },
    },
  },
  {
    id: 'water-recycler-failure',
    eventType: 'water-recycler-failure',
    title: 'Water Recycler Pump Failure',
    shortLabel: 'WATER PUMP FAULT',
    destination: 'both',
    introStory:
      'Mineral buildup stalled the Water Recycler distillation pump! Urine & cabin humidity recovery paused, threatening both drinking water and Oxygen Electrolysis feed water.',
    triggerSol: 5,
    affectedSystems: ['waterRecycler'],
    puzzleId: 'hull-patch',
    capcomAlert:
      'Heads up, Cadet! The Water Recycler pump stopped. Remember: Oxygen Electrolysis ALSO needs water! Fix the recycler or ration water.',
    capcomSuccess:
      'Water recovery back online! On the ISS, NASA recycles urine and cabin humidity condensate (while keeping solid waste sealed separately) to recover ~98% of water.',
    scienceExplanation:
      'NASA’s Water Recovery System purifies urine brine and cabin humidity through filtration, catalytic purification, and quality checks. Solid waste is always sealed separately.',
    sourceUrls: [
      { label: 'NASA Water Recovery System', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Rebuild Pump Seal with Repair Kit',
        description: 'Use 1 Repair Kit to replace the worn distillation seal and restore full water recovery.',
        requiredItemId: 'repair-kit',
        requiredItemQty: 1,
        effectSummary: 'Restores Water Recycler and recovers +14 Water',
        resourceDelta: { water: 14 },
        restoresSystem: 'waterRecycler',
      },
      B: {
        id: 'B',
        title: 'Plan B: Seal & Flush Bypass Line',
        description: 'Complete the sealing alignment puzzle to route liquid recovery through the backup filter loop.',
        requiresPuzzle: 'hull-patch',
        effectSummary: 'Restores Water Recycler (+8 Water)',
        resourceDelta: { water: 8 },
        restoresSystem: 'waterRecycler',
      },
      C: {
        id: 'C',
        title: 'Plan C: Ration Greenhouse Water',
        description: 'Pause the Greenhouse temporarily to save water for drinking and Oxygen Electrolysis.',
        requiresLowPower: true,
        effectSummary: 'Pauses Greenhouse (+6 Water saved)',
        resourceDelta: { water: 6 },
      },
    },
  },
  {
    id: 'battery-malfunction',
    eventType: 'battery-malfunction',
    title: 'Battery Bank Cell Malfunction',
    shortLabel: 'BATTERY FAULT',
    destination: 'both',
    introStory:
      'A power bus surge overheated one of our lithium-ion battery packs! Energy storage efficiency is reduced and battery charge is leaking until repaired.',
    triggerSol: 6,
    affectedSystems: ['batterySystem'],
    puzzleId: 'circuit-reconnect',
    capcomAlert:
      'Electrical alert! The Battery Bank overheated on Bus B. Walk to the Battery System cabinet to rewire it or deploy an Emergency Battery Module!',
    capcomSuccess:
      'Battery Bus balanced! Proper charge distribution keeps high-priority life support powered through orbital night and storms.',
    scienceExplanation:
      'Spacecraft batteries must balance voltage across cells. If one cell degrades, controllers isolate it and reroute power through healthy packs.',
    sourceUrls: [
      { label: 'NASA Spacecraft Power Systems', url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Rebalance Battery Bus Circuit',
        description: 'Complete the circuit reconnect puzzle to isolate the hot cell and restore full battery storage.',
        requiresPuzzle: 'circuit-reconnect',
        effectSummary: 'Restores Battery System (+10 Battery)',
        resourceDelta: { battery: 10 },
        restoresSystem: 'batterySystem',
      },
      B: {
        id: 'B',
        title: 'Plan B: Patch In Emergency Battery Module',
        description: 'Swap in an Emergency Battery Module to restore lost capacity immediately.',
        requiredItemId: 'emergency-battery',
        requiredItemQty: 1,
        effectSummary: '+25 Battery & restores Battery System',
        resourceDelta: { battery: 25 },
        restoresSystem: 'batterySystem',
      },
      C: {
        id: 'C',
        title: 'Plan C: Isolate Bus & Enter Power Save',
        description: 'Switch off Greenhouse and Research Equipment to lower current draw on the remaining cells.',
        requiresLowPower: true,
        effectSummary: 'Stabilizes Battery System (+5 Battery conserved)',
        resourceDelta: { battery: 5 },
      },
    },
  },
  {
    id: 'temperature-control-failure',
    eventType: 'temperature-control-failure',
    title: 'Temperature Control Loop Failure',
    shortLabel: 'THERMAL LOOP FAULT',
    destination: 'both',
    introStory:
      'Freezing space temperatures outside caused the thermal coolant valve to stick! Cabin temperature safety is dropping continuously until the heater loop is repaired.',
    triggerSol: 7,
    affectedSystems: ['temperatureControl'],
    puzzleId: 'diagnostic-sequence',
    capcomAlert:
      'Brrr! Cabin temperature is dropping fast because the Temperature Control loop stalled. Run diagnostics (Plan A) or use a Repair Kit (Plan B)!',
    capcomSuccess:
      'Heater loop humming again! Thermal control protects astronauts and keeps pipes from freezing.',
    scienceExplanation:
      'On the Moon and Mars, outside temperatures plunge far below zero at night. Thermal radiators, insulation, and electric heaters keep cabin air comfortable.',
    sourceUrls: [
      { label: 'NASA Thermal Control Systems', url: 'https://www.nasa.gov/reference/crew-systems/' },
    ],
    plans: {
      A: {
        id: 'A',
        title: 'Plan A: Run Thermal Diagnostic & Reset Valve',
        description: 'Complete the interactive diagnostic sequence puzzle to restart the cabin thermal control loop.',
        requiresPuzzle: 'diagnostic-sequence',
        effectSummary: 'Restores Temperature Control & +16 Temp Safety',
        resourceDelta: { temperatureSafety: 16 },
        restoresSystem: 'temperatureControl',
      },
      B: {
        id: 'B',
        title: 'Plan B: Service Coolant Valve with Repair Kit',
        description: 'Use 1 Repair Kit to unstick the valve and restore heating immediately.',
        requiredItemId: 'repair-kit',
        requiredItemQty: 1,
        effectSummary: 'Restores Temperature Control & +22 Temp Safety',
        resourceDelta: { temperatureSafety: 22 },
        restoresSystem: 'temperatureControl',
      },
      C: {
        id: 'C',
        title: 'Plan C: Huddle Crew in Insulated Shelter',
        description: 'Move crew into the insulated core shelter and conserve heat.',
        effectSummary: '+10 Temp Safety & crew sheltered',
        resourceDelta: { temperatureSafety: 10 },
        activatesShelter: true,
      },
    },
  },
];

export const SCENARIO_BY_ID: Record<string, ScenarioConfig> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s])
);

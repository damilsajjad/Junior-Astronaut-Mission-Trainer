export type ScienceSourceItem = {
  title: string;
  gameFeature: string;
  factSummary: string;
  url: string;
};

export const NASA_SCIENCE_SOURCES: ScienceSourceItem[] = [
  {
    title: 'NASA Space Apps Challenge: Junior Astronaut Mission Trainer',
    gameFeature: 'Core 4-pillar mission design (Life Support, Radiation, Power, Food)',
    factSummary:
      'Teaches young explorers how real astronauts balance interconnected habitat systems and contingency plans.',
    url: 'https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/',
  },
  {
    title: 'NASA ECLSS Life Support Subsystems',
    gameFeature: 'Water Electrolysis Oxygen Generator & CO₂ Scrubber separation',
    factSummary:
      'Real spacecraft split water with electricity (electrolysis) to produce oxygen and use separate scrubbers to remove CO₂ from cabin air.',
    url: 'https://www.nasa.gov/reference/jsc-life-support-subsystems/',
  },
  {
    title: 'NASA ISS Water Recovery Milestone',
    gameFeature: 'Water Recycler & Hydration balance',
    factSummary:
      'On the International Space Station, up to ~98% of water is recycled to minimize heavy resupply launches.',
    url: 'https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/',
  },
  {
    title: 'NASA Apollo 13 CO₂ Filter Adaptation',
    gameFeature: 'CO₂ Scrubber Filter/Adapter Puzzle (Plan B)',
    factSummary:
      'Apollo 13 engineers improvised an adapter so square Command Module LiOH canisters fit round Lunar Module sockets.',
    url: 'https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/',
  },
  {
    title: 'NASA Orion Crew Systems & Radiation Shelter',
    gameFeature: 'Radiation Shelter & Water-Barrier Blocks',
    factSummary:
      'Water and dense supplies arranged around crew quarters act as hydrogen-rich shielding during solar particle storms.',
    url: 'https://www.nasa.gov/reference/crew-systems/',
  },
  {
    title: 'NASA Mars & Moon Trek',
    gameFeature: 'Lunar (0.16g) and Martian (0.38g) environment contexts',
    factSummary:
      'Explores lunar craters, regolith hazards, and Martian dust-storm conditions across real planetary terrain.',
    url: 'https://trek.nasa.gov/mars/',
  },
];

export const SIMULATION_ASSUMPTIONS_LIST = [
  {
    rule: '0–100% Simplified Resource Scale',
    detail:
      'Oxygen, Water, Battery, Food, CO₂, Pressure, Temperature Safety, and Radiation Protection use 0–100 percentage points in Cadet Mode instead of kg/day or kWh.',
  },
  {
    rule: 'Turn-Based Mission Days (Sols)',
    detail:
      'Resources update when the player selects End Day, never draining uncontrollably while kids read the manual or inspect the 3D exterior.',
  },
  {
    rule: 'Baseline Daily Game Rates',
    detail:
      'Crew uses -8 O₂, -8 Water, -8 Food, +12 CO₂ per Sol. Active systems provide +10 O₂ (-6 Batt), +6 Water (-4 Batt), -14 CO₂ (-4 Batt), +4 Food (-4 Batt, -2 Water). Solar adds +22 Batt (+8 during Mars Dust Storm).',
  },
  {
    rule: '17-Point Cargo Loadout',
    detail:
      'Cargo Points are an educational game-balance limit so learners trade off rations, repair kits, and emergency reserves.',
  },
  {
    rule: 'Fictional Low-Voltage Puzzle Circuits',
    detail:
      'Red/Yellow/Black puzzle circuits and Apollo 13-inspired adapter slots are simplified educational models, not real spacecraft wiring diagrams.',
  },
];

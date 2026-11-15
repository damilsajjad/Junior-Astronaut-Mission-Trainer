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
    gameFeature: 'Urine + Humidity Recovery Pipeline vs. Sealed Solid Waste Containment',
    factSummary:
      'On the ISS, urine distillate and cabin humidity condensate pass through filtration, purification, and quality verification to recover ~98% of water, while solid waste is sealed separately.',
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
    gameFeature: 'Continuous Structural Shelter + Water Bags + Consumable Polyethylene Liners',
    factSummary:
      'Structural shelter bulkheads, stored water bags, and deployable polyethylene liners contain hydrogen-rich shielding that reduces solar particle radiation.',
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
    rule: 'Continuous Time-Scaled Simulation (48s = 1 Sol)',
    detail:
      'Resources, crew conditions, crop growth, and water recovery flow continuously during active gameplay and never freeze just because the astronaut is walking or exploring.',
  },
  {
    rule: 'Individual Astronaut Conditions & Nutrition vs. Stamina',
    detail:
      'All 4 astronauts track separate Health, Hydration, Nutrition, and Physical Stamina. Eating restores Nutrition, which gradually rebuilds stamina alongside rest.',
  },
  {
    rule: 'Liquid Water Recovery vs. Solid Waste Separation',
    detail:
      'Urine and cabin humidity pass through filtration, purification, and quality checks into potable water; solid waste stays sealed separately and never enters water recovery.',
  },
  {
    rule: 'Time-Scaled Hydroponic Crops & Structural Shielding',
    detail:
      'Greenhouse crops require time, water, and grow-light power before harvesting. Structural radiation shelter walls provide continuous protection, enhanced by water bags and consumable liners.',
  },
  {
    rule: 'Compressed Earth Rescue Cinematic',
    detail:
      'If Stage 3 Safety Failure triggers, the crew enters safe-state shelter and an Earth rescue rocket transit is shown at compressed cinematic speed (real Mars/Moon transit takes days to months).',
  },
];

# Simulation Assumptions

To keep ORBITAL SURVIVAL clear and playable for children (ages 7–12), several spacecraft systems use simplified educational game-balance values rather than real flight telemetry:

1. **0–100 Percentage Scale**: Oxygen, Water, Battery, Food, CO₂, Habitat Pressure, Temperature Safety, and Radiation Protection are tracked as clamped `0–100` game percentages.
2. **Turn-Based Sol Progression**: Habitat resource consumption happens when the player clicks **End Sol**, preventing unfair resource drain while reading the Repair Manual or inspecting the Exterior 360° View.
3. **Baseline Daily Game Rates**:
   - Crew Consumption: `-8 Oxygen`, `-8 Water`, `-8 Food`, `+12 CO₂` per Sol.
   - Oxygen Generator (Water Electrolysis): `+10 Oxygen`, `-6 Battery`.
   - CO₂ Scrubber: `-14 CO₂`, `-4 Battery`.
   - Water Recycler: `+6 Water`, `-4 Battery`.
   - Greenhouse: `+4 Food`, `-4 Battery`, `-2 Water`.
   - Base Habitat Heating & Air Circulation: `-6 Battery`.
   - Normal Solar Generation: `+22 Battery` (`+8 Battery` during Mars Dust Storm).
4. **17 Cargo Point Loadout**: Cargo Points represent a simplified payload trade-off budget, not actual rocket launch mass.
5. **Educational Repair Circuits & Adapters**: The Red/Yellow/Black circuit puzzle and 4-slot CO₂ filter/adapter puzzle are fictionalized low-voltage learning models, not real spacecraft maintenance instructions.

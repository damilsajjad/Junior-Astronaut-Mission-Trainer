# Simulation Assumptions

To keep **ORBITAL SURVIVAL** engaging, scientifically grounded, and playable for junior astronauts (ages 7–12) as well as Commander Mode players, spacecraft systems use transparent, time-scaled educational game-balance values documented here:

1. **0–100 Percentage Scale**: Oxygen, Water, Battery, Food, CO₂, Habitat Pressure, Temperature Safety, and Radiation Protection are tracked as clamped `0–100` game percentages.
2. **Continuous Real-Time Simulation (`1 Sol = 48 seconds`)**:
   - Resources, water recovery, crop growth, and all 4 astronauts' individual conditions (`health`, `hydration`, `nutrition`, `energy`/physical stamina) run continuously in a single authoritative engine (`stepContinuousSimulation`).
   - Time never pauses merely because the player walks around or avoids interacting with machines; it pauses only during briefing, debrief, or the Pause/Settings menu.
3. **10-Sol Mission & 3 Objectives**:
   - **Objective 1**: Keep core life-support machines healthy (`> 25%` condition, not Damaged/Offline/Repair Required) and reserves stable (`Oxygen >= 40`, `Water >= 30`, `CO₂ <= 65`, `Pressure >= 65`, `Temp >= 50`).
   - **Objective 2**: Power Research Equipment (`4 PWR/Sol`) and/or assign crew to Research to reach `100%` Research Progress.
   - **Objective 3**: Survive to the end of Sol 10.
   - **Outcomes**: `Victory` (all 3 complete), `Partial Result` (crew survives Sol 10 with 1+ incomplete objective), or `Safety Protocol / Earth Rescue` (Stage 3 critical failure).
4. **Strict Priority Power Allocation & Resource Dependencies**:
   - Power is distributed in strict safety priority order: **1) Habitat Pressure (2 PWR)** -> **2) Oxygen Generator (6 PWR + >=2 Water)** -> **3) CO₂ Scrubber (4 PWR)** -> **4) Temperature Control (4 PWR)** -> **5) Water Recycler (4 PWR)** -> **6) Hydroponic Greenhouse (4 PWR + >=2 Water)** -> **7) Research Equipment (4 PWR)**.
   - Machines switched OFF, damaged (`<=25%` condition or `Repair Required`/`Damaged`), missing Water input (`<2%`), or lacking Battery/Solar power produce **zero output**.
   - **CO₂ Scrubber Science Rule**: The CO₂ Scrubber removes CO₂ from cabin air (`-15 CO₂/Sol`) and **never** converts CO₂ into oxygen; oxygen comes strictly from Water Electrolysis (`+12 O₂/Sol`, `-2.2 Water/Sol`).
5. **Scientific Water-Recovery Cycle & Solid Waste Containment**:
   - Urine and cabin humidity condensate pass through **Filtration -> Purification -> Potable Quality Check -> Potable Storage Tank** (feeding the **Water Dispenser**) via the Water Recycler.
   - **Solid Waste** accumulates in a sealed separate containment unit and **never** enters the water recovery system.
6. **Hydroponic Crops & Nutrition vs. Physical Stamina**:
   - Greenhouse crops grow over time when powered and watered (`0% -> 100% READY`) and must be harvested manually; unpowered or dry crops wilt (`unhealthy`) instead of yielding instant food.
   - Eating updates an astronaut's **Nutrition** (never an instant jump in stamina); **Physical Stamina** (`energy`, distinct from electrical Battery) recovers gradually over time from adequate nutrition and rest.
7. **Radiation Protection Accuracy**:
   - Structural Radiation Shelter walls provide continuous base shielding without wearing out after fixed uses.
   - Inventory `Consumable Radiation Liners` represent deployable single-use polyethylene storm liners, supplemented by positioning water storage bags along the shelter wall.
8. **Three-Stage Safety System & Compressed Rescue Cinematic**:
   - **Stage 1 (Warning)** alerts the player when any buffer drops into warning range.
   - **Stage 2 (Emergency)** displays an active countdown timer proportional to remaining survival margin.
   - **Stage 3 (Mission Failure)** places the crew in safe-state shelter, transmits an Earth emergency signal, and plays a **compressed-time** rescue rocket launch cinematic (real interplanetary rescue transit takes days to months) before presenting the Debrief with exact failure cause.
9. **Baseline Rates per Sol (48s; Commander Mode scales crew demand by 1.15x)**:
   - Crew Consumption: `-8.5 Oxygen`, `-6.5 Water`, `-6.5 Food`, `+12.0 CO₂` per Sol.
   - Solar Power System: `+24 PWR/Sol` scaled by machine condition (`+5 to +10 PWR/Sol` during Mars Dust Storms or Solar faults).
   - Battery System: Stores surplus power; damaged battery cells leak `-8 PWR/Sol`.
   - Water Recycler: `+7.5 Water/Sol` recovered from liquid/humidity buffers, `-4 PWR/Sol`.
   - Temperature Control: `+5.5 Temp Safety/Sol`, `-4 PWR/Sol` (`-10` when OFF, `-14` when damaged).

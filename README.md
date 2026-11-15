# ORBITAL SURVIVAL: Junior Mission Astronaut Trainer

> *When Plan A fails, can you save the crew?*

Aligned with the NASA Space Apps Challenge: **Build a Junior Astronaut Mission Trainer**.

## Overview

ORBITAL SURVIVAL is a child-friendly 3D space survival and STEM learning game for desktop and tablet browsers. Players become the Mission Commander of a 4-astronaut crew at a **Mars (0.38g)** or **Moon (0.16g)** outpost, learning four core aerospace engineering trade-offs:

1. **Life Support** — Water Electrolysis Oxygen Generation (electricity + water -> O₂) kept scientifically distinct from CO₂ Scrubbers (removing carbon dioxide from cabin air).
2. **Radiation Shielding & Crew Safety** — Sheltering the crew and reinforcing glowing Water-Barrier Blocks during Solar Particle Events.
3. **Power Generation & Consumption** — Managing solar generation drops during Martian dust storms and prioritizing critical life support over optional equipment.
4. **Food Supply & Production** — Balancing stored rations, edible Meal/Water Packs, and Greenhouse power/water costs.

## Features

- **Mission Select & Equipment Loadout**: Choose Moon or Mars, select Cadet or Commander mode, and pack supplies within a 17 Cargo Point budget.
- **4-Scene 3D Launch Cinematic**: Crew boarding, Earth launch, deep-space transit, and planetary touchdown with a persistent **Skip Intro** button.
- **3D Cutaway Interior & 360° Exterior View**: Walkable single-level pressurized habitat cutaway with glowing amber Radiation Shelter, cyan Shield Wall, Water-Barrier Blocks, 10 interactive workstations, collectible supply packs, and a 360° orbitable Exterior View.
- **5 Playable Emergency Scenarios**: Mars Great Dust Storm, Lunar Solar Flare Radiation Alert, Oxygen Generator Circuit Failure, CO₂ Scrubber Filter Failure, and Habitat Pressure Leak — each with **Plan A, Plan B, and Plan C** options.
- **Context-Aware Repair Manual & 3 Interactive Puzzles**: Illustrated SVG schematics, hints, full solutions, Color-Coded Circuit Reconnect, Apollo 13-inspired CO₂ Filter/Adapter Assembly, and Hull Breach Patch alignment.
- **CAPCOM Mission Guide & Science Scanner**: Friendly flight director guidance with multi-turn AI Q&A and image/diagram analysis via server-side Gemini API endpoints (with automatic offline rule-based fallback).

## Run & Build Commands

```bash
npm install
npm run dev      # Starts Express + Vite dev server on http://localhost:3000
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run build    # Production Vite build to dist/
npm start        # Production Express server
```

# ORBITAL SURVIVAL: Junior Mission Astronaut Trainer

**Product Requirements Document (PRD)**  
**Document status:** Locked product requirements for implementation planning  
**Primary implementation environment:** Google Antigravity  
**Target platform:** Browser-based desktop and tablet game  
**Primary audience:** Children and young learners  
**Project team:** Four teammates  
**Challenge alignment:** NASA Space Apps Challenge, **Build a Junior Astronaut Mission Trainer**  
**Working tagline:** *When Plan A fails, can you save the crew?*

---

## 0. Mandatory instructions for the AI coding agent

This PRD is the authoritative product specification. Read the entire document before proposing implementation work.

### 0.1 Two-stage execution gate

The agent MUST follow these stages in order.

#### Stage 1: Inspect and prepare an implementation plan only

1. Inspect the existing workspace and repository before proposing architecture.
2. Read all existing project files that affect the application, including `package.json`, source files, configuration files, and existing design assets.
3. Read this entire PRD.
4. Compare the existing project with the requirements in this PRD.
5. Identify existing working code that should be preserved.
6. Identify missing features, technical conflicts, and dependencies.
7. Produce a detailed implementation plan in an Antigravity implementation-plan artifact. Also save a copy as `docs/IMPLEMENTATION_PLAN.md` only if creating that planning document does not modify application source code. If Antigravity cannot create the file without making workspace changes, keep the plan in its artifact and do not create the file yet.
8. The plan MUST include:
   - requirement-to-component mapping;
   - proposed application architecture;
   - proposed folder and file structure;
   - exact package names to install and why each is needed;
   - scene and camera implementation plan;
   - resource simulation design;
   - emergency and Plan A/B/C implementation design;
   - manual and puzzle implementation design;
   - state model and data structures;
   - asset plan, including which assets can be procedural primitives;
   - API, key, account, connector, and hosting requirements;
   - implementation sequence with small verifiable milestones;
   - risks and browser-performance considerations;
   - acceptance tests for every P0 requirement;
   - assumptions that are explicitly allowed by this PRD;
   - any genuine contradictions or missing decisions that block implementation.
9. Do not invent additional product features, external services, gameplay systems, or scientific values.
10. Do not install packages, create application code, overwrite files, edit configuration, or start implementation during Stage 1.
11. Do not silently make a product decision when this PRD already defines the answer.
12. If an essential technical detail is genuinely unavailable, list it as a blocker in the plan and recommend one concrete resolution. Do not fill the gap with fabricated facts.
13. End Stage 1 by asking the user to review and approve the implementation plan.
14. STOP. Wait for explicit user approval before doing any implementation work.

#### Stage 2: Implement only after approval

Stage 2 begins only after the user explicitly approves the implementation plan, for example by selecting Antigravity's **Proceed** action or sending the message `APPROVE IMPLEMENTATION`.

After approval:

1. Implement the approved plan in the approved order.
2. Follow this PRD as the source of truth. If the approved plan conflicts with this PRD, stop and ask for clarification rather than silently changing the product.
3. Work in small milestones. After each milestone, run the relevant checks and report the results.
4. Do not replace functioning project code without explaining why the replacement is required.
5. Do not add paid dependencies, services, APIs, or connectors.
6. Do not add API keys or secrets. The MVP does not require any runtime API key.
7. Do not use external images, fonts, audio, models, or videos unless their license and attribution are recorded in `CREDITS.md`.
8. Do not use NASA logos or claim NASA endorsement.
9. Do not claim a test passed unless it was actually run and its result was checked.
10. At completion, provide a walkthrough, exact run/build commands, test results, known limitations, and a list of files changed.

### 0.2 Antigravity configuration required from the user

Before starting Stage 1, the user should configure Antigravity as follows:

- Start the agent conversation in **Planning Mode** (or use the `/plan` workflow).
- Set Artifact Review to **Request Review / asks-for-review**.
- Do NOT use **Always Proceed** for this project.
- Keep workspace and terminal permission settings at a review-based or sandboxed setting.
- The agent must wait for the user's explicit approval of the implementation plan before coding.

The Antigravity documentation describes Planning Mode as the planning-first workflow and Request Review as the setting that pauses for explicit review before proceeding. See the links in Section 20.

### 0.3 Non-negotiable agent behavior

**The agent must not start coding after producing the plan. The agent must stop and wait.**

A response such as “Here is the plan, I will now implement it” is not allowed. Stage 1 ends at the approval gate.

---

## 1. Product overview

### 1.1 Product name

**ORBITAL SURVIVAL: Junior Mission Astronaut Trainer**

### 1.2 Product concept

ORBITAL SURVIVAL is a child-friendly 3D space survival and STEM learning game. The player controls an astronaut and becomes the Mission Commander of a small crew at a lunar or Martian outpost.

The player must keep the crew and habitat safe while managing limited oxygen, water, electricity, food, and repair supplies. Equipment failures and environmental emergencies require the player to inspect equipment, read a simple repair manual, solve hands-on puzzles, and switch from Plan A to Plan B or Plan C when necessary.

The product teaches that a successful space mission depends on preparation, engineering, teamwork, resource management, and the ability to respond when the first solution fails.

### 1.3 Official challenge alignment

The project directly addresses the NASA Space Apps Challenge statement **Build a Junior Astronaut Mission Trainer**.

The application must make the following engineering trade-offs visible to young learners:

1. Life support.
2. Radiation shielding and crew safety.
3. Power generation and consumption.
4. Food supply and production.

The README and submission description must name the exact challenge title and explain how the game teaches these four areas.

### 1.4 Target audience

- Primary audience: children and young learners, designed with approximately ages 7–12 in mind.
- Secondary audience: teachers, parents, and older students who want a more detailed difficulty mode.
- The application must not ask the player to enter their real name, age, birthday, email address, home address, or other personal information.

The 7–12 age range is a product-design target, not a claim that NASA mandates this exact age range.

### 1.5 Product principles

1. **Simple to understand:** use plain language, visual explanations, icons, and short instructions.
2. **Learn through action:** the player must move, collect items, inspect equipment, make decisions, and solve puzzles.
3. **Failure is a learning opportunity:** a failed Plan A should lead to a fallback where possible. Do not use graphic injury or death.
4. **Visible consequences:** every important action must update the game state and show what changed.
5. **Science is traceable:** distinguish NASA-supported facts from simplified game rules.
6. **No unnecessary complexity:** prioritize one complete, working mission over unfinished advanced features.
7. **Free-first implementation:** use open-source packages and free tools. Avoid paid APIs and services.

---

## 2. Locked scope and release priorities

### 2.1 MVP scope

The first playable release MUST include:

- A complete animated mission introduction from Earth to the selected destination.
- Mars and Moon destination selection.
- A 3D landing environment for both destination options, using the same reusable scene structure with different terrain, sky, lighting, and environment settings.
- A playable interior spacecraft/habitat scene.
- A 360-degree exterior orbit view of the landed spacecraft and its surroundings.
- A view switch between Interior View and Exterior 360° View.
- A movable astronaut character in Interior View.
- Interactable objects and collectible food/supply items.
- Character Health, Energy/Stamina, and Hydration status bars.
- A visible Mission Control resource dashboard.
- Life support, power, crew safety, and food systems.
- At least four playable emergency scenarios.
- Plan A, Plan B, and Plan C decision paths.
- A context-aware repair manual.
- At least two interactive repair puzzles, including a wire-connection puzzle and a filter/air-system puzzle.
- A mission debrief with score and learning feedback.
- A NASA Science & Sources screen.
- Local progress saving without an account.
- Browser controls for desktop and usable touch controls for tablet.

### 2.2 Features intentionally deferred

Do not build these in the MVP unless all MVP acceptance criteria are complete:

- Multiplayer.
- Online classrooms or teacher accounts.
- User accounts or cloud save.
- Live NASA API integrations.
- Voice-based AI assistant.
- External LLM integration.
- Full-scale open-world planetary exploration.
- Multiplayer EVA missions.
- Procedural scenario editor.
- Complex vehicle physics or realistic orbital mechanics.
- Unreal Engine integration.

### 2.3 Mars and Moon scope

Both destinations must be selectable in the MVP.

Both destinations use the same core systems, controls, resource model, and user interface. They differ through environment presentation and scenario configuration.

**Mars environment:** red terrain, dusty atmosphere, Mars sky, and a dust-storm power scenario.

**Moon environment:** grey lunar terrain, dark sky, low-gravity visual movement, and a lunar radiation or power scenario.

Do not implement scientifically detailed orbital mechanics. The journey is a cinematic learning sequence, not a flight simulator.

---

## 3. Main player journey

The game flow MUST follow this exact order:

1. Title screen.
2. Destination selection: Mars or Moon.
3. Equipment Loadout: select supplies using the cargo-point limit.
4. Mission cinematic: boarding, launch from Earth, travel through space, and landing on the selected destination.
5. Mission briefing.
6. Interior View gameplay begins.
7. Player explores the landed spacecraft/habitat, checks supplies, and completes mission tasks.
8. An emergency occurs.
9. Player opens the manual, inspects the system, and chooses a response.
10. Player completes the relevant puzzle or repair task.
11. Simulation updates resources and crew condition.
12. Player continues the mission or enters a safe mission-failure state.
13. Mission debrief appears.
14. Player can replay the mission or return to destination selection.

The player must be able to pause the game and open the manual at any time.

---

## 4. Opening cinematic: Earth launch to Moon/Mars landing

### 4.1 Required cinematic sequence

When a new mission starts, play one connected cinematic made from four scenes.

**Scene 1: Astronaut boarding**

- Show the player astronaut and the other crew members walking toward the spacecraft.
- Show the crew entering through the boarding ramp or hatch.
- Close the spacecraft hatch after the crew boards.
- The camera must make it clear that the journey is beginning.
- Target duration: 5–8 seconds.

**Scene 2: Launch from Earth**

- Show the spacecraft/launch vehicle taking off from Earth.
- Show the vehicle moving upward and leaving the launch area.
- Show clouds or atmosphere moving past the camera.
- Target duration: 5–8 seconds.

**Scene 3: Travel through space**

- Show the spacecraft outside Earth's atmosphere.
- Show Earth becoming smaller in the background.
- Show the spacecraft moving through a starfield toward the selected destination.
- Show the selected Moon or Mars becoming visible and larger.
- Target duration: 5–8 seconds.

**Scene 4: Destination landing**

- Use the selected destination to load the correct environment.
- Show the spacecraft descending and landing on the Moon or Mars.
- Show the landing dust effect appropriate to the selected environment.
- Show the landed spacecraft and nearby habitat area.
- Target duration: 5–8 seconds.
- After landing, transition into the mission briefing and playable interior scene.

### 4.2 Cinematic controls

- Show a clearly visible **Skip Intro** button throughout the cinematic.
- Clicking Skip Intro must end the cinematic and open the mission briefing.
- The cinematic must not force the player to watch it again when replaying the same mission unless the player selects Replay Intro.
- Provide a mute/unmute control.
- Do not autoplay loud audio.
- Respect the browser's reduced-motion preference by using shorter transitions and less camera movement.

### 4.3 Cinematic implementation

- Build the cinematic as real-time 3D scenes using the selected Three.js stack.
- Do not depend on remote video URLs or paid video-generation APIs.
- Use simple original low-poly models or procedural geometry for the MVP.
- Use a GLB/GLTF model only when its license and attribution are recorded.
- Use scene transitions and camera animation rather than attempting a full physically accurate rocket launch.
- A scene must still render if an optional 3D model fails to load; show a simple procedural placeholder instead.

---

## 5. Camera modes and 3D environment

The game must provide two clearly labeled view modes.

### 5.1 Interior View

**Purpose:** Main playable game mode.

**Camera:** Third-person, slightly elevated follow camera behind and above the player astronaut. Use a readable angled view similar to a simple space-adventure game. Do not copy the protected art, characters, maps, or exact interface of Among Us or another commercial game.

**Required behavior:**

- The astronaut can walk around the spacecraft/habitat interior.
- The camera follows the astronaut smoothly.
- The player can approach and interact with stations and objects.
- Interactable objects receive a visible highlight when the player is close enough.
- An interaction label appears, such as `Press E to Inspect` or `Press E to Pick Up`.
- The game must prevent the character from walking through walls, furniture, machines, or closed doors.
- The player can open the Inventory, Manual, Mission Control, and Pause panels without losing progress.

**Desktop controls:**

| Input | Action |
|---|---|
| W / Up Arrow | Move forward |
| S / Down Arrow | Move backward |
| A / Left Arrow | Move left |
| D / Right Arrow | Move right |
| Mouse movement | Rotate the follow camera within allowed limits |
| E | Interact with highlighted object |
| Left mouse click | Select an on-screen item or UI control |
| I | Open/close inventory |
| M | Open/close repair manual |
| Tab | Open/close Mission Control dashboard |
| Esc | Pause or close the active panel |

**Tablet controls:**

- Display an on-screen movement joystick on the left side.
- Display an Interact button on the right side when an object is in range.
- Display Inventory, Manual, Mission Control, and Pause buttons as touch-friendly controls.
- Support touch drag to rotate the camera.

### 5.2 Exterior 360° View

**Purpose:** Let the player inspect the landed spacecraft and the surrounding location.

This is a 360-degree orbit-camera view, not a VR mode and not a stitched 360-degree video.

**Required behavior:**

- Show the complete spacecraft/lander in the scene.
- Show the nearby Moon or Mars terrain and sky.
- Keep the spacecraft visible as the camera's main orbit target.
- Allow the user to rotate the camera through a full 360 degrees horizontally.
- Allow limited vertical camera rotation so the player can inspect the top and sides without turning the camera upside down.
- Allow zoom in and zoom out.
- Provide a Reset Camera button.
- Provide a clearly visible Return to Interior button.
- Keep the Exterior View non-destructive: switching views must not reset the player's location, inventory, or mission progress.
- Pause resource-turn progression while the player is viewing the exterior. The game must not consume resources simply because the player is inspecting the spacecraft.

**Desktop controls:**

- Drag with the left mouse button to orbit.
- Use the mouse wheel to zoom.
- Click Reset Camera to return to the default exterior angle.

**Tablet controls:**

- One-finger drag to orbit.
- Pinch to zoom.
- Tap Reset Camera to return to the default angle.

### 5.3 View switch

Display two persistent controls while gameplay is active:

- `INTERIOR VIEW`
- `EXTERIOR 360° VIEW`

The active mode must have a clear selected state.

Switching views must preserve:

- Player position in the interior.
- Inventory contents.
- Character status values.
- Habitat resources.
- Active emergency state.
- Puzzle progress, if a puzzle is open.

If a puzzle is open, pause it automatically before changing view. Preserve its current state and all connected parts. When the player returns to Interior View, allow them to resume the puzzle from the same state. Puzzle time must not expire while paused.

---

## 6. Interior spacecraft/habitat layout

Create one compact, readable 3D interior for the MVP. Use clearly separated stations rather than a large open world.

Required areas and objects:

| Area | Interactive object | Player action |
|---|---|---|
| Command area | Mission Control console | View resource dashboard, alerts, and mission objective |
| Life support area | Oxygen Generator | Inspect, diagnose, and repair the water-electrolysis unit |
| Air filtration area | CO₂ Scrubber | Inspect filter condition and perform filter/adapter puzzle |
| Power area | Power Distribution Panel | View power generation, battery reserve, and reconnect a game-only circuit puzzle |
| Galley/storage area | Food Cabinet | Pick up meal packs and water packs |
| Greenhouse area | Plant Growth Rack | Check food production and water/power use |
| Repair area | Tool Cabinet | Collect repair kits, cable parts, filters, and patch kits |
| Crew area | Crew bunks/medical station | Check crew status and use rest/medical supplies when available |
| Manual station | Digital Repair Manual terminal | Open the context-aware repair manual |
| Airlock/shelter area | Emergency Shelter | Move crew to a safe area during radiation events |

### 6.1 Habitat and 3D layout rule

The landed spacecraft and its attached pressurized habitat module represent the player's initial outpost. The player explores this landed habitat after the arrival cinematic. The exterior model and interior layout must represent the same craft/module. If separate 3D models are used for performance, keep the airlock/door location and overall proportions visually consistent.

Use one connected, single-level interior for the MVP with these connected zones: Command Area, Life Support Area, Power Area, Galley/Storage Area, Crew Area, Repair Area, and Emergency Shelter. Use short corridors between zones. Do not build multiple floors in the MVP.

- Player movement speed: 3.0 world units per second, stored as one configurable constant.
- Interaction distance: 2.0 world units, stored as one configurable constant.
- Use simple collision boundaries for walls, consoles, storage cabinets, and large equipment.
- The follow camera must not pass through walls. Use camera collision or a safe fixed follow offset.

### 6.2 Visual interaction rules

- Use a glowing outline or simple highlight on an object that can be interacted with.
- Show the object's name and one short action label.
- Do not require the player to guess which objects are interactive.
- Use simple icons and plain language.
- When the player collects an item, show a brief pickup animation and a confirmation message.
- Do not allow the player to collect an item if the inventory is full. Explain how to free inventory space.

---

## 7. Character, crew, inventory, food, and status bars

### 7.1 Player astronaut

- The player controls one custom astronaut character.
- The character must be original or made from assets with recorded usage rights.
- Use a simple friendly, non-threatening design.
- The character must have idle, walk, interact, and pickup animations. If custom animations are unavailable, use simple procedural movement/pose changes as an MVP fallback.
- Do not reproduce Among Us characters or other copyrighted game characters.

### 7.2 Crew members

- Include four astronauts in the mission crew, including the player character.
- Use fictional crew labels such as Crew Member 1, Crew Member 2, and Crew Member 3 for non-player crew.
- Do not use names, faces, or voices of real children.
- Show crew condition in the dashboard using simple icons and status labels.
- Crew members must not die or be shown with graphic injuries. If the mission becomes unsafe, move to a safe mission-failure/evacuation state and explain the learning outcome.

### 7.3 Character status bars

The player character must have three separate status values:

1. **Health:** 0–100.
2. **Energy/Stamina:** 0–100.
3. **Hydration:** 0–100.

These are personal character values. Do not confuse Energy/Stamina with the habitat's electrical Power Grid.

**Required UI:**

- Show the three bars during Interior View.
- Show numeric values and color state.
- Use green for healthy/normal, amber for a warning, and red for critical.
- Show an up/down/steady trend indicator after an action changes the value.
- Show a small bar chart or history strip with the last 10 recorded value changes for Health, Energy, and Hydration.
- The history chart must be generated from local game state. Do not call an external chart API.

### 7.4 Character status rules

Use these simple game-only rules:

- Walking for a sustained period reduces Energy/Stamina slowly.
- Eating one meal pack increases Energy/Stamina by 20 points, up to 100.
- Drinking one water pack increases Hydration by 25 points, up to 100.
- A Medical Kit restores Health by 20 points, up to 100.
- Resting at the crew bunk restores Energy/Stamina by 30 points.
- Unsafe habitat conditions can reduce Health gradually during a mission turn.
- Eating food does not directly repair Health.
- Drinking water does not directly repair Health.
- Do not allow a value to go below 0 or above 100.
- These are educational game mechanics, not medical advice or actual astronaut medical thresholds.

### 7.5 Food and supply collection

The player must physically move to the food cabinet or supply rack and collect items.

Required items:

- Meal Pack.
- Water Pack.
- Repair Kit.
- Spare CO₂ Filter.
- Cable Connector Kit.
- Hull Patch Kit.
- Medical Kit.
- Emergency Oxygen Reserve.
- Emergency Battery Module.
- Radiation Shielding Panel (mission item).

**Pickup behavior:**

1. The item is visible in the 3D environment.
2. The player moves close to the item.
3. The item receives a highlight.
4. The prompt `Press E to Pick Up` appears.
5. The player presses E or taps the Interact button.
6. The item disappears from the world and is added to the inventory.
7. A short confirmation appears, for example `Meal Pack added to inventory`.
8. The inventory count updates immediately.

**Use behavior:**

- The player opens Inventory.
- The player selects an item.
- The player chooses Use, Equip, or Inspect when the action is valid.
- Using a meal pack changes Energy/Stamina and reduces the number of meal packs by one.
- Using a water pack changes Hydration and reduces the number of water packs by one.
- Using a Medical Kit restores Health by 20 points and reduces the Medical Kit quantity by one.
- Using an Emergency Oxygen Reserve adds 25 points to Oxygen reserve, up to 100, and reduces its quantity by one. This is a game-only value.
- Using an Emergency Battery Module adds 25 points to Battery reserve, up to 100, and reduces its quantity by one. This is a game-only value.
- Using a repair item is allowed only when the corresponding repair task is active.

### 7.6 Equipment Loadout

Before the cinematic begins, show an Equipment Loadout screen. The player selects supplies for the mission.

- The cargo limit is 17 Cargo Points.
- Each item has the fixed cost shown below.
- The player cannot start the mission if the total exceeds 17 points.
- Provide a `Recommended Loadout` button that fills the loadout with the default list below.
- The player can edit the recommended loadout before starting.
- Show the selected item count, Cargo Points used, and Cargo Points remaining.
- Do not simulate real rocket payload mass. Cargo Points are a simplified game rule.

| Item | Cargo Point cost | Recommended quantity |
|---|---:|---:|
| Meal Pack | 1 | 2 |
| Water Pack | 1 | 2 |
| Repair Kit | 2 | 1 |
| Spare CO₂ Filter | 2 | 1 |
| Cable Connector Kit | 1 | 1 |
| Hull Patch Kit | 1 | 1 |
| Medical Kit | 1 | 1 |
| Emergency Battery Module | 2 | 1 |
| Emergency Oxygen Reserve | 2 | 1 |
| Radiation Shielding Panel | 2 | 1 |
| **Total** | **17** | **12 units across 10 item types** |

The recommended loadout must be available for every tutorial mission. Scenario-specific optional items can be substituted, but the game must not make the tutorial impossible because the player selected the recommended loadout.

### 7.7 Inventory rules

- Use a simple inventory with a fixed capacity of 12 item slots for the MVP.
- Stack identical consumable items in one slot.
- Show item name, icon, quantity, and one-line description.
- Do not add weight simulation in the MVP.
- If inventory is full, show `Inventory full. Use or store an item first.`

---

## 8. Mission Control dashboard and habitat systems

### 8.1 Dashboard visual structure

Recreate the visual direction of the previously discussed Mission Control mockup:

- Dark navy/charcoal background.
- Dark translucent or solid panels.
- Rounded resource cards.
- Compact typography and clear labels.
- Neon cyan/blue highlights, green safe states, amber warnings, and red critical alerts.
- Three prominent top-level resource gauges.
- Food as a separate visible resource card.
- Crew status panel.
- System condition list.
- Active alert panel.
- Clear, consistent iconography.

The prior images in the conversation are visual references, not production-ready UI files. Recreate the described layout and style using the design tokens in Section 15. Do not hotlink the previous reference imagery.

### 8.2 Three primary gauges

Display these three prominent gauges:

1. **Life Support:** includes Oxygen, Water, and CO₂ condition sub-values.
2. **Power Grid:** battery reserve and current generation/consumption.
3. **Crew Safety:** habitat pressure, temperature, and radiation safety summary.

### 8.3 Separate food display

Food must remain visible as its own card and must not be hidden inside the three primary gauges.

Show:

- Stored food level.
- Estimated food days remaining, based on game rules.
- Greenhouse status.
- Food production warning, if any.

### 8.4 System condition list

Show the status of:

- Oxygen Generator.
- CO₂ Scrubber.
- Water Recycler.
- Power Distribution Panel.
- Solar Array.
- Greenhouse.
- Habitat Pressure System.
- Radiation Shelter.

Possible status labels:

- Operational.
- Warning.
- Damaged.
- Offline.
- Repair Required.

### 8.5 Alerts

- Show alerts in a clearly visible panel.
- Use an icon, short title, severity label, and one-sentence explanation.
- Each alert must have a clear action or destination when one exists.
- Do not use flashing effects continuously. Use a brief visual pulse for a new critical event and respect reduced-motion settings.

---

## 9. Simple deterministic resource simulation

### 9.1 General rule

The MVP simulation is turn-based. One player turn represents one simulated mission day (one Sol when the destination is Mars).

Resources update when the player selects **End Day** or confirms the next mission turn. Do not continuously drain mission resources while the player is exploring, reading the manual, or viewing the exterior.

Character Energy can decrease slowly during walking, but habitat resource consumption occurs only at the end of a simulated mission day or as the direct cost of a specific action.

### 9.2 Resource values

For Cadet Mode, use percentages from 0 to 100 for the main resources.

Required tracked values:

- Oxygen reserve: 0–100.
- Water reserve: 0–100.
- Battery reserve: 0–100.
- Food reserve: 0–100.
- CO₂ level: 0–100, where higher is worse.
- Habitat pressure: 0–100, where 100 is normal and lower is worse.
- Habitat temperature safety: 0–100, where 100 is safe and lower is worse.
- Radiation protection: 0–100, where higher is better protection.
- Player Health: 0–100.
- Player Energy/Stamina: 0–100.
- Player Hydration: 0–100.

### 9.3 Starting values for the first tutorial mission

Use these values exactly for the first tutorial scenario. They are game-balance values, not NASA flight specifications.

| Resource | Starting value |
|---|---:|
| Oxygen reserve | 80 |
| Water reserve | 80 |
| Battery reserve | 80 |
| Food reserve | 80 |
| CO₂ level | 20 |
| Habitat pressure | 100 |
| Temperature safety | 100 |
| Radiation protection | 80 |
| Player Health | 100 |
| Player Energy/Stamina | 100 |
| Player Hydration | 100 |

### 9.4 Daily resource calculation rules

Use the following simple game-only baseline values for the tutorial configuration:

| System | Daily change when active |
|---|---|
| Crew oxygen use | Oxygen reserve -8 |
| Oxygen Generator | Oxygen reserve +10; battery reserve -6 |
| Crew water use | Water reserve -8 |
| Water Recycler | Water reserve +6; battery reserve -4 |
| Crew CO₂ production | CO₂ level +12 |
| CO₂ Scrubber | CO₂ level -14; battery reserve -4 |
| Greenhouse | Food reserve +4; battery reserve -4; water reserve -2 |
| Crew food use | Food reserve -8 |
| Solar generation in normal conditions | Battery reserve +22 |
| Base habitat heating/air circulation | Battery reserve -6 |

Calculation order at End Day:

1. Apply the destination's environmental modifier.
2. Calculate solar/battery power generation.
3. Calculate active system power use.
4. Apply power-priority rules.
5. Apply oxygen production and crew oxygen use.
6. Apply water recovery, greenhouse water use, and crew water use.
7. Apply CO₂ production and removal.
8. Apply food production and crew food use.
9. Apply habitat pressure, temperature, and radiation effects.
10. Update crew condition.
11. Check for scenario triggers and mission end conditions.
12. Store the updated values in local game state and refresh the UI.

Use `clamp(value, 0, 100)` for percentage resources. CO₂ is also clamped from 0 to 100, but higher values represent a worse condition.

### 9.5 Power priority

When available battery reserve cannot cover all active systems, use this priority order:

1. Oxygen Generator.
2. CO₂ Scrubber.
3. Habitat pressure and essential air circulation.
4. Essential heating/cooling.
5. Water Recycler.
6. Greenhouse.
7. Research/optional systems.

The player must be able to switch off optional systems before ending the day. If power is still insufficient, the lowest-priority system is automatically paused and the game explains why.

Do not silently turn off a critical life-support system while a safer available option exists.

### 9.6 Warning thresholds

Use these game-only thresholds in Cadet Mode:

| Value | Warning | Critical |
|---|---:|---:|
| Oxygen reserve | 40 or lower | 20 or lower |
| Water reserve | 40 or lower | 20 or lower |
| Battery reserve | 35 or lower | 15 or lower |
| Food reserve | 35 or lower | 15 or lower |
| CO₂ level | 50 or higher | 75 or higher |
| Habitat pressure | 85 or lower | 65 or lower |
| Temperature safety | 70 or lower | 40 or lower |
| Radiation protection | 60 or lower | 35 or lower |
| Character Health/Energy/Hydration | 40 or lower | 20 or lower |

These thresholds are game rules only. They must not be presented as medical or spacecraft safety limits.

### 9.7 Mission failure and non-punitive learning

- Do not show graphic injury or death.
- If a critical habitat value reaches the failure state, show `Mission Safety Protocol Activated`.
- Move the crew to the designated safe state in the game narrative.
- Explain which decisions caused the situation.
- Offer Retry Mission and Review Manual actions.
- Never delete the player's saved best result when a mission fails.

---

## 10. Destination configuration and emergency scenarios

### 10.1 Scenario structure

Store every scenario as a typed local configuration object or JSON file. Do not hardcode scenario-specific UI components.

Each scenario must define:

- Unique ID.
- Display title.
- Destination.
- Introductory story.
- Trigger condition.
- Affected systems.
- Starting resource modifiers.
- Plan A definition.
- Plan B definition.
- Plan C definition.
- Required items for each plan.
- Puzzle ID, if applicable.
- Success effect.
- Failure effect.
- Scientific explanation.
- Source URL(s).

### 10.2 Mandatory scenarios

#### Scenario 1: Mars Great Dust Storm

**Destination:** Mars  
**Problem:** Dust storm reduces solar generation.  
**Affected systems:** Power Grid, Greenhouse, Life Support indirectly.

Game event modifier: solar generation drops from 22 to 8 percentage points for two simulated days. This is a simplified scenario value, not a universal Mars storm statistic.

- **Plan A:** Inspect and reset the solar array. Requires one Repair Kit and successful interaction with the Power Panel repair task. Success restores normal solar generation.
- **Plan B:** Install and activate one Emergency Battery Module. Consumes that inventory item and adds 25 points to battery reserve. This is a game-only value. The player must also turn off research/optional equipment.
- **Plan C:** Enter Low-Power Mode. Pause the Greenhouse and optional equipment while keeping essential systems active.

Learning outcome: the player understands that power must be prioritized when generation decreases.

#### Scenario 2: Oxygen Generator Circuit Failure

**Destination:** Mars or Moon  
**Problem:** The Water Electrolysis Oxygen Generator stops producing oxygen because its simplified game power/control circuit is disconnected.  
**Affected systems:** Oxygen reserve and Power Grid.

- **Plan A:** Open the Repair Manual and reconnect the color-coded game circuit.
- **Plan B:** Use one Emergency Oxygen Reserve item. This adds 25 points to oxygen reserve, up to 100, and buys time to continue the repair later. This is a game-only value.
- **Plan C:** Enter Survival Mode, reduce nonessential activity, and preserve remaining oxygen until the backup system is available.

The repair puzzle uses a clearly labeled, fictional low-voltage game schematic. Do not present the puzzle wiring as instructions for real spacecraft equipment.

Learning outcome: the oxygen generator needs power to produce oxygen from water.

#### Scenario 3: CO₂ Scrubber Filter Failure

**Destination:** Mars or Moon  
**Problem:** The CO₂ Scrubber cannot remove carbon dioxide because its filter path is blocked or the filter needs replacement.  
**Affected systems:** CO₂ level, Life Support, crew safety.

- **Plan A:** Replace the filter using one Spare CO₂ Filter.
- **Plan B:** Complete the Apollo 13-inspired emergency filter/adapter puzzle using the available adapter components.
- **Plan C:** Move the crew to the designated safe habitat module and reduce nonessential activity while the system is restored.

Learning outcome: the CO₂ scrubber removes carbon dioxide from cabin air. It does not convert carbon dioxide into oxygen.

#### Scenario 4: Moon Radiation Alert

**Destination:** Moon  
**Problem:** A solar particle event warning is received.  
**Affected systems:** Radiation protection and crew safety.

- **Plan A:** Move all crew members into the designated radiation shelter.
- **Plan B:** Use available shielding panels to improve the shelter.
- **Plan C:** Cancel external activities and keep the crew in the best available protected interior area.

Learning outcome: radiation alerts require preparation and sheltering.

#### Scenario 5: Habitat Pressure Leak

**Destination:** Mars or Moon  
**Problem:** A simulated impact damages an exterior habitat panel and pressure begins to decrease.  
**Affected systems:** Habitat pressure, oxygen reserve, crew safety.

- **Plan A:** Find the leak and apply a Hull Patch Kit.
- **Plan B:** Close the affected compartment and isolate the damaged area.
- **Plan C:** Move the crew to the safe module and start the emergency containment procedure.

Learning outcome: isolating a damaged area can protect the rest of a habitat.

### 10.3 Scenario fairness

- Every emergency must explain the problem in plain language.
- Do not trigger two critical emergencies at the same instant during the tutorial.
- Do not require an item that the player had no opportunity to collect unless the scenario explicitly teaches preparation failure.
- Plan A/B/C options must show the required item or resource before the player confirms the choice.
- A Plan B or Plan C outcome must be different from Plan A.
- A successful repair must visibly change the corresponding system status.
- Failed puzzle attempts must provide a hint and allow another attempt.

---

## 11. Repair manual and puzzle system

### 11.1 Repair Manual purpose

The Repair Manual is an in-game guide that teaches the player how to repair the currently damaged machine.

The player can open it by:

- Pressing M.
- Clicking the Manual button in the HUD.
- Interacting with the Manual Station.
- Selecting `Open Manual` from an active emergency alert.

### 11.2 Manual behavior

- The manual must detect the active emergency or selected machine.
- It must display the correct repair instructions for that machine.
- It must show an illustrated diagram, labeled parts, and numbered steps.
- It must explain any difficult word in child-friendly language.
- It must include a `Show Hint` action.
- It must include a `Show Full Solution` action for the puzzle, because the product is designed for learning rather than punishment.
- Opening the manual pauses turn progression and does not consume resources.
- Opening the manual must not automatically complete the repair.
- The player must return to the machine and perform the puzzle themselves.

### 11.3 Scientific terminology rule

The game MUST keep these two systems separate:

1. **Water Electrolysis Oxygen Generator:** uses electricity to split water and produce oxygen and hydrogen.
2. **CO₂ Scrubber:** removes carbon dioxide from cabin air.

Do not describe the CO₂ scrubber as a machine that converts carbon dioxide into oxygen.

For child-friendly language, the manual can say:

- `The oxygen machine makes fresh oxygen from water using electricity.`
- `The air cleaner removes carbon dioxide so the cabin air stays safer to breathe.`

### 11.4 Mandatory Puzzle A: Color-coded circuit connection

**Used for:** Oxygen Generator or Power Distribution Panel repair.

**Gameplay:**

- Show a simple board with three source wires and three matching destination ports.
- Use three colors: red, yellow, and black.
- The player drags each wire end to the port with the matching color and label.
- Show a clear snap animation when the wire reaches a valid port.
- If the connection is wrong, show a friendly message such as `That connection does not match. Check the manual diagram.`
- The puzzle is complete when all three connections are correct.
- On success, restore the machine status and show a confirmation animation.

This is a fictional educational puzzle, not a real spacecraft wiring diagram or real electrical repair instruction.

### 11.5 Mandatory Puzzle B: CO₂ filter/adapter puzzle

**Used for:** CO₂ Scrubber failure.

**Gameplay:**

- Show the filter housing, airflow inlet, outlet, filter cartridge, and adapter piece.
- The player selects the correct filter and adapter parts.
- The player places the parts into highlighted slots in the correct order.
- The airflow path must become visually continuous when assembled correctly.
- If parts are misplaced, explain which part does not fit and allow retry.
- On success, show airflow moving through the filter and reduce the simulated CO₂ level according to the scenario's configured effect.

The educational story may reference Apollo 13's improvised CO₂ adapter, but the game puzzle must be labeled as a simplified adaptation.

### 11.6 Optional Puzzle C: Hull patch

- Show a small visual leak in a habitat panel.
- The player selects a patch kit.
- The player drags the patch to the highlighted leak.
- The patch must stay within the marked repair area.
- On success, stop the simulated pressure loss.

### 11.7 Puzzle architecture

All puzzles must:

- Have their own component or module.
- Receive a puzzle configuration and completion callback.
- Return a success or failure result.
- Not directly mutate unrelated resource values.
- Ask the simulation engine to apply the configured repair effect after success.
- Support mouse and touch interaction.
- Support keyboard focus where practical.

---

## 12. CAPCOM Junior Flight Director

CAPCOM is a friendly on-screen astronaut/mission guide.

### 12.1 Required behavior

- Explain the current emergency in simple language.
- Give a hint when a critical resource is falling.
- Explain why the player should prioritize a system.
- Encourage retry after a failed puzzle.
- Explain one science idea after a successful repair.

### 12.2 Implementation

- Use a local rule-based message system.
- Do not connect to Gemini, OpenAI, or another LLM in the MVP.
- Do not require an API key.
- Store message templates in local scenario/content data.
- The message must be based on known game state and active scenario.
- Do not generate facts or emergency instructions dynamically.

Example:

`Cadet, the dust storm is blocking sunlight. Our batteries are limited. Keep life support running and pause the greenhouse lights for now.`

---

## 13. Difficulty modes

### 13.1 Cadet Mode

Default mode for younger players.

- Display percentages.
- Use short sentences.
- Show icons and color-coded status.
- Show CAPCOM hints.
- Use fewer decision choices when an emergency begins.
- Allow manual hints and full puzzle solutions.
- Use one emergency at a time during the tutorial.

### 13.2 Commander Mode

For older students and classroom use.

- Display additional values and units where supported by the local scenario configuration.
- Show more detailed resource consumption and production.
- Reduce automatic hints.
- Show additional consequences for each plan.
- Include a more detailed mission debrief.

Do not show a number in kg/day, kWh, or radiation units unless the value is supported by a documented source or explicitly labeled as a game assumption. Do not invent NASA operating specifications.

---

## 14. Mission debrief and scoring

### 14.1 Debrief contents

At the end of a mission, show:

- Mission result: Survived, Completed, or Safety Protocol Activated.
- Number of crew members safe.
- Remaining oxygen, water, power, and food.
- Number of emergencies resolved.
- Plans selected by the player.
- Repair puzzles completed.
- Resource efficiency.
- One or more learning points.
- One suggestion for a better strategy on replay.

### 14.2 Scoring

Use this game scoring model:

| Category | Weight |
|---|---:|
| Crew safety | 40 points |
| Habitat system stability | 25 points |
| Resource efficiency | 20 points |
| Contingency planning | 15 points |
| **Total** | **100 points** |

The score is educational feedback, not an official NASA judging formula.

### 14.3 Achievements

Use these optional badges after the core mission is working:

- Lifeboat Hero.
- Smart Resource Manager.
- Emergency Engineer.
- Radiation Guardian.
- Mission Survivor.

---

## 15. Visual design system

### 15.1 Overall art direction

Use a polished, futuristic, child-friendly space-game interface. It should look like a modern mission-control game, not a plain school dashboard.

Use:

- Dark navy and charcoal backgrounds.
- Rounded cards and panels.
- Subtle borders and restrained glow.
- Clear icons.
- Strong text contrast.
- Small, purposeful animations.
- Bright but controlled status colors.
- A clean HUD over the 3D environment.

### 15.2 Color tokens

Use these exact initial design tokens. They may be adjusted only if contrast testing shows a problem.

| Token | Hex | Use |
|---|---|---|
| `--bg-primary` | `#07111F` | Main application background |
| `--bg-panel` | `#0D1B2A` | Cards and panels |
| `--bg-panel-raised` | `#152A3E` | Raised panels and hover states |
| `--accent-cyan` | `#37D6F4` | Primary interactive highlight |
| `--accent-blue` | `#4388F5` | Secondary highlight |
| `--status-green` | `#37D67A` | Safe/healthy |
| `--status-amber` | `#FFB84D` | Warning |
| `--status-red` | `#FF5B68` | Critical/error |
| `--text-primary` | `#F4F7FB` | Main text |
| `--text-secondary` | `#AAB8C8` | Supporting text |

### 15.3 Component styling

- Panel radius: 14–18 px.
- Button radius: 10–14 px.
- Use consistent spacing based on 4 px increments.
- Dashboard cards should use compact headings and large readable values.
- Do not use small text for essential instructions.
- All status colors must also have text or icons so meaning is not communicated by color alone.

### 15.4 Typography

- Use a clean sans-serif stack: `Inter, ui-sans-serif, system-ui, sans-serif`.
- Do not require a remote font API.
- Use large headings for mission titles.
- Use short sentences for children.
- Keep paragraphs short in the game interface.

### 15.5 Main screens

Required screens:

1. Title/Home.
2. Destination Selection.
3. Cinematic Introduction.
4. Mission Briefing.
5. Mission Control Dashboard.
6. Interior View Gameplay.
7. Exterior 360° View.
8. Inventory.
9. Repair Manual.
10. Puzzle Overlay.
11. Mission Debrief.
12. NASA Science & Sources.
13. Pause/Settings.

---

## 16. Technology stack

Use the following free-first web stack unless the Stage 1 workspace inspection reveals a concrete compatibility conflict.

### 16.1 Required stack

| Technology | Required role | Reason |
|---|---|---|
| React | UI framework | Build screens and interactive components |
| TypeScript | Programming language | Type-safe game and resource state |
| Vite | Development/build tool | Fast local development and static production build |
| Three.js | 3D rendering | Render spacecraft, astronauts, terrain, and cinematic scenes |
| `@react-three/fiber` | React renderer for Three.js | Build 3D scenes using React components |
| `@react-three/drei` | 3D helper components | Camera controls, loaders, useful scene helpers |
| Zustand | Client-side game state | Share mission/resource/player state across screens |
| Tailwind CSS | UI styling | Build consistent HUD and panels quickly |
| `lucide-react` | Interface icons | Use consistent open-source UI icons |
| Browser Local Storage | Local settings/progress | Save progress without accounts or backend |
| SVG/CSS | Small charts and bars | Avoid a chart API and keep charts lightweight |

### 16.2 Optional free tools

| Tool | Use | Requirement |
|---|---|---|
| Blender | Create or edit original 3D models | Optional; use only if needed |
| Git/GitHub | Version control and collaboration | Recommended; not a runtime dependency |
| GitHub Pages | Static hosting | Recommended deployment option |
| Vercel or Netlify | Alternative static hosting | Optional; choose one only if GitHub Pages is unsuitable |
| Audacity | Edit original sound effects | Optional |

### 16.3 Unreal Engine decision

**Unreal Engine is not required and must not be introduced into this project.**

The MVP is a browser-based game. Use Three.js through React Three Fiber. This avoids building and shipping a separate native game engine and keeps the game accessible through a browser.

### 16.4 Physics engine

Do not add a physics engine by default. The MVP needs simple character movement, camera follow, object interaction, and wall collision.

Implement simple colliders or use a free compatible library only if the approved implementation plan shows that the required character collision behavior cannot be implemented reliably with the existing stack.

Do not add Rapier, Cannon, or another physics library without explaining the exact requirement it solves in the Stage 1 plan.

### 16.5 Dependency rules

- Use stable package releases, not alpha, beta, nightly, or experimental releases.
- Check React and React Three Fiber major-version compatibility before installation.
- Pin versions through the package manager lockfile after installation.
- Do not use a package that requires a paid subscription.
- Do not install multiple libraries that solve the same problem.
- Keep the dependency list as small as possible.

---

## 17. API keys, services, and connectors

### 17.1 Required runtime API keys

**None. The MVP must work without any external runtime API key.**

### 17.2 API and connector inventory

| Service/API | Required for MVP? | Key needed? | Instructions |
|---|---|---|---|
| NASA Open APIs | No | No | Use curated local science notes and source links. Do not call an API at runtime in the MVP. |
| NASA Image and Video Library API | No | No runtime integration | Download/select approved assets manually only after checking usage terms and credits. |
| OpenAI API | No | No | Do not use. CAPCOM is rule-based. |
| Google Gemini API | No | No | Do not use. CAPCOM is rule-based. |
| Supabase | No | No | Do not use. No accounts or cloud database are required. |
| Firebase | No | No | Do not use. No authentication or remote database is required. |
| External chart API | No | No | Use local SVG/CSS charts. |
| External sound API | No | No | Use original or properly licensed local audio assets. |
| Google Antigravity | Development tool only | Antigravity sign-in/model access may be required by the user's environment | It is not a runtime dependency of the finished game. |
| GitHub | Recommended for source control | No project API key required for normal local Git use | Use normal Git authentication when pushing a repository. Never paste tokens into source code. |
| Static hosting | Needed for public demo | Hosting account authentication may be required | Use one provider only. Do not add runtime secrets. |

### 17.3 Optional future NASA API use

If a future version requires live NASA data, the team may request a free NASA API key from `https://api.nasa.gov/` after the MVP is complete.

Do not add this key to the MVP. Do not place a private key in frontend source code. Any future API integration must document the endpoint, data fields, rate limits, caching, fallback behavior, and attribution before implementation.

### 17.4 Connectors and MCP

No external connector or MCP server is required for the MVP.

The coding agent should work in the local Antigravity workspace. GitHub may be used for source control through normal Git. Do not add third-party account connectors unless a later approved requirement needs them.

### 17.5 Environment variables

The MVP must not require a `.env` file.

If a future optional service is approved, document each environment variable in `.env.example`, never commit real credentials, and never print secrets in logs.

---

## 18. Asset and licensing rules

### 18.1 3D assets

- Prefer original procedural low-poly models for the MVP.
- Use original astronaut, spacecraft, habitat, tool, and food designs.
- GLB/GLTF models may be used only when their license permits use in the public project.
- Save the asset source and license in `CREDITS.md`.
- Do not rely on remote asset URLs at runtime for essential gameplay.
- Provide a procedural placeholder for every non-essential model that fails to load.

### 18.2 NASA media

NASA media can generally be used for educational and informational purposes subject to NASA's media usage guidelines. Check each asset's page for third-party credits, restrictions, and required attribution.

The NASA insignia, logotype, seal, and identifiers are protected and must not be used as the project's own logo or in a way that implies NASA endorsement. Use the project's own ORBITAL SURVIVAL branding.

### 18.3 Audio

- Use original or properly licensed sound effects.
- Keep audio muted until the player enables it, unless the browser and user interaction rules allow otherwise.
- Provide mute and volume controls.
- Do not use copyrighted film, television, or commercial game audio.

---

## 19. Data model and application architecture

The implementation plan must map these logical modules to actual files.

### 19.1 Core state

Use a typed central game state. The following is the minimum conceptual shape; the agent may add typed fields required by the defined features but must not remove or rename these concepts without documenting the reason in Stage 1.

```ts
type Destination = "mars" | "moon";
type ViewMode = "interior" | "exterior";
type MissionStatus = "title" | "destination-select" | "loadout" | "intro" | "briefing" | "active" | "paused" | "success" | "safety-protocol";
type PlanId = "A" | "B" | "C";

type ResourceState = {
  oxygen: number;
  water: number;
  battery: number;
  food: number;
  co2: number;
  habitatPressure: number;
  temperatureSafety: number;
  radiationProtection: number;
};

type CharacterState = {
  health: number;
  energy: number;
  hydration: number;
  position: { x: number; y: number; z: number };
};

type CrewMemberState = {
  id: string;
  isPlayer: boolean;
  health: number;
  status: "healthy" | "warning" | "needs-rest" | "safe-shelter";
};

type InventoryItem = {
  id: string;
  quantity: number;
};

type EmergencyState = {
  scenarioId: string;
  active: boolean;
  selectedPlan: PlanId | null;
  puzzleCompleted: boolean;
};

type GameState = {
  destination: Destination;
  viewMode: ViewMode;
  missionStatus: MissionStatus;
  sol: number;
  resources: ResourceState;
  character: CharacterState;
  crew: CrewMemberState[];
  inventory: InventoryItem[];
  emergency: EmergencyState | null;
};
```

### 19.2 Architecture responsibilities

**UI layer:** renders screens, HUD, buttons, charts, panels, and messages. It must not contain resource formulas.

**3D scene layer:** renders the astronaut, interior environment, exterior environment, cinematic scenes, and interactive world objects.

**Game state layer:** stores player, crew, inventory, resources, view mode, mission progress, alerts, and scenario state.

**Simulation engine:** calculates daily resource changes, power priorities, thresholds, crew effects, and mission results.

**Scenario engine:** loads the selected scenario, triggers emergencies, validates Plan A/B/C availability, and applies configured consequences through the simulation engine.

**Puzzle layer:** handles puzzle input and returns success/failure. It must not independently change unrelated mission resources.

**Content layer:** stores child-friendly manual instructions, CAPCOM messages, science explanations, and NASA source references.

### 19.3 Persistence

- Save destination selection, audio preference, completed missions, best scores, and basic tutorial progress locally.
- Do not save personal information because none is collected.
- Handle invalid or older saved data by resetting to safe defaults and showing a non-technical message.
- The game must remain playable if Local Storage is unavailable; use in-memory progress for the current session.

---

## 20. Reference documentation

Use these official documentation links during implementation. The agent must prefer official documentation over random tutorials when resolving API details.

### Antigravity workflow

- Google Antigravity settings and agent execution modes: https://antigravity.google/docs/settings?tab=ide
- Google Antigravity artifact review: https://antigravity.google/docs/artifact-review/
- Google Codelab for Antigravity implementation plans and review: https://codelabs.developers.google.com/getting-started-agy-ide

### Frontend and 3D

- Vite Getting Started: https://vite.dev/guide/
- React Three Fiber Introduction: https://r3f.docs.pmnd.rs/getting-started/introduction
- React Three Fiber First Scene: https://r3f.docs.pmnd.rs/getting-started/your-first-scene
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls.html
- Three.js PointerLockControls: https://threejs.org/docs/pages/PointerLockControls.html

### NASA science and asset rules

- Official 2026 challenge: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/
- NASA Open APIs: https://api.nasa.gov/
- NASA API authentication and rate-limit information: https://api.nasa.gov/assets/html/authentication.html
- NASA Images and Media Usage Guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
- NASA Brand Guidelines: https://www.nasa.gov/nasa-brand-center/brand-guidelines/
- NASA ECLSS subsystem overview: https://www.nasa.gov/reference/jsc-life-support-subsystems/
- NASA water recovery milestone: https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/
- NASA Apollo 13: https://www.nasa.gov/mission/apollo-13/
- NASA Apollo 13 CO₂ incident and filter adaptation: https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/
- NASA Orion radiation shelter / Crew Systems: https://www.nasa.gov/reference/crew-systems/
- NASA crewed Mars communication delay research: https://ntrs.nasa.gov/citations/20220013418
- NASA Moon Trek: https://trek.nasa.gov/moon/
- NASA Mars Trek: https://trek.nasa.gov/mars/

If a listed NASA science page moves or becomes unavailable, locate the current official NASA page for the same subject and record the replacement URL in the source list. Do not invent a citation.

---

## 21. Performance, accessibility, and browser requirements

### 21.1 Performance

- Target current desktop versions of Chrome, Edge, and Firefox.
- Support current Safari where the 3D stack allows it.
- Use WebGL through Three.js.
- Detect WebGL failure and show a friendly compatibility message rather than a blank screen.
- Keep 3D models low-poly for the MVP.
- Use compressed textures and avoid large unnecessary assets.
- Load cinematic assets lazily where possible.
- Do not preload every future mission asset before the player starts.
- Provide a simple low-quality graphics option.
- Aim for smooth performance on a typical student laptop; do not claim a fixed FPS unless it has been measured on named hardware.

### 21.2 Accessibility and child usability

- Use plain English.
- Use short instructions and one action per sentence.
- Use large clickable/touchable controls.
- Use text labels with color-coded states.
- Never communicate a critical status with color alone.
- Provide keyboard controls for desktop gameplay.
- Provide touch controls for tablet.
- Avoid rapid flashing, intense screen shake, and strobe effects.
- Provide mute/unmute controls.
- Provide a reduced-motion option.
- Use a confirmation step before destructive actions such as abandoning a mission.
- Make the manual easy to find from every active gameplay screen.

### 21.3 Privacy

- Do not create user accounts.
- Do not request personal information.
- Do not add analytics that collect personal data.
- Do not use tracking pixels.
- Do not record microphone, camera, or location data.
- Keep save data local to the browser.

---

## 22. Four-person team responsibility split

Use this work split to coordinate the four teammates. The implementation plan must preserve these ownership areas unless the existing repository requires a different split and the reason is documented.

### Member 1: Frontend and UI/UX

Owns:

- Title screen and destination selection UI.
- Mission briefing UI.
- Mission Control dashboard.
- Resource cards and charts.
- Inventory and manual panels.
- View switch controls.
- Responsive layout and design tokens.

### Member 2: Simulation and game logic

Owns:

- Resource state and calculations.
- Power allocation and priorities.
- Crew status changes.
- Daily turn progression.
- Emergency triggers.
- Plan A/B/C availability and consequences.
- Mission scoring and end conditions.

### Member 3: NASA research and game content

Owns:

- Scenario text and configuration.
- Child-friendly science explanations.
- Repair Manual instructions and diagrams.
- CAPCOM message templates.
- NASA Science & Sources page.
- Simulation assumptions and attribution records.

### Member 4: 3D gameplay, puzzles, integration, and testing

Owns:

- 3D spacecraft and habitat scenes.
- Astronaut movement and interactions.
- Cinematic sequence.
- Exterior 360-degree view.
- Food/supply pickup interactions.
- Circuit and filter mini-games.
- Integration, browser testing, and deployment.

All teammates must use the shared state model and agreed component interfaces. Do not create parallel duplicate resource systems.

---

## 23. Acceptance criteria

The MVP is not complete until every P0 acceptance criterion below passes.

### 23.1 Start and cinematic

- [ ] The player can open the game in a browser without registration.
- [ ] The player can select Mars or Moon.
- [ ] A new mission plays the boarding scene.
- [ ] The launch scene shows the spacecraft taking off from Earth.
- [ ] The space-travel scene shows Earth receding and the destination approaching.
- [ ] The landing scene uses the selected destination.
- [ ] Skip Intro works from every cinematic scene.
- [ ] The cinematic transitions into the mission briefing and game without a blank screen.

### 23.2 Interior gameplay

- [ ] The astronaut moves using WASD/arrow keys.
- [ ] The camera follows the player.
- [ ] The astronaut cannot walk through the main walls and machines.
- [ ] Interactable objects highlight when in range.
- [ ] The E key and on-screen Interact button work.
- [ ] The player can walk to the food cabinet and collect a meal pack.
- [ ] The inventory count updates after pickup.
- [ ] Using a meal pack increases Energy/Stamina and decreases meal-pack quantity.
- [ ] Using a water pack increases Hydration and decreases water-pack quantity.
- [ ] Health, Energy, and Hydration bars update after actions.
- [ ] The small history chart shows the recent changes.

### 23.3 Exterior view

- [ ] The Exterior 360° View shows the spacecraft and destination environment.
- [ ] The camera can rotate a full 360 degrees horizontally.
- [ ] The camera can zoom.
- [ ] Reset Camera works.
- [ ] Return to Interior View works.
- [ ] Switching views preserves player position, inventory, and mission progress.
- [ ] Resource turns do not advance while the player is inspecting the exterior.

### 23.4 Dashboard and simulation

- [ ] The three main gauges are Life Support, Power Grid, and Crew Safety.
- [ ] Food is visible as a separate resource card.
- [ ] System status labels update after repairs.
- [ ] End Day applies the documented simulation calculations.
- [ ] Power consumption and generation are visible.
- [ ] Turning off the greenhouse saves power and reduces food production.
- [ ] Turning off the CO₂ Scrubber increases CO₂.
- [ ] Turning off the Oxygen Generator stops oxygen production.
- [ ] Water Recycler activity changes water and power values.
- [ ] Resource values stay within their defined ranges.
- [ ] Warning and critical alerts appear at the specified game thresholds.

### 23.5 Manual and puzzles

- [ ] M opens the Repair Manual.
- [ ] The active system's manual page is displayed.
- [ ] Manual instructions use short child-friendly steps.
- [ ] Manual includes an illustrated diagram.
- [ ] Manual pauses turn progression.
- [ ] Manual does not auto-complete the repair.
- [ ] The circuit puzzle accepts the correct color/label connections.
- [ ] Incorrect connections show a friendly hint.
- [ ] The CO₂ filter/adapter puzzle can be completed.
- [ ] Puzzle completion updates the related machine status through the simulation engine.

### 23.6 Mission outcome and learning

- [ ] At least four emergency scenarios are playable.
- [ ] Plan A, Plan B, and Plan C have distinct requirements and consequences.
- [ ] Unavailable plans are clearly disabled with a reason.
- [ ] Failed decisions lead to an explanatory message, not graphic content.
- [ ] A successful mission shows a debrief.
- [ ] A failed mission shows a non-punitive safety-protocol debrief.
- [ ] Debrief explains the player's decisions and one relevant science concept.
- [ ] The NASA Science & Sources screen lists source links and game assumptions.

### 23.7 Build and submission

- [ ] `npm run build` completes without errors.
- [ ] The deployed site loads over HTTPS.
- [ ] The game works in a clean/incognito browser session.
- [ ] The application does not require an API key.
- [ ] No real child personal information is collected.
- [ ] All assets are original or properly credited.
- [ ] README names the exact NASA challenge.
- [ ] CREDITS.md and SIMULATION-ASSUMPTIONS.md are present.

---

## 24. Required project documentation files

After implementation begins, create and maintain these files:

- `README.md`: project overview, exact challenge title, features, setup, run/build commands, demo URL, and team contributions.
- `CREDITS.md`: every external asset, model, audio file, icon set, and library that requires attribution or license notice.
- `SIMULATION-ASSUMPTIONS.md`: every game-only percentage, threshold, resource rate, and simplified mechanic, with the corresponding source or an explicit statement that it is a gameplay assumption.
- `NASA-SCIENCE-SOURCES.md`: NASA source links and a short note describing which game feature each source supports.
- `docs/IMPLEMENTATION_PLAN.md`: the approved implementation plan, if the user approves saving it as a workspace file.

---

## 25. Copy/paste kickoff prompt for Antigravity

Paste this message into a new Antigravity agent conversation after opening the project workspace and ensuring this file is available at the project root as `PRD.md`:

```text
Read PRD.md from beginning to end. Treat it as the locked product requirements document.

We are in Stage 1 only. Inspect the existing workspace and prepare a detailed implementation plan. Do not install packages, do not edit application source code, do not create components, and do not start implementation.

Your plan must map every P0 requirement to the modules and files you intend to create or modify. Include the architecture, folder structure, package list and compatibility checks, 3D cinematic design, interior movement, exterior 360 camera, game state, resource calculations, scenario engine, Plan A/B/C, inventory, food pickup, status charts, repair manual, puzzle logic, NASA science references, asset licensing, performance checks, and acceptance tests.

Use only the stack and services allowed by the PRD. The MVP requires no runtime API keys, no backend, no user accounts, no paid services, and no external AI API.

List only genuine blockers. Do not invent requirements or scientific facts. If the current workspace already contains working code, preserve it and explain how the plan will integrate with it.

Present the implementation plan for review and STOP. Wait for my explicit approval before changing or creating application code. Do not proceed automatically after presenting the plan.
```

---

## 26. Final instruction to the Antigravity agent

Start by reading this entire PRD and inspecting the existing workspace.

**Do Stage 1 only.** Produce a detailed implementation plan, map every P0 requirement to specific components/modules, list the packages and files you intend to add, identify any genuine blockers, and propose the order of implementation.

Do not install dependencies. Do not create or edit application code. Do not start the cinematic, 3D scene, dashboard, simulation engine, or puzzles.

After presenting the implementation plan, stop and wait for the user to approve it. Only begin Stage 2 after explicit approval.

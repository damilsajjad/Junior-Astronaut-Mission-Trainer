import {
  AlertTriangle,
  Archive,
  Backpack,
  BookOpen,
  Droplets,
  Play,
  Power,
  Puzzle,
  ShieldCheck,
  Sprout,
  Trash2,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import {
  ITEM_BY_ID,
  SHARED_FOOD_CAPACITY,
  isFoodItem,
  isLockerStorable,
} from '../../data/items';
import { buildMachineCatalog } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import { StationId, SystemId, SystemToggleState } from '../../types/game';

function getSystemsForStation(stationId: StationId): SystemId[] {
  switch (stationId) {
    case 'oxygen-generator':
      return ['oxygenGenerator'];
    case 'co2-scrubber':
      return ['co2Scrubber'];
    case 'water-recycler':
      return ['waterRecycler'];
    case 'greenhouse':
      return ['greenhouse'];
    case 'solar-array':
      return ['solarArray'];
    case 'battery-system':
      return ['batterySystem'];
    case 'radiation-shelter':
      return ['radiationShelter'];
    case 'crew-bunks':
      return ['temperatureControl'];
    case 'mission-control':
      return ['pressureSystem', 'temperatureControl'];
    default:
      return [];
  }
}

export default function StationInspectModal() {
  const inspectedStationId = useGameStore((s) => s.inspectedStationId);
  const destination = useGameStore((s) => s.destination);
  const systems = useGameStore((s) => s.systems);
  const machineConditions = useGameStore((s) => s.machineConditions);
  const toggles = useGameStore((s) => s.toggles);
  const resources = useGameStore((s) => s.resources);
  const crew = useGameStore((s) => s.crew);
  const greenhouseState = useGameStore((s) => s.greenhouseState);
  const waterCycle = useGameStore((s) => s.waterCycle);
  const dustStormDaysRemaining = useGameStore((s) => s.dustStormDaysRemaining);
  const inventory = useGameStore((s) => s.inventory);
  const sharedFoodStorage = useGameStore((s) => s.sharedFoodStorage);

  const toggleSystemPower = useGameStore((s) => s.toggleSystemPower);
  const maintainSystem = useGameStore((s) => s.maintainSystem);
  const openMachineRepairPuzzle = useGameStore((s) => s.openMachineRepairPuzzle);
  const performQuickStationAction = useGameStore((s) => s.performQuickStationAction);
  const harvestGreenhouse = useGameStore((s) => s.harvestGreenhouse);
  const drinkAtWaterDispenser = useGameStore((s) => s.drinkAtWaterDispenser);
  const eatCrewMeal = useGameStore((s) => s.eatCrewMeal);
  const depositFoodToSharedStorage = useGameStore((s) => s.depositFoodToSharedStorage);
  const withdrawFoodFromSharedStorage = useGameStore((s) => s.withdrawFoodFromSharedStorage);
  const useToiletFacility = useGameStore((s) => s.useToiletFacility);
  const emptySolidWaste = useGameStore((s) => s.emptySolidWaste);
  const openModal = useGameStore((s) => s.openModal);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!inspectedStationId) return null;

  const catalog = buildMachineCatalog({
    systems,
    machineConditions,
    toggles,
    resources,
    dustStormDaysRemaining,
    destination,
    greenhouseState,
    waterCycle,
  });

  const targetIds = getSystemsForStation(inspectedStationId);
  const machines = catalog.filter((m) => targetIds.includes(m.id));
  const repairKitQty = inventory.find((i) => i.id === 'repair-kit')?.quantity ?? 0;

  const lockerUsed = sharedFoodStorage.reduce((sum, i) => sum + i.quantity, 0);
  const storableBackpackItems = inventory.filter((i) => isLockerStorable(i.id) && i.quantity > 0);
  const totalFoodItemsHeld =
    sharedFoodStorage.filter((i) => isFoodItem(i.id)).reduce((s, i) => s + i.quantity, 0) +
    inventory.filter((i) => isFoodItem(i.id)).reduce((s, i) => s + i.quantity, 0);

  const headerTitle =
    inspectedStationId === 'water-dispenser'
      ? 'Potable Water Dispenser'
      : inspectedStationId === 'toilet-facility'
        ? 'Toilet & Separated Waste Bay'
        : inspectedStationId === 'food-cabinet'
          ? 'Shared Food Storage Box'
          : machines[0]?.name ?? inspectedStationId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">
                Station Panel · {headerTitle}
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                Inspect live status, toggle controls, run repairs, and manage crew support
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close inspection"
            className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {/* Hydroponic Greenhouse Crop Growth & Harvest Card */}
          {inspectedStationId === 'greenhouse' && (
            <div className="rounded-xl bg-[#07111F] border border-[#37D67A]/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-[#37D67A]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#F4F7FB]">
                      Hydroponic Crop Growth Cycle
                    </h3>
                    <p className="text-xs text-[#AAB8C8]">
                      Stage:{' '}
                      <strong
                        className={
                          greenhouseState.stage === 'ready'
                            ? 'text-[#37D67A]'
                            : greenhouseState.stage === 'unhealthy'
                              ? 'text-[#FF5B68]'
                              : 'text-[#37D6F4]'
                        }
                      >
                        {greenhouseState.stage.toUpperCase()}
                      </strong>{' '}
                      · Harvested Cycles: {greenhouseState.harvestedCycles}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => harvestGreenhouse()}
                  disabled={greenhouseState.stage !== 'ready'}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                    greenhouseState.stage === 'ready'
                      ? 'bg-[#37D67A] hover:bg-[#49e289] text-[#07111F] shadow-lg'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {greenhouseState.stage === 'ready'
                    ? 'Harvest Crops (+2 Fresh Harvest → Bag)'
                    : `Growing (${Math.round(greenhouseState.growthProgress)}%)`}
                </button>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(greenhouseState.growthProgress)}%`,
                    backgroundColor:
                      greenhouseState.stage === 'unhealthy'
                        ? '#FF5B68'
                        : greenhouseState.stage === 'ready'
                          ? '#37D67A'
                          : '#37D6F4',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                  <span className="text-[#AAB8C8]">Moisture</span>
                  <p className="font-bold text-[#37D6F4]">
                    {Math.round(greenhouseState.moisture)}%
                  </p>
                </div>
                <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                  <span className="text-[#AAB8C8]">Hydroponic Nutrients</span>
                  <p className="font-bold text-[#37D67A]">
                    {Math.round(greenhouseState.nutrients)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Water Dispenser Station */}
          {inspectedStationId === 'water-dispenser' && (
            <div className="rounded-xl bg-[#07111F] border border-[#37D6F4]/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#37D6F4]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#F4F7FB]">
                      Potable Water Storage & Crew Hydration
                    </h3>
                    <p className="text-xs text-[#AAB8C8]">
                      Potable Tank: <strong className="text-[#37D6F4]">{Math.round(resources.water)}%</strong> ·
                      Purity Check: <strong className="text-[#37D67A]">{Math.round(waterCycle.potableQuality)}%</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {crew.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#F4F7FB]">{c.label}</p>
                      <p className="text-[11px] text-[#37D6F4] font-semibold">
                        Hydration: {Math.round(c.hydration)}%
                      </p>
                    </div>
                    <button
                      onClick={() => drinkAtWaterDispenser(c.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] text-xs font-extrabold cursor-pointer"
                    >
                      Drink Water
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toilet & Separated Solid/Liquid Waste Bay */}
          {inspectedStationId === 'toilet-facility' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#07111F] border border-[#37D6F4]/40 p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-[#37D6F4]">
                  1. Liquid Recovery Line (Urine + Cabin Humidity → Water Recycler)
                </h3>
                <p className="text-xs text-[#AAB8C8]">
                  Collection → Filtration → Purification → Quality Check → Potable Storage → Water Dispenser
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                    <span className="text-[#AAB8C8]">Urine Buffer</span>
                    <p className="font-bold text-[#FFB84D]">{Math.round(waterCycle.urineBuffer)}%</p>
                  </div>
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                    <span className="text-[#AAB8C8]">Humidity Cond.</span>
                    <p className="font-bold text-[#37D6F4]">{Math.round(waterCycle.humidityCondensate)}%</p>
                  </div>
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                    <span className="text-[#AAB8C8]">Filtration</span>
                    <p className="font-bold text-[#37D67A]">{Math.round(waterCycle.filtrationProgress)}%</p>
                  </div>
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2">
                    <span className="text-[#AAB8C8]">Potable Quality</span>
                    <p className="font-bold text-[#37D67A]">{Math.round(waterCycle.potableQuality)}%</p>
                  </div>
                </div>
                <button
                  onClick={() => useToiletFacility()}
                  className="px-4 py-2 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] text-xs font-extrabold cursor-pointer"
                >
                  Use Toilet (Separate Liquid & Solid)
                </button>
              </div>

              <div className="rounded-xl bg-[#07111F] border border-[#FFB84D]/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#FFB84D]">
                      2. Sealed Solid Waste Containment (Separate System)
                    </h3>
                    <p className="text-xs text-[#AAB8C8]">
                      Solid waste NEVER enters the Water Recovery pipeline. Sealed canisters are stored separately.
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[#FFB84D] tabular-nums">
                    {Math.round(waterCycle.solidWasteLevel)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round(waterCycle.solidWasteLevel)}%`,
                      backgroundColor:
                        waterCycle.solidWasteLevel >= 80 ? '#FF5B68' : '#FFB84D',
                    }}
                  />
                </div>
                <button
                  onClick={() => emptySolidWaste()}
                  disabled={waterCycle.solidWasteLevel <= 0}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                    waterCycle.solidWasteLevel > 0
                      ? 'bg-[#FFB84D] hover:bg-[#ffc66e] text-[#07111F]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Seal & Transfer Solid Canister</span>
                </button>
              </div>
            </div>
          )}

          {/* Shared Food Storage Box (Food Locker) */}
          {inspectedStationId === 'food-cabinet' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#07111F] border border-[#37D67A]/45 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Archive className="w-5 h-5 text-[#37D67A]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#F4F7FB]">
                        Shared Food Storage Box ({lockerUsed} / {SHARED_FOOD_CAPACITY} Items)
                      </h3>
                      <p className="text-xs text-[#AAB8C8]">
                        Crew Reserve: <strong className="text-[#37D67A]">{Math.round(resources.food)}%</strong> ({totalFoodItemsHeld} real food items)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal('inventory')}
                    className="px-3 py-1.5 rounded-xl bg-[#152A3E] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Backpack className="w-3.5 h-3.5" />
                    <span>Open Backpack (I)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Locker Contents */}
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#37D67A]">
                      Inside Shared Locker
                    </p>
                    {sharedFoodStorage.length === 0 ? (
                      <p className="text-xs text-[#AAB8C8]">
                        Locker is empty! Harvest Greenhouse crops or store food from your Backpack.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {sharedFoodStorage.map((slot) => {
                          const def = ITEM_BY_ID[slot.id];
                          return (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#07111F] border border-white/10 px-2.5 py-1.5 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[#F4F7FB] truncate">
                                  {def?.name ?? slot.id}{' '}
                                  <span className="text-[#37D67A] font-mono">x{slot.quantity}</span>
                                </p>
                              </div>
                              <button
                                onClick={() => withdrawFoodFromSharedStorage(slot.id, 1)}
                                className="px-2 py-1 rounded-md bg-[#37D6F4]/20 hover:bg-[#37D6F4]/30 border border-[#37D6F4]/40 text-[10px] font-bold text-[#37D6F4] cursor-pointer shrink-0"
                              >
                                Take 1 → Bag
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Store From Backpack */}
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-3 space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#37D6F4]">
                      Your Backpack → Store
                    </p>
                    {storableBackpackItems.length === 0 ? (
                      <p className="text-xs text-[#AAB8C8]">
                        No food or water packs in Backpack right now.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {storableBackpackItems.map((slot) => {
                          const def = ITEM_BY_ID[slot.id];
                          return (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#07111F] border border-white/10 px-2.5 py-1.5 text-xs"
                            >
                              <p className="font-bold text-[#F4F7FB] truncate">
                                {def?.name ?? slot.id}{' '}
                                <span className="text-[#37D6F4] font-mono">x{slot.quantity}</span>
                              </p>
                              <button
                                onClick={() => depositFoodToSharedStorage(slot.id, 1)}
                                className="px-2 py-1 rounded-md bg-[#37D67A]/20 hover:bg-[#37D67A]/30 border border-[#37D67A]/40 text-[10px] font-bold text-[#37D67A] cursor-pointer shrink-0"
                              >
                                Store 1
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feed Crew From Shared Food Box */}
              <div className="rounded-xl bg-[#07111F] border border-white/15 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#37D67A]" />
                  <h3 className="text-sm font-bold text-[#F4F7FB]">
                    Serve Meal to Crew (Consumes 1 Real Food Item)
                  </h3>
                </div>
                <p className="text-[11px] text-[#AAB8C8]">
                  Eating raises Nutrition right away; Stamina recovers gradually with rest and good Nutrition.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {crew.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#F4F7FB]">{c.label}</p>
                        <p className="text-[11px] text-[#AAB8C8]">
                          Nutr <strong className="text-[#37D67A]">{Math.round(c.nutrition)}%</strong> · Stam{' '}
                          <strong className="text-[#FFB84D]">{Math.round(c.energy)}%</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => eatCrewMeal(c.id, { source: 'storage' })}
                        disabled={totalFoodItemsHeld <= 0}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                          totalFoodItemsHeld > 0
                            ? 'bg-[#37D67A]/20 hover:bg-[#37D67A]/30 border border-[#37D67A]/50 text-[#37D67A] cursor-pointer'
                            : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                      >
                        Feed 1x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Crew Meals & Nutrition at Bunks / Med Bay */}
          {inspectedStationId === 'crew-bunks' && (
            <div className="rounded-xl bg-[#07111F] border border-[#37D67A]/35 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#37D67A]" />
                  <h3 className="text-sm font-bold text-[#F4F7FB]">
                    Crew Nutrition & Stamina Care ({totalFoodItemsHeld} Food Items Available)
                  </h3>
                </div>
              </div>
              <p className="text-[11px] text-[#AAB8C8]">
                Eating consumes 1 food item and restores Nutrition; Stamina recovers gradually from good Nutrition, Hydration, and Rest.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {crew.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#F4F7FB]">{c.label}</p>
                      <p className="text-[11px] text-[#AAB8C8]">
                        Nutr <strong className="text-[#37D67A]">{Math.round(c.nutrition)}%</strong> · Stam{' '}
                        <strong className="text-[#FFB84D]">{Math.round(c.energy)}%</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => eatCrewMeal(c.id)}
                      disabled={totalFoodItemsHeld <= 0}
                      className={`px-2.5 py-1.5 rounded-lg font-bold ${
                        totalFoodItemsHeld > 0
                          ? 'bg-[#37D67A]/20 hover:bg-[#37D67A]/30 border border-[#37D67A]/50 text-[#37D67A] cursor-pointer'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      Feed 1x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Machine Catalog Cards */}
          {machines.map((m) => {
            const toggleKey = m.id as keyof SystemToggleState;
            const isOn = m.hasPowerSwitch ? toggles[toggleKey] : true;
            const statusColor =
              m.status === 'Operational'
                ? 'text-[#37D67A]'
                : m.status === 'Warning'
                  ? 'text-[#FFB84D]'
                  : 'text-[#FF5B68]';

            return (
              <div
                key={m.id}
                className="rounded-xl bg-[#07111F] border border-white/15 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#F4F7FB]">{m.name}</h3>
                    <p className={`text-xs font-extrabold ${statusColor}`}>
                      Status: {m.status} · Condition: {m.condition}%
                    </p>
                  </div>

                  {m.hasPowerSwitch && (
                    <button
                      onClick={() => toggleSystemPower(toggleKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border ${
                        isOn
                          ? 'bg-[#37D67A]/20 border-[#37D67A]/50 text-[#37D67A]'
                          : 'bg-white/10 border-white/15 text-[#AAB8C8]'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Power: {isOn ? 'ON' : 'OFF'}</span>
                    </button>
                  )}
                </div>

                {/* Condition Bar */}
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${m.condition}%`,
                      backgroundColor:
                        m.condition >= 70 ? '#37D67A' : m.condition >= 40 ? '#FFB84D' : '#FF5B68',
                    }}
                  />
                </div>

                {/* Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5">
                    <span className="text-[10px] uppercase font-bold text-[#AAB8C8]">Power Draw</span>
                    <p className="font-bold text-[#FFB84D] mt-0.5">{m.powerRequirement} PWR / Sol</p>
                  </div>
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5">
                    <span className="text-[10px] uppercase font-bold text-[#AAB8C8]">Required Inputs</span>
                    <p className="font-bold text-[#F4F7FB] mt-0.5">{m.inputsDesc}</p>
                  </div>
                  <div className="rounded-lg bg-[#0D1B2A] border border-white/10 p-2.5">
                    <span className="text-[10px] uppercase font-bold text-[#AAB8C8]">Output / State</span>
                    <p className="font-bold text-[#37D67A] mt-0.5">{m.outputDesc}</p>
                  </div>
                </div>

                {m.fault && (
                  <div className="rounded-lg bg-[#FF5B68]/15 border border-[#FF5B68]/40 px-3 py-2 flex items-center gap-2 text-xs text-[#FF5B68] font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Fault Detected: {m.fault}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => openMachineRepairPuzzle(m.id, inspectedStationId)}
                    className="px-3 py-2 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Puzzle className="w-3.5 h-3.5" />
                    <span>Solve Repair Puzzle</span>
                  </button>
                  <button
                    onClick={() => maintainSystem(m.id, false)}
                    className="px-3 py-2 rounded-xl bg-[#152A3E] hover:bg-[#1d3954] border border-[#37D6F4]/40 text-xs font-bold text-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Routine Maintenance (+18% Cond)</span>
                  </button>
                  <button
                    onClick={() => maintainSystem(m.id, true)}
                    disabled={repairKitQty <= 0}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                      repairKitQty > 0
                        ? 'bg-[#37D67A] hover:bg-[#49e289] text-[#07111F] cursor-pointer'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Use Repair Kit ({repairKitQty} held)</span>
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => openModal('manual', inspectedStationId)}
              className="px-4 py-2 rounded-xl bg-[#152A3E] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Manual Chapter</span>
            </button>

            <button
              onClick={() => {
                const sid = inspectedStationId;
                closeModal();
                performQuickStationAction(sid);
              }}
              className="px-4 py-2 rounded-xl bg-[#152A3E] hover:bg-[#1e3c58] border border-white/20 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Quick Interact</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

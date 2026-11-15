import { useEffect, useState } from 'react';
import {
  Archive,
  ArrowDownToLine,
  Backpack,
  BatteryCharging,
  Cpu,
  Droplets,
  FlaskConical,
  Hammer,
  HeartPulse,
  Package,
  Shield,
  Sprout,
  Utensils,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import {
  ASSEMBLY_RECIPES,
  INVENTORY_SLOT_LIMIT,
  ITEM_BY_ID,
  isLockerStorable,
} from '../../data/items';
import { useGameStore } from '../../store/gameStore';

function renderItemIcon(itemId: string, sizeClass = 'w-6 h-6') {
  switch (itemId) {
    case 'fresh-crop':
      return <Sprout className={`${sizeClass} text-[#4ADE80]`} />;
    case 'meal-pack':
      return <Utensils className={`${sizeClass} text-[#37D67A]`} />;
    case 'water-pack':
      return <Droplets className={`${sizeClass} text-[#38BDF8]`} />;
    case 'repair-kit':
      return <Wrench className={`${sizeClass} text-[#FFB84D]`} />;
    case 'medical-kit':
      return <HeartPulse className={`${sizeClass} text-[#FF5B68]`} />;
    case 'emergency-oxygen':
      return <Wind className={`${sizeClass} text-[#37D6F4]`} />;
    case 'emergency-battery':
      return <BatteryCharging className={`${sizeClass} text-[#FFB84D]`} />;
    case 'radiation-panel':
      return <Shield className={`${sizeClass} text-[#37D6F4]`} />;
    case 'spare-sensor':
      return <Cpu className={`${sizeClass} text-[#AAB8C8]`} />;
    case 'filter-cartridge':
      return <FlaskConical className={`${sizeClass} text-[#38BDF8]`} />;
    default:
      return <Package className={`${sizeClass} text-[#AAB8C8]`} />;
  }
}

function categoryTone(category?: string) {
  if (category === 'consumable') return 'border-[#37D67A]/45 bg-[#37D67A]/10';
  if (category === 'repair') return 'border-[#FFB84D]/45 bg-[#FFB84D]/10';
  return 'border-[#37D6F4]/45 bg-[#37D6F4]/10';
}

export default function InventoryModal() {
  const inventory = useGameStore((s) => s.inventory);
  const sharedFoodStorage = useGameStore((s) => s.sharedFoodStorage);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);
  const dropInventoryItem = useGameStore((s) => s.dropInventoryItem);
  const depositFoodToSharedStorage = useGameStore((s) => s.depositFoodToSharedStorage);
  const craftAssemblyRecipe = useGameStore((s) => s.craftAssemblyRecipe);
  const openModal = useGameStore((s) => s.openModal);
  const closeModal = useGameStore((s) => s.closeModal);

  const [selectedId, setSelectedId] = useState<string | null>(inventory[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId || !inventory.some((s) => s.id === selectedId)) {
      setSelectedId(inventory[0]?.id ?? null);
    }
  }, [inventory, selectedId]);

  const qtyOf = (id: string) => inventory.find((i) => i.id === id)?.quantity ?? 0;
  const selectedSlot = inventory.find((i) => i.id === selectedId) ?? inventory[0] ?? null;
  const selectedDef = selectedSlot ? ITEM_BY_ID[selectedSlot.id] : null;
  const lockerItemCount = sharedFoodStorage.reduce((sum, s) => sum + s.quantity, 0);

  const slots = Array.from({ length: INVENTORY_SLOT_LIMIT }, (_, idx) => inventory[idx] ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/45 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Backpack className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">Astronaut Backpack & Assembly</h2>
              <p className="text-xs text-[#AAB8C8] tabular-nums">
                {inventory.length} / {INVENTORY_SLOT_LIMIT} Backpack slots · Shared Food Locker: {lockerItemCount} items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('station-inspect', 'food-cabinet')}
              className="px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#37D67A]/45 text-xs font-bold text-[#37D67A] hover:bg-[#13293f] flex items-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Food Locker ({lockerItemCount})</span>
            </button>
            <button
              onClick={closeModal}
              aria-label="Close inventory"
              className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {/* PUBG-Style Visual 12-Slot Backpack Grid + Selected Item Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#37D6F4]">
                  Backpack Grid (Tap Slot to Inspect)
                </span>
                <span className="text-[11px] font-bold text-[#AAB8C8] tabular-nums">
                  {inventory.length}/{INVENTORY_SLOT_LIMIT} Used
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {slots.map((slot, idx) => {
                  if (!slot) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-24 rounded-xl border border-dashed border-white/12 bg-[#0D1B2A]/45 flex flex-col items-center justify-center text-[10px] text-white/25 font-semibold"
                      >
                        <span>Slot {idx + 1}</span>
                      </div>
                    );
                  }
                  const def = ITEM_BY_ID[slot.id];
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedId(slot.id)}
                      className={`relative h-24 rounded-xl border p-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${categoryTone(
                        def?.category
                      )} ${
                        isSelected
                          ? 'ring-2 ring-[#37D6F4] border-[#37D6F4] scale-[1.02]'
                          : 'hover:border-white/40'
                      }`}
                    >
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#07111F]/90 border border-white/15 text-[10px] font-mono font-extrabold text-[#37D6F4] tabular-nums">
                        x{slot.quantity}
                      </span>
                      {renderItemIcon(slot.id, 'w-7 h-7')}
                      <span className="text-[11px] font-bold text-[#F4F7FB] text-center leading-tight line-clamp-2">
                        {def?.name ?? slot.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Item Inspector */}
            <div className="lg:col-span-2 rounded-xl bg-[#07111F] border border-white/15 p-4 flex flex-col justify-between gap-4">
              {selectedSlot && selectedDef ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${categoryTone(
                          selectedDef.category
                        )}`}
                      >
                        {renderItemIcon(selectedSlot.id, 'w-8 h-8')}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#37D6F4]">
                          {selectedDef.category} · Held: x{selectedSlot.quantity}
                        </span>
                        <h3 className="text-base font-extrabold text-[#F4F7FB] leading-tight">
                          {selectedDef.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-[#AAB8C8] leading-relaxed">{selectedDef.shortDesc}</p>
                    <div className="rounded-lg bg-[#0D1B2A] border border-white/10 px-3 py-2 text-xs font-bold text-[#37D67A]">
                      Effect: {selectedDef.useEffectLabel}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedDef.usableInInventory && (
                      <button
                        onClick={() => useInventoryItem(selectedSlot.id)}
                        className="w-full py-2.5 rounded-xl bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F] font-extrabold text-xs cursor-pointer transition-colors"
                      >
                        {selectedDef.id === 'water-pack'
                          ? 'Drink Water Pack (+Hydration)'
                          : selectedDef.id === 'meal-pack' || selectedDef.id === 'fresh-crop'
                            ? 'Eat 1x Now (+Nutrition)'
                            : `Use 1x ${selectedDef.name}`}
                      </button>
                    )}

                    {isLockerStorable(selectedSlot.id) && (
                      <button
                        onClick={() => depositFoodToSharedStorage(selectedSlot.id, 1)}
                        className="w-full py-2 rounded-xl bg-[#37D67A]/20 hover:bg-[#37D67A]/30 border border-[#37D67A]/50 text-[#37D67A] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Store 1x in Shared Food Locker</span>
                      </button>
                    )}

                    <button
                      onClick={() => dropInventoryItem(selectedSlot.id)}
                      className="w-full py-2 rounded-xl bg-[#152A3E] hover:bg-[#1e3c58] border border-white/15 text-[#FFB84D] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Drop 1x on Habitat Floor</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-6">
                  <Package className="w-10 h-10 text-[#AAB8C8] mb-2" />
                  <p className="text-sm font-bold text-[#F4F7FB]">Backpack is Empty</p>
                  <p className="text-xs text-[#AAB8C8] mt-1">
                    Walk near glowing packs, harvest Greenhouse crops, or take food from the Shared Food Locker.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Simple Component Assembly */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-[#FFB84D]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#FFB84D]">
                Component Assembly Workbench
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ASSEMBLY_RECIPES.map((recipe) => {
                const canCraft = recipe.ingredients.every((ing) => qtyOf(ing.itemId) >= ing.qty);
                return (
                  <div
                    key={recipe.id}
                    className="rounded-xl bg-[#07111F] border border-white/10 p-3 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#F4F7FB]">{recipe.outputName}</p>
                      <p className="text-[11px] text-[#AAB8C8] mt-0.5">{recipe.description}</p>
                      <div className="mt-1.5 space-y-0.5 text-[10px]">
                        {recipe.ingredients.map((ing) => {
                          const held = qtyOf(ing.itemId);
                          const name = ITEM_BY_ID[ing.itemId]?.name ?? ing.itemId;
                          return (
                            <p
                              key={ing.itemId}
                              className={held >= ing.qty ? 'text-[#37D67A]' : 'text-[#FF5B68]'}
                            >
                              • {name}: {held}/{ing.qty}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => craftAssemblyRecipe(recipe.id)}
                      disabled={!canCraft}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold ${
                        canCraft
                          ? 'bg-[#FF7A3D] hover:bg-[#ff8f59] text-white cursor-pointer'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      Assemble
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

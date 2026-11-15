import { Backpack, Package, X } from 'lucide-react';
import { INVENTORY_SLOT_LIMIT, ITEM_BY_ID } from '../../data/items';
import { useGameStore } from '../../store/gameStore';

export default function InventoryModal() {
  const inventory = useGameStore((s) => s.inventory);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);
  const closeModal = useGameStore((s) => s.closeModal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Backpack className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">Crew Supply Inventory</h2>
              <p className="text-xs text-[#AAB8C8] tabular-nums">
                {inventory.length} / {INVENTORY_SLOT_LIMIT} item slots used · Walk to cabinets in 3D to collect more
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close inventory"
            className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {inventory.length === 0 ? (
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-8 text-center">
              <Package className="w-10 h-10 text-[#AAB8C8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F4F7FB]">Inventory is empty</p>
              <p className="text-xs text-[#AAB8C8] mt-1">
                Walk near glowing supply packs inside the module and press E to pick them up!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map((slot) => {
                const def = ITEM_BY_ID[slot.id];
                if (!def) return null;
                return (
                  <div
                    key={slot.id}
                    className="rounded-xl bg-[#07111F] border border-white/10 p-3.5 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#F4F7FB]">{def.name}</span>
                        <span className="text-xs font-mono font-bold text-[#37D6F4] tabular-nums">
                          x{slot.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-[#AAB8C8] mt-1">{def.shortDesc}</p>
                      <p className="text-[11px] font-semibold text-[#37D67A] mt-1">
                        {def.useEffectLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => useInventoryItem(slot.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        def.usableInInventory
                          ? 'bg-[#37D6F4] hover:bg-[#5ce1f8] text-[#07111F]'
                          : 'bg-[#152A3E] text-[#AAB8C8] border border-white/10'
                      }`}
                    >
                      {def.usableInInventory ? 'Use Item' : 'Used During Repairs'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, Minus, PackageCheck, Plus, Rocket, Sparkles } from 'lucide-react';
import { CARGO_LIMIT, GAME_ITEMS } from '../../data/items';
import { useGameStore } from '../../store/gameStore';

export default function LoadoutScreen() {
  const destination = useGameStore((s) => s.destination);
  const loadoutSelection = useGameStore((s) => s.loadoutSelection);
  const setLoadoutQty = useGameStore((s) => s.setLoadoutQty);
  const applyRecommendedLoadout = useGameStore((s) => s.applyRecommendedLoadout);
  const startMissionFromLoadout = useGameStore((s) => s.startMissionFromLoadout);
  const setMissionStatus = useGameStore((s) => s.setMissionStatus);

  const [replayIntro, setReplayIntro] = useState(true);

  const usedPoints = GAME_ITEMS.reduce(
    (sum, item) => sum + (loadoutSelection[item.id] || 0) * item.cargoCost,
    0
  );
  const totalUnits = GAME_ITEMS.reduce(
    (sum, item) => sum + (loadoutSelection[item.id] || 0),
    0
  );
  const remaining = CARGO_LIMIT - usedPoints;

  return (
    <div className="min-h-screen w-full bg-[#07111F] text-[#F4F7FB] flex flex-col">
      <header className="px-6 py-4 bg-[#0D1B2A] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMissionStatus('destination-select')}
            className="h-10 px-3 rounded-xl bg-[#152A3E] border border-white/15 hover:border-[#37D6F4] flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-[#F4F7FB]">
              Equipment Loadout · {destination === 'mars' ? 'Mars Outpost' : 'Lunar Outpost'}
            </h1>
            <p className="text-xs text-[#AAB8C8]">
              Pack mission supplies within your 17 Cargo Point payload limit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#07111F] border border-[#37D6F4]/40 px-4 py-2 text-xs tabular-nums">
            Cargo Points Used:{' '}
            <span className="font-extrabold text-[#37D6F4]">{usedPoints} / {CARGO_LIMIT}</span>
            <span className="text-[#AAB8C8] ml-2">({remaining} left · {totalUnits} items)</span>
          </div>
          <button
            onClick={applyRecommendedLoadout}
            className="h-10 px-4 rounded-xl bg-[#152A3E] hover:bg-[#1c3954] border border-[#37D67A]/50 text-xs font-bold text-[#37D67A] flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Recommended Loadout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {GAME_ITEMS.map((item) => {
            const qty = loadoutSelection[item.id] || 0;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#0D1B2A] border border-white/15 p-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#F4F7FB]">{item.name}</h2>
                    <span className="text-[11px] font-mono font-bold text-[#FFB84D]">
                      {item.cargoCost} pt{item.cargoCost > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[#AAB8C8]">{item.shortDesc}</p>
                  <p className="text-[11px] text-[#37D67A] font-semibold">{item.useEffectLabel}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setLoadoutQty(item.id, qty - 1)}
                    disabled={qty <= 0}
                    aria-label={`Remove ${item.name}`}
                    className="w-9 h-9 rounded-xl bg-[#152A3E] border border-white/15 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center text-sm font-extrabold tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setLoadoutQty(item.id, qty + 1)}
                    disabled={usedPoints + item.cargoCost > CARGO_LIMIT}
                    aria-label={`Add ${item.name}`}
                    className="w-9 h-9 rounded-xl bg-[#152A3E] border border-[#37D6F4]/40 flex items-center justify-center text-[#37D6F4] disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-[#0D1B2A] border border-white/15 p-5 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-[#AAB8C8] cursor-pointer">
            <input
              type="checkbox"
              checked={replayIntro}
              onChange={(e) => setReplayIntro(e.target.checked)}
              className="w-4 h-4 accent-[#37D6F4]"
            />
            <span>Play 4-Scene Earth Launch to {destination === 'mars' ? 'Mars' : 'Moon'} Landing Cinematic</span>
          </label>

          <button
            onClick={() => startMissionFromLoadout(replayIntro)}
            disabled={usedPoints > CARGO_LIMIT}
            className="px-7 py-3 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white font-extrabold text-sm flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Begin Mission</span>
            <Rocket className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

import { AlertTriangle, BookOpen, Check, Lock, X } from 'lucide-react';
import { ITEM_BY_ID } from '../../data/items';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { useGameStore } from '../../store/gameStore';
import { PlanId } from '../../types/game';

export default function PlanDecisionModal() {
  const emergency = useGameStore((s) => s.emergency);
  const inventory = useGameStore((s) => s.inventory);
  const chooseEmergencyPlan = useGameStore((s) => s.chooseEmergencyPlan);
  const openModal = useGameStore((s) => s.openModal);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!emergency) return null;
  const scenario = SCENARIO_BY_ID[emergency.scenarioId];
  if (!scenario) return null;

  const planIds: PlanId[] = ['A', 'B', 'C'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0D1B2A] border border-[#FFB84D]/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFB84D]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">{scenario.title}</h2>
              <p className="text-xs text-[#FFB84D]">
                When Plan A isn’t available or fails, switch to Plan B or Plan C!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('manual')}
              className="px-3 py-1.5 rounded-lg bg-[#0D1B2A] border border-[#37D6F4]/50 text-xs font-bold text-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Manual</span>
            </button>
            <button
              onClick={closeModal}
              aria-label="Close emergency plans"
              className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <p className="text-sm text-[#F4F7FB] bg-[#07111F] border border-white/10 rounded-xl p-4 leading-relaxed">
            {scenario.introStory}
          </p>

          <div className="grid grid-cols-1 gap-3">
            {planIds.map((pid) => {
              const plan = scenario.plans[pid];
              const reqItem = plan.requiredItemId ? ITEM_BY_ID[plan.requiredItemId] : null;
              const invCount = plan.requiredItemId
                ? inventory.find((i) => i.id === plan.requiredItemId)?.quantity ?? 0
                : 0;
              const hasRequired = !plan.requiredItemId || invCount >= (plan.requiredItemQty ?? 1);

              return (
                <div
                  key={pid}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    hasRequired
                      ? 'bg-[#152A3E] border-white/15 hover:border-[#37D6F4]/60'
                      : 'bg-[#07111F] border-white/10 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded ${
                          pid === 'A'
                            ? 'bg-[#37D6F4]/20 text-[#37D6F4]'
                            : pid === 'B'
                              ? 'bg-[#FFB84D]/20 text-[#FFB84D]'
                              : 'bg-[#37D67A]/20 text-[#37D67A]'
                        }`}
                      >
                        PLAN {pid}
                      </span>
                      <h3 className="text-sm font-bold text-[#F4F7FB]">{plan.title.replace(/^Plan [ABC]: /, '')}</h3>
                    </div>
                    <p className="text-xs text-[#AAB8C8]">{plan.description}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                      <span className="text-[#37D67A] font-semibold">Effect: {plan.effectSummary}</span>
                      {reqItem && (
                        <span className={hasRequired ? 'text-[#37D6F4]' : 'text-[#FF5B68]'}>
                          Requires: {reqItem.name} (In bag: {invCount})
                        </span>
                      )}
                      {plan.requiresPuzzle && (
                        <span className="text-[#FFB84D]">Includes hands-on repair puzzle</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => chooseEmergencyPlan(pid)}
                    disabled={!hasRequired}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      hasRequired
                        ? 'bg-[#FF7A3D] hover:bg-[#ff8f59] text-white'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {hasRequired ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{hasRequired ? `Execute Plan ${pid}` : `Need ${reqItem?.name}`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

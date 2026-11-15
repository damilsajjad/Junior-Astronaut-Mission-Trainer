import { AlertTriangle, Compass, Rocket, ShieldCheck } from 'lucide-react';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { useGameStore } from '../../store/gameStore';

export default function BriefingModal() {
  const destination = useGameStore((s) => s.destination);
  const emergency = useGameStore((s) => s.emergency);
  const beginActiveGameplay = useGameStore((s) => s.beginActiveGameplay);

  const scenario = emergency ? SCENARIO_BY_ID[emergency.scenarioId] : null;
  const isMars = destination === 'mars';

  return (
    <div className="min-h-screen w-full bg-[#07111F] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-[#152A3E] border-b border-white/10 flex items-center gap-3">
          <Rocket className="w-6 h-6 text-[#37D6F4]" />
          <div>
            <h1 className="text-xl font-extrabold text-[#F4F7FB]">
              Touchdown Confirmed · {isMars ? 'Mars Outpost' : 'Lunar Outpost'}
            </h1>
            <p className="text-xs text-[#37D6F4]">
              Commander Mission Briefing · Gravity {isMars ? '0.38g' : '0.16g'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#F4F7FB] leading-relaxed">
            Welcome inside your pressurized habitat module! Walk around with{' '}
            <span className="font-bold text-[#37D6F4]">WASD / Arrow Keys</span> (or click the floor),
            press <span className="font-bold text-[#37D6F4]">E</span> near machines to inspect or pick
            up crates, complete your <strong>Research Objective</strong>, and keep all 4 crew safe for 10 Sols.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#37D67A] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>3 Mission Objectives</span>
              </div>
              <p className="text-xs text-[#AAB8C8]">
                1) Restore & maintain all 9 life-support machines, 2) Reach 100% Research, 3) Survive to End of Sol 10!
              </p>
            </div>
            <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFB84D] mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Incoming Situation</span>
              </div>
              <p className="text-xs text-[#AAB8C8]">
                {scenario?.title}: {scenario?.introStory}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#152A3E] border border-white/10 p-3.5 flex items-center gap-3 text-xs text-[#F4F7FB]">
            <Compass className="w-5 h-5 text-[#37D6F4] shrink-0" />
            <span>
              Tip: Press <strong>M</strong> anytime for the Repair Manual, <strong>I</strong> for Inventory, <strong>Tab</strong> for Mission Control, or switch to <strong>Exterior 360° View</strong> to orbit your landed craft!
            </span>
          </div>

          <button
            onClick={beginActiveGameplay}
            className="w-full py-3.5 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white font-extrabold text-sm tracking-wide cursor-pointer shadow-lg"
          >
            ENTER HABITAT INTERIOR →
          </button>
        </div>
      </div>
    </div>
  );
}

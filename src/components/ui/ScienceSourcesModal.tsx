import { ExternalLink, Globe, Info, X } from 'lucide-react';
import { NASA_SCIENCE_SOURCES, SIMULATION_ASSUMPTIONS_LIST } from '../../data/scienceSources';
import { useGameStore } from '../../store/gameStore';

export default function ScienceSourcesModal() {
  const closeModal = useGameStore((s) => s.closeModal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#37D6F4]" />
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FB]">NASA Science & Sources</h2>
              <p className="text-xs text-[#AAB8C8]">
                Distinguishing real NASA spaceflight facts from simplified game balance rules
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            aria-label="Close science sources"
            className="w-9 h-9 rounded-xl bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#37D6F4] mb-3">
              Curated NASA Educational References
            </h3>
            <div className="space-y-2.5">
              {NASA_SCIENCE_SOURCES.map((src) => (
                <div
                  key={src.url}
                  className="rounded-xl bg-[#07111F] border border-white/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#F4F7FB]">{src.title}</p>
                    <p className="text-xs text-[#37D67A]">Supports: {src.gameFeature}</p>
                    <p className="text-xs text-[#AAB8C8]">{src.factSummary}</p>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#152A3E] border border-white/15 text-xs font-semibold text-[#37D6F4] hover:border-[#37D6F4] flex items-center gap-1.5 shrink-0"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFB84D] mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>Simplified Game Rules & Assumptions</span>
            </h3>
            <div className="space-y-2">
              {SIMULATION_ASSUMPTIONS_LIST.map((item) => (
                <div
                  key={item.rule}
                  className="rounded-xl bg-[#07111F] border border-white/10 p-3 text-xs"
                >
                  <p className="font-bold text-[#F4F7FB]">{item.rule}</p>
                  <p className="text-[#AAB8C8] mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#AAB8C8] text-center pt-1">
            ORBITAL SURVIVAL is an independent educational game aligned with the NASA Space Apps Challenge “Build a Junior Astronaut Mission Trainer” and does not imply NASA endorsement.
          </p>
        </div>
      </div>
    </div>
  );
}

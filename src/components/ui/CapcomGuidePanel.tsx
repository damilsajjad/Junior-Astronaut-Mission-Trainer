import { useGameStore } from '../../store/gameStore';

export function RobotAvatarSvg({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="14" y="16" width="36" height="28" rx="12" fill="#DCE9F7" stroke="#37D6F4" strokeWidth="2.5" />
      <line x1="32" y1="7" x2="32" y2="16" stroke="#37D6F4" strokeWidth="2.5" />
      <circle cx="32" cy="6" r="3.5" fill="#37D6F4" />
      <rect x="20" y="23" width="24" height="14" rx="6" fill="#0B192C" />
      <circle cx="27" cy="30" r="2.6" fill="#37D6F4" />
      <circle cx="37" cy="30" r="2.6" fill="#37D6F4" />
      <path d="M28 34.5 Q32 37 36 34.5" stroke="#37D6F4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="20" y="46" width="24" height="12" rx="6" fill="#B8CEE3" />
      <circle cx="32" cy="52" r="3" fill="#37D6F4" />
    </svg>
  );
}

export default function CapcomGuidePanel({ compact: _compact = false }: { compact?: boolean }) {
  const capcomMessage = useGameStore((s) => s.capcomMessage);

  return (
    <div className="mc-capcom-panel rounded-2xl bg-[#0D1B2A]/95 border border-white/15 p-3.5 flex flex-col gap-2.5 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="mc-capcom-title text-xs font-extrabold tracking-wider uppercase text-[#F4F7FB]">
          Mission Guide
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <RobotAvatarSvg className="w-12 h-12 shrink-0" />
        <div className="mc-capcom-bubble rounded-xl bg-[#DCE9F7] text-[#0D1B2A] px-3 py-2 text-xs font-semibold leading-snug shadow-sm">
          {capcomMessage}
        </div>
      </div>
    </div>
  );
}

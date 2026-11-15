import {
  Award,
  BookOpen,
  Compass,
  HelpCircle,
  Play,
  Rocket,
  Settings,
  Shield,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import CapcomGuidePanel from '../ui/CapcomGuidePanel';

export default function MissionSelectScreen() {
  const destination = useGameStore((s) => s.destination);
  const difficulty = useGameStore((s) => s.difficulty);
  const savedProgress = useGameStore((s) => s.savedProgress);
  const savedMission = useGameStore((s) => s.savedMission);
  const exitNotice = useGameStore((s) => s.exitNotice);
  const selectDestination = useGameStore((s) => s.selectDestination);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setMissionStatus = useGameStore((s) => s.setMissionStatus);
  const startPracticePuzzle = useGameStore((s) => s.startPracticePuzzle);
  const resumeSavedMission = useGameStore((s) => s.resumeSavedMission);
  const dismissExitNotice = useGameStore((s) => s.dismissExitNotice);
  const openModal = useGameStore((s) => s.openModal);
  const toggleMute = useGameStore((s) => s.toggleMute);

  const isMars = destination === 'mars';

  return (
    <div className="relative min-h-screen w-full bg-[#07111F] text-[#F4F7FB] overflow-x-hidden flex flex-col">
      {/* Atmospheric Martian / Space Horizon Backdrop matching Home Reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 72% 28%, rgba(255, 122, 61, 0.34) 0%, rgba(164, 62, 34, 0.28) 26%, rgba(13, 27, 42, 0.92) 60%, #07111F 100%), linear-gradient(180deg, #07111F 0%, #1b1720 55%, #4a2318 100%)',
        }}
      />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-white/10 bg-[#0D1B2A]/85">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7A3D] to-[#37D6F4] p-[1.5px]">
            <div className="w-full h-full rounded-[10px] bg-[#07111F] flex items-center justify-center">
              <Rocket className="w-5 h-5 text-[#FF7A3D]" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-[#F4F7FB] leading-tight">
              ASTRO-CADET · ORBITAL SURVIVAL
            </h1>
            <p className="text-[11px] font-semibold text-[#FFB84D] tracking-wider uppercase">
              Junior Astronaut Mission Trainer
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#07111F]/90 border border-white/15 px-4 py-2 text-center">
          <p className="text-xs font-extrabold tracking-wider uppercase text-[#F4F7FB]">
            Mission Select: Active Cadet Training
          </p>
          <div className="mt-1 flex items-center justify-center gap-2 text-[11px]">
            <button
              onClick={() => setDifficulty('cadet')}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                difficulty === 'cadet'
                  ? 'bg-[#37D6F4] text-[#07111F]'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              Cadet Mode (Ages 7–12)
            </button>
            <button
              onClick={() => setDifficulty('commander')}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer ${
                difficulty === 'commander'
                  ? 'bg-[#FF7A3D] text-white'
                  : 'text-[#AAB8C8] hover:text-white'
              }`}
            >
              Commander Mode
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('science')}
            title="NASA Science & Sources"
            aria-label="Open NASA Science and Sources"
            className="h-10 px-3 rounded-xl bg-[#152A3E] border border-white/15 hover:border-[#37D6F4] flex items-center gap-1.5 text-xs font-bold text-[#F4F7FB] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#37D6F4]" />
            <span className="hidden sm:inline">Science</span>
          </button>
          <button
            onClick={toggleMute}
            aria-label={savedProgress.muted ? 'Unmute audio' : 'Mute audio'}
            className="h-10 w-10 rounded-xl bg-[#152A3E] border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer"
          >
            {savedProgress.muted ? (
              <VolumeX className="w-4 h-4 text-[#AAB8C8]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#37D6F4]" />
            )}
          </button>
          <button
            onClick={() => openModal('settings')}
            aria-label="Open settings"
            className="h-10 w-10 rounded-xl bg-[#152A3E] border border-white/15 hover:border-[#37D6F4] flex items-center justify-center cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#F4F7FB]" />
          </button>
        </div>
      </header>

      {/* Browser-Safe Exit & Save Banner */}
      {exitNotice && (
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-5 pt-4">
          <div className="rounded-2xl bg-[#0D1B2A]/95 border border-[#37D67A]/55 px-4 py-3 flex items-center justify-between gap-3 shadow-xl">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-extrabold text-[#37D67A]">
                {exitNotice.saved && exitNotice.sol
                  ? `Mission Progress Saved (Sol ${exitNotice.sol} · ${exitNotice.destination === 'mars' ? 'Mars Outpost' : 'Lunar Outpost'})`
                  : 'Settings & Cadet Progress Saved'}
              </p>
              <p className="text-[11px] sm:text-xs text-[#AAB8C8]">
                Browser tabs cannot be closed automatically by scripts. You can safely close this tab (Ctrl+W / ⌘+W) or continue from the Main Menu below.
              </p>
            </div>
            <button
              onClick={dismissExitNotice}
              aria-label="Dismiss exit notice"
              className="w-8 h-8 rounded-lg bg-[#152A3E] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Column Mission Control Grid */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[260px_1fr_290px] gap-4 items-start">
        {/* LEFT COLUMN: Member Status + Current Status */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-4 space-y-3.5 shadow-xl">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#AAB8C8]">
              Member Status
            </h2>
            <div className="rounded-xl bg-[#152A3E] border border-[#37D6F4]/30 py-1.5 text-center text-xs font-extrabold tracking-wider text-[#37D6F4]">
              CADET STATUS
            </div>

            <div className="flex items-center gap-3">
              {/* Stylized Original Cadet SVG Portrait */}
              <div className="w-16 h-16 rounded-xl bg-[#152A3E] border border-[#37D6F4]/40 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
                  <circle cx="32" cy="28" r="16" fill="#E2E8F0" stroke="#37D6F4" strokeWidth="2" />
                  <rect x="21" y="21" width="22" height="12" rx="5" fill="#0D1B2A" />
                  <circle cx="27" cy="27" r="2" fill="#37D6F4" />
                  <circle cx="37" cy="27" r="2" fill="#37D6F4" />
                  <path d="M16 54 C16 44 48 44 48 54" fill="#FF7A3D" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#AAB8C8]">Best Score</p>
                <p className="text-2xl font-extrabold text-[#F4F7FB] tabular-nums">
                  {savedProgress.bestScore.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#37D67A] font-semibold tabular-nums">
                  {savedProgress.completedMissions} missions cleared
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#AAB8C8] mb-2">
                Achievements ({savedProgress.unlockedAchievements.length}/5)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {savedProgress.unlockedAchievements.slice(0, 4).map((badge) => (
                  <div
                    key={badge}
                    className="rounded-xl bg-[#07111F] border border-[#37D6F4]/30 p-2 text-center"
                  >
                    <Award className="w-5 h-5 text-[#FFB84D] mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-[#F4F7FB] leading-tight">{badge}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-4 space-y-2 shadow-xl">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#AAB8C8]">
              Current Status
            </h2>
            <p className="text-xs font-bold text-[#F4F7FB]">
              CURRENT RANK: <span className="text-[#37D67A]">CADET TRAINEE</span>
            </p>
            <p className="text-xs font-bold text-[#FFB84D]">
              [ALERT] {isMars ? 'MARS DUST STORM' : 'LUNAR SOLAR FLARE'}
            </p>
            <p className="text-xs font-semibold text-[#AAB8C8]">
              ATMOSPHERE: {isMars ? 'CO₂ RICH · 0.38g' : 'VACUUM · 0.16g'}
            </p>
          </div>
        </aside>

        {/* CENTER COLUMN: Mission Cards + Academy Practice + Primary CTA */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Mission 01: Moon */}
            <div
              onClick={() => selectDestination('moon')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && selectDestination('moon')}
              className={`rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer border ${
                !isMars
                  ? 'bg-[#0D1B2A]/95 border-[#37D6F4] ring-2 ring-[#37D6F4]/35 shadow-xl'
                  : 'bg-[#0D1B2A]/85 border-white/15 hover:border-[#37D6F4]/60'
              }`}
            >
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#37D6F4]">
                  [Mission 01: The Moon · Lunar Survival]
                </p>
                <div className="relative h-24 rounded-xl overflow-hidden border border-white/10 bg-[#07111F]">
                  <img
                    src="/assets/aistudio/Moon_Module_01f7b5ea.jpeg"
                    alt="Lunar Outpost Habitat Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#37D67A]">PLAYABLE · TUTORIAL READY</p>
                  <p className="text-[#AAB8C8]">Difficulty: 1/3 Stars</p>
                  <p className="text-[#AAB8C8] tabular-nums">Gravity: 0.16g · Radiation Alert</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectDestination('moon');
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                  !isMars
                    ? 'bg-[#37D6F4] text-[#07111F]'
                    : 'bg-[#152A3E] text-[#F4F7FB] border border-white/15'
                }`}
              >
                {!isMars ? 'SELECTED: MOON' : 'SELECT MOON'}
              </button>
            </div>

            {/* Mission 02: Mars */}
            <div
              onClick={() => selectDestination('mars')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && selectDestination('mars')}
              className={`rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer border ${
                isMars
                  ? 'bg-[#0D1B2A]/95 border-[#FF7A3D] ring-2 ring-[#FF7A3D]/35 shadow-xl'
                  : 'bg-[#0D1B2A]/85 border-white/15 hover:border-[#FF7A3D]/60'
              }`}
            >
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#FFB84D]">
                  [Mission 02: The Mars · Dust Storm]
                </p>
                <div className="relative h-24 rounded-xl overflow-hidden border border-white/10 bg-[#07111F]">
                  <img
                    src="/assets/aistudio/Mars_Module_1b294b3d.jpeg"
                    alt="Mars Outpost Habitat Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#FF7A3D]">HAZARD: HIGH · DUST STORM</p>
                  <p className="text-[#AAB8C8]">Difficulty: 2/3 Stars</p>
                  <p className="text-[#AAB8C8] tabular-nums">Gravity: 0.38g · Solar Drop</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectDestination('mars');
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                  isMars
                    ? 'bg-[#FF7A3D] text-white'
                    : 'bg-[#152A3E] text-[#F4F7FB] border border-white/15'
                }`}
              >
                {isMars ? 'SELECTED: MARS' : 'SELECT MARS'}
              </button>
            </div>

            {/* Mission 03: Systems & Contingency Info */}
            <div className="rounded-2xl p-3.5 bg-[#0D1B2A]/88 border border-white/15 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#AAB8C8]">
                  [Mission 03: Life Support & Hull]
                </p>
                <div className="h-24 rounded-xl bg-[#07111F] border border-white/10 flex flex-col items-center justify-center p-2 text-center">
                  <Compass className="w-7 h-7 text-[#37D6F4] mb-1" />
                  <p className="text-[11px] font-bold text-[#F4F7FB]">
                    O₂, CO₂ & Hull Breach Drills
                  </p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#37D6F4]">DYNAMIC SOLS 1–10</p>
                  <p className="text-[#AAB8C8]">9 Dynamic Emergencies & Research</p>
                </div>
              </div>
              <button
                onClick={() => openModal('manual')}
                className="w-full py-2 rounded-xl bg-[#152A3E] hover:bg-[#1b3650] border border-white/15 text-xs font-bold text-[#37D6F4] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>READ REPAIR MANUAL</span>
              </button>
            </div>
          </div>

          {/* Academy Training / Systems Practice */}
          <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-4 space-y-3 shadow-xl">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#F4F7FB]">
              Academy Training / Systems Practice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#37D6F4]/15 border border-[#37D6F4]/40 flex items-center justify-center text-[#37D6F4] shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F4F7FB]">POWER SYSTEMS SIMULATION</p>
                    <p className="text-[11px] text-[#AAB8C8]">Color-coded circuit puzzle</p>
                  </div>
                </div>
                <button
                  onClick={() => startPracticePuzzle('circuit-reconnect')}
                  className="px-3 py-2 rounded-xl bg-[#152A3E] hover:bg-[#1e3a56] border border-[#37D6F4]/40 text-xs font-bold text-[#37D6F4] cursor-pointer whitespace-nowrap"
                >
                  START TRAINING
                </button>
              </div>

              <div className="rounded-xl bg-[#07111F] border border-white/10 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB84D]/15 border border-[#FFB84D]/40 flex items-center justify-center text-[#FFB84D] shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F4F7FB]">CO₂ FILTER PROTOCOLS</p>
                    <p className="text-[11px] text-[#AAB8C8]">Apollo 13 adapter assembly</p>
                  </div>
                </div>
                <button
                  onClick={() => startPracticePuzzle('co2-filter-adapter')}
                  className="px-3 py-2 rounded-xl bg-[#152A3E] hover:bg-[#1e3a56] border border-[#FFB84D]/40 text-xs font-bold text-[#FFB84D] cursor-pointer whitespace-nowrap"
                >
                  START TRAINING
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Mission Progress & Primary CTA Strip matching Home Pic */}
          <div className="rounded-2xl bg-[#0D1B2A]/95 border border-white/15 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#AAB8C8]">
                Mission Readiness
              </p>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-full bg-[#37D67A]" />
                </div>
                <span className="text-xs font-bold text-[#37D67A]">ASTRONAUT HEALTH: 100%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {savedMission && (
                <button
                  onClick={resumeSavedMission}
                  className="px-4 py-3 rounded-xl bg-[#37D67A] hover:bg-[#4ee08c] text-[#07111F] text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    RESUME SAVED (SOL {savedMission.sol} · {savedMission.destination === 'mars' ? 'MARS' : 'MOON'})
                  </span>
                </button>
              )}
              <button
                onClick={() => setMissionStatus('loadout')}
                className="px-6 py-3 rounded-xl bg-[#152A3E] hover:bg-[#1c3954] border-2 border-[#37D6F4] text-sm font-extrabold text-[#F4F7FB] shadow-[0_0_20px_rgba(55,214,244,0.28)] flex items-center gap-2 cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 text-[#37D6F4]" />
                <span>GO TO EQUIPMENT LOADOUT</span>
              </button>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-[#F4F7FB] tabular-nums">
                TARGET: {isMars ? 'MARS' : 'MOON'}
              </p>
              <p className="text-[11px] text-[#37D6F4] font-semibold">4 Crew · 10 Sols</p>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: CAPCOM Mission Guide + Science + Launch */}
        <aside className="space-y-4">
          <CapcomGuidePanel />

          <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 p-3.5 space-y-2.5 shadow-xl">
            <button
              onClick={() => openModal('science')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#07111F] border border-[#FFB84D]/40 text-xs font-bold text-[#FFB84D] hover:bg-[#152A3E] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>NASA SCIENCE & SOURCES</span>
            </button>
            <button
              onClick={() => setMissionStatus('loadout')}
              className="w-full py-3 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8f59] text-white text-sm font-extrabold tracking-wide cursor-pointer shadow-lg transition-colors"
            >
              LAUNCH SIMULATION →
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

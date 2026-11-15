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
import marsHorizonBg from '../../assets/images/mars_horizon_bg_1794735682910.jpg';
import moonHorizonBg from '../../assets/images/moon_horizon_bg_1794735682983.jpg';
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
    <div className="homepage-theme relative min-h-screen w-full bg-[#101923] text-[#F2F3F4] overflow-x-hidden flex flex-col">
      {/* Cinematic Planetary Horizon Backdrop (Mars / Moon + Deep Space) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#101923]">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            isMars ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${marsHorizonBg})` }}
        />
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            !isMars ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${moonHorizonBg})` }}
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: isMars
              ? 'linear-gradient(180deg, rgba(16, 25, 35, 0.62) 0%, rgba(23, 25, 28, 0.34) 44%, rgba(73, 49, 38, 0.45) 78%, rgba(16, 25, 35, 0.82) 100%), radial-gradient(circle at 75% 25%, rgba(228, 119, 62, 0.14) 0%, transparent 55%)'
              : 'linear-gradient(180deg, rgba(16, 25, 35, 0.65) 0%, rgba(23, 25, 28, 0.36) 46%, rgba(37, 43, 51, 0.48) 78%, rgba(16, 25, 35, 0.84) 100%), radial-gradient(circle at 50% 24%, rgba(169, 220, 235, 0.12) 0%, transparent 55%)',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="mc-topbar relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E4773E] via-[#B96E46] to-[#53D4E6] p-[1.5px] shadow-md">
            <div className="w-full h-full rounded-[10px] bg-[#17191C] flex items-center justify-center">
              <Rocket className="w-5 h-5 text-[#E4773E]" />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-[#F2F3F4] leading-tight">
              ASTRO-CADET · ORBITAL SURVIVAL
            </h1>
            <p className="text-[11px] font-semibold text-[#FFB547] tracking-wider uppercase">
              Junior Astronaut Mission Trainer
            </p>
          </div>
        </div>

        <div className="mc-subpanel rounded-xl px-4 py-2 text-center">
          <p className="text-xs font-extrabold tracking-wider uppercase text-[#F2F3F4]">
            Mission Select: Active Cadet Training
          </p>
          <div className="mt-1 flex items-center justify-center gap-2 text-[11px]">
            <button
              onClick={() => setDifficulty('cadet')}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                difficulty === 'cadet'
                  ? 'bg-[#53D4E6] text-[#101923]'
                  : 'text-[#C3CBD2] hover:text-[#F2F3F4]'
              }`}
            >
              Cadet Mode (Ages 7–12)
            </button>
            <button
              onClick={() => setDifficulty('commander')}
              className={`px-2.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                difficulty === 'commander'
                  ? 'bg-[#E4773E] text-[#F2F3F4]'
                  : 'text-[#C3CBD2] hover:text-[#F2F3F4]'
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
            className="mc-btn-metallic h-10 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#F2F3F4] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#53D4E6]" />
            <span className="hidden sm:inline">Science</span>
          </button>
          <button
            onClick={toggleMute}
            aria-label={savedProgress.muted ? 'Unmute audio' : 'Mute audio'}
            className="mc-btn-metallic h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer"
          >
            {savedProgress.muted ? (
              <VolumeX className="w-4 h-4 text-[#929DA8]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#53D4E6]" />
            )}
          </button>
          <button
            onClick={() => openModal('settings')}
            aria-label="Open settings"
            className="mc-btn-metallic h-10 w-10 rounded-xl flex items-center justify-center cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#F2F3F4]" />
          </button>
        </div>
      </header>

      {/* Browser-Safe Exit & Save Banner */}
      {exitNotice && (
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-5 pt-4">
          <div className="mc-panel rounded-2xl border-[#53C978]/50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-extrabold text-[#53C978]">
                {exitNotice.saved && exitNotice.sol
                  ? `Mission Progress Saved (Sol ${exitNotice.sol} · ${exitNotice.destination === 'mars' ? 'Mars Outpost' : 'Lunar Outpost'})`
                  : 'Settings & Cadet Progress Saved'}
              </p>
              <p className="text-[11px] sm:text-xs text-[#C3CBD2]">
                Browser tabs cannot be closed automatically by scripts. You can safely close this tab (Ctrl+W / ⌘+W) or continue from the Main Menu below.
              </p>
            </div>
            <button
              onClick={dismissExitNotice}
              aria-label="Dismiss exit notice"
              className="mc-btn-metallic w-8 h-8 rounded-lg flex items-center justify-center text-[#C3CBD2] hover:text-[#F2F3F4] cursor-pointer shrink-0"
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
          <div className="mc-panel rounded-2xl p-4 space-y-3.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#C3CBD2]">
              Member Status
            </h2>
            <div className="rounded-xl bg-[#252B33]/85 border border-[#53D4E6]/35 py-1.5 text-center text-xs font-extrabold tracking-wider text-[#A9DCEB]">
              CADET STATUS
            </div>

            <div className="flex items-center gap-3">
              {/* Stylized Original Cadet SVG Portrait */}
              <div className="w-16 h-16 rounded-xl bg-[#17191C]/90 border border-[#53D4E6]/35 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
                  <circle cx="32" cy="28" r="16" fill="#E5E9EE" stroke="#A9DCEB" strokeWidth="2" />
                  <rect x="21" y="21" width="22" height="12" rx="5" fill="#17191C" />
                  <circle cx="27" cy="27" r="2" fill="#53D4E6" />
                  <circle cx="37" cy="27" r="2" fill="#53D4E6" />
                  <path d="M16 54 C16 44 48 44 48 54" fill="#E4773E" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#C3CBD2]">Best Score</p>
                <p className="text-2xl font-extrabold text-[#F2F3F4] tabular-nums">
                  {savedProgress.bestScore.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#53C978] font-semibold tabular-nums">
                  {savedProgress.completedMissions} missions cleared
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C3CBD2] mb-2">
                Achievements ({savedProgress.unlockedAchievements.length}/5)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {savedProgress.unlockedAchievements.slice(0, 4).map((badge) => (
                  <div
                    key={badge}
                    className="mc-subpanel rounded-xl border-[#B96E46]/35 p-2 text-center"
                  >
                    <Award className="w-5 h-5 text-[#FFB547] mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-[#F2F3F4] leading-tight">{badge}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mc-panel rounded-2xl p-4 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#C3CBD2]">
              Current Status
            </h2>
            <p className="text-xs font-bold text-[#F2F3F4]">
              CURRENT RANK: <span className="text-[#53C978]">CADET TRAINEE</span>
            </p>
            <p className="text-xs font-bold text-[#FFB547]">
              [ALERT] {isMars ? 'MARS DUST STORM' : 'LUNAR SOLAR FLARE'}
            </p>
            <p className="text-xs font-semibold text-[#929DA8]">
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
              className={`rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                !isMars ? 'mc-card-moon-active' : 'mc-card-inactive hover:border-[#53D4E6]/50'
              }`}
            >
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#A9DCEB]">
                  [Mission 01: The Moon · Lunar Survival]
                </p>
                <div className="relative h-24 rounded-xl overflow-hidden border border-[#C3CBD2]/15 bg-[#17191C]">
                  <img
                    src="/assets/aistudio/Moon_Module_01f7b5ea.jpeg"
                    alt="Lunar Outpost Habitat Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#53C978]">PLAYABLE · TUTORIAL READY</p>
                  <p className="text-[#C3CBD2]">Difficulty: 1/3 Stars</p>
                  <p className="text-[#929DA8] tabular-nums">Gravity: 0.16g · Radiation Alert</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectDestination('moon');
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  !isMars
                    ? 'bg-[#53D4E6] text-[#101923] shadow-sm hover:brightness-105'
                    : 'mc-btn-metallic'
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
              className={`rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                isMars ? 'mc-card-mars-active' : 'mc-card-inactive hover:border-[#E4773E]/55'
              }`}
            >
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#FFB547]">
                  [Mission 02: The Mars · Dust Storm]
                </p>
                <div className="relative h-24 rounded-xl overflow-hidden border border-[#C3CBD2]/15 bg-[#17191C]">
                  <img
                    src="/assets/aistudio/Mars_Module_1b294b3d.jpeg"
                    alt="Mars Outpost Habitat Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#E4773E]">HAZARD: HIGH · DUST STORM</p>
                  <p className="text-[#C3CBD2]">Difficulty: 2/3 Stars</p>
                  <p className="text-[#929DA8] tabular-nums">Gravity: 0.38g · Solar Drop</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectDestination('mars');
                }}
                className={`w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  isMars ? 'mc-btn-orange' : 'mc-btn-metallic'
                }`}
              >
                {isMars ? 'SELECTED: MARS' : 'SELECT MARS'}
              </button>
            </div>

            {/* Mission 03: Systems & Contingency Info */}
            <div className="mc-card-inactive rounded-2xl p-3.5 flex flex-col justify-between gap-3">
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#C3CBD2]">
                  [Mission 03: Life Support & Hull]
                </p>
                <div className="mc-subpanel h-24 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <Compass className="w-7 h-7 text-[#53D4E6] mb-1" />
                  <p className="text-[11px] font-bold text-[#F2F3F4]">
                    O₂, CO₂ & Hull Breach Drills
                  </p>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[#55BFCB]">DYNAMIC SOLS 1–10</p>
                  <p className="text-[#929DA8]">9 Dynamic Emergencies & Research</p>
                </div>
              </div>
              <button
                onClick={() => openModal('manual')}
                className="mc-btn-metallic w-full py-2 rounded-xl text-xs font-bold text-[#A9DCEB] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#53D4E6]" />
                <span>READ REPAIR MANUAL</span>
              </button>
            </div>
          </div>

          {/* Academy Training / Systems Practice */}
          <div className="mc-panel rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#F2F3F4]">
              Academy Training / Systems Practice
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="mc-subpanel rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#53D4E6]/12 border border-[#53D4E6]/35 flex items-center justify-center text-[#53D4E6] shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F2F3F4]">POWER SYSTEMS SIMULATION</p>
                    <p className="text-[11px] text-[#929DA8]">Color-coded circuit puzzle</p>
                  </div>
                </div>
                <button
                  onClick={() => startPracticePuzzle('circuit-reconnect')}
                  className="mc-btn-metallic px-3 py-2 rounded-xl border-[#53D4E6]/40 text-xs font-bold text-[#A9DCEB] cursor-pointer whitespace-nowrap"
                >
                  START TRAINING
                </button>
              </div>

              <div className="mc-subpanel rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#B96E46]/18 border border-[#FFB547]/40 flex items-center justify-center text-[#FFB547] shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F2F3F4]">CO₂ FILTER PROTOCOLS</p>
                    <p className="text-[11px] text-[#929DA8]">Apollo 13 adapter assembly</p>
                  </div>
                </div>
                <button
                  onClick={() => startPracticePuzzle('co2-filter-adapter')}
                  className="mc-btn-metallic px-3 py-2 rounded-xl border-[#B96E46]/50 text-xs font-bold text-[#FFB547] cursor-pointer whitespace-nowrap"
                >
                  START TRAINING
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Mission Progress & Primary CTA Strip */}
          <div className="mc-panel rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#C3CBD2]">
                Mission Readiness
              </p>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 rounded-full bg-[#F2F3F4]/12 overflow-hidden">
                  <div className="h-full w-full bg-[#53C978]" />
                </div>
                <span className="text-xs font-bold text-[#53C978]">ASTRONAUT HEALTH: 100%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {savedMission && (
                <button
                  onClick={resumeSavedMission}
                  className="px-4 py-3 rounded-xl bg-[#53C978] hover:brightness-105 text-[#101923] text-xs sm:text-sm font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    RESUME SAVED (SOL {savedMission.sol} · {savedMission.destination === 'mars' ? 'MARS' : 'MOON'})
                  </span>
                </button>
              )}
              <button
                onClick={() => setMissionStatus('loadout')}
                className="mc-btn-cyan px-6 py-3 rounded-xl text-sm font-extrabold flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#53D4E6]" />
                <span>GO TO EQUIPMENT LOADOUT</span>
              </button>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-[#F2F3F4] tabular-nums">
                TARGET: {isMars ? 'MARS' : 'MOON'}
              </p>
              <p className="text-[11px] text-[#A9DCEB] font-semibold">4 Crew · 10 Sols</p>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: CAPCOM Mission Guide + Science + Launch */}
        <aside className="space-y-4">
          <CapcomGuidePanel />

          <div className="mc-panel rounded-2xl p-3.5 space-y-2.5">
            <button
              onClick={() => openModal('science')}
              className="mc-btn-metallic w-full py-2.5 px-3 rounded-xl border-[#B96E46]/45 text-xs font-bold text-[#FFB547] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>NASA SCIENCE & SOURCES</span>
            </button>
            <button
              onClick={() => setMissionStatus('loadout')}
              className="mc-btn-orange w-full py-3 rounded-xl text-sm font-extrabold tracking-wide cursor-pointer"
            >
              LAUNCH SIMULATION →
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

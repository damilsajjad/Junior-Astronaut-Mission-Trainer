import { useEffect } from 'react';
import CircuitPuzzle from './components/puzzles/CircuitPuzzle';
import DiagnosticPuzzle from './components/puzzles/DiagnosticPuzzle';
import FilterAdapterPuzzle from './components/puzzles/FilterAdapterPuzzle';
import HullPatchPuzzle from './components/puzzles/HullPatchPuzzle';
import CinematicCanvas from './components/scene/CinematicCanvas';
import BriefingModal from './components/screens/BriefingModal';
import GameplayHUD from './components/screens/GameplayHUD';
import LoadoutScreen from './components/screens/LoadoutScreen';
import MissionSelectScreen from './components/screens/MissionSelectScreen';
import DebriefModal from './components/ui/DebriefModal';
import InventoryModal from './components/ui/InventoryModal';
import MissionControlModal from './components/ui/MissionControlModal';
import PlanDecisionModal from './components/ui/PlanDecisionModal';
import RepairManualModal from './components/ui/RepairManualModal';
import ScienceSourcesModal from './components/ui/ScienceSourcesModal';
import SettingsPauseModal from './components/ui/SettingsPauseModal';
import StationInspectModal from './components/ui/StationInspectModal';
import { useGameStore } from './store/gameStore';
import { MusicTrack, syncMusic } from './utils/sound';

export default function App() {
  const missionStatus = useGameStore((s) => s.missionStatus);
  const activeModal = useGameStore((s) => s.activeModal);
  const activePuzzle = useGameStore((s) => s.activePuzzle);
  const puzzlePaused = useGameStore((s) => s.puzzlePaused);
  const reducedMotion = useGameStore((s) => s.savedProgress.reducedMotion);
  const musicMuted = useGameStore((s) => s.savedProgress.musicMuted);
  const musicVolume = useGameStore((s) => s.savedProgress.musicVolume);

  useEffect(() => {
    const isMissionStage =
      missionStatus === 'active' ||
      missionStatus === 'paused' ||
      missionStatus === 'rescue-cinematic' ||
      missionStatus === 'success' ||
      missionStatus === 'safety-protocol';

    const track: MusicTrack = isMissionStage ? 'mission' : 'menu';
    syncMusic(track, {
      musicMuted: musicMuted ?? false,
      musicVolume: musicVolume ?? 0.35,
    });
  }, [missionStatus, musicMuted, musicVolume]);

  return (
    <div className={reducedMotion ? 'reduced-motion min-h-screen' : 'min-h-screen'}>
      {(missionStatus === 'title' || missionStatus === 'destination-select') && (
        <MissionSelectScreen />
      )}

      {missionStatus === 'loadout' && <LoadoutScreen />}

      {missionStatus === 'intro' && <CinematicCanvas mode="intro" />}

      {missionStatus === 'rescue-cinematic' && <CinematicCanvas mode="rescue" />}

      {missionStatus === 'briefing' && <BriefingModal />}

      {(missionStatus === 'active' ||
        missionStatus === 'paused' ||
        missionStatus === 'success' ||
        missionStatus === 'safety-protocol') && <GameplayHUD />}

      {/* Modals */}
      {activeModal === 'inventory' && <InventoryModal />}
      {activeModal === 'manual' && <RepairManualModal />}
      {(activeModal === 'dashboard' || activeModal === 'end-day-report') && <MissionControlModal />}
      {activeModal === 'station-inspect' && <StationInspectModal />}
      {activeModal === 'plan-decision' && <PlanDecisionModal />}
      {activeModal === 'science' && <ScienceSourcesModal />}
      {(activeModal === 'pause' || activeModal === 'settings' || activeModal === 'exit-confirm') && (
        <SettingsPauseModal />
      )}

      {/* Repair Puzzles (auto-paused when inspecting Exterior 360 View) */}
      {activePuzzle && !puzzlePaused && activePuzzle.id === 'circuit-reconnect' && (
        <CircuitPuzzle />
      )}
      {activePuzzle && !puzzlePaused && activePuzzle.id === 'co2-filter-adapter' && (
        <FilterAdapterPuzzle />
      )}
      {activePuzzle && !puzzlePaused && activePuzzle.id === 'hull-patch' && (
        <HullPatchPuzzle />
      )}
      {activePuzzle && !puzzlePaused && activePuzzle.id === 'diagnostic-sequence' && (
        <DiagnosticPuzzle />
      )}

      {/* Mission End Debrief */}
      <DebriefModal />
    </div>
  );
}

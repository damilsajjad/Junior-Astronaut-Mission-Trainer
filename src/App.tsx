import CircuitPuzzle from './components/puzzles/CircuitPuzzle';
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
import { useGameStore } from './store/gameStore';

export default function App() {
  const missionStatus = useGameStore((s) => s.missionStatus);
  const activeModal = useGameStore((s) => s.activeModal);
  const activePuzzle = useGameStore((s) => s.activePuzzle);
  const puzzlePaused = useGameStore((s) => s.puzzlePaused);
  const reducedMotion = useGameStore((s) => s.savedProgress.reducedMotion);

  return (
    <div className={reducedMotion ? 'reduced-motion min-h-screen' : 'min-h-screen'}>
      {(missionStatus === 'title' || missionStatus === 'destination-select') && (
        <MissionSelectScreen />
      )}

      {missionStatus === 'loadout' && <LoadoutScreen />}

      {missionStatus === 'intro' && <CinematicCanvas />}

      {missionStatus === 'briefing' && <BriefingModal />}

      {(missionStatus === 'active' ||
        missionStatus === 'paused' ||
        missionStatus === 'success' ||
        missionStatus === 'safety-protocol') && <GameplayHUD />}

      {/* Modals */}
      {activeModal === 'inventory' && <InventoryModal />}
      {activeModal === 'manual' && <RepairManualModal />}
      {activeModal === 'dashboard' && <MissionControlModal />}
      {activeModal === 'plan-decision' && <PlanDecisionModal />}
      {activeModal === 'science' && <ScienceSourcesModal />}
      {(activeModal === 'pause' || activeModal === 'settings') && <SettingsPauseModal />}

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

      {/* Mission End Debrief */}
      <DebriefModal />
    </div>
  );
}

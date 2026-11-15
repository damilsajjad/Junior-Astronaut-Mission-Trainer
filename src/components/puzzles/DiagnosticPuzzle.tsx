import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Cpu, HelpCircle, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SystemId } from '../../types/game';

type DiagnosticStep = {
  prompt: string;
  options: { id: string; label: string; isCorrect: boolean; hint: string }[];
};

type DiagnosticVariant = {
  id: string;
  systemMatch?: SystemId[];
  title: string;
  subtitle: string;
  readout: string;
  steps: DiagnosticStep[];
};

const VARIANTS: DiagnosticVariant[] = [
  {
    id: 'solar-dust',
    systemMatch: ['solarArray', 'batterySystem'],
    title: 'Solar & Battery Diagnostic Sequence',
    subtitle: 'Clear dust reduction & restore charge bus safely',
    readout: 'SOLAR OUTPUT: 38% · DUST LAYER DETECTED · BATTERY RESERVE DRAINING',
    steps: [
      {
        prompt: 'Step 1 · Why did Solar Power drop during the storm?',
        options: [
          {
            id: 'a',
            label: 'Dust coats the solar panels and blocks sunlight',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'The CO₂ scrubber stopped making oxygen',
            isCorrect: false,
            hint: 'CO₂ scrubbers remove CO₂ from cabin air—they do not affect solar panels.',
          },
          {
            id: 'c',
            label: 'Solid waste entered the battery pack',
            isCorrect: false,
            hint: 'Solid waste is sealed separately and never connects to electrical hardware.',
          },
        ],
      },
      {
        prompt: 'Step 2 · Which action protects life support power first?',
        options: [
          {
            id: 'a',
            label: 'Pause Research & brush solar panel dust sensors',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Turn off the Oxygen Generator and O₂ tank',
            isCorrect: false,
            hint: 'Never shut off essential Oxygen unless an electrical short forces a brief swap!',
          },
          {
            id: 'c',
            label: 'Drink all potable water reserves at once',
            isCorrect: false,
            hint: 'Drinking extra water lowers reserves needed for crew hydration and electrolysis.',
          },
        ],
      },
      {
        prompt: 'Step 3 · Confirm final system verification check:',
        options: [
          {
            id: 'a',
            label: 'Verify Solar Array -> Battery Charge Bus -> Life Support',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Bypass the battery protection breaker',
            isCorrect: false,
            hint: 'Bypassing battery protection can overload the storage cells.',
          },
          {
            id: 'c',
            label: 'Open exterior airlock to cool the panels',
            isCorrect: false,
            hint: 'Opening the airlock depressurizes the habitat!',
          },
        ],
      },
    ],
  },
  {
    id: 'water-recovery',
    systemMatch: ['waterRecycler'],
    title: 'Water Recovery Loop Diagnostic',
    subtitle: 'Trace liquid urine + cabin humidity recovery without contamination',
    readout: 'FILTRATION VALVE STUCK · HUMIDITY CONDENSATE RISING · POTABLE CHECK PENDING',
    steps: [
      {
        prompt: 'Step 1 · What enters the spacecraft Water Recovery System?',
        options: [
          {
            id: 'a',
            label: 'Crew urine and cabin humidity condensate',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Sealed solid waste from the toilet bay',
            isCorrect: false,
            hint: 'Solid waste is NEVER sent into water recovery—it is sealed separately!',
          },
          {
            id: 'c',
            label: 'Martian iron dust from outside',
            isCorrect: false,
            hint: 'Exterior dust stays outside the closed cabin water loop.',
          },
        ],
      },
      {
        prompt: 'Step 2 · Put the recovery stages in safe scientific order:',
        options: [
          {
            id: 'a',
            label: 'Collection -> Filtration -> Purification -> Quality Check -> Dispenser',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Collection -> Dispenser -> Filtration',
            isCorrect: false,
            hint: 'Water must be filtered, purified, and quality-checked BEFORE reaching the Water Dispenser!',
          },
          {
            id: 'c',
            label: 'Purification -> Solid Waste -> Electrolysis',
            isCorrect: false,
            hint: 'Solid waste is completely separate from the water purification loop.',
          },
        ],
      },
      {
        prompt: 'Step 3 · Why do we protect potable water reserves?',
        options: [
          {
            id: 'a',
            label: 'It supplies crew drinking water, Greenhouse crops, and O₂ electrolysis',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'It powers the solar array directly',
            isCorrect: false,
            hint: 'Solar arrays run on sunlight; water is used for hydration, plants, and splitting H₂O into O₂.',
          },
          {
            id: 'c',
            label: 'It replaces CO₂ scrubber cartridges',
            isCorrect: false,
            hint: 'CO₂ scrubbers use chemical filters, not drinking water.',
          },
        ],
      },
    ],
  },
  {
    id: 'greenhouse-hydro',
    systemMatch: ['greenhouse'],
    title: 'Hydroponic Greenhouse Calibration',
    subtitle: 'Restore moisture, grow lights, and crop nutrient balance',
    readout: 'GROWTH RATE LOW · NUTRIENT PUMP DESYNCED · MOISTURE CHECK REQUIRED',
    steps: [
      {
        prompt: 'Step 1 · What three inputs keep hydroponic crops healthy?',
        options: [
          {
            id: 'a',
            label: 'Electricity (grow lights), purified water, and nutrients',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Zero water and pitch darkness',
            isCorrect: false,
            hint: 'Plants need photosynthesis light and steady moisture to grow.',
          },
          {
            id: 'c',
            label: 'High radiation bursts and vacuum air',
            isCorrect: false,
            hint: 'Crops require pressurized cabin air and radiation shielding.',
          },
        ],
      },
      {
        prompt: 'Step 2 · When can astronauts harvest fresh food from the Greenhouse?',
        options: [
          {
            id: 'a',
            label: 'Only after crops grow through stages and reach Harvest Ready (100%)',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Instantly at 0% growth with unlimited meals',
            isCorrect: false,
            hint: 'Real crops take time to grow before yielding food!',
          },
          {
            id: 'c',
            label: 'Whenever the CO₂ scrubber fails',
            isCorrect: false,
            hint: 'Greenhouse harvests depend on crop maturity, moisture, and power.',
          },
        ],
      },
      {
        prompt: 'Step 3 · How does eating food help the crew?',
        options: [
          {
            id: 'a',
            label: 'Raises crew Nutrition so Stamina & Health stay strong over time',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Recharges the habitat main Solar Battery instantly',
            isCorrect: false,
            hint: 'Food fuels astronaut bodies (Nutrition), while Sunlight charges the Solar Battery.',
          },
          {
            id: 'c',
            label: 'Seals micrometeoroid hull holes',
            isCorrect: false,
            hint: 'Hull breaches require a Composite Patch, not food.',
          },
        ],
      },
    ],
  },
  {
    id: 'life-support-science',
    systemMatch: ['oxygenGenerator', 'co2Scrubber', 'radiationShelter', 'temperatureControl'],
    title: 'Life Support & Shielding Diagnostic',
    subtitle: 'Verify O₂ electrolysis, CO₂ scrubbing, and radiation storm safety',
    readout: 'CABIN SENSOR CHECK · GAS BALANCE & THERMAL / SHIELD VERIFICATION',
    steps: [
      {
        prompt: 'Step 1 · How does the Oxygen Generator make breathable O₂?',
        options: [
          {
            id: 'a',
            label: 'Electrolysis uses electricity to split Water (H₂O) into Oxygen (O₂)',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'The CO₂ scrubber turns battery power into water',
            isCorrect: false,
            hint: 'CO₂ scrubbers trap exhaled CO₂; the Oxygen Generator splits H₂O into O₂.',
          },
          {
            id: 'c',
            label: 'Opening the exterior door pulls oxygen from Mars or Moon',
            isCorrect: false,
            hint: 'The Moon has no air and Mars atmosphere is mostly CO₂—never vent the cabin!',
          },
        ],
      },
      {
        prompt: 'Step 2 · What protects astronauts best during a Solar Radiation Storm?',
        options: [
          {
            id: 'a',
            label: 'Structural shelter walls, water-wall shielding, and polyethylene liners',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Turning off the CO₂ scrubber filter',
            isCorrect: false,
            hint: 'Turning off the CO₂ scrubber traps dangerous CO₂ inside the shelter.',
          },
          {
            id: 'c',
            label: 'Waiting outside near the solar panels',
            isCorrect: false,
            hint: 'Solar Particle Events expose unshielded astronauts to intense radiation!',
          },
        ],
      },
      {
        prompt: 'Step 3 · How should astronauts balance Stamina vs Habitat Battery?',
        options: [
          {
            id: 'a',
            label: 'Keep Stamina up with Hydration, Nutrition, & Rest; manage Battery with Solar & Switches',
            isCorrect: true,
            hint: '',
          },
          {
            id: 'b',
            label: 'Plug the astronaut suit directly into the battery to replace sleep',
            isCorrect: false,
            hint: 'Physical stamina comes from crew health, hydration, nutrition, and rest—separate from electrical battery!',
          },
          {
            id: 'c',
            label: 'Leave every non-essential machine running at 0% power',
            isCorrect: false,
            hint: 'Pausing Research or non-critical loads helps life support survive dust storms.',
          },
        ],
      },
    ],
  },
];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = (seed || 1) >>> 0;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export default function DiagnosticPuzzle() {
  const activePuzzle = useGameStore((s) => s.activePuzzle);
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const closePuzzle = useGameStore((s) => s.closePuzzle);
  const openModal = useGameStore((s) => s.openModal);

  const seed = activePuzzle?.instanceSeed ?? 1;
  const targetSystem = activePuzzle?.targetSystem;

  const { variant, shuffledSteps } = useMemo(() => {
    const matched = targetSystem
      ? VARIANTS.filter((v) => v.systemMatch?.includes(targetSystem))
      : [];
    const pool = matched.length > 0 ? matched : VARIANTS;
    const chosen = pool[seed % pool.length];
    const stepsWithShuffledOptions = chosen.steps.map((step, idx) => ({
      prompt: step.prompt,
      options: seededShuffle(step.options, seed + (idx + 1) * 7919),
    }));
    return { variant: chosen, shuffledSteps: stepsWithShuffledOptions };
  }, [seed, targetSystem]);

  const [stepIdx, setStepIdx] = useState(0);
  const [solvedSteps, setSolvedSteps] = useState<boolean[]>([false, false, false]);
  const [feedback, setFeedback] = useState(
    'Complete all 3 diagnostic checks to calibrate and restore the system.'
  );
  const [isError, setIsError] = useState(false);

  const allSolved = solvedSteps.every(Boolean);
  const currentStep = shuffledSteps[stepIdx];

  const handleSelectOption = (option: DiagnosticStep['options'][number]) => {
    if (allSolved) return;
    if (option.isCorrect) {
      const next = [...solvedSteps];
      next[stepIdx] = true;
      setSolvedSteps(next);
      setIsError(false);
      if (stepIdx < shuffledSteps.length - 1) {
        setStepIdx(stepIdx + 1);
        setFeedback(`Check ${stepIdx + 1} passed! Continue to Step ${stepIdx + 2}.`);
      } else {
        setFeedback('All 3 diagnostic checks verified! Click Apply Calibration to finish.');
      }
    } else {
      setIsError(true);
      setFeedback(option.hint || 'Check the Repair Manual and try another option!');
      completePuzzle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-[#37D6F4]/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#152A3E] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#37D6F4]/15 border border-[#37D6F4]/40 flex items-center justify-center text-[#37D6F4]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F4F7FB]">
                {variant.title}
              </h2>
              <p className="text-xs text-[#AAB8C8]">
                {variant.subtitle} · Seed #{seed % 999}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('manual', activePuzzle?.stationId ?? null)}
              className="px-3 py-1.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-xs font-semibold text-[#37D6F4] hover:border-[#37D6F4] flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
            <button
              onClick={closePuzzle}
              aria-label="Close puzzle"
              className="w-8 h-8 rounded-lg bg-[#0D1B2A] border border-white/15 flex items-center justify-center text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Telemetry strip */}
          <div className="rounded-xl bg-[#07111F] border border-[#FFB84D]/35 px-4 py-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold text-[#FFB84D]">
              {variant.readout}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {solvedSteps.map((ok, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-md text-xs font-extrabold flex items-center justify-center border ${
                    ok
                      ? 'bg-[#37D67A]/20 border-[#37D67A] text-[#37D67A]'
                      : i === stepIdx
                        ? 'bg-[#37D6F4]/20 border-[#37D6F4] text-[#37D6F4]'
                        : 'bg-[#0D1B2A] border-white/15 text-[#AAB8C8]'
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Active Question */}
          <div className="rounded-2xl bg-[#07111F] border border-white/10 p-5 space-y-3">
            <p className="text-sm font-bold text-[#F4F7FB]">{currentStep.prompt}</p>
            <div className="space-y-2.5">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  disabled={allSolved}
                  className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all cursor-pointer ${
                    allSolved && opt.isCorrect
                      ? 'bg-[#37D67A]/15 border-[#37D67A] text-[#37D67A]'
                      : 'bg-[#0D1B2A] border-white/15 text-[#F4F7FB] hover:border-[#37D6F4] hover:bg-[#152A3E]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div
            className={`rounded-xl px-4 py-3 border text-sm flex items-center gap-2.5 ${
              allSolved
                ? 'bg-[#37D67A]/15 border-[#37D67A]/50 text-[#37D67A]'
                : isError
                  ? 'bg-[#FF5B68]/15 border-[#FF5B68]/50 text-[#FF5B68]'
                  : 'bg-[#152A3E] border-white/10 text-[#F4F7FB]'
            }`}
          >
            {allSolved ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 shrink-0 text-[#37D6F4]" />
            )}
            <span>{feedback}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                setStepIdx(0);
                setSolvedSteps([false, false, false]);
                setIsError(false);
                setFeedback('Diagnostic sequence reset. Start at Step 1.');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#152A3E] border border-white/15 text-sm font-semibold text-[#AAB8C8] hover:text-white cursor-pointer"
            >
              Restart Sequence
            </button>

            <button
              onClick={() => completePuzzle(true)}
              disabled={!allSolved}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                allSolved
                  ? 'bg-[#37D67A] hover:bg-[#48e088] text-[#07111F] shadow-lg'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Apply Calibration & Repair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

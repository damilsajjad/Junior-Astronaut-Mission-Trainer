import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AlertTriangle, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SoundId, playSound } from '../../utils/sound';
import {
  createAfterDrawPacer,
  createAstronautGroup,
  createMultiToneStarfield,
  createPlanetTerrainTexture,
  createSpacecraftRocketGroup,
  detectSoftwareWebGL,
  isWebGLAvailable,
} from './sceneHelpers';

const INTRO_LABELS = [
  {
    title: 'Scene 1 of 4 · Crew Boarding',
    caption: 'Your 4-astronaut crew walks up the gantry ramp and seals the spacecraft hatch.',
  },
  {
    title: 'Scene 2 of 4 · Earth Launch',
    caption: 'Main engines ignite! Ascending through Earth’s clouds toward deep space.',
  },
  {
    title: 'Scene 3 of 4 · Space Transit',
    caption: 'Earth grows smaller behind you as your destination grows closer ahead.',
  },
  {
    title: 'Scene 4 of 4 · Touchdown',
    caption: 'Retro-thrusters fire for landing beside your pressurized outpost module.',
  },
];

const RESCUE_LABELS = [
  {
    title: 'Stage 3 Safety Protocol · Crew Secured',
    caption: 'Habitat entered Safe-State mode. All 4 astronauts sealed in backup module.',
  },
  {
    title: 'Emergency Transmission Sent to Earth',
    caption: 'Instant emergency beacon received! Mission Control cleared Rescue Rocket launch.',
  },
  {
    title: 'Earth Rescue Rocket Launch',
    caption: 'Heavy rescue craft lifts off from Earth pad (compressed cinematic time scale).',
  },
  {
    title: 'Rescue Craft En Route to Outpost',
    caption: 'Rescue ship approaches destination orbit (real interplanetary transit takes days to months).',
  },
];

export default function CinematicCanvas({
  mode = 'intro',
}: {
  mode?: 'intro' | 'rescue';
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const destination = useGameStore((s) => s.destination);
  const safetyReason = useGameStore((s) => s.safetyReason);
  const muted = useGameStore((s) => s.savedProgress.muted);
  const volume = useGameStore((s) => s.savedProgress.volume);
  const reducedMotion = useGameStore((s) => s.savedProgress.reducedMotion);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const finishIntro = useGameStore((s) => s.finishCinematicToBriefing);
  const finishRescue = useGameStore((s) => s.finishRescueCinematic);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const isRescue = mode === 'rescue';
  const labels = isRescue ? RESCUE_LABELS : INTRO_LABELS;
  const finishCinematic = isRescue ? finishRescue : finishIntro;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglOk(false);
      return;
    }
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 450);

    const hemi = new THREE.HemisphereLight(0x9bd6ff, 0x382822, 0.85);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.9);
    keyLight.position.set(10, 16, 11);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(isRescue ? 0xff7a3d : 0x37d6f4, 1.05);
    rimLight.position.set(-9, 7, -11);
    scene.add(rimLight);

    // Rich Multi-Tone Starfield + Subtle Deep-Space Nebula Wash
    const starfield = createMultiToneStarfield(420, 48, 120);
    scene.add(starfield.mesh);

    const nebulaMat = new THREE.MeshBasicMaterial({
      color: isRescue ? 0x5c1d34 : 0x164e63,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nebulaBand = new THREE.Mesh(new THREE.RingGeometry(24, 52, 40), nebulaMat);
    nebulaBand.position.set(-8, 10, -44);
    nebulaBand.rotation.set(0.55, -0.35, 0.25);
    scene.add(nebulaBand);

    // Detailed Composite Spacecraft Rocket
    const rocketHandle = createSpacecraftRocketGroup({ isRescue });
    const rocket = rocketHandle.group;
    scene.add(rocket);

    // Exhaust Spark Particles (InstancedMesh)
    const sparkCount = 88;
    const sparkGeo = new THREE.CapsuleGeometry(0.035, 0.16, 4, 6);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xffc66d,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
    sparkMesh.visible = false;
    scene.add(sparkMesh);

    const sparkSeeds = Array.from({ length: sparkCount }, (_, i) => ({
      phase: (i / sparkCount) * 1.0,
      angle: i * 2.39996,
      radial: 0.18 + (i % 7) * 0.08,
      speed: 6.5 + (i % 5) * 1.7,
    }));

    // Volumetric Launch & Landing Smoke Puffs (InstancedMesh)
    const smokeCount = 54;
    const smokeGeo = new THREE.SphereGeometry(0.62, 10, 8);
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xdbe5f0,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.62,
    });
    const smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeCount);
    smokeMesh.visible = false;
    scene.add(smokeMesh);

    const smokeSeeds = Array.from({ length: smokeCount }, (_, i) => ({
      angle: (i / smokeCount) * Math.PI * 2 + (i % 3) * 0.25,
      phase: (i % 18) / 18,
      radiusBias: 0.8 + (i % 5) * 0.45,
    }));

    // Pad, Flame Trench, Lattice Gantry Tower & Crew Ramp (Intro Scene 1 or Rescue Safe Shelter Scene 1)
    const padGroup = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.42, metalness: 0.65 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });

    const padFloor = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 7.4, 0.45, 28), concreteMat);
    padFloor.position.y = -0.22;
    padGroup.add(padFloor);

    const trenchRing = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 2.05, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    trenchRing.rotation.x = -Math.PI / 2;
    trenchRing.position.y = 0.015;
    padGroup.add(trenchRing);

    // Metallic Lattice Gantry Tower & Retracting Swing Arm
    const gantryTower = new THREE.Group();
    gantryTower.position.set(-2.55, 0, -0.85);
    const legOffsets = [
      [-0.4, -0.4],
      [0.4, -0.4],
      [-0.4, 0.4],
      [0.4, 0.4],
    ];
    for (const [lx, lz] of legOffsets) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 5.8, 0.11), steelMat);
      post.position.set(lx, 2.9, lz);
      gantryTower.add(post);
    }
    for (let y = 1.0; y <= 5.5; y += 1.1) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.95), steelMat);
      deck.position.y = y;
      gantryTower.add(deck);
    }
    const gantryBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff5b68 })
    );
    gantryBeacon.position.set(0, 6.0, 0);
    gantryTower.add(gantryBeacon);

    const swingArmPivot = new THREE.Group();
    swingArmPivot.position.set(0.4, 2.65, 0.4);
    const armBeam = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.22), hazardMat);
    armBeam.position.set(0.95, 0, 0);
    swingArmPivot.add(armBeam);
    gantryTower.add(swingArmPivot);
    padGroup.add(gantryTower);

    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.14, 3.85), steelMat);
    ramp.position.set(0, 0.72, 2.75);
    ramp.rotation.x = -0.34;
    padGroup.add(ramp);

    const crewSprites = [0xff7a3d, 0x37d6f4, 0x37d67a, 0xffb84d].map((col, idx) => {
      const ast = createAstronautGroup(col, idx === 0);
      ast.group.scale.setScalar(0.62);
      ast.group.position.set((idx - 1.5) * 0.42, 0.04, 4.5 - idx * 0.38);
      padGroup.add(ast.group);
      return ast;
    });
    scene.add(padGroup);

    // Emergency radio signal waves (Rescue Scene 2)
    const beaconRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.07, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4, transparent: true, opacity: 0.75 })
    );
    beaconRing.visible = false;
    scene.add(beaconRing);

    // Layered Atmospheric Clouds (Launch stage)
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xe6effa,
      roughness: 0.94,
      transparent: true,
      opacity: 0.82,
    });
    for (let i = 0; i < 18; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(1.6 + (i % 3) * 0.75, 12, 10), cloudMat);
      c.scale.set(1.9, 0.58, 1.4);
      c.position.set(((i % 4) - 1.5) * 5.6, 7.5 + i * 1.4, -4 - (i % 5) * 2.2);
      cloudGroup.add(c);
    }
    cloudGroup.visible = false;
    scene.add(cloudGroup);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const earthTex = createPlanetTerrainTexture('earth', maxAniso);
    const destTex = createPlanetTerrainTexture(destination, maxAniso);

    // Earth Globe + Rayleigh Atmospheric Glow Rim
    const earthGroup = new THREE.Group();
    const earthGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 32, 24),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.58, metalness: 0.06 })
    );
    earthGroup.add(earthGlobe);
    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(4.46, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.24,
        side: THREE.BackSide,
      })
    );
    earthGroup.add(earthAtmo);
    earthGroup.visible = false;
    scene.add(earthGroup);

    // Destination Globe + Atmospheric Rim (Mars rusty haze / Moon subtle terminator rim)
    const destGroup = new THREE.Group();
    const destGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 30, 24),
      new THREE.MeshStandardMaterial({ map: destTex, roughness: 0.86 })
    );
    destGroup.add(destGlobe);
    if (destination === 'mars') {
      const marsAtmo = new THREE.Mesh(
        new THREE.SphereGeometry(2.78, 28, 22),
        new THREE.MeshBasicMaterial({
          color: 0xe07a45,
          transparent: true,
          opacity: 0.22,
          side: THREE.BackSide,
        })
      );
      destGroup.add(marsAtmo);
    }
    destGroup.visible = false;
    scene.add(destGroup);

    // Landing terrain, boulders & dynamic dust ring
    const terrainGroup = new THREE.Group();
    const terrainGeo = new THREE.PlaneGeometry(65, 65, 28, 28);
    const tAttr = terrainGeo.attributes.position;
    for (let i = 0; i < tAttr.count; i++) {
      const gx = tAttr.getX(i);
      const gy = tAttr.getY(i);
      const dist = Math.hypot(gx, gy);
      if (dist > 4.2) {
        tAttr.setZ(i, Math.sin(gx * 0.22) * Math.cos(gy * 0.22) * 0.55 + Math.sin(dist * 0.35) * 0.2);
      }
    }
    terrainGeo.computeVertexNormals();
    const terrainPlane = new THREE.Mesh(
      terrainGeo,
      new THREE.MeshStandardMaterial({ map: destTex, roughness: 0.92 })
    );
    terrainPlane.rotation.x = -Math.PI / 2;
    terrainGroup.add(terrainPlane);

    const boulderGeo = new THREE.DodecahedronGeometry(0.45, 0);
    const boulderMat = new THREE.MeshStandardMaterial({
      color: destination === 'mars' ? 0x7c3420 : 0x5c6370,
      roughness: 0.9,
    });
    const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, 22);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2;
      const rad = 5.0 + (i % 5) * 2.2;
      dummy.position.set(Math.cos(ang) * rad, 0.16, Math.sin(ang) * rad);
      dummy.rotation.set(i * 0.4, i * 0.9, 0);
      dummy.scale.setScalar(0.6 + (i % 4) * 0.45);
      dummy.updateMatrix();
      boulders.setMatrixAt(i, dummy.matrix);
    }
    boulders.computeBoundingSphere();
    terrainGroup.add(boulders);

    const dustRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 2.9, 32),
      new THREE.MeshBasicMaterial({
        color: destination === 'mars' ? 0xe07a52 : 0x9ca3af,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      })
    );
    dustRing.rotation.x = -Math.PI / 2;
    dustRing.position.y = 0.05;
    terrainGroup.add(dustRing);
    terrainGroup.visible = false;
    scene.add(terrainGroup);

    const pacer = createAfterDrawPacer(renderer);
    const sceneDuration = reducedMotion ? 2.0 : isRescue ? 3.8 : 4.8;
    const totalDuration = sceneDuration * 4;
    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let disposed = false;
    let lastStage = -1;
    let playedDoorClose = false;
    let playedIgnition = false;
    let playedImpact = false;

    const triggerCinematicSfx = (id: SoundId) => {
      playSound(id, {
        muted: mutedRef.current,
        volume: volumeRef.current,
        bypassCooldown: true,
      });
    };

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const updatePlumeAndParticles = (
      active: boolean,
      thrustPower: number,
      smokeAtPad: boolean,
      smokeOriginY: number
    ) => {
      rocketHandle.plumeGroup.visible = active;
      sparkMesh.visible = active;
      smokeMesh.visible = active && (smokeAtPad || rocket.position.y < 6.5);

      if (!active) {
        rocketHandle.engineLight.intensity = 0;
        return;
      }

      const flicker = 0.88 + Math.sin(elapsed * 42) * 0.14 + Math.cos(elapsed * 27) * 0.08;
      rocketHandle.flameOuter.scale.set(
        0.92 + Math.sin(elapsed * 31) * 0.08,
        thrustPower * flicker,
        0.92 + Math.cos(elapsed * 29) * 0.08
      );
      rocketHandle.flameCore.scale.set(
        0.95 + Math.cos(elapsed * 37) * 0.06,
        thrustPower * (0.95 + Math.sin(elapsed * 47) * 0.1),
        0.95 + Math.sin(elapsed * 37) * 0.06
      );
      rocketHandle.machDiamonds.forEach((d, idx) => {
        const s = 0.75 + Math.sin(elapsed * 35 + idx * 1.4) * 0.25;
        d.scale.set(0.8 * s, 1.45 * s, 0.8 * s);
      });
      rocketHandle.engineLight.intensity = (2.8 + Math.sin(elapsed * 40) * 0.7) * thrustPower;

      // Exhaust sparks streaming along rocket -Y axis in world space
      const worldOffset = rocket.position;
      const isHorizontal = Math.abs(rocket.rotation.z) > 0.5;
      sparkSeeds.forEach((s, idx) => {
        const t = (elapsed * (s.speed * 0.24) + s.phase) % 1;
        const dist = 0.2 + t * 3.8;
        if (isHorizontal) {
          dummy.position.set(
            worldOffset.x - dist,
            worldOffset.y + Math.sin(s.angle) * s.radial * (1 + t * 1.6),
            worldOffset.z + Math.cos(s.angle) * s.radial * (1 + t * 1.6)
          );
          dummy.rotation.set(0, 0, Math.PI / 2);
        } else {
          dummy.position.set(
            worldOffset.x + Math.cos(s.angle) * s.radial * (1 + t * 1.5),
            worldOffset.y - dist,
            worldOffset.z + Math.sin(s.angle) * s.radial * (1 + t * 1.5)
          );
          dummy.rotation.set(0, 0, 0);
        }
        dummy.scale.setScalar((1 - t) * 1.15);
        dummy.updateMatrix();
        sparkMesh.setMatrixAt(idx, dummy.matrix);
      });
      sparkMesh.instanceMatrix.needsUpdate = true;

      if (smokeMesh.visible) {
        (smokeMesh.material as THREE.MeshStandardMaterial).color.setHex(
          smokeAtPad ? 0xdbe5f0 : destination === 'mars' ? 0xd47d58 : 0x9ca3af
        );
        smokeSeeds.forEach((p, idx) => {
          const t = (elapsed * 0.52 + p.phase) % 1;
          const radial = p.radiusBias + t * 4.8;
          dummy.position.set(
            Math.cos(p.angle) * radial,
            smokeOriginY + t * 1.85,
            Math.sin(p.angle) * radial
          );
          dummy.rotation.set(0, p.angle, 0);
          dummy.scale.setScalar((0.55 + t * 1.75) * (1 - t * 0.3));
          dummy.updateMatrix();
          smokeMesh.setMatrixAt(idx, dummy.matrix);
        });
        smokeMesh.instanceMatrix.needsUpdate = true;
      }
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      elapsed += dt;

      if (elapsed >= totalDuration) {
        finishCinematic();
        return;
      }

      const stage = Math.min(3, Math.floor(elapsed / sceneDuration));
      const localT = (elapsed - stage * sceneDuration) / sceneDuration;
      if (stage !== lastStage) {
        lastStage = stage;
        setSceneIndex(stage);
        if (!isRescue) {
          if (stage === 0) triggerCinematicSfx('door-open');
          else if (stage === 1) triggerCinematicSfx('rocket-launch');
          else if (stage === 2) triggerCinematicSfx('rocket-shutdown');
          else if (stage === 3) triggerCinematicSfx('rocket-landing');
        } else {
          if (stage === 0) triggerCinematicSfx('door-close');
          else if (stage === 1) triggerCinematicSfx('warn-general');
          else if (stage === 2) {
            triggerCinematicSfx('rocket-ignition');
            triggerCinematicSfx('rocket-launch');
          } else if (stage === 3) {
            triggerCinematicSfx('rocket-shutdown');
          }
        }
      }

      if (!isRescue) {
        if (stage === 0 && localT >= 0.65 && !playedDoorClose) {
          playedDoorClose = true;
          triggerCinematicSfx('door-close');
        }
        if (stage === 0 && localT >= 0.85 && !playedIgnition) {
          playedIgnition = true;
          triggerCinematicSfx('rocket-ignition');
        }
        if (stage === 3 && localT >= 0.85 && !playedImpact) {
          playedImpact = true;
          triggerCinematicSfx('landing-impact');
        }
      }

      earthGlobe.rotation.y += dt * 0.08;
      destGlobe.rotation.y += dt * 0.12;

      if (!isRescue) {
        padGroup.visible = stage === 0 || (stage === 1 && localT < 0.35);
        gantryTower.visible = stage === 0 || (stage === 1 && localT < 0.35);
        ramp.visible = stage === 0;
        cloudGroup.visible = stage === 1;
        earthGroup.visible = stage === 2;
        destGroup.visible = stage === 2;
        terrainGroup.visible = stage === 3;
        beaconRing.visible = false;

        if (stage === 0) {
          scene.background = new THREE.Color(0x091830);
          rocket.position.set(0, 0, 0);
          rocket.rotation.set(0, 0, 0);
          rocketHandle.hatch.position.x = THREE.MathUtils.lerp(0.42, 0, Math.max(0, (localT - 0.65) / 0.35));
          swingArmPivot.rotation.y = THREE.MathUtils.lerp(0, -1.15, Math.max(0, (localT - 0.72) / 0.28));
          crewSprites.forEach((ast, idx) => {
            const walkT = Math.min(1, localT * 1.4 - idx * 0.12);
            if (walkT > 0 && walkT < 1) {
              ast.group.position.z = THREE.MathUtils.lerp(4.5, 1.05, walkT);
              ast.group.position.y = THREE.MathUtils.lerp(0.04, 1.38, walkT);
              const swing = Math.sin(elapsed * 8 + idx) * 0.4;
              ast.leftLeg.rotation.x = swing;
              ast.rightLeg.rotation.x = -swing;
            } else if (walkT >= 1) {
              ast.group.visible = false;
            }
          });
          // Pre-ignition warm thruster glow in final 12% of scene 1
          const preIgnite = localT > 0.88;
          updatePlumeAndParticles(preIgnite, 0.45, true, 0.15);
          camera.position.set(5.2 - localT * 1.1, 2.8, 7.9);
          camera.lookAt(0, 2.1, 0.2);
        } else if (stage === 1) {
          const skyColor = new THREE.Color(0x1b4b87).lerp(new THREE.Color(0x040914), localT);
          scene.background = skyColor;
          swingArmPivot.rotation.y = -1.25;
          rocket.position.set(Math.sin(elapsed * 22) * 0.03 * (1 - localT), localT * 13.5, 0);
          updatePlumeAndParticles(true, 1.12, true, 0.18);
          cloudGroup.position.y = -localT * 10.5;
          camera.position.set(6.2, 2.4 + localT * 12.2, 8.2);
          camera.lookAt(0, rocket.position.y + 2.2, 0);
        } else if (stage === 2) {
          scene.background = new THREE.Color(0x030712);
          rocket.position.set(0, 0, 0);
          rocket.rotation.z = -Math.PI / 2;
          rocket.rotation.y = 0.22;
          updatePlumeAndParticles(true, 0.75, false, -10);
          earthGroup.position.set(-6.5 - localT * 9, -1.5, -10.5 - localT * 8);
          earthGroup.scale.setScalar(Math.max(0.25, 1.0 - localT * 0.7));
          destGroup.position.set(9.2 - localT * 4.5, 1.2, -16 + localT * 9);
          destGroup.scale.setScalar(0.35 + localT * 1.15);
          camera.position.set(0.6, 2.8, 9.2);
          camera.lookAt(0.5, 0, 0);
        } else {
          const bgHex = destination === 'mars' ? 0x6b2f1c : 0x050912;
          scene.background = new THREE.Color(bgHex);
          rocket.rotation.set(0, 0, 0);
          const altitude = THREE.MathUtils.lerp(11.5, 0, THREE.MathUtils.smoothstep(localT, 0, 0.85));
          rocket.position.set(0, altitude, 0);
          const burning = localT < 0.85;
          updatePlumeAndParticles(burning, 0.88, false, 0.22);
          const dustScale = localT > 0.45 ? 0.5 + (localT - 0.45) * 3.2 : 0.1;
          dustRing.scale.setScalar(dustScale);
          (dustRing.material as THREE.MeshBasicMaterial).opacity =
            localT > 0.45 ? Math.max(0, 0.55 - (localT - 0.45)) : 0;
          camera.position.set(6.8, 3.0 + altitude * 0.25, 8.6);
          camera.lookAt(0, altitude + 1.8, 0);
        }
      } else {
        // RESCUE CINEMATIC
        padGroup.visible = stage === 0 || (stage === 2 && localT < 0.35);
        gantryTower.visible = stage === 2 && localT < 0.35;
        ramp.visible = false;
        beaconRing.visible = stage === 1;
        cloudGroup.visible = stage === 2;
        earthGroup.visible = stage === 1 || stage === 3;
        destGroup.visible = stage === 1 || stage === 3;
        terrainGroup.visible = stage === 0;
        rocket.visible = stage >= 2;

        if (stage === 0) {
          scene.background = new THREE.Color(destination === 'mars' ? 0x5c2618 : 0x070d19);
          updatePlumeAndParticles(false, 0, false, 0);
          crewSprites.forEach((ast, idx) => {
            ast.group.visible = true;
            ast.group.position.set((idx - 1.5) * 0.85, 0.05, 1.5);
          });
          camera.position.set(0, 2.2, 6.2);
          camera.lookAt(0, 0.8, 1.5);
        } else if (stage === 1) {
          scene.background = new THREE.Color(0x030712);
          updatePlumeAndParticles(false, 0, false, 0);
          destGroup.position.set(-5.5, 0, -4);
          destGroup.scale.setScalar(0.8);
          earthGroup.position.set(6.5, 0.8, -8);
          earthGroup.scale.setScalar(0.65);
          beaconRing.position.set(-5.5 + localT * 12, localT * 0.8, -4 - localT * 4);
          beaconRing.scale.setScalar(0.4 + Math.sin(elapsed * 10) * 0.15);
          camera.position.set(0, 1.8, 9.5);
          camera.lookAt(0, 0.4, -5);
        } else if (stage === 2) {
          const skyColor = new THREE.Color(0x1b4b87).lerp(new THREE.Color(0x040914), localT);
          scene.background = skyColor;
          swingArmPivot.rotation.y = -1.25;
          rocket.rotation.set(0, 0, 0);
          rocket.position.set(Math.sin(elapsed * 24) * 0.03 * (1 - localT), localT * 13.5, 0);
          updatePlumeAndParticles(true, 1.18, true, 0.18);
          cloudGroup.position.y = -localT * 10.5;
          camera.position.set(6.2, 2.4 + localT * 12.2, 8.2);
          camera.lookAt(0, rocket.position.y + 2.2, 0);
        } else {
          scene.background = new THREE.Color(0x030712);
          rocket.position.set(-2 + localT * 3, 0, 0);
          rocket.rotation.z = -Math.PI / 2;
          rocket.rotation.y = 0.2;
          updatePlumeAndParticles(true, 0.8, false, -10);
          earthGroup.position.set(-7 - localT * 6, -1.5, -10);
          earthGroup.scale.setScalar(Math.max(0.28, 0.9 - localT * 0.5));
          destGroup.position.set(8 - localT * 4.5, 0.8, -14 + localT * 7);
          destGroup.scale.setScalar(0.4 + localT * 1.1);
          camera.position.set(0.6, 2.6, 9.2);
          camera.lookAt(0, 0, 0);
        }
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        pacer.afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      pacer.afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      pacer.cancel();
      window.removeEventListener('resize', handleResize);
      earthTex.dispose();
      destTex.dispose();
      starfield.geometry.dispose();
      starfield.material.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      smokeGeo.dispose();
      smokeMat.dispose();
      boulderGeo.dispose();
      boulderMat.dispose();
      terrainGeo.dispose();
      nebulaMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [destination, isRescue, reducedMotion, finishCinematic]);

  const activeInfo = labels[sceneIndex] || labels[0];

  return (
    <div className="relative w-screen h-screen bg-[#07111F] overflow-hidden select-none">
      {webglOk ? (
        <div ref={mountRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#07111F] p-8 text-center">
          <div className="max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6">
            <h2 className="text-xl font-bold text-[#37D6F4]">
              {isRescue ? 'Earth Rescue Sequence' : 'Mission Transit Sequence'}
            </h2>
            <p className="mt-2 text-sm text-[#AAB8C8]">
              {isRescue
                ? 'Crew safely sheltered. Earth rescue rocket dispatched at compressed cinematic speed.'
                : 'WebGL 3D preview is unavailable on this browser, but all Mission Control systems are ready!'}
            </p>
          </div>
        </div>
      )}

      {/* Top Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-20 pointer-events-none">
        <div
          className={`pointer-events-auto rounded-xl bg-[#0D1B2A]/92 border px-4 py-2.5 ${
            isRescue ? 'border-[#FF5B68]/60' : 'border-white/15'
          }`}
        >
          <p
            className={`text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 ${
              isRescue ? 'text-[#FF5B68]' : 'text-[#37D6F4]'
            }`}
          >
            {isRescue && <AlertTriangle className="w-3.5 h-3.5" />}
            {activeInfo.title}
          </p>
          <p className="text-sm font-medium text-[#F4F7FB] mt-0.5">
            {isRescue
              ? `Safety Cause: ${safetyReason || 'Critical survival threshold triggered'}`
              : `Destination: ${destination === 'mars' ? 'Mars Outpost (0.38g)' : 'Lunar Outpost (0.16g)'}`}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="h-10 w-10 rounded-xl bg-[#0D1B2A]/90 border border-white/15 flex items-center justify-center text-[#F4F7FB] hover:border-[#37D6F4] transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#37D6F4]" />}
          </button>
          <button
            onClick={finishCinematic}
            className="h-10 px-4 rounded-xl bg-[#FF7A3D] hover:bg-[#ff8d57] text-white font-semibold text-sm flex items-center gap-2 shadow-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{isRescue ? 'View Debrief' : 'Skip Intro'}</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Narration & Progress */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(700px,92vw)] z-20 pointer-events-none">
        <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 px-6 py-4 text-center">
          <p className="text-sm sm:text-base text-[#F4F7FB] font-medium">{activeInfo.caption}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {labels.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === sceneIndex
                    ? isRescue
                      ? 'w-10 bg-[#FF5B68]'
                      : 'w-10 bg-[#37D6F4]'
                    : idx < sceneIndex
                      ? 'w-6 bg-[#37D67A]'
                      : 'w-6 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

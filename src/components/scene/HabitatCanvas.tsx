import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  Droplets,
  Heart,
  Shield,
  Sprout,
  Sun,
  Utensils,
  Wind,
  Wrench,
} from 'lucide-react';
import { INTERACTION_DISTANCE, PLAYER_SPEED, isMachineHealthy } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import { StationId, SystemId, WorldPickup } from '../../types/game';
import { playSound } from '../../utils/sound';
import {
  ArcadeMachineHandle,
  createAfterDrawPacer,
  createArcadeMachineGroup,
  createAstronautGroup,
  createFloorPanelTexture,
  createMultiToneStarfield,
  createPlanetTerrainTexture,
  createSolarCellTexture,
  detectSoftwareWebGL,
  drawArcadeScreenCanvas,
  isWebGLAvailable,
} from './sceneHelpers';

export type StationDef = {
  id: StationId;
  label: string;
  kidAction: string;
  x: number;
  z: number;
  walkX: number;
  walkZ: number;
  halfW: number;
  halfD: number;
  solid?: boolean;
};

export const HABITAT_STATIONS: StationDef[] = [
  // Row of 6 Physical Arcade-Style Life-Support Machines along back arcade line (expanded spacing)
  { id: 'oxygen-generator', label: 'O₂ Generator', kidAction: 'Inspect / Fix', x: -2.75, z: -2.05, walkX: -2.75, walkZ: -1.15, halfW: 0.36, halfD: 0.34, solid: true },
  { id: 'co2-scrubber', label: 'CO₂ Scrubber', kidAction: 'Inspect / Fix', x: -1.65, z: -2.05, walkX: -1.65, walkZ: -1.15, halfW: 0.36, halfD: 0.34, solid: true },
  { id: 'water-recycler', label: 'Water Recycler', kidAction: 'Inspect / Fix', x: -0.55, z: -2.05, walkX: -0.55, walkZ: -1.15, halfW: 0.36, halfD: 0.34, solid: true },
  { id: 'greenhouse', label: 'Greenhouse', kidAction: 'Inspect / Harvest', x: 0.55, z: -2.05, walkX: 0.55, walkZ: -1.08, halfW: 0.36, halfD: 0.44, solid: true },
  { id: 'solar-array', label: 'Solar Power', kidAction: 'Inspect / Fix', x: 1.65, z: -2.05, walkX: 1.65, walkZ: -1.15, halfW: 0.36, halfD: 0.34, solid: true },
  { id: 'battery-system', label: 'Battery Bank', kidAction: 'Inspect / Fix', x: 2.75, z: -2.05, walkX: 2.75, walkZ: -1.15, halfW: 0.36, halfD: 0.34, solid: true },

  // Physical Habitat Facilities & Stations (generous walkways)
  { id: 'radiation-shelter', label: 'Radiation Shelter', kidAction: 'Shelter Crew', x: -4.2, z: 0.0, walkX: -3.65, walkZ: 0.0, halfW: 0.6, halfD: 0.9, solid: false },
  { id: 'crew-bunks', label: 'Med & Rest Bay', kidAction: 'Rest & Heal', x: -3.85, z: -1.75, walkX: -3.45, walkZ: -0.95, halfW: 0.42, halfD: 0.36, solid: true },
  { id: 'water-dispenser', label: 'Water Dispenser', kidAction: 'Drink Water', x: 3.75, z: -1.75, walkX: 3.35, walkZ: -1.0, halfW: 0.34, halfD: 0.32, solid: true },
  { id: 'toilet-facility', label: 'Toilet & Waste Bay', kidAction: 'Waste & Cycle', x: -3.45, z: 1.85, walkX: -3.25, walkZ: 1.05, halfW: 0.4, halfD: 0.34, solid: true },
  { id: 'tool-cabinet', label: 'Tool Rack', kidAction: 'Open Bag', x: -1.75, z: 1.85, walkX: -1.75, walkZ: 1.05, halfW: 0.4, halfD: 0.34, solid: true },
  { id: 'mission-control', label: 'Mission Desk', kidAction: 'Systems View', x: 0.0, z: -0.22, walkX: 0.0, walkZ: 0.5, halfW: 0.5, halfD: 0.28, solid: true },
  { id: 'manual-terminal', label: 'Repair Guide', kidAction: 'Read Guide', x: 1.75, z: 1.85, walkX: 1.75, walkZ: 1.05, halfW: 0.4, halfD: 0.34, solid: true },
  { id: 'food-cabinet', label: 'Food Locker', kidAction: 'Food Locker', x: 3.35, z: 1.85, walkX: 3.15, walkZ: 1.05, halfW: 0.42, halfD: 0.34, solid: true },
  { id: 'water-blocks', label: 'Water Shield Wall', kidAction: 'Add Water Bag', x: 4.1, z: 0.0, walkX: 3.35, walkZ: 0.0, halfW: 0.55, halfD: 0.7, solid: false },
];

const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _screenPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

type OverheadAstronaut = {
  id: string;
  label: string;
  isPlayer: boolean;
  health: number;
  energy: number;
  x: number;
  y: number;
  visible: boolean;
};

type StationBubble = {
  id: StationId;
  title: string;
  actionText: string;
  needsRepair: boolean;
  x: number;
  y: number;
  visible: boolean;
};

type LabelOverlay = {
  text: string;
  action: string;
  x: number;
  y: number;
} | null;

export default function HabitatCanvas({
  resetCamTrigger,
}: {
  resetCamTrigger: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [hoverLabel, setHoverLabel] = useState<LabelOverlay>(null);
  const [overheadCrew, setOverheadCrew] = useState<OverheadAstronaut[]>([]);
  const [stationBubbles, setStationBubbles] = useState<StationBubble[]>([]);

  const destination = useGameStore((s) => s.destination);
  const viewMode = useGameStore((s) => s.viewMode);
  const lowGraphics = useGameStore((s) => s.savedProgress.lowGraphics);
  const worldPickups = useGameStore((s) => s.worldPickups);
  const waterBlocksReinforced = useGameStore((s) => s.waterBlocksReinforced);
  const activeRadiationHazard = useGameStore((s) => s.activeRadiationHazard);
  const dustStormDaysRemaining = useGameStore((s) => s.dustStormDaysRemaining);
  const systems = useGameStore((s) => s.systems);
  const liveTrends = useGameStore((s) => s.liveTrends);
  const crew = useGameStore((s) => s.crew);
  const character = useGameStore((s) => s.character);

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const pickupsRef = useRef(worldPickups);
  pickupsRef.current = worldPickups;
  const blocksRef = useRef(waterBlocksReinforced);
  blocksRef.current = waterBlocksReinforced;
  const radHazardRef = useRef(activeRadiationHazard);
  radHazardRef.current = activeRadiationHazard;
  const dustStormRef = useRef(dustStormDaysRemaining);
  dustStormRef.current = dustStormDaysRemaining;
  const systemsRef = useRef(systems);
  systemsRef.current = systems;
  const crewRef = useRef(crew);
  crewRef.current = crew;
  const charRef = useRef(character);
  charRef.current = character;

  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const exteriorCamRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (resetCamTrigger > 0 && exteriorCamRef.current && orbitControlsRef.current) {
      exteriorCamRef.current.position.set(8.8, 5.2, 11.2);
      orbitControlsRef.current.target.set(0, 1.25, 0);
      orbitControlsRef.current.update();
    }
  }, [resetCamTrigger]);

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
      antialias: !isSoftwareGl && !lowGraphics,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(
      isSoftwareGl || lowGraphics ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl && !lowGraphics;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const isMars = destination === 'mars';
    const skyBg = isMars ? 0x622f1f : 0x050a14;
    scene.background = new THREE.Color(skyBg);
    scene.fog = new THREE.FogExp2(skyBg, isMars ? 0.017 : 0.009);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const interiorCam = new THREE.PerspectiveCamera(44, width / height, 0.1, 220);
    interiorCam.position.set(0.5, 6.4, 10.6);
    interiorCam.lookAt(0, 1.0, 0);

    const fpvCam = new THREE.PerspectiveCamera(68, width / height, 0.08, 220);
    fpvCam.rotation.order = 'YXZ';

    const exteriorCam = new THREE.PerspectiveCamera(45, width / height, 0.1, 220);
    exteriorCam.position.set(8.8, 5.2, 11.2);
    exteriorCamRef.current = exteriorCam;

    const controls = new OrbitControls(exteriorCam, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6.5;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.target.set(0, 1.25, 0);
    controls.enabled = viewModeRef.current === 'exterior';
    orbitControlsRef.current = controls;

    // 3-point lighting
    const hemi = new THREE.HemisphereLight(
      isMars ? 0xffb88e : 0x9ec5ff,
      isMars ? 0x4b1d12 : 0x2a2f3a,
      0.88
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(isMars ? 0xffe2c7 : 0xf4f8ff, 1.65);
    keyLight.position.set(9, 14, 10);
    if (!isSoftwareGl && !lowGraphics) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 10;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const cabinLight = new THREE.PointLight(0xe0f7ff, 1.5, 18, 1.3);
    cabinLight.position.set(0, 3.05, 0.25);
    scene.add(cabinLight);

    // Planetary Terrain + Crater Ridges + Rocks
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const terrainTex = createPlanetTerrainTexture(destination, maxAniso);
    terrainTex.repeat.set(7, 7);
    const solarTex = createSolarCellTexture(maxAniso);

    const groundGeo = new THREE.PlaneGeometry(110, 110, 42, 42);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const gx = posAttr.getX(i);
      const gy = posAttr.getY(i);
      const dist = Math.hypot(gx, gy);
      if (dist > 7.8) {
        const wave =
          Math.sin(gx * 0.22) * Math.cos(gy * 0.22) * 0.72 +
          Math.sin(dist * 0.35) * 0.28 +
          Math.max(0, (dist - 28) * 0.06);
        posAttr.setZ(i, wave);
      }
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({ map: terrainTex, roughness: 0.94, metalness: 0.02 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    // Crater Rim Rings in middle distance
    const rimMat = new THREE.MeshStandardMaterial({
      color: isMars ? 0x8b3b23 : 0x676f7d,
      roughness: 0.92,
    });
    const craterCoords = [
      [-16, -18, 4.2],
      [19, -15, 5.2],
      [-21, 14, 3.8],
      [16, 17, 4.5],
    ];
    for (const [cx, cz, cr] of craterCoords) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(cr, 0.38, 8, 28), rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.scale.set(1, 1, 0.55);
      rim.position.set(cx, 0.08, cz);
      scene.add(rim);
    }

    // Scattered rocks
    const rockCount = 48;
    const rockGeo = new THREE.DodecahedronGeometry(0.36, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: isMars ? 0x7c3420 : 0x5c6370,
      roughness: 0.9,
    });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
      const ang = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.2;
      const rad = 8.8 + (i % 10) * 2.3;
      dummy.position.set(Math.cos(ang) * rad, 0.16, Math.sin(ang) * rad);
      dummy.rotation.set(i * 0.4, i * 0.8, 0);
      dummy.scale.setScalar(0.65 + (i % 4) * 0.45);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.computeBoundingSphere();
    scene.add(rocks);

    // Sky Backdrop & Storm Particles
    const starGroup = new THREE.Group();
    const starfield = createMultiToneStarfield(isMars ? 140 : 320, 44, 90);
    if (isMars) {
      starfield.material.transparent = true;
      starfield.material.opacity = 0.38;
    }
    starGroup.add(starfield.mesh);

    if (!isMars) {
      const earthTex = createPlanetTerrainTexture('earth', maxAniso);
      const earthSphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.9, 28, 22),
        new THREE.MeshStandardMaterial({
          map: earthTex,
          roughness: 0.5,
          emissive: 0x0b2545,
          emissiveIntensity: 0.42,
        })
      );
      earthSphere.position.set(13, 12, -28);
      starGroup.add(earthSphere);

      const earthGlow = new THREE.Mesh(
        new THREE.SphereGeometry(3.15, 28, 22),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.22,
          side: THREE.BackSide,
        })
      );
      earthGlow.position.copy(earthSphere.position);
      starGroup.add(earthGlow);
    } else {
      const vortexMat = new THREE.MeshBasicMaterial({
        color: 0xd97757,
        transparent: true,
        opacity: 0.28,
      });
      const vortex = new THREE.Mesh(new THREE.ConeGeometry(2.8, 10, 18, 1, true), vortexMat);
      vortex.rotation.x = Math.PI;
      vortex.position.set(14, 5.2, -26);
      starGroup.add(vortex);

      const moonMat = new THREE.MeshStandardMaterial({ color: 0xd8c3b4, roughness: 0.8 });
      const phobos = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 1), moonMat);
      phobos.scale.set(1.2, 0.85, 0.9);
      phobos.position.set(15, 13, -30);
      starGroup.add(phobos);

      const deimos = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), moonMat);
      deimos.position.set(-14, 15, -34);
      starGroup.add(deimos);
    }
    scene.add(starGroup);

    const stormCount = 54;
    const stormGeo = new THREE.CapsuleGeometry(0.032, 0.48, 4, 6);
    const stormMat = new THREE.MeshBasicMaterial({
      color: isMars ? 0xff8c52 : 0xffd166,
      transparent: true,
      opacity: 0.68,
    });
    const stormMesh = new THREE.InstancedMesh(stormGeo, stormMat, stormCount);
    stormMesh.rotation.z = Math.PI / 2;
    const stormSeeds = Array.from({ length: stormCount }, (_, i) => ({
      x: -9 + ((i * 1.93) % 18),
      y: 0.4 + ((i * 0.72) % 4.0),
      z: -4.2 + ((i * 1.31) % 8.4),
      speed: 3.8 + (i % 5) * 0.9,
    }));
    scene.add(stormMesh);

    // =========================================================================
    // EXPANDED CURVED SPACECRAFT HABITAT MODULE (10.4m x 5.4m, r = 2.95m)
    // =========================================================================
    const habitatGroup = new THREE.Group();
    scene.add(habitatGroup);

    const floorTex = createFloorPanelTexture(maxAniso);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.44,
      metalness: 0.25,
    });
    const hullInnerMat = new THREE.MeshStandardMaterial({
      color: 0xa6b7ca,
      roughness: 0.48,
      metalness: 0.18,
      side: THREE.DoubleSide,
    });
    const outerShellMat = new THREE.MeshPhysicalMaterial({
      color: 0x8a99ab,
      roughness: 0.34,
      metalness: 0.48,
      clearcoat: 0.35,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.42,
      metalness: 0.68,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.75,
    });

    const floorHitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 4.7),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    floorHitPlane.rotation.x = -Math.PI / 2;
    floorHitPlane.position.y = 0.13;
    habitatGroup.add(floorHitPlane);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.22, 5.4), floorMat);
    deck.position.set(0, 0.0, 0);
    deck.receiveShadow = true;
    habitatGroup.add(deck);

    // Illuminated walkway guide strips
    const floorTrimBack = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.03, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4 })
    );
    floorTrimBack.position.set(0, 0.115, -0.78);
    habitatGroup.add(floorTrimBack);

    const floorTrimFront = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.03, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4 })
    );
    floorTrimFront.position.set(0, 0.115, 0.78);
    habitatGroup.add(floorTrimFront);

    // Under-cradle & inner curved bulkhead
    const cradle = new THREE.Mesh(
      new THREE.CylinderGeometry(3.04, 3.12, 10.6, 28, 1, true, Math.PI * 1.18, Math.PI * 0.64),
      darkMetalMat
    );
    cradle.rotation.z = Math.PI / 2;
    cradle.position.set(0, 1.38, 0);
    habitatGroup.add(cradle);

    const curvedHull = new THREE.Mesh(
      new THREE.CylinderGeometry(2.95, 2.95, 10.5, 36, 1, true, Math.PI * 0.42, Math.PI * 0.76),
      hullInnerMat
    );
    curvedHull.rotation.z = Math.PI / 2;
    curvedHull.position.set(0, 1.38, 0);
    curvedHull.receiveShadow = true;
    habitatGroup.add(curvedHull);

    // Structural pressure ribs
    const ribGeo = new THREE.TorusGeometry(2.9, 0.075, 10, 32, Math.PI * 0.7);
    ribGeo.rotateZ(-0.2);
    for (let x = -4.9; x <= 4.9; x += 1.96) {
      const rib = new THREE.Mesh(ribGeo, darkMetalMat);
      rib.rotation.y = Math.PI / 2;
      rib.position.set(x, 1.38, 0);
      habitatGroup.add(rib);
    }

    // Overhead LED Light Bars
    for (let x = -3.3; x <= 3.3; x += 2.2) {
      const lightBar = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.04, 1.4, 6, 10),
        new THREE.MeshBasicMaterial({ color: 0xc2f5ff })
      );
      lightBar.rotation.z = Math.PI / 2;
      lightBar.position.set(x, 4.1, -0.35);
      habitatGroup.add(lightBar);
    }

    // Rear Panoramic Viewport Window
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 0.08), darkMetalMat);
    winFrame.position.set(0.0, 2.75, -2.56);
    habitatGroup.add(winFrame);

    const winGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.95, 0.82),
      new THREE.MeshBasicMaterial({ color: isMars ? 0x9a3412 : 0x0b1f3a })
    );
    winGlass.position.set(0.0, 2.75, -2.51);
    habitatGroup.add(winGlass);

    // Left & Right Airlock Hatches
    const leftHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.42, 22), darkMetalMat);
    leftHatch.rotation.z = Math.PI / 2;
    leftHatch.position.set(-5.25, 1.38, 0.0);
    habitatGroup.add(leftHatch);

    const rightHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.42, 22), darkMetalMat);
    rightHatch.rotation.z = Math.PI / 2;
    rightHatch.position.set(5.25, 1.38, 0.0);
    habitatGroup.add(rightHatch);

    // FIRST-PERSON + EXTERIOR FRONT ENCLOSURE WALL (hidden only in Overview cutaway!)
    const enclosedFrontGroup = new THREE.Group();
    const frontWallLower = new THREE.Mesh(
      new THREE.BoxGeometry(10.4, 1.15, 0.14),
      hullInnerMat
    );
    frontWallLower.position.set(0, 0.68, 2.66);
    enclosedFrontGroup.add(frontWallLower);

    const frontWallUpper = new THREE.Mesh(
      new THREE.CylinderGeometry(2.95, 2.95, 10.5, 32, 1, true, -Math.PI * 0.04, Math.PI * 0.48),
      hullInnerMat
    );
    frontWallUpper.rotation.z = Math.PI / 2;
    frontWallUpper.position.set(0, 1.38, 0);
    enclosedFrontGroup.add(frontWallUpper);

    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.14), hullInnerMat);
    frontWallL.position.set(-3.6, 1.9, 2.66);
    enclosedFrontGroup.add(frontWallL);

    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 0.14), hullInnerMat);
    frontWallR.position.set(3.6, 1.9, 2.66);
    enclosedFrontGroup.add(frontWallR);

    const frontViewportFrame = new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.1, 0.18), darkMetalMat);
    frontViewportFrame.position.set(0, 1.85, 2.66);
    // Keep center transparent by using border bars
    frontViewportFrame.scale.set(1, 0.08, 1);
    frontViewportFrame.position.set(0, 1.28, 2.66);
    enclosedFrontGroup.add(frontViewportFrame);

    const frontViewportTop = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.1, 0.18), darkMetalMat);
    frontViewportTop.position.set(0, 2.38, 2.66);
    enclosedFrontGroup.add(frontViewportTop);

    const frontViewportGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.05),
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.16,
        roughness: 0.08,
        metalness: 0.1,
        side: THREE.DoubleSide,
      })
    );
    frontViewportGlass.position.set(0, 1.83, 2.66);
    enclosedFrontGroup.add(frontViewportGlass);

    // Endcap interior bulkheads so FPV looking left/right feels inside a real pressurized vessel
    const leftBulkhead = new THREE.Mesh(new THREE.CircleGeometry(2.92, 28), hullInnerMat);
    leftBulkhead.rotation.y = Math.PI / 2;
    leftBulkhead.position.set(-5.18, 1.38, 0);
    enclosedFrontGroup.add(leftBulkhead);

    const rightBulkhead = new THREE.Mesh(new THREE.CircleGeometry(2.92, 28), hullInnerMat);
    rightBulkhead.rotation.y = -Math.PI / 2;
    rightBulkhead.position.set(5.18, 1.38, 0);
    enclosedFrontGroup.add(rightBulkhead);

    enclosedFrontGroup.visible = viewModeRef.current !== 'interior';
    habitatGroup.add(enclosedFrontGroup);

    // EXTERIOR-ONLY FULL CLOSED SHELL, LANDING LEGS, COMMS DISH & PHOTOVOLTAIC WINGS
    const exteriorOnlyGroup = new THREE.Group();
    const frontCurvedHull = new THREE.Mesh(
      new THREE.CylinderGeometry(2.98, 2.98, 10.5, 32, 1, true, -Math.PI * 0.85, Math.PI * 1.3),
      outerShellMat
    );
    frontCurvedHull.rotation.z = Math.PI / 2;
    frontCurvedHull.position.set(0, 1.38, 0);
    exteriorOnlyGroup.add(frontCurvedHull);

    const domeGeo = new THREE.SphereGeometry(2.95, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const leftDome = new THREE.Mesh(domeGeo, outerShellMat);
    leftDome.rotation.z = Math.PI / 2;
    leftDome.scale.set(1, 0.52, 1);
    leftDome.position.set(-5.25, 1.38, 0);
    exteriorOnlyGroup.add(leftDome);

    const rightDome = new THREE.Mesh(domeGeo, outerShellMat);
    rightDome.rotation.z = -Math.PI / 2;
    rightDome.scale.set(1, 0.52, 1);
    rightDome.position.set(5.25, 1.38, 0);
    exteriorOnlyGroup.add(rightDome);

    // Exterior front viewport glass
    const frontWindow = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 2.2, 8, 14),
      new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.08, metalness: 0.85, clearcoat: 1 })
    );
    frontWindow.rotation.z = Math.PI / 2;
    frontWindow.position.set(0, 1.78, 2.94);
    exteriorOnlyGroup.add(frontWindow);

    // Solar Array Wings with textured Photovoltaic Cells
    const solarPanelMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.22,
      metalness: 0.65,
      emissive: 0x0a1e3d,
      emissiveIntensity: 0.22,
    });
    const solarWingL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 2.1), solarPanelMat);
    solarWingL.position.set(-2.7, 4.65, -0.35);
    solarWingL.rotation.x = 0.26;
    exteriorOnlyGroup.add(solarWingL);

    const solarWingR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 2.1), solarPanelMat);
    solarWingR.position.set(2.7, 4.65, -0.35);
    solarWingR.rotation.x = 0.26;
    exteriorOnlyGroup.add(solarWingR);

    // Dorsal High-Gain Comms Dish & Thermal Radiator Fins
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 4.55, 0.2);
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 12), titaniumMat);
    dishGroup.add(dishMast);
    const dishBowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.4, side: THREE.DoubleSide })
    );
    dishBowl.position.set(0, 0.42, 0.1);
    dishBowl.rotation.x = Math.PI * 0.68;
    dishGroup.add(dishBowl);
    exteriorOnlyGroup.add(dishGroup);

    // 4 Grounded Landing Legs with Footpads at y = 0
    for (const [lx, lz] of [
      [-4.2, 2.65],
      [4.2, 2.65],
      [-4.2, -2.65],
      [4.2, -2.65],
    ]) {
      const legStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.35, 10), titaniumMat);
      legStrut.position.set(lx, 0.56, lz * 0.92);
      legStrut.rotation.x = lz > 0 ? -0.34 : 0.34;
      exteriorOnlyGroup.add(legStrut);

      const footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.12, 16), darkMetalMat);
      footPad.position.set(lx, 0.04, lz * 1.05);
      exteriorOnlyGroup.add(footPad);
    }

    exteriorOnlyGroup.visible = viewModeRef.current === 'exterior';
    habitatGroup.add(exteriorOnlyGroup);

    // =========================================================================
    // RADIATION SHELTER & WATER BAGS WALL
    // =========================================================================
    const interactiveStationGroups: THREE.Object3D[] = [];
    const tagStation = (obj: THREE.Object3D, id: StationId) => {
      obj.userData.stationId = id;
      obj.traverse((child) => {
        child.userData.stationId = id;
      });
      interactiveStationGroups.push(obj);
    };

    const shelterArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.055, 10, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffb84d })
    );
    shelterArch.rotation.y = Math.PI / 2;
    shelterArch.position.set(-3.95, 0.25, 0);
    tagStation(shelterArch, 'radiation-shelter');
    habitatGroup.add(shelterArch);

    const shelterField = new THREE.Mesh(
      new THREE.CircleGeometry(1.82, 28, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffb84d, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    );
    shelterField.rotation.y = Math.PI / 2;
    shelterField.position.set(-3.95, 0.25, 0);
    habitatGroup.add(shelterField);

    const shieldArch = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.06, 10, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4 })
    );
    shieldArch.rotation.y = Math.PI / 2;
    shieldArch.position.set(4.55, 0.25, 0);
    habitatGroup.add(shieldArch);

    const shieldField = new THREE.Mesh(
      new THREE.CircleGeometry(1.76, 28, 0, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    shieldField.rotation.y = Math.PI / 2;
    shieldField.position.set(4.55, 0.25, 0);
    habitatGroup.add(shieldField);

    const waterBlockMeshes: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const bGrp = new THREE.Group();
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.82,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.4,
      });
      const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.38, 8, 14), mat);
      tank.rotation.x = Math.PI / 2;
      tank.castShadow = true;
      bGrp.add(tank);

      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.025, 8, 18),
        new THREE.MeshStandardMaterial({ color: 0x37d6f4, metalness: 0.6, roughness: 0.2 })
      );
      bGrp.add(band);

      bGrp.position.set(4.1, 0.36 + i * 0.46, -0.25 + (i % 2) * 0.48);
      tagStation(bGrp, 'water-blocks');
      habitatGroup.add(bGrp);
      waterBlockMeshes.push(bGrp);
    }

    // =========================================================================
    // ROW OF 6 ARCADE-STYLE LIFE-SUPPORT MACHINES (SPACIOUS BACK LINE)
    // =========================================================================
    const arcadeSpecs: {
      stationId: StationId;
      systemId: SystemId;
      title: string;
      accentHex: number;
      accentCss: string;
      x: number;
      z: number;
    }[] = [
      { stationId: 'oxygen-generator', systemId: 'oxygenGenerator', title: 'O2 GEN', accentHex: 0x37d6f4, accentCss: '#37D6F4', x: -2.75, z: -2.05 },
      { stationId: 'co2-scrubber', systemId: 'co2Scrubber', title: 'CO2 SCRUB', accentHex: 0x37d67a, accentCss: '#37D67A', x: -1.65, z: -2.05 },
      { stationId: 'water-recycler', systemId: 'waterRecycler', title: 'H2O RECYC', accentHex: 0x38bdf8, accentCss: '#38BDF8', x: -0.55, z: -2.05 },
      { stationId: 'greenhouse', systemId: 'greenhouse', title: 'GREENHSE', accentHex: 0x4ade80, accentCss: '#4ADE80', x: 0.55, z: -2.05 },
      { stationId: 'solar-array', systemId: 'solarArray', title: 'SOLAR SYS', accentHex: 0xfbbf24, accentCss: '#FBBF24', x: 1.65, z: -2.05 },
      { stationId: 'battery-system', systemId: 'batterySystem', title: 'BATTERY', accentHex: 0xff7a3d, accentCss: '#FF7A3D', x: 2.75, z: -2.05 },
    ];

    const arcadeHandles = new Map<SystemId, { stationId: StationId; handle: ArcadeMachineHandle }>();
    for (const spec of arcadeSpecs) {
      const handle = createArcadeMachineGroup({
        title: spec.title,
        accentHex: spec.accentHex,
        accentCss: spec.accentCss,
      });
      handle.group.position.set(spec.x, 0.12, spec.z);
      tagStation(handle.group, spec.stationId);
      habitatGroup.add(handle.group);
      arcadeHandles.set(spec.systemId, { stationId: spec.stationId, handle });
    }

    // Hydroponic Crop Planter Box right in front-side of Greenhouse arcade cabinet
    const cropLeaves: THREE.Mesh[] = [];
    const cropGroup = new THREE.Group();
    cropGroup.position.set(0.55, 0.12, -1.56);
    const planterTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.12, 0.24),
      darkMetalMat
    );
    planterTray.position.y = 0.06;
    cropGroup.add(planterTray);
    const cropMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
    for (let i = -1; i <= 1; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), cropMat);
      leaf.position.set(i * 0.17, 0.18, 0);
      cropGroup.add(leaf);
      cropLeaves.push(leaf);
    }
    tagStation(cropGroup, 'greenhouse');
    habitatGroup.add(cropGroup);

    // =========================================================================
    // PHYSICAL WATER DISPENSER, TOILET & WASTE BAY, MISSION DESK & PODS
    // =========================================================================
    const stationIndicatorMap = new Map<StationId, THREE.Mesh>();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.38, metalness: 0.45 });
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.6 });

    const attachLed = (id: StationId, grp: THREE.Group, y: number) => {
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x37d67a })
      );
      led.position.set(0, y, 0);
      grp.add(led);
      stationIndicatorMap.set(id, led);
    };

    // Water Dispenser (x: 3.75, z: -1.75)
    const dispGrp = new THREE.Group();
    dispGrp.position.set(3.75, 0.12, -1.75);
    const dispBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.86, 16), slateMat);
    dispBody.position.y = 0.43;
    dispGrp.add(dispBody);
    const dispJug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.42, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.78, roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.35 })
    );
    dispJug.position.y = 1.07;
    dispGrp.add(dispJug);
    const dispSpout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.16), metalMat);
    dispSpout.position.set(0, 0.72, 0.24);
    dispGrp.add(dispSpout);
    attachLed('water-dispenser', dispGrp, 1.38);
    tagStation(dispGrp, 'water-dispenser');
    habitatGroup.add(dispGrp);

    // Toilet & Waste Separation Facility (x: -3.45, z: 1.85)
    const toiletGrp = new THREE.Group();
    toiletGrp.position.set(-3.45, 0.12, 1.85);
    const toiletBase = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.5), darkMetalMat);
    toiletBase.position.y = 0.07;
    toiletGrp.add(toiletBase);
    const toiletSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.42, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 })
    );
    toiletSeat.position.set(-0.14, 0.35, 0);
    toiletGrp.add(toiletSeat);
    const solidCanister = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.56, 14),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.4 })
    );
    solidCanister.position.set(0.18, 0.42, -0.05);
    toiletGrp.add(solidCanister);
    const liquidPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.65, 10),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4 })
    );
    liquidPipe.position.set(-0.14, 0.48, -0.18);
    toiletGrp.add(liquidPipe);
    attachLed('toilet-facility', toiletGrp, 0.96);
    tagStation(toiletGrp, 'toilet-facility');
    habitatGroup.add(toiletGrp);

    // Mission Control Center Desk (x: 0.0, z: -0.22)
    const mcGrp = new THREE.Group();
    mcGrp.position.set(0.0, 0.12, -0.22);
    const mcPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.66, 18), slateMat);
    mcPedestal.position.y = 0.33;
    mcGrp.add(mcPedestal);
    const mcHolo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.22, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mcHolo.position.y = 0.84;
    mcGrp.add(mcHolo);
    attachLed('mission-control', mcGrp, 1.14);
    tagStation(mcGrp, 'mission-control');
    habitatGroup.add(mcGrp);

    // Remaining rounded pods
    const makeRoundedStation = (id: StationId, x: number, z: number, colorHex: number, ringHex: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.12, z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.16, 18), darkMetalMat);
      base.position.y = 0.08;
      g.add(base);
      const pod = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.26, 0.4, 8, 16),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.3 })
      );
      pod.position.y = 0.48;
      pod.castShadow = true;
      g.add(pod);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.03, 8, 20),
        new THREE.MeshBasicMaterial({ color: ringHex })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.6;
      g.add(ring);
      attachLed(id, g, 1.05);
      tagStation(g, id);
      habitatGroup.add(g);
    };

    // Physical Shared Food Storage Box / Pantry Locker (x: 3.35, z: 1.85)
    const foodLockerGrp = new THREE.Group();
    foodLockerGrp.position.set(3.35, 0.12, 1.85);
    const lockerFrame = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.98, 0.54), slateMat);
    lockerFrame.position.y = 0.49;
    lockerFrame.castShadow = true;
    foodLockerGrp.add(lockerFrame);
    const lockerTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.09, 0.58),
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        emissive: 0x15803d,
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    lockerTrim.position.y = 0.99;
    foodLockerGrp.add(lockerTrim);
    const lockerDoorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.68, 0.04),
      new THREE.MeshPhysicalMaterial({
        color: 0xbbf7d0,
        transparent: true,
        opacity: 0.28,
        roughness: 0.1,
      })
    );
    lockerDoorGlass.position.set(0, 0.5, -0.27);
    foodLockerGrp.add(lockerDoorGlass);
    const pantryColors = [0x4ade80, 0x22c55e, 0x38bdf8];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const pack = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.18),
          new THREE.MeshStandardMaterial({
            color: pantryColors[(row + col) % pantryColors.length],
            roughness: 0.35,
          })
        );
        pack.position.set(-0.2 + col * 0.2, 0.32 + row * 0.32, -0.18);
        foodLockerGrp.add(pack);
      }
    }
    attachLed('food-cabinet', foodLockerGrp, 1.16);
    tagStation(foodLockerGrp, 'food-cabinet');
    habitatGroup.add(foodLockerGrp);

    makeRoundedStation('tool-cabinet', -1.75, 1.85, 0xd97706, 0xffb84d);
    makeRoundedStation('crew-bunks', -3.85, -1.75, 0x2563eb, 0x60a5fa);
    makeRoundedStation('manual-terminal', 1.75, 1.85, 0x1e293b, 0x37d6f4);

    // Highlight & Move Rings + Repair Spark Ring
    const highlightRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.68, 32),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    highlightRing.rotation.x = -Math.PI / 2;
    highlightRing.position.y = 0.14;
    highlightRing.visible = false;
    habitatGroup.add(highlightRing);

    const moveMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.28, 24),
      new THREE.MeshBasicMaterial({ color: 0x37d67a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    moveMarker.rotation.x = -Math.PI / 2;
    moveMarker.position.y = 0.14;
    moveMarker.visible = false;
    habitatGroup.add(moveMarker);

    const repairPulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.62, 24),
      new THREE.MeshBasicMaterial({ color: 0x37d6f4, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    repairPulseRing.rotation.x = -Math.PI / 2;
    repairPulseRing.position.y = 0.16;
    repairPulseRing.visible = false;
    habitatGroup.add(repairPulseRing);

    // Dynamic Floor Pickups (supports initial + freshly dropped items!)
    const pickupMeshMap = new Map<string, THREE.Group>();
    const createPickupMesh = (wp: WorldPickup) => {
      const pGrp = new THREE.Group();
      const isFresh = wp.itemId === 'fresh-crop';
      const isMeal = wp.itemId === 'meal-pack';
      const isWater = wp.itemId === 'water-pack';

      const colorHex = isFresh ? 0x4ade80 : isMeal ? 0x22c55e : isWater ? 0x38bdf8 : 0xffb84d;
      const emissiveHex = isFresh ? 0x15803d : isMeal ? 0x166534 : isWater ? 0x0284c7 : 0xd97706;

      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.25,
        emissive: emissiveHex,
        emissiveIntensity: 0.45,
      });

      if (isFresh || isMeal) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.2), mat);
        pGrp.add(crate);
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.04, 0.21),
          new THREE.MeshBasicMaterial({ color: isFresh ? 0xbbf7d0 : 0xfde68a })
        );
        strip.position.y = 0.04;
        pGrp.add(strip);
      } else {
        const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.15, 6, 12), mat);
        cap.rotation.z = Math.PI / 2;
        pGrp.add(cap);
      }

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.24, 20),
        new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.16;
      pGrp.add(ring);

      pGrp.position.set(wp.position.x, wp.position.y, wp.position.z);
      habitatGroup.add(pGrp);
      pickupMeshMap.set(wp.uid, pGrp);
      return pGrp;
    };

    for (const wp of pickupsRef.current) {
      createPickupMesh(wp);
    }

    // Player Astronaut + 3 Autonomous Roaming Crewmates (createAstronautGroup preserved!)
    const playerRig = createAstronautGroup(0xff7a3d, true);
    playerRig.group.scale.setScalar(0.95);
    const startPos = useGameStore.getState().character.position;
    playerRig.group.position.set(startPos.x, 0.12, startPos.z);
    habitatGroup.add(playerRig.group);

    const crewRigs = [
      {
        id: 'crew-1',
        rig: createAstronautGroup(0x37d6f4),
        waypoints: [{ x: -2.2, z: -0.9 }, { x: -1.1, z: -0.95 }, { x: -2.5, z: 0.45 }],
        wpIdx: 0,
        phase: 0,
      },
      {
        id: 'crew-2',
        rig: createAstronautGroup(0x37d67a),
        waypoints: [{ x: 2.1, z: -0.9 }, { x: 2.9, z: 0.25 }, { x: 1.2, z: 0.65 }],
        wpIdx: 0,
        phase: 1.7,
      },
      {
        id: 'crew-3',
        rig: createAstronautGroup(0xffb84d),
        waypoints: [{ x: -2.95, z: 0.65 }, { x: -1.1, z: 0.85 }, { x: -3.2, z: 0.05 }],
        wpIdx: 0,
        phase: 3.1,
      },
    ];
    crewRigs.forEach((c) => {
      c.rig.group.scale.setScalar(0.86);
      c.rig.group.position.set(c.waypoints[0].x, 0.12, c.waypoints[0].z);
      habitatGroup.add(c.rig.group);
    });

    // Keyboard & Pointer Interaction (Overview + First-Person View!)
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        useGameStore.getState().setMoveTarget(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let camYawOffset = 0;
    let fpvYaw = 0; // 0 looks toward -Z (the 6 arcade cabinets & Mission Desk!)
    let fpvPitch = -0.05;
    let pointerDown = false;
    let dragDist = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (viewModeRef.current === 'interior' || viewModeRef.current === 'first-person') {
        pointerDown = true;
        dragDist = 0;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerDown) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragDist += Math.hypot(dx, dy);

      if (viewModeRef.current === 'interior' && dragDist > 12) {
        camYawOffset = THREE.MathUtils.clamp(camYawOffset - dx * 0.004, -0.7, 0.7);
      } else if (viewModeRef.current === 'first-person' && dragDist > 4) {
        fpvYaw -= dx * 0.0045;
        fpvPitch = THREE.MathUtils.clamp(fpvPitch - dy * 0.0038, -1.02, 1.02);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const mode = viewModeRef.current;
      if (pointerDown && (mode === 'interior' || mode === 'first-person') && dragDist < 10) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const activeCam = mode === 'first-person' ? fpvCam : interiorCam;
        raycaster.setFromCamera(pointerNdc, activeCam);

        // 1) Check direct click on a 3D machine/station first
        const stHits = raycaster.intersectObjects(interactiveStationGroups, true);
        if (stHits.length > 0) {
          const hitId = stHits[0].object.userData.stationId as StationId | undefined;
          const st = hitId ? HABITAT_STATIONS.find((s) => s.id === hitId) : undefined;
          if (st) {
            const store = useGameStore.getState();
            const d = Math.hypot(
              playerRig.group.position.x - st.x,
              playerRig.group.position.z - st.z
            );
            if (d <= INTERACTION_DISTANCE) {
              store.performQuickStationAction(st.id);
            } else {
              store.setMoveTarget({ x: st.walkX, z: st.walkZ, stationId: st.id });
            }
            pointerDown = false;
            return;
          }
        }

        // 2) Otherwise walk to clicked floor point
        const hits = raycaster.intersectObject(floorHitPlane);
        if (hits.length > 0) {
          const pt = hits[0].point;
          const clampedX = THREE.MathUtils.clamp(pt.x, -4.45, 4.45);
          const clampedZ = THREE.MathUtils.clamp(pt.z, -2.1, 2.1);
          useGameStore.getState().setMoveTarget({ x: clampedX, z: clampedZ });
        }
      }
      pointerDown = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      interiorCam.aspect = w / h;
      interiorCam.updateProjectionMatrix();
      fpvCam.aspect = w / h;
      fpvCam.updateProjectionMatrix();
      exteriorCam.aspect = w / h;
      exteriorCam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const checkCollision = (nx: number, nz: number): boolean => {
      if (nx < -4.55 || nx > 4.55 || nz < -2.22 || nz > 2.22) return true;
      for (const st of HABITAT_STATIONS) {
        if (!st.solid) continue;
        if (Math.abs(nx - st.x) < st.halfW + 0.2 && Math.abs(nz - st.z) < st.halfD + 0.2) {
          return true;
        }
      }
      return false;
    };

    const pacer = createAfterDrawPacer(renderer);
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let walkPhase = 0;
    let footstepAccum = 0;
    let uiSyncAccum = 0;
    let overlayAccum = 0;

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();
      const store = useGameStore.getState();
      const mode = viewModeRef.current;
      const isOverview = mode === 'interior';
      const isFirstPerson = mode === 'first-person';
      const isInside = isOverview || isFirstPerson;

      enclosedFrontGroup.visible = !isOverview;
      exteriorOnlyGroup.visible = mode === 'exterior';
      controls.enabled = mode === 'exterior';
      playerRig.group.visible = !isFirstPerson;

      // Storm Particles
      const stormActive = dustStormRef.current > 0 || radHazardRef.current;
      stormMesh.visible = stormActive;
      if (stormActive) {
        cabinLight.color.setHex(isMars ? 0xffcaa6 : 0xffe4a3);
        stormSeeds.forEach((p, idx) => {
          p.x += p.speed * dt;
          if (p.x > 9.5) p.x = -9.5;
          dummy.position.set(p.x, p.y + Math.sin(elapsed * 3 + idx) * 0.12, p.z);
          dummy.rotation.set(0, 0, Math.PI / 2);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          stormMesh.setMatrixAt(idx, dummy.matrix);
        });
        stormMesh.instanceMatrix.needsUpdate = true;
      } else {
        cabinLight.color.setHex(0xe0f7ff);
      }

      mcHolo.rotation.y += dt * 0.9;

      // Update Greenhouse foliage visually
      const ghState = store.greenhouseState;
      const cropScale = ghState.stage === 'ready' ? 1.38 : 0.65 + (ghState.growthProgress / 100) * 0.65;
      cropLeaves.forEach((leaf) => leaf.scale.setScalar(cropScale));
      cropMat.color.setHex(
        ghState.stage === 'unhealthy' ? 0xa16207 : ghState.stage === 'ready' ? 0x4ade80 : 0x22c55e
      );

      // Update all 6 Arcade Machine cabinets (screens, switches, LEDs, 3D warning triangles!)
      const sysMap = systemsRef.current;
      const condMap = store.machineConditions;
      const togMap = store.toggles;

      const metricFor = (sysId: SystemId): string => {
        if (sysId === 'oxygenGenerator') return `O2: ${Math.round(store.resources.oxygen)}%`;
        if (sysId === 'co2Scrubber') return `CO2: ${Math.round(store.resources.co2)}%`;
        if (sysId === 'waterRecycler') return `H2O: ${Math.round(store.resources.water)}%`;
        if (sysId === 'greenhouse') {
          return ghState.stage === 'ready' ? 'HARVEST READY!' : `CROP: ${Math.round(ghState.growthProgress)}%`;
        }
        if (sysId === 'solarArray') return `COND: ${Math.round(condMap.solarArray)}%`;
        return `BATT: ${Math.round(store.resources.battery)}%`;
      };

      arcadeHandles.forEach(({ handle }, sysId) => {
        const status = sysMap[sysId];
        const cond = Math.round(condMap[sysId]);
        const isOn = togMap[sysId as keyof typeof togMap] ?? true;
        const healthy = isMachineHealthy(status, cond);
        const metricLine = metricFor(sysId);

        handle.switchLever.rotation.x = isOn ? -0.45 : 0.55;
        handle.warningTriangle.visible = !healthy;
        if (!healthy) {
          handle.warningTriangle.position.y = 1.76 + Math.sin(elapsed * 4.5) * 0.06;
          handle.warningTriangle.rotation.y = Math.sin(elapsed * 2) * 0.35;
          (handle.sparkRing.material as THREE.MeshBasicMaterial).opacity =
            0.3 + Math.abs(Math.sin(elapsed * 8)) * 0.5;
        } else {
          (handle.sparkRing.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        const ledCol = !healthy ? 0xff5b68 : !isOn ? 0x64748b : 0x37d67a;
        (handle.statusLed.material as THREE.MeshBasicMaterial).color.setHex(ledCol);

        const nextKey = `${status}|${isOn}|${metricLine}|${healthy}`;
        if (handle.lastKey !== nextKey) {
          handle.lastKey = nextKey;
          drawArcadeScreenCanvas(
            handle.screenCanvas,
            handle.title,
            handle.accentHexStr,
            `${cond}%`,
            isOn,
            metricLine,
            !healthy
          );
          handle.screenTexture.needsUpdate = true;
        }
      });

      // Exterior Solar Panel Wing Visual State (damage / dust storm tinting)
      const solarHealthy = isMachineHealthy(sysMap.solarArray, condMap.solarArray);
      if (!solarHealthy) {
        solarPanelMat.color.setHex(0xb45309);
        solarPanelMat.emissive.setHex(0x7c2d12);
        solarPanelMat.emissiveIntensity = 0.42;
      } else if (isMars && dustStormRef.current > 0) {
        solarPanelMat.color.setHex(0xb07c58);
        solarPanelMat.emissive.setHex(0x27190e);
        solarPanelMat.emissiveIntensity = 0.16;
      } else {
        solarPanelMat.color.setHex(0xffffff);
        solarPanelMat.emissive.setHex(0x0a1e3d);
        solarPanelMat.emissiveIntensity = 0.22;
      }

      // Water-Barrier Bags placement inside expanded right shield wing
      const reinforced = blocksRef.current;
      waterBlockMeshes.forEach((blk, idx) => {
        const active = idx < reinforced;
        blk.position.x = THREE.MathUtils.lerp(blk.position.x, active ? 4.1 : 3.45, 0.12);
        blk.position.y = active ? 0.34 + idx * 0.44 : 0.34 + Math.sin(elapsed * 2 + idx) * 0.05;
      });

      // Dynamic Pickups Sync & Bobbing
      for (const wp of pickupsRef.current) {
        let mesh = pickupMeshMap.get(wp.uid);
        if (!mesh && !wp.collected) {
          mesh = createPickupMesh(wp);
        }
        if (mesh) {
          mesh.visible = !wp.collected;
          if (!wp.collected) {
            mesh.position.x = wp.position.x;
            mesh.position.z = wp.position.z;
            mesh.position.y = 0.3 + Math.sin(elapsed * 2.5 + wp.position.x) * 0.055;
            mesh.rotation.y += dt * 1.25;
          }
        }
      }

      // Repair & Action Animation Check
      const nowMs = Date.now();
      const rAnim = store.repairAnim;
      const isRepairing = Boolean(rAnim && nowMs < rAnim.endsAt);
      const aAnim = store.actionAnim;
      const actionActive = Boolean(aAnim && nowMs < aAnim.endsAt);

      if (isRepairing && rAnim) {
        const targetSt = HABITAT_STATIONS.find((s) => s.id === rAnim.stationId);
        if (targetSt) {
          playerRig.wrenchTool.visible = true;
          playerRig.waterBottleProp.visible = false;
          playerRig.foodPackProp.visible = false;
          playerRig.rightArm.rotation.x = -1.1 + Math.sin(elapsed * 18) * 0.45;
          playerRig.rightArm.rotation.z = -0.15;
          const dx = targetSt.x - playerRig.group.position.x;
          const dz = targetSt.z - playerRig.group.position.z;
          playerRig.group.rotation.y = Math.atan2(dx, dz);
          repairPulseRing.visible = true;
          repairPulseRing.position.set(targetSt.x, 0.16, targetSt.z);
          repairPulseRing.scale.setScalar(0.85 + Math.sin(elapsed * 14) * 0.25);
        }
      } else {
        playerRig.wrenchTool.visible = false;
        repairPulseRing.visible = false;
      }

      const applyActionAnimation = (
        rig: typeof playerRig,
        crewId: string
      ): boolean => {
        if (!actionActive || !aAnim || aAnim.targetCrewId !== crewId) {
          rig.waterBottleProp.visible = false;
          rig.foodPackProp.visible = false;
          rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0, 0.2);
          return false;
        }
        if (aAnim.type === 'drink') {
          rig.waterBottleProp.visible = true;
          rig.foodPackProp.visible = false;
          rig.rightArm.rotation.x = -1.68 + Math.sin(elapsed * 9) * 0.14;
          rig.rightArm.rotation.z = 0.34;
          rig.headGroup.rotation.x = -0.18;
          return true;
        }
        if (aAnim.type === 'eat') {
          rig.waterBottleProp.visible = false;
          rig.foodPackProp.visible = true;
          rig.rightArm.rotation.x = -1.52 + Math.sin(elapsed * 12) * 0.16;
          rig.rightArm.rotation.z = 0.28;
          rig.headGroup.rotation.x = Math.sin(elapsed * 12) * 0.08;
          return true;
        }
        if (aAnim.type === 'pickup' || aAnim.type === 'drop') {
          rig.waterBottleProp.visible = false;
          rig.foodPackProp.visible = false;
          rig.rightArm.rotation.x = -1.05;
          rig.leftArm.rotation.x = -0.55;
          rig.headGroup.rotation.x = 0.24;
          return true;
        }
        rig.waterBottleProp.visible = false;
        rig.foodPackProp.visible = false;
        return false;
      };

      // Movement & Nearest Interactable
      let nearestSt: StationDef | null = null;
      let nearestDist = INTERACTION_DISTANCE;
      let nearestPickupUid: string | null = null;
      let nearestPickupLabel = '';

      if (
        isInside &&
        store.missionStatus === 'active' &&
        !store.activeModal &&
        !store.activePuzzle
      ) {
        let inputX = store.touchMoveVector.x;
        let inputZ = store.touchMoveVector.y;
        if (keys['KeyW'] || keys['ArrowUp']) inputZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) inputZ += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

        let moveX = inputX;
        let moveZ = inputZ;

        // In First-Person view, transform WASD / joystick relative to camera yaw
        if (isFirstPerson && Math.hypot(inputX, inputZ) > 0.05) {
          const forwardAmount = -inputZ; // W gives -1 -> +1 forward
          const strafeAmount = inputX;   // D gives +1 -> +1 right
          const cosY = Math.cos(fpvYaw);
          const sinY = Math.sin(fpvYaw);
          moveX = -sinY * forwardAmount + cosY * strafeAmount;
          moveZ = -cosY * forwardAmount - sinY * strafeAmount;
        }

        const mTarget = store.moveTarget;
        if (Math.hypot(inputX, inputZ) < 0.05 && mTarget) {
          const dx = mTarget.x - playerRig.group.position.x;
          const dz = mTarget.z - playerRig.group.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.24) {
            moveMarker.visible = false;
            const arrivedStation = mTarget.stationId;
            store.setMoveTarget(null);
            if (arrivedStation) {
              store.performQuickStationAction(arrivedStation);
            }
          } else {
            moveX = dx / dist;
            moveZ = dz / dist;
            moveMarker.visible = true;
            moveMarker.position.set(mTarget.x, 0.14, mTarget.z);
          }
        } else {
          moveMarker.visible = false;
        }

        const mag = Math.hypot(moveX, moveZ);
        let movedDist = 0;
        if (mag > 0.05 && !isRepairing) {
          const nxDir = moveX / Math.max(1, mag);
          const nzDir = moveZ / Math.max(1, mag);
          const step = PLAYER_SPEED * dt;
          const curX = playerRig.group.position.x;
          const curZ = playerRig.group.position.z;

          let nextX = curX;
          let nextZ = curZ;
          if (!checkCollision(curX + nxDir * step, curZ)) nextX = curX + nxDir * step;
          if (!checkCollision(nextX, curZ + nzDir * step)) nextZ = curZ + nzDir * step;

          movedDist = Math.hypot(nextX - curX, nextZ - curZ);
          playerRig.group.position.x = nextX;
          playerRig.group.position.z = nextZ;

          const targetRot = Math.atan2(nxDir, nzDir);
          playerRig.group.rotation.y = THREE.MathUtils.lerp(
            playerRig.group.rotation.y,
            targetRot,
            1 - Math.exp(-10 * dt)
          );

          walkPhase += dt * (isMars ? 9 : 6.5);
          if (movedDist > 0.005) {
            footstepAccum += dt;
            if (footstepAccum >= 0.34) {
              footstepAccum = 0;
              playSound('footstep', {
                muted: store.savedProgress.muted,
                volume: store.savedProgress.volume,
              });
            }
          }
          const swing = Math.sin(walkPhase) * 0.45;
          playerRig.leftLeg.rotation.x = swing;
          playerRig.rightLeg.rotation.x = -swing;
          if (!applyActionAnimation(playerRig, 'player')) {
            playerRig.leftArm.rotation.x = -swing * 0.65;
            playerRig.rightArm.rotation.x = swing * 0.65;
            playerRig.rightArm.rotation.z = -0.24;
          }
          playerRig.group.position.y =
            0.12 + Math.abs(Math.sin(walkPhase)) * (isMars ? 0.04 : 0.1);
        } else if (!isRepairing) {
          footstepAccum = 0.22;
          playerRig.leftLeg.rotation.x = THREE.MathUtils.lerp(playerRig.leftLeg.rotation.x, 0, 0.15);
          playerRig.rightLeg.rotation.x = THREE.MathUtils.lerp(playerRig.rightLeg.rotation.x, 0, 0.15);
          if (!applyActionAnimation(playerRig, 'player')) {
            playerRig.leftArm.rotation.x = THREE.MathUtils.lerp(playerRig.leftArm.rotation.x, 0, 0.15);
            playerRig.rightArm.rotation.x = THREE.MathUtils.lerp(playerRig.rightArm.rotation.x, 0, 0.15);
            playerRig.rightArm.rotation.z = THREE.MathUtils.lerp(playerRig.rightArm.rotation.z, -0.24, 0.15);
          }
          playerRig.group.position.y =
            0.12 + (isMars ? 0.02 : 0.07 + Math.sin(elapsed * 2) * 0.04);
        }

        for (const wp of pickupsRef.current) {
          if (wp.collected) continue;
          const d = Math.hypot(
            playerRig.group.position.x - wp.position.x,
            playerRig.group.position.z - wp.position.z
          );
          if (d < nearestDist) {
            nearestDist = d;
            nearestPickupUid = wp.uid;
            nearestPickupLabel = wp.label;
          }
        }
        if (!nearestPickupUid) {
          let bestStDist = INTERACTION_DISTANCE;
          for (const st of HABITAT_STATIONS) {
            const d = Math.hypot(
              playerRig.group.position.x - st.x,
              playerRig.group.position.z - st.z
            );
            if (d < bestStDist) {
              bestStDist = d;
              nearestSt = st;
            }
          }
        }

        // Nearby damaged arcade machine electrical spark audio cue (cooldown-throttled)
        if (nearestSt) {
          const stSysMap: Partial<Record<StationId, SystemId>> = {
            'oxygen-generator': 'oxygenGenerator',
            'co2-scrubber': 'co2Scrubber',
            'water-recycler': 'waterRecycler',
            greenhouse: 'greenhouse',
            'solar-array': 'solarArray',
            'battery-system': 'batterySystem',
          };
          const nearSys = stSysMap[nearestSt.id];
          if (nearSys && sysMap[nearSys] !== 'Operational') {
            playSound('machine-spark', {
              muted: store.savedProgress.muted,
              volume: store.savedProgress.volume,
            });
          }
        }

        uiSyncAccum += dt;
        if (movedDist > 0 || uiSyncAccum > 0.1) {
          uiSyncAccum = 0;
          store.updatePlayerPosition(
            {
              x: playerRig.group.position.x,
              y: playerRig.group.position.y,
              z: playerRig.group.position.z,
            },
            movedDist
          );
          store.setNearbyInteractable(nearestSt?.id ?? null, nearestPickupUid);
        }
      }

      // Autonomous Crew Roaming + Picking Up Dropped Floor Food + Eating/Drinking Animations
      const droppedFoodPickups = pickupsRef.current.filter(
        (wp) =>
          !wp.collected &&
          wp.zone === 'interior' &&
          (wp.itemId === 'fresh-crop' || wp.itemId === 'meal-pack')
      );

      crewRigs.forEach((c, idx) => {
        const crewActionPose = applyActionAnimation(c.rig, c.id);
        const assignedDrop =
          !radHazardRef.current && droppedFoodPickups.length > 0 && idx === 0
            ? droppedFoodPickups[0]
            : !radHazardRef.current && droppedFoodPickups.length > 1 && idx === 1
              ? droppedFoodPickups[1]
              : null;

        const target = radHazardRef.current
          ? { x: -3.8 + idx * 0.25, z: -0.25 + idx * 0.3 }
          : assignedDrop
            ? { x: assignedDrop.position.x, z: assignedDrop.position.z }
            : c.waypoints[c.wpIdx];

        const dx = target.x - c.rig.group.position.x;
        const dz = target.z - c.rig.group.position.z;
        const dist = Math.hypot(dx, dz);

        if (assignedDrop && dist < 0.38 && !crewActionPose) {
          store.crewCollectDroppedFood(assignedDrop.uid, c.id);
        } else if (dist > 0.12 && !crewActionPose) {
          const speed = 0.9 * dt;
          c.rig.group.position.x += (dx / dist) * speed;
          c.rig.group.position.z += (dz / dist) * speed;
          c.rig.group.rotation.y = Math.atan2(dx, dz);
          c.phase += dt * 6;
          const swing = Math.sin(c.phase) * 0.35;
          c.rig.leftLeg.rotation.x = swing;
          c.rig.rightLeg.rotation.x = -swing;
          c.rig.rightArm.rotation.x = THREE.MathUtils.lerp(c.rig.rightArm.rotation.x, 0, 0.15);
          c.rig.rightArm.rotation.z = THREE.MathUtils.lerp(c.rig.rightArm.rotation.z, -0.24, 0.15);
          c.rig.group.position.y = 0.12 + Math.abs(Math.sin(c.phase)) * 0.03;
        } else {
          c.rig.leftLeg.rotation.x = THREE.MathUtils.lerp(c.rig.leftLeg.rotation.x, 0, 0.15);
          c.rig.rightLeg.rotation.x = THREE.MathUtils.lerp(c.rig.rightLeg.rotation.x, 0, 0.15);
          if (!crewActionPose) {
            c.rig.rightArm.rotation.x = THREE.MathUtils.lerp(c.rig.rightArm.rotation.x, 0, 0.15);
            c.rig.rightArm.rotation.z = THREE.MathUtils.lerp(c.rig.rightArm.rotation.z, -0.24, 0.15);
          }
          if (!radHazardRef.current && !assignedDrop && Math.sin(elapsed * 0.7 + idx * 2.1) > 0.96) {
            c.wpIdx = (c.wpIdx + 1) % c.waypoints.length;
          }
        }
      });

      const viewW = container.clientWidth || width;
      const viewH = container.clientHeight || height;

      // Update camera BEFORE projecting 2D overlays so First-Person projections are rock solid!
      if (isFirstPerson) {
        const eyeBob = Math.sin(walkPhase * 2) * 0.025;
        fpvCam.position.set(
          playerRig.group.position.x,
          playerRig.group.position.y + 1.24 + (walkPhase > 0 ? eyeBob : 0),
          playerRig.group.position.z
        );
        fpvCam.rotation.y = fpvYaw;
        fpvCam.rotation.x = fpvPitch;
        fpvCam.rotation.z = 0;
        fpvCam.updateMatrixWorld();
      } else if (isOverview) {
        _camTarget.set(
          playerRig.group.position.x * 0.42,
          1.05,
          playerRig.group.position.z * 0.28
        );
        _camDesired.set(
          _camTarget.x + Math.sin(camYawOffset) * 10.6,
          6.4,
          _camTarget.z + Math.cos(camYawOffset) * 10.6
        );
        interiorCam.position.lerp(_camDesired, 1 - Math.exp(-6 * dt));
        interiorCam.lookAt(_camTarget);
        interiorCam.updateMatrixWorld();
      }

      if (isInside) {
        const activeCam = isFirstPerson ? fpvCam : interiorCam;
        activeCam.getWorldDirection(_camDir);

        const isPointInFront = (wx: number, wy: number, wz: number): boolean => {
          _toPoint.set(wx - activeCam.position.x, wy - activeCam.position.y, wz - activeCam.position.z);
          return _toPoint.dot(_camDir) > 0.15;
        };

        if (nearestPickupUid || nearestSt) {
          highlightRing.visible = true;
          if (nearestPickupUid) {
            const wp = pickupsRef.current.find((w) => w.uid === nearestPickupUid)!;
            highlightRing.position.set(wp.position.x, 0.14, wp.position.z);
            if (isPointInFront(wp.position.x, 0.9, wp.position.z)) {
              _screenPos.set(wp.position.x, 0.9, wp.position.z).project(activeCam);
              setHoverLabel({
                text: nearestPickupLabel,
                action: 'Press E to Pick Up',
                x: ((_screenPos.x + 1) / 2) * viewW,
                y: ((-_screenPos.y + 1) / 2) * viewH,
              });
            } else {
              setHoverLabel((prev) => (prev ? null : prev));
            }
          } else if (nearestSt) {
            highlightRing.position.set(nearestSt.x, 0.14, nearestSt.z);
            if (isPointInFront(nearestSt.x, 1.45, nearestSt.z)) {
              _screenPos.set(nearestSt.x, 1.45, nearestSt.z).project(activeCam);
              setHoverLabel({
                text: nearestSt.label,
                action: `E: ${nearestSt.kidAction}`,
                x: ((_screenPos.x + 1) / 2) * viewW,
                y: ((-_screenPos.y + 1) / 2) * viewH,
              });
            } else {
              setHoverLabel((prev) => (prev ? null : prev));
            }
          }
        } else {
          highlightRing.visible = false;
          setHoverLabel((prev) => (prev ? null : prev));
        }

        overlayAccum += dt;
        if (overlayAccum >= 0.05) {
          overlayAccum = 0;

          const cState = crewRef.current;
          const pChar = charRef.current;
          const nextOverhead: OverheadAstronaut[] = [];

          const pushAst = (id: string, label: string, isPlayer: boolean, pos: THREE.Vector3, hp: number, en: number) => {
            if (isPlayer && isFirstPerson) return;
            const visibleFront = isPointInFront(pos.x, pos.y + 1.42, pos.z);
            _screenPos.set(pos.x, pos.y + 1.42, pos.z).project(activeCam);
            nextOverhead.push({
              id,
              label,
              isPlayer,
              health: Math.round(hp),
              energy: Math.round(en),
              x: ((_screenPos.x + 1) / 2) * viewW,
              y: ((-_screenPos.y + 1) / 2) * viewH,
              visible: visibleFront && _screenPos.z < 1,
            });
          };

          pushAst('player', 'YOU', true, playerRig.group.position, pChar.health, pChar.energy);
          crewRigs.forEach((cr, idx) => {
            const member = cState[idx + 1];
            pushAst(
              cr.id,
              member?.label || `Crew ${idx + 1}`,
              false,
              cr.rig.group.position,
              member?.health ?? 100,
              member?.energy ?? 100
            );
          });
          setOverheadCrew(nextOverhead);

          const bubbleStations: StationId[] = [
            'oxygen-generator',
            'co2-scrubber',
            'water-recycler',
            'greenhouse',
            'solar-array',
            'battery-system',
            'water-dispenser',
            'toilet-facility',
            'food-cabinet',
            'water-blocks',
          ];
          const nextBubbles: StationBubble[] = bubbleStations.map((sid) => {
            const st = HABITAT_STATIONS.find((s) => s.id === sid)!;
            const visibleFront = isPointInFront(st.x, 1.85, st.z);
            _screenPos.set(st.x, 1.85, st.z).project(activeCam);
            const needsRepair =
              (sid === 'oxygen-generator' && sysMap.oxygenGenerator !== 'Operational') ||
              (sid === 'co2-scrubber' && sysMap.co2Scrubber !== 'Operational') ||
              (sid === 'water-recycler' && sysMap.waterRecycler !== 'Operational') ||
              (sid === 'greenhouse' && sysMap.greenhouse !== 'Operational') ||
              (sid === 'solar-array' && sysMap.solarArray !== 'Operational') ||
              (sid === 'battery-system' && sysMap.batterySystem !== 'Operational') ||
              (sid === 'water-blocks' && blocksRef.current < 3 && radHazardRef.current);

            let actionText = st.label;
            if (needsRepair) actionText = 'FIX!';
            else if (sid === 'greenhouse' && ghState.stage === 'ready') actionText = 'HARVEST!';

            return {
              id: sid,
              title: st.label,
              actionText,
              needsRepair,
              x: ((_screenPos.x + 1) / 2) * viewW,
              y: ((-_screenPos.y + 1) / 2) * viewH,
              visible: visibleFront && _screenPos.z < 1,
            };
          });
          setStationBubbles(nextBubbles);
        }

        renderer.render(scene, activeCam);
      } else {
        highlightRing.visible = false;
        setOverheadCrew((prev) => (prev.length > 0 ? [] : prev));
        setStationBubbles((prev) => (prev.length > 0 ? [] : prev));
        controls.update();
        renderer.render(scene, exteriorCam);
      }

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
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      terrainTex.dispose();
      floorTex.dispose();
      solarTex.dispose();
      starfield.geometry.dispose();
      starfield.material.dispose();
      rockGeo.dispose();
      rockMat.dispose();
      groundGeo.dispose();
      arcadeHandles.forEach(({ handle }) => handle.screenTexture.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [destination, lowGraphics]);

  const handleBubbleClick = (sid: StationId) => {
    const st = HABITAT_STATIONS.find((s) => s.id === sid);
    if (!st) return;
    const store = useGameStore.getState();
    const p = store.character.position;
    const dist = Math.hypot(p.x - st.x, p.z - st.z);
    if (dist <= INTERACTION_DISTANCE) {
      store.performQuickStationAction(sid);
    } else {
      store.setMoveTarget({ x: st.walkX, z: st.walkZ, stationId: sid });
    }
  };

  const bubbleIcon = (id: StationId, needsRepair: boolean) => {
    if (needsRepair) return <Wrench className="w-3 h-3 text-white" />;
    if (id === 'oxygen-generator') return <Wind className="w-3 h-3 text-[#37D6F4]" />;
    if (id === 'co2-scrubber') return <Wind className="w-3 h-3 text-[#37D67A]" />;
    if (id === 'water-recycler' || id === 'water-dispenser') return <Droplets className="w-3 h-3 text-[#38BDF8]" />;
    if (id === 'solar-array') return <Sun className="w-3 h-3 text-[#FFB84D]" />;
    if (id === 'battery-system') return <BatteryCharging className="w-3 h-3 text-[#FF7A3D]" />;
    if (id === 'greenhouse') return <Sprout className="w-3 h-3 text-[#37D67A]" />;
    if (id === 'food-cabinet') return <Utensils className="w-3 h-3 text-[#37D67A]" />;
    if (id === 'water-blocks') return <Shield className="w-3 h-3 text-[#37D6F4]" />;
    return <Heart className="w-3 h-3 text-[#FF5B68]" />;
  };

  const isInsideView = viewMode === 'interior' || viewMode === 'first-person';

  return (
    <div className="relative w-full h-full">
      {webglOk ? (
        <div
          ref={mountRef}
          className={`w-full h-full ${viewMode === 'first-person' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#07111F] p-8">
          <div className="max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 text-center">
            <h2 className="text-lg font-bold text-[#37D6F4]">2D Compatibility Mode</h2>
            <p className="text-sm text-[#AAB8C8] mt-2">
              Use the bottom station bar to walk to and operate every spacecraft machine!
            </p>
          </div>
        </div>
      )}

      {/* Overhead Health & Stamina Bars over visible 3D Astronauts */}
      {isInsideView &&
        overheadCrew.map(
          (ast) =>
            ast.visible && (
              <div
                key={ast.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-10"
                style={{ left: `${ast.x}px`, top: `${ast.y}px` }}
              >
                <div className="rounded-lg bg-[#07111F]/90 border border-white/20 px-2 py-1 shadow-lg min-w-[78px]">
                  <div className="flex items-center justify-between gap-1 text-[9px] font-extrabold text-white leading-none mb-0.5">
                    <span>{ast.label}</span>
                    <span className="tabular-nums text-[#37D67A]">{ast.health}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ast.health}%`,
                        backgroundColor:
                          ast.health > 55 ? '#37D67A' : ast.health > 30 ? '#FFB84D' : '#FF5B68',
                      }}
                    />
                  </div>
                  {ast.isPlayer && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="h-1.5 flex-1 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#37D6F4] transition-all"
                          style={{ width: `${ast.energy}%` }}
                        />
                      </div>
                      <span className="flex items-center gap-0.5 text-[8px] font-bold text-[#FFB84D] tabular-nums">
                        {liveTrends.battery >= 0 ? (
                          <ArrowUp className="w-2.5 h-2.5 text-[#37D67A]" />
                        ) : (
                          <ArrowDown className="w-2.5 h-2.5 text-[#FF5B68]" />
                        )}
                        {ast.energy}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
        )}

      {/* Interactive Labels over the 6 Arcade Machines & Facilities */}
      {isInsideView &&
        stationBubbles.map(
          (b) =>
            b.visible && (
              <button
                key={b.id}
                onClick={() => handleBubbleClick(b.id)}
                style={{ left: `${b.x}px`, top: `${b.y}px` }}
                className={`sci-btn hidden md:flex absolute -translate-x-1/2 -translate-y-full z-10 items-center gap-1 rounded-xl px-2 py-1 text-[9px] font-extrabold border cursor-pointer whitespace-nowrap ${
                  b.needsRepair
                    ? 'sci-btn-urgent bg-[#FF5B68] border-white text-white'
                    : 'bg-[#0D1B2A]/94 border-[#37D6F4]/60 text-[#F4F7FB] hover:border-[#37D6F4]'
                }`}
              >
                {bubbleIcon(b.id, b.needsRepair)}
                <span>{b.actionText}</span>
              </button>
            )
        )}

      {/* Floating Nearest Interaction Label */}
      {hoverLabel && isInsideView && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 z-10"
          style={{
            left: `${Math.max(120, Math.min(window.innerWidth - 120, hoverLabel.x))}px`,
            top: `${Math.max(95, hoverLabel.y + 8)}px`,
          }}
        >
          <div className="rounded-xl bg-[#0D1B2A]/95 border border-[#37D6F4] px-3 py-1.5 text-center shadow-xl">
            <p className="text-[11px] font-bold text-[#37D6F4] whitespace-nowrap">
              {hoverLabel.text} · {hoverLabel.action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

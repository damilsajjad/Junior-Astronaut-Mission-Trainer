import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { INTERACTION_DISTANCE, PLAYER_SPEED } from '../../engine/simulation';
import { useGameStore } from '../../store/gameStore';
import { StationId } from '../../types/game';
import {
  createAfterDrawPacer,
  createAstronautGroup,
  createFloorPanelTexture,
  createPlanetTerrainTexture,
  detectSoftwareWebGL,
  isWebGLAvailable,
} from './sceneHelpers';

type StationDef = {
  id: StationId;
  label: string;
  actionLabel: string;
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  solid?: boolean;
};

const STATIONS: StationDef[] = [
  { id: 'radiation-shelter', label: 'Radiation Shelter', actionLabel: 'Inspect Shelter', x: -3.2, z: -0.2, halfW: 0.7, halfD: 0.9, solid: false },
  { id: 'oxygen-generator', label: 'Oxygen Generator', actionLabel: 'Inspect O₂ Electrolysis', x: -1.6, z: -1.4, halfW: 0.55, halfD: 0.45, solid: true },
  { id: 'co2-scrubber', label: 'CO₂ Scrubber', actionLabel: 'Inspect Air Scrubber', x: -0.35, z: -1.45, halfW: 0.5, halfD: 0.45, solid: true },
  { id: 'power-panel', label: 'Power Distribution Panel', actionLabel: 'Inspect Power Panel', x: 0.9, z: -1.45, halfW: 0.5, halfD: 0.45, solid: true },
  { id: 'mission-control', label: 'Mission Control Console', actionLabel: 'Open Dashboard', x: -0.3, z: -0.1, halfW: 0.65, halfD: 0.4, solid: true },
  { id: 'greenhouse', label: 'Plant Growth Rack', actionLabel: 'Check Greenhouse', x: 2.05, z: -1.4, halfW: 0.55, halfD: 0.45, solid: true },
  { id: 'food-cabinet', label: 'Food Cabinet', actionLabel: 'Open Supplies', x: 2.25, z: 0.7, halfW: 0.5, halfD: 0.45, solid: true },
  { id: 'tool-cabinet', label: 'Tool Cabinet', actionLabel: 'Check Tools', x: -1.85, z: 1.15, halfW: 0.5, halfD: 0.4, solid: true },
  { id: 'crew-bunks', label: 'Crew Bunks & Med Bay', actionLabel: 'Rest (+30 Energy)', x: -2.4, z: -1.35, halfW: 0.65, halfD: 0.45, solid: true },
  { id: 'manual-terminal', label: 'Digital Repair Manual', actionLabel: 'Open Manual', x: 0.85, z: 1.15, halfW: 0.45, halfD: 0.4, solid: true },
  { id: 'water-recycler', label: 'Water Recycler', actionLabel: 'Check Water System', x: -0.5, z: 1.15, halfW: 0.45, halfD: 0.4, solid: true },
  { id: 'water-blocks', label: 'Water-Barrier Blocks', actionLabel: 'Reinforce Shield Wall', x: 2.95, z: -0.1, halfW: 0.65, halfD: 0.7, solid: false },
];

// Reusable math vectors outside animation loop (zero GC)
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _screenPos = new THREE.Vector3();

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

  const destination = useGameStore((s) => s.destination);
  const viewMode = useGameStore((s) => s.viewMode);
  const lowGraphics = useGameStore((s) => s.savedProgress.lowGraphics);
  const worldPickups = useGameStore((s) => s.worldPickups);
  const waterBlocksReinforced = useGameStore((s) => s.waterBlocksReinforced);
  const activeRadiationHazard = useGameStore((s) => s.activeRadiationHazard);
  const systems = useGameStore((s) => s.systems);

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const pickupsRef = useRef(worldPickups);
  pickupsRef.current = worldPickups;
  const blocksRef = useRef(waterBlocksReinforced);
  blocksRef.current = waterBlocksReinforced;
  const radHazardRef = useRef(activeRadiationHazard);
  radHazardRef.current = activeRadiationHazard;
  const systemsRef = useRef(systems);
  systemsRef.current = systems;

  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const exteriorCamRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (resetCamTrigger > 0 && exteriorCamRef.current && orbitControlsRef.current) {
      exteriorCamRef.current.position.set(7.5, 4.5, 9.2);
      orbitControlsRef.current.target.set(0, 1.0, 0);
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
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl || lowGraphics ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl && !lowGraphics;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const isMars = destination === 'mars';
    const skyBg = isMars ? 0x5c2e20 : 0x050a14;
    scene.background = new THREE.Color(skyBg);
    scene.fog = new THREE.FogExp2(skyBg, isMars ? 0.022 : 0.012);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const interiorCam = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    interiorCam.position.set(0.6, 5.4, 7.6);
    interiorCam.lookAt(0, 0.8, 0);

    const exteriorCam = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    exteriorCam.position.set(7.5, 4.5, 9.2);
    exteriorCamRef.current = exteriorCam;

    const controls = new OrbitControls(exteriorCam, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 5.5;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.target.set(0, 1.0, 0);
    controls.enabled = viewModeRef.current === 'exterior';
    orbitControlsRef.current = controls;

    // 3-point lighting matching Mars warm ochre / Moon crisp lunar lighting
    const hemi = new THREE.HemisphereLight(
      isMars ? 0xffb38a : 0x9ec5ff,
      isMars ? 0x4b1d12 : 0x2a2f3a,
      0.95
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(isMars ? 0xffe0c2 : 0xf4f8ff, 1.85);
    keyLight.position.set(7, 12, 8);
    if (!isSoftwareGl && !lowGraphics) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 8;
      keyLight.shadow.camera.bottom = -8;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const cabinLight = new THREE.PointLight(0xdaf6ff, 1.6, 12, 1.5);
    cabinLight.position.set(0, 2.3, 0);
    scene.add(cabinLight);

    // Planetary Terrain (Mars red-ochre or Moon grey craters)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const terrainTex = createPlanetTerrainTexture(destination, maxAniso);
    terrainTex.repeat.set(6, 6);
    const groundGeo = new THREE.PlaneGeometry(90, 90, 36, 36);
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const gx = posAttr.getX(i);
      const gy = posAttr.getY(i);
      const dist = Math.hypot(gx, gy);
      if (dist > 6.5) {
        const wave = Math.sin(gx * 0.25) * Math.cos(gy * 0.25) * 0.65 + Math.sin(dist * 0.4) * 0.25;
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

    // Scattered planetary rocks (InstancedMesh)
    const rockCount = 42;
    const rockGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: isMars ? 0x7c3420 : 0x5c6370,
      roughness: 0.9,
    });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
      const ang = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.2;
      const rad = 7.5 + (i % 9) * 2.2;
      dummy.position.set(Math.cos(ang) * rad, 0.15, Math.sin(ang) * rad);
      dummy.rotation.set(i * 0.4, i * 0.8, 0);
      dummy.scale.setScalar(0.7 + (i % 4) * 0.45);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.computeBoundingSphere();
    scene.add(rocks);

    // Sky Backdrop Elements (Moon: Starfield + Earth in upper-right; Mars: Dust Vortex + Moons)
    const starGroup = new THREE.Group();
    if (!isMars) {
      const starGeo = new THREE.SphereGeometry(0.11, 6, 6);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xe6f2ff });
      const stars = new THREE.InstancedMesh(starGeo, starMat, 220);
      for (let i = 0; i < 220; i++) {
        const theta = i * 2.39996;
        const r = 38 + (i % 18);
        const y = 6 + (i % 24);
        dummy.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r - 12);
        dummy.scale.setScalar(0.6 + (i % 3) * 0.35);
        dummy.updateMatrix();
        stars.setMatrixAt(i, dummy.matrix);
      }
      stars.computeBoundingSphere();
      starGroup.add(stars);

      const earthTex = createPlanetTerrainTexture('earth', maxAniso);
      const earthSphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 24, 20),
        new THREE.MeshStandardMaterial({
          map: earthTex,
          roughness: 0.5,
          emissive: 0x0b2545,
          emissiveIntensity: 0.4,
        })
      );
      earthSphere.position.set(11, 10, -24);
      starGroup.add(earthSphere);
    } else {
      // Distant Martian dust vortex & two tiny moons
      const vortexMat = new THREE.MeshBasicMaterial({
        color: 0xc26e4e,
        transparent: true,
        opacity: 0.28,
        wireframe: false,
      });
      const vortex = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 18, 1, true), vortexMat);
      vortex.rotation.x = Math.PI;
      vortex.position.set(11, 4.5, -22);
      starGroup.add(vortex);

      const moonMat = new THREE.MeshStandardMaterial({ color: 0xd8c3b4, roughness: 0.8 });
      const phobos = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), moonMat);
      phobos.position.set(13, 12, -28);
      starGroup.add(phobos);
    }
    scene.add(starGroup);

    // =========================================================================
    // HABITAT MODULE (Cutaway Cylindrical/Octagonal Pod matching Reference Pics)
    // =========================================================================
    const habitatGroup = new THREE.Group();
    scene.add(habitatGroup);

    const floorTex = createFloorPanelTexture(maxAniso);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.45,
      metalness: 0.25,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xdbe2ea,
      roughness: 0.38,
      metalness: 0.18,
    });
    const outerShellMat = new THREE.MeshStandardMaterial({
      color: 0xb9c2cc,
      roughness: 0.4,
      metalness: 0.45,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.65,
    });

    // Main Capsule Floor Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.24, 4.0), floorMat);
    deck.position.set(0, 0.0, 0);
    deck.receiveShadow = true;
    habitatGroup.add(deck);

    // Outer base cradle & landing pads grounding module to planetary terrain
    const cradle = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.28, 4.35), darkMetalMat);
    cradle.position.set(0, -0.14, 0);
    habitatGroup.add(cradle);

    // Back Wall & Angled Ceiling Shell (open in front for cutaway Interior View!)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.4, 0.22), wallMat);
    backWall.position.set(0, 1.3, -1.95);
    backWall.receiveShadow = true;
    habitatGroup.add(backWall);

    const roofBack = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.2, 2.2), wallMat);
    roofBack.position.set(0, 2.68, -0.95);
    roofBack.rotation.x = 0.22;
    habitatGroup.add(roofBack);

    // Ribbed Structural Arches + LED Light Strips (matching reference screenshots!)
    for (let i = -3; i <= 3; i += 2) {
      const archBack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.45, 0.16), outerShellMat);
      archBack.position.set(i, 1.32, -1.82);
      habitatGroup.add(archBack);

      const ledStrip = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.07, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xe6f8ff })
      );
      ledStrip.position.set(i === 3 ? 2.1 : i + 1, 2.54, -0.9);
      if (i < 3) habitatGroup.add(ledStrip);
    }

    // Left & Right Endcap Bulkheads with Airlock Ports
    const leftEndcap = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.35, 16), outerShellMat);
    leftEndcap.rotation.z = Math.PI / 2;
    leftEndcap.position.set(-4.05, 1.28, 0);
    habitatGroup.add(leftEndcap);

    const leftHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.44, 16), darkMetalMat);
    leftHatch.rotation.z = Math.PI / 2;
    leftHatch.position.set(-4.18, 1.1, 0);
    habitatGroup.add(leftHatch);

    const rightEndcap = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.35, 16), outerShellMat);
    rightEndcap.rotation.z = Math.PI / 2;
    rightEndcap.position.set(4.05, 1.28, 0);
    habitatGroup.add(rightEndcap);

    const rightHatch = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.44, 16), darkMetalMat);
    rightHatch.rotation.z = Math.PI / 2;
    rightHatch.position.set(4.18, 1.1, 0);
    habitatGroup.add(rightHatch);

    // EXTERIOR-ONLY SHELL (closes cutaway & adds Solar Arrays when in Exterior 360° View!)
    const exteriorOnlyGroup = new THREE.Group();
    const frontHull = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.45, 0.24), outerShellMat);
    frontHull.position.set(0, 1.3, 1.95);
    exteriorOnlyGroup.add(frontHull);

    const frontWindow = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.8, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.1, metalness: 0.85, emissive: 0x0ea5e9, emissiveIntensity: 0.35 })
    );
    frontWindow.position.set(0, 1.5, 1.96);
    exteriorOnlyGroup.add(frontWindow);

    const roofFront = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.22, 2.3), outerShellMat);
    roofFront.position.set(0, 2.66, 0.95);
    roofFront.rotation.x = -0.22;
    exteriorOnlyGroup.add(roofFront);

    // Solar Array Wings + Comms Dish
    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x16325c,
      roughness: 0.25,
      metalness: 0.75,
      emissive: 0x0a1e3d,
      emissiveIntensity: 0.3,
    });
    const solarWingL = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), solarPanelMat);
    solarWingL.position.set(-2.2, 3.1, -0.2);
    solarWingL.rotation.x = 0.28;
    exteriorOnlyGroup.add(solarWingL);

    const solarWingR = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), solarPanelMat);
    solarWingR.position.set(2.2, 3.1, -0.2);
    solarWingR.rotation.x = 0.28;
    exteriorOnlyGroup.add(solarWingR);

    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8), darkMetalMat);
    dishMast.position.set(0, 3.25, -0.3);
    exteriorOnlyGroup.add(dishMast);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.35, 16, 1, true), wallMat);
    dish.position.set(0, 3.7, -0.3);
    dish.rotation.x = 0.85;
    exteriorOnlyGroup.add(dish);

    exteriorOnlyGroup.visible = viewModeRef.current === 'exterior';
    habitatGroup.add(exteriorOnlyGroup);

    // =========================================================================
    // GLOWING AMBER RADIATION SHELTER FRAME (Left) & CYAN SHIELD WALL (Right)
    // =========================================================================
    const shelterFrameMat = new THREE.MeshBasicMaterial({ color: 0xffb84d });
    const shelterGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffb84d,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
    });
    const shelterArch = new THREE.Group();
    const sPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.1, 0.07), shelterFrameMat);
    sPost1.position.set(-2.65, 1.15, 1.35);
    shelterArch.add(sPost1);
    const sPost2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.1, 0.07), shelterFrameMat);
    sPost2.position.set(-2.65, 1.15, -1.35);
    shelterArch.add(sPost2);
    const sTop = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 2.75), shelterFrameMat);
    sTop.position.set(-2.65, 2.2, 0);
    shelterArch.add(sTop);
    const sPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.1), shelterGlowMat);
    sPlane.rotation.y = Math.PI / 2;
    sPlane.position.set(-2.65, 1.15, 0);
    shelterArch.add(sPlane);
    habitatGroup.add(shelterArch);

    // Right Holographic Cyan Shield Wall
    const shieldFrameMat = new THREE.MeshBasicMaterial({ color: 0x37d6f4 });
    const shieldGlowMat = new THREE.MeshBasicMaterial({
      color: 0x37d6f4,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const shieldWall = new THREE.Group();
    const shPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.1, 0.07), shieldFrameMat);
    shPost1.position.set(3.45, 1.15, 1.3);
    shieldWall.add(shPost1);
    const shPost2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.1, 0.07), shieldFrameMat);
    shPost2.position.set(3.45, 1.15, -1.3);
    shieldWall.add(shPost2);
    const shTop = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 2.65), shieldFrameMat);
    shTop.position.set(3.45, 2.2, 0);
    shieldWall.add(shTop);
    const shPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.1), shieldGlowMat);
    shPlane.rotation.y = Math.PI / 2;
    shPlane.position.set(3.45, 1.15, 0);
    shieldWall.add(shPlane);
    habitatGroup.add(shieldWall);

    // Interactive Water-Barrier Blocks (3 translucent ice-cyan blocks!)
    const waterBlockMeshes: THREE.Mesh[] = [];
    const blockGeo = new THREE.BoxGeometry(0.55, 0.42, 0.72);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        roughness: 0.15,
        metalness: 0.05,
        transparent: true,
        opacity: 0.78,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.35,
      });
      const blk = new THREE.Mesh(blockGeo, mat);
      blk.position.set(2.95, 0.34 + i * 0.44, -0.3 + (i % 2) * 0.45);
      blk.castShadow = true;
      habitatGroup.add(blk);
      waterBlockMeshes.push(blk);
    }

    // =========================================================================
    // INTERACTIVE WORKSTATIONS (Composite Multi-Part Groups)
    // =========================================================================
    const stationIndicatorMap = new Map<StationId, THREE.Mesh>();

    const addStationBox = (
      id: StationId,
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      bodyColor: number,
      screenColor: number
    ) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0.12, z);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45, metalness: 0.3 })
      );
      base.position.y = h / 2;
      base.castShadow = true;
      grp.add(base);

      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.72, h * 0.36, 0.06),
        new THREE.MeshBasicMaterial({ color: screenColor })
      );
      bezel.position.set(0, h * 0.72, d / 2 + 0.02);
      grp.add(bezel);

      const statusLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x37d67a })
      );
      statusLed.position.set(w * 0.35, h + 0.08, 0);
      grp.add(statusLed);
      stationIndicatorMap.set(id, statusLed);

      habitatGroup.add(grp);
      return grp;
    };

    // Oxygen Generator (tanks + cyan electrolysis core)
    const o2Grp = addStationBox('oxygen-generator', -1.6, -1.45, 0.95, 1.3, 0.6, 0xcbd5e1, 0x37d6f4);
    const o2Tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.0, 14),
      new THREE.MeshStandardMaterial({ color: 0x37d6f4, roughness: 0.25, metalness: 0.5 })
    );
    o2Tank.position.set(-0.26, 0.65, 0.2);
    o2Grp.add(o2Tank);

    // CO2 Scrubber
    addStationBox('co2-scrubber', -0.35, -1.45, 0.85, 1.35, 0.6, 0x94a3b8, 0xfbbf24);

    // Power Panel
    addStationBox('power-panel', 0.9, -1.45, 0.9, 1.35, 0.55, 0x475569, 0xff7a3d);

    // Greenhouse Plant Rack
    const ghGrp = addStationBox('greenhouse', 2.05, -1.45, 1.0, 1.3, 0.6, 0xdbeafe, 0x37d67a);
    const plants = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.22, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 })
    );
    plants.position.set(0, 0.85, 0.15);
    ghGrp.add(plants);

    // Center Mission Control Console
    addStationBox('mission-control', -0.3, -0.1, 1.15, 0.85, 0.65, 0x334155, 0x37d6f4);

    // Food Cabinet, Tool Cabinet, Crew Bunks, Manual Terminal, Water Recycler
    addStationBox('food-cabinet', 2.25, 0.7, 0.75, 1.15, 0.55, 0xe2e8f0, 0x37d67a);
    addStationBox('tool-cabinet', -1.85, 1.15, 0.75, 1.0, 0.5, 0x64748b, 0xffb84d);
    addStationBox('crew-bunks', -2.4, -1.35, 1.1, 0.75, 0.65, 0xcbd5e1, 0x60a5fa);
    addStationBox('manual-terminal', 0.85, 1.15, 0.65, 0.95, 0.48, 0x1e293b, 0x37d6f4);
    addStationBox('water-recycler', -0.5, 1.15, 0.72, 1.0, 0.48, 0x94a3b8, 0x38bdf8);

    // Highlight Ring for nearby station
    const highlightRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.78, 32),
      new THREE.MeshBasicMaterial({
        color: 0x37d6f4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    highlightRing.rotation.x = -Math.PI / 2;
    highlightRing.position.y = 0.15;
    highlightRing.visible = false;
    habitatGroup.add(highlightRing);

    // Collectible World Pickups
    const pickupMeshMap = new Map<string, THREE.Group>();
    for (const wp of pickupsRef.current) {
      const pGrp = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.18, 0.22),
        new THREE.MeshStandardMaterial({
          color: wp.itemId === 'meal-pack' ? 0x37d67a : wp.itemId === 'water-pack' ? 0x37d6f4 : 0xffb84d,
          roughness: 0.35,
          emissive: 0x0a2540,
          emissiveIntensity: 0.35,
        })
      );
      pGrp.add(box);
      pGrp.position.set(wp.position.x, wp.position.y, wp.position.z);
      habitatGroup.add(pGrp);
      pickupMeshMap.set(wp.uid, pGrp);
    }

    // Player Astronaut + 3 Crew Members
    const playerRig = createAstronautGroup(0xff7a3d, true);
    playerRig.group.scale.setScalar(0.82);
    const startPos = useGameStore.getState().character.position;
    playerRig.group.position.set(startPos.x, 0.12, startPos.z);
    habitatGroup.add(playerRig.group);

    const crewRigs = [
      { rig: createAstronautGroup(0x37d6f4), baseX: -0.9, baseZ: 0.25 },
      { rig: createAstronautGroup(0x37d67a), baseX: 1.4, baseZ: -0.35 },
      { rig: createAstronautGroup(0xffb84d), baseX: -2.95, baseZ: 0.45 },
    ];
    crewRigs.forEach(({ rig, baseX, baseZ }) => {
      rig.group.scale.setScalar(0.76);
      rig.group.position.set(baseX, 0.12, baseZ);
      habitatGroup.add(rig.group);
    });

    // Keyboard & Pointer Input
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let camYawOffset = 0;
    let pointerDown = false;
    let lastPointerX = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (viewModeRef.current === 'interior') {
        pointerDown = true;
        lastPointerX = e.clientX;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerDown && viewModeRef.current === 'interior') {
        const dx = e.clientX - lastPointerX;
        lastPointerX = e.clientX;
        camYawOffset = THREE.MathUtils.clamp(camYawOffset - dx * 0.005, -0.75, 0.75);
      }
    };
    const onPointerUp = () => {
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
      exteriorCam.aspect = w / h;
      exteriorCam.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const checkCollision = (nx: number, nz: number): boolean => {
      // Module interior walls
      if (nx < -3.45 || nx > 3.45 || nz < -1.55 || nz > 1.55) return true;
      for (const st of STATIONS) {
        if (!st.solid) continue;
        if (Math.abs(nx - st.x) < st.halfW + 0.25 && Math.abs(nz - st.z) < st.halfD + 0.25) {
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
    let uiSyncAccum = 0;

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.getElapsedTime();
      const store = useGameStore.getState();
      const isInterior = viewModeRef.current === 'interior';

      exteriorOnlyGroup.visible = !isInterior;
      controls.enabled = !isInterior;

      // Update Water-Barrier Block visibility & glow based on reinforced count (1..3)
      const reinforced = blocksRef.current;
      waterBlockMeshes.forEach((blk, idx) => {
        const active = idx < reinforced;
        blk.position.x = active ? 3.05 : 2.35;
        blk.position.y = active ? 0.34 + idx * 0.44 : 0.32 + Math.sin(elapsed * 2 + idx) * 0.06;
        const mat = blk.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = active ? 0.55 : 0.2;
      });

      // Update station LED colors
      const sysMap = systemsRef.current;
      const ledColor = (status: string) =>
        status === 'Operational' ? 0x37d67a : status === 'Warning' ? 0xffb84d : 0xff5b68;
      stationIndicatorMap.get('oxygen-generator')?.material &&
        ((stationIndicatorMap.get('oxygen-generator')!.material as THREE.MeshBasicMaterial).color.setHex(ledColor(sysMap.oxygenGenerator)));
      stationIndicatorMap.get('co2-scrubber')?.material &&
        ((stationIndicatorMap.get('co2-scrubber')!.material as THREE.MeshBasicMaterial).color.setHex(ledColor(sysMap.co2Scrubber)));
      stationIndicatorMap.get('power-panel')?.material &&
        ((stationIndicatorMap.get('power-panel')!.material as THREE.MeshBasicMaterial).color.setHex(ledColor(sysMap.powerPanel)));
      stationIndicatorMap.get('radiation-shelter')?.material &&
        ((stationIndicatorMap.get('radiation-shelter')!.material as THREE.MeshBasicMaterial).color.setHex(ledColor(sysMap.radiationShelter)));

      // Update pickups visibility + bobbing
      for (const wp of pickupsRef.current) {
        const mesh = pickupMeshMap.get(wp.uid);
        if (mesh) {
          mesh.visible = !wp.collected;
          if (!wp.collected) {
            mesh.position.y = 0.36 + Math.sin(elapsed * 2.5 + wp.position.x) * 0.06;
            mesh.rotation.y += dt * 1.1;
          }
        }
      }

      // Movement in Interior View when no modal/puzzle blocks input
      let nearestSt: StationDef | null = null;
      let nearestDist = INTERACTION_DISTANCE;
      let nearestPickupUid: string | null = null;
      let nearestPickupLabel = '';

      if (
        isInterior &&
        store.missionStatus === 'active' &&
        !store.activeModal &&
        !store.activePuzzle
      ) {
        let moveX = store.touchMoveVector.x;
        let moveZ = store.touchMoveVector.y;
        if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        const mag = Math.hypot(moveX, moveZ);
        let movedDist = 0;
        if (mag > 0.05) {
          const nxDir = moveX / Math.max(1, mag);
          const nzDir = moveZ / Math.max(1, mag);
          const step = PLAYER_SPEED * dt;
          const curX = playerRig.group.position.x;
          const curZ = playerRig.group.position.z;

          let nextX = curX;
          let nextZ = curZ;
          if (!checkCollision(curX + nxDir * step, curZ)) {
            nextX = curX + nxDir * step;
          }
          if (!checkCollision(nextX, curZ + nzDir * step)) {
            nextZ = curZ + nzDir * step;
          }

          movedDist = Math.hypot(nextX - curX, nextZ - curZ);
          playerRig.group.position.x = nextX;
          playerRig.group.position.z = nextZ;

          // Smoothly face direction
          const targetRot = Math.atan2(nxDir, nzDir);
          playerRig.group.rotation.y = THREE.MathUtils.lerp(
            playerRig.group.rotation.y,
            targetRot,
            1 - Math.exp(-10 * dt)
          );

          // Walk/Moon-float animation (0.16g subtle float vs 0.38g Mars stride)
          walkPhase += dt * (isMars ? 9 : 6.5);
          const swing = Math.sin(walkPhase) * 0.45;
          playerRig.leftLeg.rotation.x = swing;
          playerRig.rightLeg.rotation.x = -swing;
          playerRig.leftArm.rotation.x = -swing * 0.7;
          playerRig.rightArm.rotation.x = swing * 0.7;
          playerRig.group.position.y =
            0.12 + Math.abs(Math.sin(walkPhase)) * (isMars ? 0.04 : 0.11);
        } else {
          // Idle / subtle low-gravity hover
          playerRig.leftLeg.rotation.x = THREE.MathUtils.lerp(playerRig.leftLeg.rotation.x, 0, 0.15);
          playerRig.rightLeg.rotation.x = THREE.MathUtils.lerp(playerRig.rightLeg.rotation.x, 0, 0.15);
          playerRig.group.position.y =
            0.12 + (isMars ? 0.02 : 0.08 + Math.sin(elapsed * 2) * 0.05);
        }

        // Check nearest collectible pickup
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

        // Check nearest station
        if (!nearestPickupUid) {
          let bestStDist = INTERACTION_DISTANCE;
          for (const st of STATIONS) {
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

        uiSyncAccum += dt;
        if (movedDist > 0 || uiSyncAccum > 0.12) {
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

      // Highlight ring + floating label projection
      if (isInterior && (nearestPickupUid || nearestSt)) {
        highlightRing.visible = true;
        if (nearestPickupUid) {
          const wp = pickupsRef.current.find((w) => w.uid === nearestPickupUid)!;
          highlightRing.position.set(wp.position.x, 0.15, wp.position.z);
          _screenPos.set(wp.position.x, 0.9, wp.position.z).project(interiorCam);
          setHoverLabel({
            text: nearestPickupLabel,
            action: 'Press E to Pick Up',
            x: ((_screenPos.x + 1) / 2) * (container.clientWidth || width),
            y: ((-_screenPos.y + 1) / 2) * (container.clientHeight || height),
          });
        } else if (nearestSt) {
          highlightRing.position.set(nearestSt.x, 0.15, nearestSt.z);
          _screenPos.set(nearestSt.x, 1.45, nearestSt.z).project(interiorCam);
          setHoverLabel({
            text: nearestSt.label,
            action: `Press E: ${nearestSt.actionLabel}`,
            x: ((_screenPos.x + 1) / 2) * (container.clientWidth || width),
            y: ((-_screenPos.y + 1) / 2) * (container.clientHeight || height),
          });
        }
      } else {
        highlightRing.visible = false;
        setHoverLabel((prev) => (prev ? null : prev));
      }

      // Crew idle animations (move toward shelter if radiation hazard)
      crewRigs.forEach(({ rig, baseX, baseZ }, idx) => {
        const targetX = radHazardRef.current ? -3.0 + idx * 0.25 : baseX;
        rig.group.position.x = THREE.MathUtils.lerp(rig.group.position.x, targetX, 0.03);
        rig.group.position.z = THREE.MathUtils.lerp(rig.group.position.z, baseZ, 0.03);
        rig.group.position.y = 0.12 + Math.sin(elapsed * 1.8 + idx) * (isMars ? 0.015 : 0.04);
      });

      // Follow camera (smooth exponential damping)
      if (isInterior) {
        _camTarget.set(
          playerRig.group.position.x * 0.55,
          0.95,
          playerRig.group.position.z * 0.35
        );
        _camDesired.set(
          _camTarget.x + Math.sin(camYawOffset) * 7.6,
          5.1,
          _camTarget.z + Math.cos(camYawOffset) * 7.6
        );
        interiorCam.position.lerp(_camDesired, 1 - Math.exp(-6 * dt));
        interiorCam.lookAt(_camTarget);
        renderer.render(scene, interiorCam);
      } else {
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
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [destination, lowGraphics]);

  return (
    <div className="relative w-full h-full">
      {webglOk ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#07111F] p-8">
          <div className="max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 text-center">
            <h2 className="text-lg font-bold text-[#37D6F4]">2D Compatibility Mode</h2>
            <p className="text-sm text-[#AAB8C8] mt-2">
              WebGL is disabled on this device. Use Mission Control, Repair Manual, and Puzzles in the HUD to run the full mission!
            </p>
          </div>
        </div>
      )}

      {/* Floating 3D World Interaction Prompt */}
      {hoverLabel && viewMode === 'interior' && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-10"
          style={{
            left: `${Math.max(120, Math.min(window.innerWidth - 120, hoverLabel.x))}px`,
            top: `${Math.max(85, hoverLabel.y)}px`,
          }}
        >
          <div className="rounded-xl bg-[#0D1B2A]/95 border border-[#37D6F4] px-3.5 py-2 text-center shadow-xl">
            <p className="text-xs font-bold text-[#F4F7FB] whitespace-nowrap">{hoverLabel.text}</p>
            <p className="text-[11px] font-semibold text-[#37D6F4] whitespace-nowrap">{hoverLabel.action}</p>
          </div>
        </div>
      )}
    </div>
  );
}

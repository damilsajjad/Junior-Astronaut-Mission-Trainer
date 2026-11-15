import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import {
  createAfterDrawPacer,
  createAstronautGroup,
  createPlanetTerrainTexture,
  detectSoftwareWebGL,
  isWebGLAvailable,
} from './sceneHelpers';

const SCENE_LABELS = [
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

export default function CinematicCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const destination = useGameStore((s) => s.destination);
  const muted = useGameStore((s) => s.savedProgress.muted);
  const reducedMotion = useGameStore((s) => s.savedProgress.reducedMotion);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const finishCinematic = useGameStore((s) => s.finishCinematicToBriefing);

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
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b16);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 400);

    // Three-point lighting
    const hemi = new THREE.HemisphereLight(0x8ecae6, 0x3b2a22, 0.8);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 1.8);
    keyLight.position.set(8, 14, 10);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x37d6f4, 0.9);
    rimLight.position.set(-8, 6, -10);
    scene.add(rimLight);

    // Starfield (InstancedMesh)
    const starCount = 320;
    const starGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xeef6ff });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const r = 45 + (i % 60);
      const theta = i * 2.39996;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      dummy.scale.setScalar(0.6 + (i % 5) * 0.25);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);

    // Multi-part Rocket / Lander Group
    const rocket = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.35, metalness: 0.35 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xff7a3d, roughness: 0.4, metalness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e2c3d, roughness: 0.5, metalness: 0.6 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x37d6f4 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 3.6, 20), hullMat);
    body.position.y = 2.0;
    rocket.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.4, 20), accentMat);
    nose.position.y = 4.5;
    rocket.add(nose);

    const ringBand = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.22, 20), glowMat);
    ringBand.position.y = 3.2;
    rocket.add(ringBand);

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.45), darkMat);
      leg.position.set(Math.cos(a) * 1.1, 0.55, Math.sin(a) * 1.1);
      leg.rotation.y = -a;
      leg.rotation.z = 0.22;
      rocket.add(leg);
    }

    const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.14), darkMat);
    hatch.position.set(0, 1.3, 0.98);
    rocket.add(hatch);

    const plume = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 2.4, 16),
      new THREE.MeshBasicMaterial({ color: 0xffa63d, transparent: true, opacity: 0.85 })
    );
    plume.rotation.x = Math.PI;
    plume.position.y = -1.0;
    plume.visible = false;
    rocket.add(plume);
    scene.add(rocket);

    // Boarding pad & crew (Scene 1)
    const padGroup = new THREE.Group();
    const padFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 7, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    padFloor.position.y = -0.2;
    padGroup.add(padFloor);
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.14, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    ramp.position.set(0, 0.45, 2.6);
    ramp.rotation.x = -0.24;
    padGroup.add(ramp);

    const crewSprites = [0xff7a3d, 0x37d6f4, 0x37d67a, 0xffb84d].map((col, idx) => {
      const ast = createAstronautGroup(col, idx === 0);
      ast.group.scale.setScalar(0.65);
      ast.group.position.set((idx - 1.5) * 0.45, 0.05, 4.4 - idx * 0.4);
      padGroup.add(ast.group);
      return ast;
    });
    scene.add(padGroup);

    // Clouds (Scene 2)
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.95,
      transparent: true,
      opacity: 0.8,
    });
    for (let i = 0; i < 16; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (i % 3) * 0.7, 12, 10), cloudMat);
      c.scale.set(1.8, 0.6, 1.4);
      c.position.set(((i % 4) - 1.5) * 5.5, 8 + i * 1.4, -4 - (i % 5) * 2);
      cloudGroup.add(c);
    }
    cloudGroup.visible = false;
    scene.add(cloudGroup);

    // Earth & Destination globes (Scene 3)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const earthTex = createPlanetTerrainTexture('earth', maxAniso);
    const destTex = createPlanetTerrainTexture(destination, maxAniso);

    const earthGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 28, 24),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.6 })
    );
    earthGlobe.visible = false;
    scene.add(earthGlobe);

    const destGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 28, 24),
      new THREE.MeshStandardMaterial({ map: destTex, roughness: 0.85 })
    );
    destGlobe.visible = false;
    scene.add(destGlobe);

    // Landing terrain & dust (Scene 4)
    const terrainGroup = new THREE.Group();
    const terrainPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(55, 55, 24, 24),
      new THREE.MeshStandardMaterial({ map: destTex, roughness: 0.92 })
    );
    terrainPlane.rotation.x = -Math.PI / 2;
    terrainGroup.add(terrainPlane);

    const dustRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 2.8, 28),
      new THREE.MeshBasicMaterial({
        color: destination === 'mars' ? 0xd97757 : 0x9ca3af,
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
    const sceneDuration = reducedMotion ? 2.2 : 5.2;
    const totalDuration = sceneDuration * 4;
    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let disposed = false;
    let lastStage = -1;

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

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
      }

      // Reset visibility per stage
      padGroup.visible = stage === 0;
      cloudGroup.visible = stage === 1;
      earthGlobe.visible = stage === 2;
      destGlobe.visible = stage === 2;
      terrainGroup.visible = stage === 3;
      plume.visible = stage === 1 || (stage === 3 && localT < 0.82);

      if (stage === 0) {
        // Boarding
        scene.background = new THREE.Color(0x0b1c36);
        rocket.position.set(0, 0, 0);
        rocket.rotation.set(0, 0, 0);
        hatch.position.x = THREE.MathUtils.lerp(0.42, 0, Math.max(0, (localT - 0.65) / 0.35));
        crewSprites.forEach((ast, idx) => {
          const walkT = Math.min(1, localT * 1.4 - idx * 0.12);
          if (walkT > 0 && walkT < 1) {
            ast.group.position.z = THREE.MathUtils.lerp(4.4, 1.0, walkT);
            ast.group.position.y = THREE.MathUtils.lerp(0.05, 0.95, walkT);
            const swing = Math.sin(elapsed * 8 + idx) * 0.4;
            ast.leftLeg.rotation.x = swing;
            ast.rightLeg.rotation.x = -swing;
          } else if (walkT >= 1) {
            ast.group.visible = false;
          }
        });
        camera.position.set(4.5 - localT * 1.2, 2.5, 7.2);
        camera.lookAt(0, 1.6, 0.4);
      } else if (stage === 1) {
        // Launch from Earth
        const skyColor = new THREE.Color(0x1d4e89).lerp(new THREE.Color(0x050b16), localT);
        scene.background = skyColor;
        rocket.position.set(0, localT * 12, 0);
        plume.scale.setScalar(0.85 + Math.sin(elapsed * 30) * 0.15);
        cloudGroup.position.y = -localT * 10;
        camera.position.set(5.5, 2.2 + localT * 11, 7.5);
        camera.lookAt(0, rocket.position.y + 2.0, 0);
      } else if (stage === 2) {
        // Space Transit
        scene.background = new THREE.Color(0x030712);
        rocket.position.set(0, 0, 0);
        rocket.rotation.z = -Math.PI / 2;
        rocket.rotation.y = 0.25;
        earthGlobe.position.set(-6 - localT * 9, -1.5, -10 - localT * 8);
        earthGlobe.scale.setScalar(Math.max(0.25, 1.0 - localT * 0.7));
        destGlobe.position.set(9 - localT * 4.5, 1.2, -16 + localT * 9);
        destGlobe.scale.setScalar(0.35 + localT * 1.15);
        camera.position.set(0.5, 2.8, 8.8);
        camera.lookAt(0, 0, 0);
      } else {
        // Destination Landing
        const bgHex = destination === 'mars' ? 0x6b2f1c : 0x050912;
        scene.background = new THREE.Color(bgHex);
        rocket.rotation.set(0, 0, 0);
        const altitude = THREE.MathUtils.lerp(11, 0, THREE.MathUtils.smoothstep(localT, 0, 0.85));
        rocket.position.set(0, altitude, 0);
        const dustScale = localT > 0.5 ? 0.5 + (localT - 0.5) * 3.0 : 0.1;
        dustRing.scale.setScalar(dustScale);
        (dustRing.material as THREE.MeshBasicMaterial).opacity =
          localT > 0.5 ? Math.max(0, 0.55 - (localT - 0.5)) : 0;
        camera.position.set(6.5, 3.0 + altitude * 0.25, 8.2);
        camera.lookAt(0, altitude + 1.5, 0);
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
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [destination, reducedMotion, finishCinematic]);

  const activeInfo = SCENE_LABELS[sceneIndex] || SCENE_LABELS[0];

  return (
    <div className="relative w-screen h-screen bg-[#07111F] overflow-hidden select-none">
      {webglOk ? (
        <div ref={mountRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#07111F] p-8 text-center">
          <div className="max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6">
            <h2 className="text-xl font-bold text-[#37D6F4]">Mission Transit Sequence</h2>
            <p className="mt-2 text-sm text-[#AAB8C8]">
              WebGL 3D preview is unavailable on this browser, but all Mission Control systems are ready!
            </p>
          </div>
        </div>
      )}

      {/* Top Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-20 pointer-events-none">
        <div className="pointer-events-auto rounded-xl bg-[#0D1B2A]/90 border border-white/15 px-4 py-2.5">
          <p className="text-xs font-semibold tracking-wider text-[#37D6F4] uppercase">
            {activeInfo.title}
          </p>
          <p className="text-sm font-medium text-[#F4F7FB] mt-0.5">
            Destination: {destination === 'mars' ? 'Mars Outpost (0.38g)' : 'Lunar Outpost (0.16g)'}
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
            <span>Skip Intro</span>
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Narration & Progress */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[min(680px,92vw)] z-20 pointer-events-none">
        <div className="rounded-2xl bg-[#0D1B2A]/92 border border-white/15 px-6 py-4 text-center">
          <p className="text-sm sm:text-base text-[#F4F7FB] font-medium">{activeInfo.caption}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {SCENE_LABELS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === sceneIndex
                    ? 'w-10 bg-[#37D6F4]'
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

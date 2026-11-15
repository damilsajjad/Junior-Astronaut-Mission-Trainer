import * as THREE from 'three';

export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function createAfterDrawPacer(renderer: THREE.WebGLRenderer) {
  let timerId = 0;
  const afterDraw = (cb: () => void) => {
    try {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            timerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 5);
        return;
      }
    } catch {
      // Fallback
    }
    timerId = window.setTimeout(cb, 80);
  };
  const cancel = () => window.clearTimeout(timerId);
  return { afterDraw, cancel };
}

export function createPlanetTerrainTexture(
  kind: 'mars' | 'moon' | 'earth',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'mars') {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#9E472A');
    grad.addColorStop(0.5, '#85381F');
    grad.addColorStop(1, '#6E2B17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 420; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
      const px = Math.abs(x) * 512;
      const py = Math.abs(y) * 512;
      const r = 3 + (i % 18);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(196, 98, 60, 0.22)' : 'rgba(65, 22, 12, 0.26)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'moon') {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#7F8792');
    grad.addColorStop(0.5, '#68707C');
    grad.addColorStop(1, '#545B66');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 360; i++) {
      const px = Math.abs((Math.sin(i * 19.31) * 43758.5453) % 1) * 512;
      const py = Math.abs((Math.sin(i * 91.7) * 43758.5453) % 1) * 512;
      const r = 4 + (i % 24);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(165, 174, 186, 0.22)' : 'rgba(42, 46, 54, 0.34)';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Earth
    ctx.fillStyle = '#155CA8';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#2F8F5B';
    const continents = [
      [110, 140, 80, 55],
      [280, 110, 110, 75],
      [340, 260, 75, 90],
      [140, 310, 65, 80],
    ];
    for (const [cx, cy, rx, ry] of continents) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(244, 249, 255, 0.65)';
    for (let i = 0; i < 40; i++) {
      const px = (i * 53) % 512;
      const py = (i * 97) % 512;
      ctx.beginPath();
      ctx.ellipse(px, py, 38, 12, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  return tex;
}

export function createFloorPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8F9AA6';
  ctx.fillRect(0, 0, 512, 512);

  // Clean futuristic tile grid matching Mars & Moon module floor
  ctx.strokeStyle = '#636E7B';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 16; x < 512; x += 128) {
    for (let y = 16; y < 512; y += 128) {
      ctx.fillRect(x, y, 96, 96);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  return tex;
}

export function createAstronautGroup(
  accentHex: number,
  isPlayer = false
): {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
} {
  const group = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0xf0f4f8,
    roughness: 0.45,
    metalness: 0.1,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.4,
    metalness: 0.25,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x263242,
    roughness: 0.6,
    metalness: 0.4,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x162436,
    roughness: 0.1,
    metalness: 0.9,
    emissive: isPlayer ? 0x103848 : 0x091624,
    emissiveIntensity: 0.5,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), suitMat);
  torso.position.y = 0.72;
  torso.castShadow = true;
  group.add(torso);

  // Chest control pack
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.08), trimMat);
  chest.position.set(0, 0.76, 0.16);
  group.add(chest);

  // Backpack life support
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.18), suitMat);
  pack.position.set(0, 0.76, -0.2);
  pack.castShadow = true;
  group.add(pack);

  const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.19), trimMat);
  packStripe.position.set(0, 0.86, -0.2);
  group.add(packStripe);

  // Helmet + visor
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), suitMat);
  helmet.position.set(0, 1.18, 0);
  helmet.castShadow = true;
  group.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), visorMat);
  visor.position.set(0, 1.18, 0.11);
  visor.scale.set(1.05, 0.88, 0.75);
  group.add(visor);

  // Neck ring
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.06, 16), trimMat);
  collar.position.set(0, 1.0, 0);
  group.add(collar);

  // Limbs pivoted cleanly
  const legGeo = new THREE.CapsuleGeometry(0.08, 0.26, 6, 10);
  const leftLeg = new THREE.Mesh(legGeo, suitMat);
  leftLeg.position.set(-0.11, 0.28, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, suitMat);
  rightLeg.position.set(0.11, 0.28, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  const bootGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
  const leftBoot = new THREE.Mesh(bootGeo, darkMat);
  leftBoot.position.set(0, -0.2, 0.03);
  leftLeg.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, darkMat);
  rightBoot.position.set(0, -0.2, 0.03);
  rightLeg.add(rightBoot);

  const armGeo = new THREE.CapsuleGeometry(0.065, 0.26, 6, 10);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.29, 0.72, 0);
  leftArm.rotation.z = 0.18;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.29, 0.72, 0);
  rightArm.rotation.z = -0.18;
  rightArm.castShadow = true;
  group.add(rightArm);

  if (isPlayer) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.4, 24),
      new THREE.MeshBasicMaterial({
        color: 0x37d6f4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);
  }

  return { group, leftLeg, rightLeg, leftArm, rightArm };
}

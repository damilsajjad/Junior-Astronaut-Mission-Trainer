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
    grad.addColorStop(0, '#B55331');
    grad.addColorStop(0.45, '#923D22');
    grad.addColorStop(1, '#6C2815');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Wind-blown Martian regolith dunes & dark basaltic streaks
    for (let i = 0; i < 46; i++) {
      const y = (i * 11.4) % 512;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(222, 118, 72, 0.2)' : 'rgba(58, 19, 10, 0.24)';
      ctx.lineWidth = 3 + (i % 6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + ((i % 5) - 2) * 8, 340, y - ((i % 4) - 1.5) * 8, 512, y);
      ctx.stroke();
    }

    // Impact craters & iron-oxide rocks
    for (let i = 0; i < 440; i++) {
      const px = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * 512;
      const py = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1) * 512;
      const r = 2.5 + (i % 16);
      if (i % 19 === 0 && r > 9) {
        // Rim highlight & basin shadow
        ctx.fillStyle = 'rgba(64, 21, 11, 0.42)';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(228, 134, 88, 0.36)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px - 1, py - 1, r, 0.2, Math.PI * 1.15);
        ctx.stroke();
      } else {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(218, 112, 68, 0.22)' : 'rgba(62, 20, 11, 0.25)';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === 'moon') {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#8C95A1');
    grad.addColorStop(0.5, '#6C7582');
    grad.addColorStop(1, '#505763');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Maria patches & crisp rimmed lunar craters
    for (let i = 0; i < 380; i++) {
      const px = Math.abs((Math.sin(i * 19.31) * 43758.5453) % 1) * 512;
      const py = Math.abs((Math.sin(i * 91.7) * 43758.5453) % 1) * 512;
      const r = 4 + (i % 24);
      if (i % 11 === 0 && r > 10) {
        ctx.fillStyle = 'rgba(30, 34, 42, 0.44)';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(215, 224, 236, 0.42)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(px - 1.2, py - 1.2, r + 0.5, Math.PI * 0.9, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ctx.fillStyle = i % 3 === 0 ? 'rgba(182, 192, 204, 0.24)' : 'rgba(34, 38, 46, 0.34)';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0E4C8A');
    oceanGrad.addColorStop(0.5, '#1565B5');
    oceanGrad.addColorStop(1, '#0C467E');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Continents with coastal shelf + green lowlands
    const continents = [
      [110, 145, 82, 58],
      [285, 118, 112, 76],
      [345, 265, 76, 92],
      [142, 315, 68, 82],
      [440, 360, 58, 48],
    ];
    for (const [cx, cy, rx, ry] of continents) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx + 7, ry + 7, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2F8F5B';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(180, 146, 86, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy - 6, rx * 0.46, ry * 0.42, 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar ice caps
    ctx.fillStyle = 'rgba(241, 248, 255, 0.86)';
    ctx.fillRect(0, 0, 512, 26);
    ctx.fillRect(0, 486, 512, 26);

    // Swirling cloud bands
    ctx.fillStyle = 'rgba(244, 249, 255, 0.62)';
    for (let i = 0; i < 46; i++) {
      const px = (i * 53 + (i % 3) * 19) % 512;
      const py = 30 + ((i * 97) % 452);
      ctx.beginPath();
      ctx.ellipse(px, py, 36 + (i % 18), 9 + (i % 6), 0.18, 0, Math.PI * 2);
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

export function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0F2547';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 4;
  const cw = 512 / cols;
  const ch = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      const cellGrad = ctx.createLinearGradient(x, y, x + cw, y + ch);
      cellGrad.addColorStop(0, '#1B4079');
      cellGrad.addColorStop(0.5, '#13315E');
      cellGrad.addColorStop(1, '#1E4C8F');
      ctx.fillStyle = cellGrad;
      ctx.fillRect(x + 4, y + 4, cw - 8, ch - 8);

      // Subtle silicon busbars
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.34)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + cw * 0.33, y + 4);
      ctx.lineTo(x + cw * 0.33, y + ch - 4);
      ctx.moveTo(x + cw * 0.66, y + 4);
      ctx.lineTo(x + cw * 0.66, y + ch - 4);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, cw - 6, ch - 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  return tex;
}

/**
 * Multi-tone InstancedMesh starfield for crisp deep-space sky depth.
 */
export function createMultiToneStarfield(
  count: number,
  minRadius: number,
  maxRadius: number
): {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
} {
  const geometry = new THREE.SphereGeometry(0.13, 6, 6);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const palette = [
    new THREE.Color(0xeef6ff),
    new THREE.Color(0xbce0ff),
    new THREE.Color(0xfff4d6),
    new THREE.Color(0xffd7b5),
  ];

  for (let i = 0; i < count; i++) {
    const r = minRadius + ((i * 17.3) % Math.max(1, maxRadius - minRadius));
    const theta = i * 2.39996;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    dummy.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    dummy.scale.setScalar(0.5 + (i % 6) * 0.22);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, palette[i % palette.length]);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();

  return { mesh, geometry, material };
}

export type SpacecraftRocketHandle = {
  group: THREE.Group;
  hatch: THREE.Group;
  plumeGroup: THREE.Group;
  flameOuter: THREE.Mesh;
  flameCore: THREE.Mesh;
  machDiamonds: THREE.Mesh[];
  engineLight: THREE.PointLight;
};

/**
 * Detailed composite procedural aerospace spacecraft rocket (LatheGeometry fuselage/ogive nose/engine bells,
 * beveled ExtrudeGeometry swept fins with landing footpads, copper thermal foil band, propellant lines,
 * recessed viewport & boarding hatch, and multi-layered plasma thruster plume).
 */
export function createSpacecraftRocketGroup(opts: {
  isRescue: boolean;
}): SpacecraftRocketHandle {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef3f8,
    roughness: 0.28,
    metalness: 0.24,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: opts.isRescue ? 0xe11d48 : 0xf97316,
    roughness: 0.34,
    metalness: 0.22,
    clearcoat: 0.5,
  });
  const darkAlloyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.38,
    metalness: 0.72,
  });
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.32,
    metalness: 0.78,
  });
  const thermalFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd99b26,
    roughness: 0.24,
    metalness: 0.88,
  });
  const glowTrimMat = new THREE.MeshBasicMaterial({
    color: opts.isRescue ? 0xffb84d : 0x37d6f4,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b2545,
    roughness: 0.08,
    metalness: 0.85,
    clearcoat: 1.0,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.42,
  });

  // 1. Main Fuselage + Curved Tapered Upper Crew Stage (LatheGeometry)
  const bodyProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.56),
    new THREE.Vector2(0.76, 0.56),
    new THREE.Vector2(0.96, 0.72),
    new THREE.Vector2(0.98, 1.35),
    new THREE.Vector2(0.96, 2.55),
    new THREE.Vector2(0.92, 3.15),
    new THREE.Vector2(0.84, 3.45),
    new THREE.Vector2(0.82, 4.18),
    new THREE.Vector2(0.0, 4.18),
  ];
  const fuselage = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, 32), hullMat);
  fuselage.castShadow = true;
  group.add(fuselage);

  // 2. Smooth Ogive Nose Fairing + Escape Spire
  const noseProfile: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = Math.max(0.02, Math.cos(t * Math.PI * 0.5) ** 0.78 * 0.82);
    const y = 4.16 + t * 1.38;
    noseProfile.push(new THREE.Vector2(r, y));
  }
  const noseCone = new THREE.Mesh(new THREE.LatheGeometry(noseProfile, 32), accentMat);
  noseCone.castShadow = true;
  group.add(noseCone);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.42, 12), titaniumMat);
  spire.position.y = 5.72;
  group.add(spire);
  const tipBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), glowTrimMat);
  tipBeacon.position.y = 5.94;
  group.add(tipBeacon);

  // 3. Interstage Collar, Gold Thermal Foil Band & Glowing Telemetry Ring
  const thermalBand = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.99, 0.34, 32), thermalFoilMat);
  thermalBand.position.y = 1.04;
  group.add(thermalBand);

  const interstageRing = new THREE.Mesh(new THREE.CylinderGeometry(0.87, 0.94, 0.24, 32), darkAlloyMat);
  interstageRing.position.y = 3.28;
  group.add(interstageRing);

  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.845, 0.032, 10, 32), glowTrimMat);
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 3.44;
  group.add(glowRing);

  // 4. External Propellant Feedlines & Avionics Conduits
  for (const ang of [Math.PI * 0.22, -Math.PI * 0.22, Math.PI * 0.78, -Math.PI * 0.78]) {
    const pipe = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 2.25, 6, 10), titaniumMat);
    pipe.position.set(Math.cos(ang) * 0.98, 2.02, Math.sin(ang) * 0.98);
    group.add(pipe);
  }

  // 5. Recessed Crew Cabin Viewport & Circular Boarding Hatch
  const viewportFrame = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 10, 24), darkAlloyMat);
  viewportFrame.position.set(0, 3.82, 0.8);
  group.add(viewportFrame);
  const viewportGlass = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), glassMat);
  viewportGlass.scale.set(1, 1, 0.35);
  viewportGlass.position.set(0, 3.82, 0.78);
  group.add(viewportGlass);

  const hatch = new THREE.Group();
  hatch.position.set(0, 1.82, 0.95);
  const hatchRim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24), darkAlloyMat);
  hatch.add(hatchRim);
  const hatchDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20), titaniumMat);
  hatchDoor.rotation.x = Math.PI / 2;
  hatch.add(hatchDoor);
  const hatchBar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.12), accentMat);
  hatch.add(hatchBar);
  group.add(hatch);

  // 6. Four Beveled Swept Aerodynamic Fins + Landing Footpads (grounded at y = 0!)
  const finShape = new THREE.Shape();
  finShape.moveTo(0.84, 0.58);
  finShape.lineTo(1.52, 0.08);
  finShape.lineTo(1.56, 0.38);
  finShape.lineTo(0.95, 1.56);
  finShape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  finGeo.translate(0, 0, -0.04);

  for (let i = 0; i < 4; i++) {
    const finGroup = new THREE.Group();
    finGroup.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;

    const finMesh = new THREE.Mesh(finGeo, darkAlloyMat);
    finMesh.castShadow = true;
    finGroup.add(finMesh);

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.62, 10), titaniumMat);
    strut.position.set(1.22, 0.31, 0);
    strut.rotation.z = 0.24;
    finGroup.add(strut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.08, 16), darkAlloyMat);
    pad.position.set(1.38, 0.04, 0);
    finGroup.add(pad);

    group.add(finGroup);
  }

  // 7. Tri-Cluster Parabolic Engine Bells (LatheGeometry)
  const bellProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.08, 0.56),
    new THREE.Vector2(0.14, 0.44),
    new THREE.Vector2(0.24, 0.26),
    new THREE.Vector2(0.31, 0.08),
    new THREE.Vector2(0.28, 0.08),
    new THREE.Vector2(0.12, 0.44),
  ];
  const bellGeo = new THREE.LatheGeometry(bellProfile, 22);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const bell = new THREE.Mesh(bellGeo, darkAlloyMat);
    bell.position.set(Math.cos(a) * 0.34, 0.02, Math.sin(a) * 0.34);
    group.add(bell);
  }

  // 8. Multi-Layered Engine Flame Plume + Dynamic PointLight
  const plumeGroup = new THREE.Group();
  plumeGroup.position.set(0, 0.08, 0);

  const outerGeo = new THREE.ConeGeometry(0.76, 3.2, 22, 1, true);
  outerGeo.translate(0, -1.6, 0);
  const flameOuter = new THREE.Mesh(
    outerGeo,
    new THREE.MeshBasicMaterial({
      color: 0xff6b2c,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  plumeGroup.add(flameOuter);

  const coreGeo = new THREE.ConeGeometry(0.42, 2.35, 18);
  coreGeo.translate(0, -1.18, 0);
  const flameCore = new THREE.Mesh(
    coreGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfff0b3,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  plumeGroup.add(flameCore);

  const machDiamonds: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22 - i * 0.04, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    diamond.scale.set(0.85, 1.5, 0.85);
    diamond.position.y = -0.55 - i * 0.65;
    plumeGroup.add(diamond);
    machDiamonds.push(diamond);
  }

  const engineLight = new THREE.PointLight(0xff8c3b, 0, 22, 1.6);
  engineLight.position.set(0, -0.8, 0);
  plumeGroup.add(engineLight);

  plumeGroup.visible = false;
  group.add(plumeGroup);

  return {
    group,
    hatch,
    plumeGroup,
    flameOuter,
    flameCore,
    machDiamonds,
    engineLight,
  };
}

export function createFloorPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2B3646';
  ctx.fillRect(0, 0, 512, 512);

  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillStyle = '#3B495C';
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 8, 112, 112, 14);
      ctx.fill();

      ctx.strokeStyle = 'rgba(55, 214, 244, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 14, y + 14, 100, 100, 10);
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      for (const rx of [x + 20, x + 108]) {
        for (const ry of [y + 20, y + 108]) {
          ctx.beginPath();
          ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 2.5);
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  return tex;
}

/**
 * Draws the live status screen CanvasTexture for each physical Arcade Life-Support Machine.
 */
export function drawArcadeScreenCanvas(
  canvas: HTMLCanvasElement,
  title: string,
  accentHex: string,
  statusText: string,
  isOn: boolean,
  metricLine: string,
  isFault: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = isFault ? '#2A0B12' : '#07111F';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header marquee bar
  ctx.fillStyle = isFault ? '#FF5B68' : accentHex;
  ctx.fillRect(0, 0, canvas.width, 46);

  ctx.fillStyle = '#07111F';
  ctx.font = 'bold 21px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 30);

  // Status pill
  ctx.fillStyle = !isOn ? '#475569' : isFault ? '#FF5B68' : '#37D67A';
  ctx.beginPath();
  ctx.roundRect(24, 64, canvas.width - 48, 36, 8);
  ctx.fill();

  ctx.fillStyle = '#07111F';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(isFault ? '! REPAIR NEEDED !' : isOn ? `ON · ${statusText}` : 'SWITCHED OFF', canvas.width / 2, 88);

  // Telemetry line
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(metricLine, canvas.width / 2, 134);

  // Decorative waveform / bar
  ctx.strokeStyle = isFault ? '#FF5B68' : accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 20; x <= canvas.width - 20; x += 16) {
    const y = 166 + Math.sin(x * 0.12) * (isOn && !isFault ? 10 : 2);
    if (x === 20) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export type ArcadeMachineHandle = {
  group: THREE.Group;
  screenCanvas: HTMLCanvasElement;
  screenTexture: THREE.CanvasTexture;
  switchLever: THREE.Mesh;
  statusLed: THREE.Mesh;
  warningTriangle: THREE.Group;
  sparkRing: THREE.Mesh;
  accentHexStr: string;
  title: string;
  lastKey: string;
};

/**
 * Compact Futuristic Arcade Gaming Cabinet for the 6 physical Life-Support Machines.
 * Includes individual CRT/OLED screen, glowing arcade buttons, physical ON/OFF lever,
 * status LED dome, and floating 3D Warning Triangle with '!' when damaged.
 */
export function createArcadeMachineGroup(opts: {
  title: string;
  accentHex: number;
  accentCss: string;
}): ArcadeMachineHandle {
  const group = new THREE.Group();

  const cabinetBodyMat = new THREE.MeshStandardMaterial({
    color: 0x162235,
    roughness: 0.4,
    metalness: 0.55,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: opts.accentHex,
    roughness: 0.28,
    metalness: 0.3,
    emissive: opts.accentHex,
    emissiveIntensity: 0.35,
  });
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x0b1322,
    roughness: 0.5,
    metalness: 0.65,
  });

  // Base pedestal
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.56), bezelMat);
  base.position.y = 0.06;
  base.castShadow = true;
  group.add(base);

  // Lower cabinet body
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.68, 0.48), cabinetBodyMat);
  lower.position.y = 0.46;
  lower.castShadow = true;
  group.add(lower);

  // Side accent trim rails
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.18, 0.46), trimMat);
  railL.position.set(-0.32, 0.72, -0.02);
  group.add(railL);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.18, 0.46), trimMat);
  railR.position.set(0.32, 0.72, -0.02);
  group.add(railR);

  // Upper screen housing
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.4), cabinetBodyMat);
  upper.position.set(0, 1.04, -0.04);
  upper.castShadow = true;
  group.add(upper);

  // Screen CanvasTexture
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256;
  screenCanvas.height = 192;
  drawArcadeScreenCanvas(screenCanvas, opts.title, opts.accentCss, 'READY', true, 'PWR · OK', false);
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.38),
    new THREE.MeshBasicMaterial({ map: screenTexture })
  );
  screenMesh.position.set(0, 1.04, 0.165);
  group.add(screenMesh);

  // Arcade control deck shelf + 3 illuminated buttons + physical ON/OFF toggle lever
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.24), bezelMat);
  deck.position.set(0, 0.78, 0.24);
  deck.rotation.x = 0.22;
  group.add(deck);

  const btnColors = [0x37d67a, 0x37d6f4, 0xffb84d];
  btnColors.forEach((c, idx) => {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.04, 0.03, 12),
      new THREE.MeshBasicMaterial({ color: c })
    );
    btn.position.set(-0.14 + idx * 0.1, 0.82, 0.26);
    btn.rotation.x = 0.22;
    group.add(btn);
  });

  // Physical ON/OFF Toggle Lever on right side of arcade deck
  const switchLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.11, 10),
    new THREE.MeshStandardMaterial({ color: 0xff7a3d, emissive: 0xff5500, emissiveIntensity: 0.4 })
  );
  switchLever.position.set(0.2, 0.85, 0.25);
  switchLever.rotation.x = -0.35;
  group.add(switchLever);

  // Top marquee + status LED dome
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.44), trimMat);
  marquee.position.set(0, 1.34, -0.02);
  group.add(marquee);

  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x37d67a })
  );
  statusLed.position.set(0, 1.46, 0.04);
  group.add(statusLed);

  // Floating 3D Warning Triangle with '!' (hidden when healthy!)
  const warningTriangle = new THREE.Group();
  warningTriangle.position.set(0, 1.76, 0.05);

  const triShape = new THREE.Shape();
  triShape.moveTo(0, 0.2);
  triShape.lineTo(-0.18, -0.14);
  triShape.lineTo(0.18, -0.14);
  triShape.closePath();

  const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 0.04, bevelEnabled: false });
  const triMesh = new THREE.Mesh(
    triGeo,
    new THREE.MeshBasicMaterial({ color: 0xffb84d })
  );
  triMesh.position.z = -0.02;
  warningTriangle.add(triMesh);

  const exclBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.13, 0.055),
    new THREE.MeshBasicMaterial({ color: 0x07111f })
  );
  exclBar.position.set(0, 0.03, 0);
  warningTriangle.add(exclBar);

  const exclDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x07111f })
  );
  exclDot.position.set(0, -0.08, 0);
  warningTriangle.add(exclDot);

  warningTriangle.visible = false;
  group.add(warningTriangle);

  // Spark/Damage ring on floor around cabinet when damaged
  const sparkRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.52, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff5b68,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );
  sparkRing.rotation.x = -Math.PI / 2;
  sparkRing.position.y = 0.02;
  group.add(sparkRing);

  return {
    group,
    screenCanvas,
    screenTexture,
    switchLever,
    statusLed,
    warningTriangle,
    sparkRing,
    accentHexStr: opts.accentCss,
    title: opts.title,
    lastKey: '',
  };
}

/**
 * Smooth, sculpted 100% rounded 3D Astronaut model with optional repair wrench tool.
 */
export function createAstronautGroup(
  accentHex: number,
  isPlayer = false
): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  headGroup: THREE.Group;
  wrenchTool: THREE.Group;
  waterBottleProp: THREE.Group;
  foodPackProp: THREE.Group;
} {
  const group = new THREE.Group();

  const suitMat = new THREE.MeshStandardMaterial({
    color: 0xeef3f9,
    roughness: 0.42,
    metalness: 0.1,
  });
  const suitShadeMat = new THREE.MeshStandardMaterial({
    color: 0xbac7d6,
    roughness: 0.48,
    metalness: 0.18,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    roughness: 0.3,
    metalness: 0.25,
    emissive: accentHex,
    emissiveIntensity: isPlayer ? 0.22 : 0.12,
  });
  const darkBootMat = new THREE.MeshStandardMaterial({
    color: 0x162032,
    roughness: 0.48,
    metalness: 0.45,
  });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f2740,
    roughness: 0.08,
    metalness: 0.92,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    emissive: isPlayer ? 0x164e63 : 0x0b1f33,
    emissiveIntensity: 0.65,
  });

  // Rounded Sculpted Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.24, 10, 18), suitMat);
  torso.scale.set(1.06, 1.0, 0.82);
  torso.position.y = 0.72;
  torso.castShadow = true;
  group.add(torso);

  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.036, 10, 24), trimMat);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.05, 0.84, 1);
  belt.position.y = 0.56;
  group.add(belt);

  const chestUnit = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.08, 16), suitShadeMat);
  chestUnit.rotation.x = Math.PI / 2;
  chestUnit.position.set(0, 0.76, 0.18);
  group.add(chestUnit);

  const chestLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 10, 10),
    new THREE.MeshBasicMaterial({ color: isPlayer ? 0x37d6f4 : accentHex })
  );
  chestLed.position.set(0, 0.76, 0.22);
  group.add(chestLed);

  const packBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.2, 8, 16), suitShadeMat);
  packBody.scale.set(1.15, 1.0, 0.65);
  packBody.position.set(0, 0.77, -0.2);
  packBody.castShadow = true;
  group.add(packBody);

  const packTankL = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.18, 6, 12), suitMat);
  packTankL.position.set(-0.09, 0.78, -0.26);
  group.add(packTankL);

  const packTankR = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.18, 6, 12), suitMat);
  packTankR.position.set(0.09, 0.78, -0.26);
  group.add(packTankR);

  const packRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), trimMat);
  packRing.position.set(0, 0.9, -0.28);
  group.add(packRing);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, 0);
  group.add(headGroup);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.038, 10, 24), trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = -0.13;
  headGroup.add(collar);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.255, 24, 20), suitMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, 22, 18, -Math.PI * 0.36, Math.PI * 0.72, Math.PI * 0.22, Math.PI * 0.56),
    visorMat
  );
  visor.position.set(0, 0.01, 0.06);
  visor.rotation.y = Math.PI / 2;
  headGroup.add(visor);

  const visorRim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.022, 10, 24), trimMat);
  visorRim.position.set(0, 0.01, 0.15);
  visorRim.scale.set(1.06, 0.88, 0.7);
  headGroup.add(visorRim);

  const earPodGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.06, 14);
  const earL = new THREE.Mesh(earPodGeo, trimMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.25, 0, 0);
  headGroup.add(earL);

  const earR = new THREE.Mesh(earPodGeo, trimMat);
  earR.rotation.z = Math.PI / 2;
  earR.position.set(0.25, 0, 0);
  headGroup.add(earR);

  const makeLeg = (xOffset: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 0.52, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.22, 8, 14), suitMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    pivot.add(thigh);

    const kneeRing = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.018, 8, 16), trimMat);
    kneeRing.rotation.x = Math.PI / 2;
    kneeRing.position.y = -0.24;
    pivot.add(kneeRing);

    const boot = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.09, 8, 14), darkBootMat);
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, -0.42, 0.045);
    boot.castShadow = true;
    pivot.add(boot);

    group.add(pivot);
    return pivot;
  };

  const leftLeg = makeLeg(-0.115);
  const rightLeg = makeLeg(0.115);

  const makeArm = (xOffset: number, tiltZ: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOffset, 0.86, 0);
    pivot.rotation.z = tiltZ;

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.092, 14, 12), trimMat);
    pivot.add(shoulder);

    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.2, 8, 12), suitMat);
    sleeve.position.y = -0.17;
    sleeve.castShadow = true;
    pivot.add(sleeve);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), darkBootMat);
    glove.position.y = -0.34;
    pivot.add(glove);

    group.add(pivot);
    return pivot;
  };

  const leftArm = makeArm(-0.27, 0.24);
  const rightArm = makeArm(0.27, -0.24);

  // Physical Wrench / Repair Tool attached to right glove (hidden until repairing!)
  const wrenchTool = new THREE.Group();
  const wHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.28, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.25 })
  );
  wHandle.position.set(0, -0.38, 0.12);
  wHandle.rotation.x = Math.PI / 2;
  wrenchTool.add(wHandle);
  const wTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x37d6f4 })
  );
  wTip.position.set(0, -0.38, 0.26);
  wrenchTool.add(wTip);
  wrenchTool.visible = false;
  rightArm.add(wrenchTool);

  // Handheld Water Bottle prop (visible during 'drink' animation)
  const waterBottleProp = new THREE.Group();
  const bottleBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.1, 6, 10),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
    })
  );
  bottleBody.position.set(0, -0.37, 0.08);
  waterBottleProp.add(bottleBody);
  const bottleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.028, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
  );
  bottleCap.position.set(0, -0.29, 0.08);
  waterBottleProp.add(bottleCap);
  waterBottleProp.visible = false;
  rightArm.add(waterBottleProp);

  // Handheld Food Ration / Harvest prop (visible during 'eat' animation)
  const foodPackProp = new THREE.Group();
  const foodBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.06, 0.13),
    new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x16a34a,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
  );
  foodBar.position.set(0, -0.36, 0.08);
  foodPackProp.add(foodBar);
  foodPackProp.visible = false;
  rightArm.add(foodPackProp);

  if (isPlayer) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.42, 32),
      new THREE.MeshBasicMaterial({
        color: 0x37d6f4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);
  }

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    wrenchTool,
    waterBottleProp,
    foodPackProp,
  };
}

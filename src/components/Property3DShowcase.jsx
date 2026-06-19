import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { formatPriceIndian } from '../data';

// =============================================================================
// Property3DShowcase — an architectural-render-quality interactive 3D model of
// the property (three.js), paired with an AI "3D Advisor" (Riya) that flies the
// camera to features and narrates them via the free Web Speech API.
//
// The building is generated procedurally from the listing's OWN data, but at
// arch-viz fidelity: reflective glass curtain wall (env-map reflections),
// per-floor balconies + glass railings, aluminium mullions + spandrel banding,
// a stone podium with recessed entrance, a crown, ACES tone-mapping and soft
// shadows. No external 3D assets, no paid APIs.
// =============================================================================

const ADVISOR = { name: 'Riya', role: 'Your 3D property advisor', emoji: '👩‍💼' };

function deriveBuild(property) {
  const type = (property.type || 'apartment').toLowerCase();
  const isVilla = /villa|independent|bungalow|plot|row|house/.test(type);
  const isCommercial = /commercial|office|retail|shop|sco/.test(type);

  let total = property.totalFloors || property.floors;
  if (!total && property.floor) {
    const m = String(property.floor).match(/of\s*(\d+)/i) || String(property.floor).match(/(\d+)\s*floors?/i);
    if (m) total = parseInt(m[1], 10);
  }
  if (!total) total = isVilla ? 2 : isCommercial ? 16 : /penthouse/.test(type) ? 30 : 22;
  total = Math.max(isVilla ? 2 : 6, Math.min(total, 46));

  let yourFloor = 0;
  if (property.floor) { const m = String(property.floor).match(/(\d+)/); if (m) yourFloor = Math.min(parseInt(m[1], 10), total); }
  if (!yourFloor) yourFloor = Math.round(total * 0.6);

  const facing = (property.facing && property.facing !== 'Not Set') ? property.facing : 'East';
  return { type, isVilla, isCommercial, total, yourFloor, facing };
}

const FACING_DEG = { N: 0, North: 0, NE: 45, E: 90, East: 90, SE: 135, S: 180, South: 180, SW: 225, W: 270, West: 270, NW: 315 };

// Canvas vertical sky gradient → used as scene.background.
function makeSky() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6ea6e6'); g.addColorStop(0.45, '#a9cdf2'); g.addColorStop(0.8, '#dfeaf6'); g.addColorStop(1, '#eef3f8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Subtle procedural ground texture (grass with variation).
function makeGround() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6f8f54'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const g = 70 + Math.random() * 70 | 0;
    ctx.fillStyle = `rgba(${g * 0.7 | 0},${g + 40},${g * 0.6 | 0},0.25)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function Property3DShowcase({ property, onClose, onSchedule, onSave, saved }) {
  const mountRef = useRef(null);
  const sceneApi = useRef(null);
  const flyTarget = useRef(null);
  const autoRotateRef = useRef(true);

  const build = useMemo(() => deriveBuild(property), [property]);

  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const voiceRef = useRef(null);

  const topics = useMemo(() => {
    const sunWord = /east/i.test(build.facing) ? 'gentle morning sunlight'
      : /west/i.test(build.facing) ? 'warm afternoon and evening light'
      : /north/i.test(build.facing) ? 'soft, even daylight with low heat'
      : 'bright, sunny exposure through the day';
    const floorWord = build.yourFloor >= build.total * 0.75 ? 'a commanding high-rise vantage'
      : build.yourFloor >= build.total * 0.4 ? 'a comfortable mid-rise height'
      : 'an easy, low-floor convenience';
    return [
      { id: 'overview', icon: '🏢', label: 'Overview', tip: `A ${build.total}-storey ${build.type} project.`,
        say: `Let's take a look at ${property.title}. It's ${build.isVilla ? 'a low-rise home' : `a ${build.total}-storey tower`}, priced at ${spoken(property.price)}. Drag to orbit the model — I'll walk you through it.`, cam: 'overview' },
      { id: 'orientation', icon: '🧭', label: 'Sunlight & Facing', tip: `${build.facing}-facing — ${sunWord}.`,
        say: `This home is ${build.facing}-facing. That means you get ${sunWord}. Watch how the sun falls across the glass facade from this side.`, cam: 'sun' },
      { id: 'unit', icon: '📍', label: build.isVilla ? 'Your Home' : 'Your Floor', tip: build.isVilla ? 'Your independent home.' : `Floor ${build.yourFloor} of ${build.total}.`,
        say: build.isVilla ? `Here's your home, highlighted in gold, with its own balcony and outdoor space.` : `Your unit is on floor ${build.yourFloor}, highlighted in gold with its own balcony. That gives you ${floorWord}, well above the street.`, cam: 'unit' },
      { id: 'amenities', icon: '🏊', label: build.isVilla ? 'Outdoor Space' : 'Sky Deck', tip: property.amenities?.length ? `${property.amenities.length} amenities.` : 'Premium amenities.',
        say: property.amenities?.length ? `${build.isVilla ? 'Your garden and deck sit here' : 'Up on the rooftop deck'} you have amenities like ${property.amenities.slice(0, 3).join(', ')}.` : `${build.isVilla ? 'Enjoy your private outdoor space.' : 'The rooftop deck offers an infinity pool and open city views.'}`, cam: 'deck' },
      { id: 'surroundings', icon: '🌳', label: 'Surroundings', tip: `${property.location || 'Prime location'}.`,
        say: `Looking around, ${property.title} sits in ${property.location || 'a prime neighbourhood'}, framed by landscaped greenery and a well-connected road network.`, cam: 'wide' },
    ];
  }, [build, property]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = makeSky();
    scene.fog = new THREE.Fog(0xdbe7f4, 110, 360);

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    mount.appendChild(renderer.domElement);

    // Environment map for realistic PBR reflections (no external HDR needed).
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // ── Lighting ──
    scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x57613f, 0.55));
    const az = (FACING_DEG[build.facing] ?? 90) * Math.PI / 180;
    const sun = new THREE.DirectionalLight(0xfff1d8, 2.4);
    sun.position.set(Math.sin(az) * 80, 110, Math.cos(az) * 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 360;
    sun.shadow.camera.left = -110; sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 140; sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
    scene.add(sun);

    // ── Materials ──
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x2a3c52, metalness: 0.15, roughness: 0.06, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.08 });
    const glassLite = new THREE.MeshPhysicalMaterial({ color: 0x3f566f, metalness: 0.1, roughness: 0.08, envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.1 });
    const frame = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 0.65, roughness: 0.35 });
    const spandrel = new THREE.MeshStandardMaterial({ color: 0xeef1f6, metalness: 0.1, roughness: 0.6 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xb9a888, metalness: 0.05, roughness: 0.85 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.85, roughness: 0.3 });
    const railGlass = new THREE.MeshPhysicalMaterial({ color: 0xaed4f0, metalness: 0, roughness: 0.08, transmission: 0.7, transparent: true, opacity: 0.55, envMapIntensity: 1, ior: 1.45 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc23d, metalness: 0.5, roughness: 0.3, emissive: 0xff9e00, emissiveIntensity: 0.55 });

    // ── Ground ──
    const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 72), new THREE.MeshStandardMaterial({ map: makeGround(), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(30, 56), new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.8, metalness: 0.05 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; plaza.receiveShadow = true; scene.add(plaza);
    const road = new THREE.Mesh(new THREE.RingGeometry(34, 41, 64), new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2; road.position.y = 0.03; road.receiveShadow = true; scene.add(road);

    // ── Building ──
    const group = new THREE.Group(); scene.add(group);
    const dummy = new THREE.Object3D();

    const fh = 1.7;
    const bw = build.isVilla ? 16 : 12;
    const bd = build.isVilla ? 12 : 12;
    const podiumH = build.isVilla ? 0 : 3.4;
    const towerH = build.total * fh;
    const totalH = podiumH + towerH;
    const unitY = podiumH + (build.yourFloor - 0.5) * fh;

    if (build.isVilla) {
      buildVilla(group, { bw, bd, fh, total: build.total, unitY }, { glass, stone, frame, metal, railGlass, goldMat });
    } else {
      // Podium (stone) with recessed glass entrance + cantilever canopy
      const podium = new THREE.Mesh(new RoundedBoxGeometry(bw + 6, podiumH, bd + 6, 3, 0.4), stone);
      podium.position.y = podiumH / 2; podium.castShadow = podium.receiveShadow = true; group.add(podium);
      const entrance = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.5, podiumH * 0.78, 0.4), glass);
      entrance.position.set(0, podiumH * 0.42, bd / 2 + 3.05); group.add(entrance);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.75, 0.35, 4.2), metal);
      canopy.position.set(0, podiumH * 0.86, bd / 2 + 4.6); canopy.castShadow = true; group.add(canopy);

      // Main glass mass
      const tower = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.4, towerH, bd - 0.4), glass);
      tower.position.y = podiumH + towerH / 2; tower.castShadow = tower.receiveShadow = true; group.add(tower);

      // Spandrel banding (one instanced floor-edge per floor)
      const bandGeo = new THREE.BoxGeometry(bw + 0.25, fh * 0.26, bd + 0.25);
      const bands = new THREE.InstancedMesh(bandGeo, spandrel, build.total + 1);
      bands.castShadow = bands.receiveShadow = true;
      for (let i = 0; i <= build.total; i++) { dummy.position.set(0, podiumH + i * fh, 0); dummy.updateMatrix(); bands.setMatrixAt(i, dummy.matrix); }
      group.add(bands);

      // Vertical aluminium mullions around the perimeter
      const finsPerFace = 5;
      const finGeo = new THREE.BoxGeometry(0.16, towerH, 0.3);
      const finPositions = [];
      for (let f = 0; f <= finsPerFace; f++) {
        const t = -0.5 + f / finsPerFace; // -0.5..0.5
        finPositions.push({ x: t * (bw - 0.4), z: bd / 2 - 0.18, ry: 0 });   // front
        finPositions.push({ x: t * (bw - 0.4), z: -bd / 2 + 0.18, ry: 0 });  // back
        finPositions.push({ x: bw / 2 - 0.18, z: t * (bd - 0.4), ry: Math.PI / 2 }); // right
        finPositions.push({ x: -bw / 2 + 0.18, z: t * (bd - 0.4), ry: Math.PI / 2 }); // left
      }
      const fins = new THREE.InstancedMesh(finGeo, frame, finPositions.length);
      fins.castShadow = true;
      finPositions.forEach((p, i) => { dummy.position.set(p.x, podiumH + towerH / 2, p.z); dummy.rotation.set(0, p.ry, 0); dummy.updateMatrix(); fins.setMatrixAt(i, dummy.matrix); });
      fins.instanceMatrix.needsUpdate = true; group.add(fins);
      dummy.rotation.set(0, 0, 0);

      // Corner columns
      const colGeo = new THREE.BoxGeometry(0.6, towerH, 0.6);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        const col = new THREE.Mesh(colGeo, frame);
        col.position.set(sx * (bw / 2 - 0.1), podiumH + towerH / 2, sz * (bd / 2 - 0.1));
        col.castShadow = true; group.add(col);
      });

      // Balconies (slab + glass railing) on the front face, alternating side
      const slabGeo = new THREE.BoxGeometry(bw * 0.5, 0.16, 1.3);
      const railGeo = new THREE.BoxGeometry(bw * 0.5, 0.85, 0.06);
      const slabs = new THREE.InstancedMesh(slabGeo, spandrel, build.total);
      const rails = new THREE.InstancedMesh(railGeo, railGlass, build.total);
      slabs.castShadow = slabs.receiveShadow = true;
      for (let i = 0; i < build.total; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * bw * 0.18;
        const y = podiumH + i * fh + 0.12;
        dummy.position.set(x, y, bd / 2 + 0.62); dummy.updateMatrix(); slabs.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x, y + 0.5, bd / 2 + 1.24); dummy.updateMatrix(); rails.setMatrixAt(i, dummy.matrix);
      }
      group.add(slabs); group.add(rails);

      // Crown — parapet, mechanical penthouse, slim mast
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.6, 1.1, bd + 0.6), metal);
      parapet.position.y = totalH + 0.55; parapet.castShadow = true; group.add(parapet);
      const mech = new THREE.Mesh(new RoundedBoxGeometry(bw * 0.55, 2.4, bd * 0.55, 2, 0.2), spandrel);
      mech.position.y = totalH + 2.3; mech.castShadow = true; group.add(mech);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4), metal);
      mast.position.y = totalH + 5.4; group.add(mast);

      // Rooftop sky-deck: infinity pool + glass perimeter railing
      const deck = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.3, bd), new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 }));
      deck.position.y = totalH + 0.15; deck.receiveShadow = true; group.add(deck);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.5, 0.34, bd * 0.32), glassLite);
      pool.position.set(0, totalH + 0.45, bd * 0.18); group.add(pool);

      // "Your floor" gold highlight — glowing band + slim ring + floating pin
      const goldBand = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.35, fh * 0.94, bd + 0.35), goldMat);
      goldBand.position.set(0, unitY, 0); group.add(goldBand);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(bw * 0.92, 0.12, 14, 56), new THREE.MeshBasicMaterial({ color: 0xffd45e }));
      ring.rotation.x = Math.PI / 2; ring.position.set(0, unitY, 0); group.add(ring);
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 18), new THREE.MeshStandardMaterial({ color: 0xffce4d, emissive: 0xffae00, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.3 }));
      pin.rotation.x = Math.PI; pin.position.set(0, unitY + fh * 0.5 + 1.6, bd / 2 + 1.3); group.add(pin);

      group.userData = { totalH, unitY, bw, bd, ring, pin };
    }

    // ── Surrounding skyline (reflective neighbour towers) + trees ──
    const ctx = new THREE.Group(); scene.add(ctx);
    const neighbourMat = new THREE.MeshPhysicalMaterial({ color: 0x4a6076, metalness: 0.2, roughness: 0.12, envMapIntensity: 1.2, clearcoat: 0.6 });
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + 0.3;
      const r = 50 + Math.random() * 28;
      const h = 8 + Math.random() * 30;
      const w = 7 + Math.random() * 5;
      const nb = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), neighbourMat);
      nb.position.set(Math.cos(ang) * r, h / 2, Math.sin(ang) * r);
      nb.castShadow = nb.receiveShadow = true; ctx.add(nb);
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2a, roughness: 1 });
    const leafMats = [0x3f8f4a, 0x4fa256, 0x357a40].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 24 + Math.random() * 34;
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      const s = 0.8 + Math.random() * 0.7;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 1.8 * s), trunkMat);
      trunk.position.set(x, 0.9 * s, z); trunk.castShadow = true; ctx.add(trunk);
      for (let b = 0; b < 3; b++) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((1.3 - b * 0.25) * s, 0), leafMats[(i + b) % 3]);
        leaf.position.set(x + (Math.random() - 0.5) * 0.6, (2.2 + b * 0.7) * s, z + (Math.random() - 0.5) * 0.6);
        leaf.castShadow = true; ctx.add(leaf);
      }
    }

    // ── Hotspot anchors + camera presets (use the built model's real dims) ──
    const M = group.userData;
    const anchors = {
      overview: new THREE.Vector3(0, M.totalH * 0.55, 0),
      orientation: new THREE.Vector3(Math.sin(az) * M.bw, M.totalH * 0.6, Math.cos(az) * M.bd),
      unit: new THREE.Vector3(0, M.unitY, M.bd / 2 + 1.4),
      amenities: new THREE.Vector3(0, M.totalH + 1.6, 0),
      surroundings: new THREE.Vector3(0, 4, M.bd / 2 + 16),
    };
    const S = Math.max(M.bw, M.totalH);
    const presets = {
      overview: { pos: new THREE.Vector3(S * 1.5, M.totalH * 0.9, S * 1.7), look: new THREE.Vector3(0, M.totalH * 0.42, 0) },
      sun:      { pos: new THREE.Vector3(Math.sin(az) * S * 2.0, M.totalH * 1.0, Math.cos(az) * S * 2.0), look: new THREE.Vector3(0, M.totalH * 0.5, 0) },
      unit:     { pos: new THREE.Vector3(M.bw * 1.5, M.unitY + 2, M.bd / 2 + M.bw * 1.7), look: new THREE.Vector3(0, M.unitY, 0) },
      deck:     { pos: new THREE.Vector3(M.bw * 1.1, M.totalH + M.bw * 1.2, M.bd * 1.1), look: new THREE.Vector3(0, M.totalH, 0) },
      wide:     { pos: new THREE.Vector3(S * 2.6, M.totalH * 1.5, S * 2.8), look: new THREE.Vector3(0, M.totalH * 0.3, 0) },
    };
    camera.position.copy(presets.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.target.copy(presets.overview.look);
    controls.minDistance = bw; controls.maxDistance = S * 5;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', () => { flyTarget.current = null; });

    const ring = group.userData.ring, pin = group.userData.pin;
    sceneApi.current = { scene, camera, renderer, controls, anchors, presets, mount, pmrem, ring, pin };

    let raf; const tmpV = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.autoRotate = autoRotateRef.current && !flyTarget.current;
      if (flyTarget.current) {
        camera.position.lerp(flyTarget.current.pos, 0.06);
        controls.target.lerp(flyTarget.current.look, 0.06);
        if (camera.position.distanceTo(flyTarget.current.pos) < 0.6) flyTarget.current = null;
      }
      if (ring) ring.rotation.z += 0.01;
      if (pin) pin.position.y += Math.sin(performance.now() * 0.003) * 0.004;
      controls.update();
      renderer.render(scene, camera);

      const rect = mount.getBoundingClientRect();
      const next = [];
      for (const [id, pos] of Object.entries(anchors)) {
        tmpV.copy(pos).project(camera);
        next.push({ id, x: (tmpV.x * 0.5 + 0.5) * rect.width, y: (-tmpV.y * 0.5 + 0.5) * rect.height, visible: tmpV.z < 1 });
      }
      setHotspots(next);
    };
    animate(); setReady(true);

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose(); });
      });
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneApi.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    if (!supported) return;
    const load = () => { const vs = window.speechSynthesis.getVoices(); voiceRef.current = vs.find(v => /en[-_]IN/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null; };
    load(); window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); };
  }, [supported]);

  const speak = useCallback((text) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.lang = voiceRef.current?.lang || 'en-IN'; u.rate = 0.97; u.pitch = 1.05;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    setTimeout(() => window.speechSynthesis.speak(u), 80);
  }, [supported]);

  const goTopic = useCallback((topic) => {
    const api = sceneApi.current; if (!api) return;
    setActiveTopic(topic.id);
    const preset = api.presets[topic.cam] || api.presets.overview;
    flyTarget.current = { pos: preset.pos.clone(), look: preset.look.clone() };
    setAutoRotate(false); speak(topic.say);
  }, [speak]);

  const runFullRef = useRef(false);
  const playFull = useCallback(() => {
    runFullRef.current = true; let i = 0;
    const next = () => {
      if (!runFullRef.current || i >= topics.length) { runFullRef.current = false; return; }
      const t = topics[i++]; goTopic(t);
      const check = setInterval(() => {
        if (!runFullRef.current) { clearInterval(check); return; }
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) { clearInterval(check); setTimeout(next, 400); }
      }, 300);
    };
    next();
  }, [topics, goTopic]);

  useEffect(() => () => { runFullRef.current = false; }, []);
  useEffect(() => { const onKey = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);

  const labelFor = (id) => topics.find(t => t.id === id)?.label || id;

  return (
    <div className="pi-3d" role="dialog" aria-label="3D property showcase">
      <div ref={mountRef} className="pi-3d-canvas" />

      {ready && hotspots.map(h => h.visible && (
        <button key={h.id} className={`pi-3d-hotspot ${activeTopic === h.id ? 'active' : ''}`} style={{ left: h.x, top: h.y }}
          onClick={() => { const t = topics.find(t => t.id === h.id); if (t) goTopic(t); }}>
          <span className="pi-3d-hotspot-dot" /><span className="pi-3d-hotspot-label">{labelFor(h.id)}</span>
        </button>
      ))}

      <div className="pi-3d-topbar">
        <div className="pi-3d-title">
          <span className="pi-3d-badge">3D</span>
          <div><strong>{property.title}</strong><span>{property.location}</span></div>
        </div>
        <button className="pi-3d-close" onClick={onClose} aria-label="Close 3D view">✕</button>
      </div>

      <div className="pi-3d-advisor">
        <div className="pi-3d-advisor-head">
          <span className={`pi-3d-avatar ${speaking ? 'speaking' : ''}`}>{ADVISOR.emoji}</span>
          <div><strong>{ADVISOR.name}</strong><span>{speaking ? 'Speaking…' : ADVISOR.role}</span></div>
        </div>
        <div className="pi-3d-topics">
          {topics.map(t => (
            <button key={t.id} className={`pi-3d-topic ${activeTopic === t.id ? 'active' : ''}`} onClick={() => { runFullRef.current = false; goTopic(t); }}>
              <span className="pi-3d-topic-icon">{t.icon}</span>
              <span className="pi-3d-topic-text"><strong>{t.label}</strong><small>{t.tip}</small></span>
            </button>
          ))}
        </div>
        <button className="pi-3d-play-full" onClick={playFull}>▶ Play full 3D advisor tour</button>
        <div className="pi-3d-cta-row">
          <button className="primary" onClick={() => { onSchedule?.(); onClose(); }}>📅 Schedule Visit</button>
          <button className="ghost" onClick={() => onSave?.()}>{saved ? '♥ Saved' : '♡ Save'}</button>
        </div>
      </div>

      <div className="pi-3d-controls">
        <button className={autoRotate ? 'on' : ''} onClick={() => setAutoRotate(r => !r)}>{autoRotate ? '⏸ Stop spin' : '↻ Auto-rotate'}</button>
        <button onClick={() => { goTopic(topics[0]); setActiveTopic(null); setAutoRotate(true); }}>⤢ Reset view</button>
        <span className="pi-3d-hint">🖱️ Drag to orbit · scroll to zoom</span>
      </div>

      {!ready && <div className="pi-3d-loading"><span className="pi-3d-spinner" />Building 3D model…</div>}
    </div>
  );
}

// Low-rise villa massing — stone + glass with a pitched roof, porch, garden.
function buildVilla(group, dim, mats) {
  const { bw, bd, fh, unitY } = dim;
  const { glass, stone, frame, metal, railGlass, goldMat } = mats;
  const h = fh * 2 + 1;
  // base
  const base = new THREE.Mesh(new RoundedBoxGeometry(bw, h, bd, 2, 0.3), stone);
  base.position.y = h / 2; base.castShadow = base.receiveShadow = true; group.add(base);
  // glass band (large windows ground + upper)
  const win = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.92, fh * 0.8, bd + 0.1), glass);
  win.position.set(0, fh * 0.7, 0); group.add(win);
  const win2 = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.6, fh * 0.7, bd + 0.12), glass);
  win2.position.set(bw * 0.12, fh * 1.7, 0); group.add(win2);
  // pitched roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(bw * 0.82, 3.4, 4), new THREE.MeshStandardMaterial({ color: 0x8d4a2c, roughness: 0.8 }));
  roof.rotation.y = Math.PI / 4; roof.position.y = h + 1.5; roof.castShadow = true; group.add(roof);
  // porch + canopy
  const porch = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.4, 0.25, 3), metal);
  porch.position.set(-bw * 0.2, fh, bd / 2 + 1.6); porch.castShadow = true; group.add(porch);
  for (const sx of [-0.34, -0.06]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, fh), frame); c.position.set(bw * sx, fh / 2, bd / 2 + 2.9); group.add(c); }
  // upper balcony railing
  const rail = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.6, 0.7, 0.05), railGlass);
  rail.position.set(bw * 0.12, fh * 1.35, bd / 2 + 0.1); group.add(rail);
  // boundary lawn pad
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(bw * 0.95, 40), new THREE.MeshStandardMaterial({ color: 0x6f9a52, roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.04; lawn.receiveShadow = true; group.add(lawn);
  // gold highlight (whole home)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(bw * 0.7, 0.12, 14, 56), new THREE.MeshBasicMaterial({ color: 0xffd45e }));
  ring.rotation.x = Math.PI / 2; ring.position.set(0, Math.min(unitY, h * 0.5), 0); group.add(ring);
  const pin = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 18), goldMat);
  pin.rotation.x = Math.PI; pin.position.set(0, h + 4, 0); group.add(pin);
  group.userData = { totalH: h + 3.4, unitY: Math.min(unitY, h * 0.5), bw, bd, ring, pin };
}

function spoken(price) {
  if (!price) return 'an attractive price';
  if (price >= 1e7) return `${(Math.round(price / 1e7 * 100) / 100).toString().replace(/\.0+$/, '')} crore rupees`;
  if (price >= 1e5) return `${(Math.round(price / 1e5 * 100) / 100).toString().replace(/\.0+$/, '')} lakh rupees`;
  return `${formatPriceIndian(price)}`;
}

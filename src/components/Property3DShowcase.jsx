import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { formatPriceIndian } from '../data';

// =============================================================================
// Property3DShowcase — arch-viz-grade interactive 3D of the property with two
// modes:
//   • Exterior  — the building, tied to the real project via a site billboard
//                 showing the actual cover photo + the project name on signage.
//   • Interior  — a walkable furnished home (living / kitchen / bedroom /
//                 balcony) with room-by-room camera waypoints.
// An AI "3D Advisor" (Riya) flies the camera to features and narrates them via
// the free Web Speech API. No external 3D assets, no paid APIs.
// =============================================================================

const ADVISOR = { name: 'Riya', role: 'Your 3D property advisor', emoji: '👩‍💼' };
const FACING_DEG = { N: 0, North: 0, NE: 45, E: 90, East: 90, SE: 135, S: 180, South: 180, SW: 225, W: 270, West: 270, NW: 315 };

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
  const bhk = property.bedrooms || 3;
  const luxury = (property.price || 0) >= 4e7 || /penthouse|luxury|premium/.test(type + ' ' + (property.title || '').toLowerCase());
  return { type, isVilla, isCommercial, total, yourFloor, facing, bhk, luxury };
}

// ── Canvas texture helpers ──────────────────────────────────────────────────
function makeSky() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6ea6e6'); g.addColorStop(0.45, '#a9cdf2'); g.addColorStop(0.8, '#dfeaf6'); g.addColorStop(1, '#eef3f8');
  x.fillStyle = g; x.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeGround() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#6f8f54'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const g = 70 + Math.random() * 70 | 0; x.fillStyle = `rgba(${g * 0.7 | 0},${g + 40},${g * 0.6 | 0},0.25)`; x.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeWood() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#9b6a3e'; x.fillRect(0, 0, 512, 512);
  for (let p = 0; p < 8; p++) {
    const y0 = p * 64; x.fillStyle = `rgb(${140 + Math.random() * 30 | 0},${95 + Math.random() * 25 | 0},${55 + Math.random() * 20 | 0})`;
    x.fillRect(0, y0, 512, 62);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(90,60,30,${0.05 + Math.random() * 0.08})`; x.beginPath(); x.moveTo(0, y0 + Math.random() * 62); x.bezierCurveTo(170, y0 + Math.random() * 62, 340, y0 + Math.random() * 62, 512, y0 + Math.random() * 62); x.stroke(); }
    x.strokeStyle = 'rgba(60,40,20,0.4)'; x.strokeRect(0, y0, 512, 62);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Project-name signage (also used as billboard fallback before the photo loads).
function makeSign(text, sub, photo = false) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = photo ? 640 : 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, '#16335f'); g.addColorStop(1, '#0d1f3c');
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.font = '800 64px Georgia, serif';
  wrap(x, text || 'Project', c.width / 2, c.height / 2 - (sub ? 24 : 0), c.width - 80, 70);
  if (sub) { x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = '600 30px Arial'; x.fillText(sub, c.width / 2, c.height - 48); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function wrap(ctx, text, cx, cy, maxW, lh) {
  const words = String(text).split(' '); let line = '', lines = [];
  for (const w of words) { const test = line + w + ' '; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w + ' '; } else line = test; }
  lines.push(line);
  const startY = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l.trim(), cx, startY + i * lh));
}

// quick mesh helper
function mk(parent, geo, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (opts.rx || opts.ry || opts.rz) m.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  m.castShadow = opts.cast !== false; m.receiveShadow = opts.recv !== false;
  parent.add(m); return m;
}

// =============================================================================
// EXTERIOR
// =============================================================================
function createExterior(scene, build, coverImg, property) {
  const az = (FACING_DEG[build.facing] ?? 90) * Math.PI / 180;
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x57613f, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1d8, 2.4);
  sun.position.set(Math.sin(az) * 80, 110, Math.cos(az) * 80); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 360;
  sun.shadow.camera.left = -110; sun.shadow.camera.right = 110; sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.0004; sun.shadow.radius = 4; scene.add(sun);

  const glass = new THREE.MeshPhysicalMaterial({ color: build.luxury ? 0x2b3b4f : 0x33485e, metalness: 0.15, roughness: 0.06, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.08 });
  const glassLite = new THREE.MeshPhysicalMaterial({ color: 0x3f566f, metalness: 0.1, roughness: 0.08, envMapIntensity: 1.4, clearcoat: 1 });
  const frame = new THREE.MeshStandardMaterial({ color: build.luxury ? 0xc9a96a : 0xdfe4ea, metalness: 0.65, roughness: 0.35 });
  const spandrel = new THREE.MeshStandardMaterial({ color: 0xeef1f6, metalness: 0.1, roughness: 0.6 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xb9a888, metalness: 0.05, roughness: 0.85 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.85, roughness: 0.3 });
  const railGlass = new THREE.MeshPhysicalMaterial({ color: 0xaed4f0, metalness: 0, roughness: 0.08, transmission: 0.7, transparent: true, opacity: 0.55, envMapIntensity: 1, ior: 1.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc23d, metalness: 0.5, roughness: 0.3, emissive: 0xff9e00, emissiveIntensity: 0.55 });

  const ground = mk(scene, new THREE.CircleGeometry(220, 72), new THREE.MeshStandardMaterial({ map: makeGround(), roughness: 1 }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
  mk(scene, new THREE.CircleGeometry(30, 56), new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 0.8, metalness: 0.05 }), 0, 0.02, 0, { rx: -Math.PI / 2, cast: false });
  mk(scene, new THREE.RingGeometry(34, 41, 64), new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.95 }), 0, 0.03, 0, { rx: -Math.PI / 2, cast: false });

  const group = new THREE.Group(); scene.add(group);
  const dummy = new THREE.Object3D();
  const fh = 1.7, bw = build.isVilla ? 16 : 12, bd = 12;
  const podiumH = build.isVilla ? 0 : 3.4;
  const towerH = build.total * fh, totalH = podiumH + towerH;
  const unitY = podiumH + (build.yourFloor - 0.5) * fh;
  let ring = null, pin = null;

  if (build.isVilla) {
    const m = buildVilla(group, { bw, bd, fh, unitY }, { glass, stone, frame, metal, railGlass, goldMat });
    ring = m.ring; pin = m.pin; group.userData = m;
  } else {
    mk(group, new RoundedBoxGeometry(bw + 6, podiumH, bd + 6, 3, 0.4), stone, 0, podiumH / 2, 0);
    mk(group, new THREE.BoxGeometry(bw * 0.5, podiumH * 0.78, 0.4), glass, 0, podiumH * 0.42, bd / 2 + 3.05, { cast: false });
    mk(group, new THREE.BoxGeometry(bw * 0.75, 0.35, 4.2), metal, 0, podiumH * 0.86, bd / 2 + 4.6);
    mk(group, new THREE.BoxGeometry(bw - 0.4, towerH, bd - 0.4), glass, 0, podiumH + towerH / 2, 0);

    const bands = new THREE.InstancedMesh(new THREE.BoxGeometry(bw + 0.25, fh * 0.26, bd + 0.25), spandrel, build.total + 1);
    bands.castShadow = bands.receiveShadow = true;
    for (let i = 0; i <= build.total; i++) { dummy.position.set(0, podiumH + i * fh, 0); dummy.updateMatrix(); bands.setMatrixAt(i, dummy.matrix); }
    group.add(bands);

    const finsPerFace = 5, finGeo = new THREE.BoxGeometry(0.16, towerH, 0.3), fp = [];
    for (let f = 0; f <= finsPerFace; f++) { const t = -0.5 + f / finsPerFace;
      fp.push({ x: t * (bw - 0.4), z: bd / 2 - 0.18, ry: 0 }); fp.push({ x: t * (bw - 0.4), z: -bd / 2 + 0.18, ry: 0 });
      fp.push({ x: bw / 2 - 0.18, z: t * (bd - 0.4), ry: Math.PI / 2 }); fp.push({ x: -bw / 2 + 0.18, z: t * (bd - 0.4), ry: Math.PI / 2 }); }
    const fins = new THREE.InstancedMesh(finGeo, frame, fp.length); fins.castShadow = true;
    fp.forEach((p, i) => { dummy.position.set(p.x, podiumH + towerH / 2, p.z); dummy.rotation.set(0, p.ry, 0); dummy.updateMatrix(); fins.setMatrixAt(i, dummy.matrix); });
    fins.instanceMatrix.needsUpdate = true; group.add(fins); dummy.rotation.set(0, 0, 0);

    const colGeo = new THREE.BoxGeometry(0.6, towerH, 0.6);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => mk(group, colGeo, frame, sx * (bw / 2 - 0.1), podiumH + towerH / 2, sz * (bd / 2 - 0.1)));

    const slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(bw * 0.5, 0.16, 1.3), spandrel, build.total);
    const rails = new THREE.InstancedMesh(new THREE.BoxGeometry(bw * 0.5, 0.85, 0.06), railGlass, build.total);
    slabs.castShadow = slabs.receiveShadow = true;
    for (let i = 0; i < build.total; i++) { const side = i % 2 === 0 ? -1 : 1, x = side * bw * 0.18, y = podiumH + i * fh + 0.12;
      dummy.position.set(x, y, bd / 2 + 0.62); dummy.updateMatrix(); slabs.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y + 0.5, bd / 2 + 1.24); dummy.updateMatrix(); rails.setMatrixAt(i, dummy.matrix); }
    group.add(slabs); group.add(rails);

    mk(group, new THREE.BoxGeometry(bw + 0.6, 1.1, bd + 0.6), metal, 0, totalH + 0.55, 0);
    mk(group, new RoundedBoxGeometry(bw * 0.55, 2.4, bd * 0.55, 2, 0.2), spandrel, 0, totalH + 2.3, 0);
    mk(group, new THREE.CylinderGeometry(0.08, 0.08, 4), metal, 0, totalH + 5.4, 0, { cast: false });
    mk(group, new THREE.BoxGeometry(bw, 0.3, bd), new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 }), 0, totalH + 0.15, 0);
    mk(group, new THREE.BoxGeometry(bw * 0.5, 0.34, bd * 0.32), glassLite, 0, totalH + 0.45, bd * 0.18, { cast: false });

    // Project-name signage band high on the front parapet
    mk(group, new THREE.PlaneGeometry(bw * 0.82, 1.5), new THREE.MeshBasicMaterial({ map: makeSign(shortName(property.title), null), transparent: true }), 0, totalH - 0.1, bd / 2 + 0.05, { cast: false, recv: false });

    // gold "your floor" highlight
    mk(group, new THREE.BoxGeometry(bw + 0.35, fh * 0.94, bd + 0.35), goldMat, 0, unitY, 0, { cast: false });
    ring = mk(group, new THREE.TorusGeometry(bw * 0.92, 0.12, 14, 56), new THREE.MeshBasicMaterial({ color: 0xffd45e }), 0, unitY, 0, { rx: Math.PI / 2, cast: false });
    pin = mk(group, new THREE.ConeGeometry(0.6, 1.4, 18), new THREE.MeshStandardMaterial({ color: 0xffce4d, emissive: 0xffae00, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.3 }), 0, unitY + fh * 0.5 + 1.6, bd / 2 + 1.3, { rx: Math.PI, cast: false });
    group.userData = { totalH, unitY, bw, bd };
  }

  // ── Site billboard with the REAL project cover photo (ties model to project)
  const billW = 9, billH = 5.4;
  const billMat = new THREE.MeshBasicMaterial({ map: makeSign(shortName(property.title), property.location, true) });
  const billboard = mk(scene, new THREE.PlaneGeometry(billW, billH), billMat, -bw - 8, billH / 2 + 2.2, bd / 2 + 4, { ry: 0.5, cast: false, recv: false });
  mk(scene, new THREE.BoxGeometry(0.4, billH / 2 + 2.2, 0.4), metal, -bw - 8 - 3.2, (billH / 2 + 2.2) / 2, bd / 2 + 4 - 1.7, { recv: false });
  mk(scene, new THREE.BoxGeometry(0.4, billH / 2 + 2.2, 0.4), metal, -bw - 8 + 3.2, (billH / 2 + 2.2) / 2, bd / 2 + 4 + 1.7, { recv: false });
  if (coverImg) {
    new THREE.TextureLoader().load(coverImg, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; billMat.map?.dispose?.(); billMat.map = tex; billMat.needsUpdate = true; }, undefined, () => {});
  }

  // ── Sibling towers for larger projects (multi-tower complex feel) ──
  if (!build.isVilla && build.total >= 16) {
    const sibMat = glass;
    [[-bw - 20, -10, 0.78], [bw + 20, -14, 0.62]].forEach(([sx, sz, hs]) => {
      const sh = towerH * hs, sg = new THREE.Group(); scene.add(sg);
      mk(sg, new THREE.BoxGeometry(bw - 1, sh, bd - 1), sibMat, sx, podiumH + sh / 2, sz);
      const sb = new THREE.InstancedMesh(new THREE.BoxGeometry(bw - 0.7, fh * 0.24, bd - 0.7), spandrel, Math.floor(build.total * hs) + 1);
      sb.castShadow = true;
      for (let i = 0; i <= build.total * hs; i++) { dummy.position.set(sx, podiumH + i * fh, sz); dummy.updateMatrix(); sb.setMatrixAt(i, dummy.matrix); }
      sg.add(sb);
      mk(sg, new THREE.BoxGeometry(bw - 0.4, 0.9, bd - 0.4), metal, sx, podiumH + sh + 0.45, sz);
    });
  }

  // trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2a, roughness: 1 });
  const leafMats = [0x3f8f4a, 0x4fa256, 0x357a40].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, r = 24 + Math.random() * 32, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.8 + Math.random() * 0.6;
    mk(scene, new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 1.8 * s), trunkMat, x, 0.9 * s, z, { recv: false });
    for (let b = 0; b < 3; b++) mk(scene, new THREE.IcosahedronGeometry((1.3 - b * 0.25) * s, 0), leafMats[(i + b) % 3], x + (Math.random() - 0.5) * 0.6, (2.2 + b * 0.7) * s, z + (Math.random() - 0.5) * 0.6, { recv: false }); }

  const M = group.userData, S = Math.max(M.bw, M.totalH);
  const anchors = {
    overview: new THREE.Vector3(0, M.totalH * 0.55, 0),
    orientation: new THREE.Vector3(Math.sin(az) * M.bw, M.totalH * 0.6, Math.cos(az) * M.bd),
    unit: new THREE.Vector3(0, M.unitY, M.bd / 2 + 1.4),
    amenities: new THREE.Vector3(0, M.totalH + 1.6, 0),
    surroundings: new THREE.Vector3(0, 4, M.bd / 2 + 16),
  };
  const presets = {
    overview: { pos: new THREE.Vector3(S * 1.5, M.totalH * 0.9, S * 1.7), look: new THREE.Vector3(0, M.totalH * 0.42, 0) },
    sun: { pos: new THREE.Vector3(Math.sin(az) * S * 2.0, M.totalH, Math.cos(az) * S * 2.0), look: new THREE.Vector3(0, M.totalH * 0.5, 0) },
    unit: { pos: new THREE.Vector3(M.bw * 1.5, M.unitY + 2, M.bd / 2 + M.bw * 1.7), look: new THREE.Vector3(0, M.unitY, 0) },
    deck: { pos: new THREE.Vector3(M.bw * 1.1, M.totalH + M.bw * 1.2, M.bd * 1.1), look: new THREE.Vector3(0, M.totalH, 0) },
    wide: { pos: new THREE.Vector3(S * 2.6, M.totalH * 1.5, S * 2.8), look: new THREE.Vector3(0, M.totalH * 0.3, 0) },
  };
  return { anchors, presets, ring, pin, start: presets.overview };
}

function buildVilla(group, dim, mats) {
  const { bw, bd, fh, unitY } = dim;
  const { glass, stone, frame, metal, railGlass, goldMat } = mats;
  const h = fh * 2 + 1;
  mk(group, new RoundedBoxGeometry(bw, h, bd, 2, 0.3), stone, 0, h / 2, 0);
  mk(group, new THREE.BoxGeometry(bw * 0.92, fh * 0.8, bd + 0.1), glass, 0, fh * 0.7, 0, { cast: false });
  mk(group, new THREE.BoxGeometry(bw * 0.6, fh * 0.7, bd + 0.12), glass, bw * 0.12, fh * 1.7, 0, { cast: false });
  mk(group, new THREE.ConeGeometry(bw * 0.82, 3.4, 4), new THREE.MeshStandardMaterial({ color: 0x8d4a2c, roughness: 0.8 }), 0, h + 1.5, 0, { ry: Math.PI / 4 });
  mk(group, new THREE.BoxGeometry(bw * 0.4, 0.25, 3), metal, -bw * 0.2, fh, bd / 2 + 1.6);
  for (const sx of [-0.34, -0.06]) mk(group, new THREE.CylinderGeometry(0.15, 0.15, fh), frame, bw * sx, fh / 2, bd / 2 + 2.9, { cast: false });
  mk(group, new THREE.BoxGeometry(bw * 0.6, 0.7, 0.05), railGlass, bw * 0.12, fh * 1.35, bd / 2 + 0.1, { cast: false });
  mk(group, new THREE.CircleGeometry(bw * 0.95, 40), new THREE.MeshStandardMaterial({ color: 0x6f9a52, roughness: 1 }), 0, 0.04, 0, { rx: -Math.PI / 2, cast: false });
  const ring = mk(group, new THREE.TorusGeometry(bw * 0.7, 0.12, 14, 56), new THREE.MeshBasicMaterial({ color: 0xffd45e }), 0, Math.min(unitY, h * 0.5), 0, { rx: Math.PI / 2, cast: false });
  const pin = mk(group, new THREE.ConeGeometry(0.6, 1.4, 18), goldMat, 0, h + 4, 0, { rx: Math.PI, cast: false });
  return { totalH: h + 3.4, unitY: Math.min(unitY, h * 0.5), bw, bd, ring, pin };
}

// =============================================================================
// INTERIOR — a walkable furnished home
// =============================================================================
function createInterior(scene, build, coverImg) {
  // brighter indoor lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a8a, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(6, 12, 12); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 60;
  key.shadow.camera.left = -16; key.shadow.camera.right = 16; key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
  key.shadow.bias = -0.0004; key.shadow.radius = 4; scene.add(key);
  const warm = new THREE.PointLight(0xffd9a8, 22, 22, 2); warm.position.set(-3, 2.7, 0); scene.add(warm);

  const X = 13, Z = 9, WH = 3; // footprint + wall height
  const floorMat = new THREE.MeshStandardMaterial({ map: makeWood(), roughness: 0.55, metalness: 0.05 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: build.luxury ? 0x355c6b : 0x6f7f8c, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6e4a2d, roughness: 0.5, metalness: 0.1 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0x8a93a6, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c2026, roughness: 0.5, metalness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.85, roughness: 0.3 });
  const railGlass = new THREE.MeshPhysicalMaterial({ color: 0xbfe0f5, roughness: 0.08, transmission: 0.75, transparent: true, opacity: 0.5, ior: 1.45 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 1 });

  const root = new THREE.Group(); scene.add(root);

  // floor + skirting
  mk(root, new THREE.BoxGeometry(X, 0.2, Z), floorMat, 0, -0.1, 0);
  // back + side walls (front kept open as glass to the balcony for the view)
  mk(root, new THREE.BoxGeometry(X, WH, 0.2), wallMat, 0, WH / 2, -Z / 2);       // back
  mk(root, new THREE.BoxGeometry(0.2, WH, Z), wallMat, -X / 2, WH / 2, 0);        // left
  mk(root, new THREE.BoxGeometry(0.2, WH, Z), wallMat, X / 2, WH / 2, 0);         // right
  // accent wall behind TV (left)
  mk(root, new THREE.BoxGeometry(0.22, WH, Z * 0.55), accentMat, -X / 2 + 0.01, WH / 2, Z * 0.12);

  // bedroom partition (right rear quadrant): walls with a door gap
  const bx0 = 1.8;
  mk(root, new THREE.BoxGeometry(X / 2 - bx0, WH, 0.16), wallMat, (bx0 + X / 2) / 2, WH / 2, -0.6); // partition along z=-0.6
  mk(root, new THREE.BoxGeometry(0.16, WH, Z / 2 - 1.4), wallMat, bx0, WH / 2, -Z / 2 + (Z / 2 - 1.4) / 2 + 0.0); // partition along x=bx0 (with gap = door near front)

  // ── Living room (front-left) ──
  // rug
  mk(root, new THREE.BoxGeometry(4.6, 0.04, 3.2), rugMat, -3.4, 0.02, 1.4, { cast: false });
  // sofa (L-shape): base + back + cushions
  mk(root, new RoundedBoxGeometry(4.2, 0.7, 1.5, 2, 0.12), fabric, -3.6, 0.45, 2.7);
  mk(root, new RoundedBoxGeometry(4.2, 0.8, 0.4, 2, 0.12), fabric, -3.6, 0.85, 3.35);
  mk(root, new RoundedBoxGeometry(1.5, 0.7, 3.0, 2, 0.12), fabric, -5.45, 0.45, 1.6);
  for (let i = 0; i < 3; i++) mk(root, new RoundedBoxGeometry(0.9, 0.5, 0.3, 2, 0.1), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x6f7c92 : 0xb98a64, roughness: 1 }), -4.9 + i * 1.3, 0.95, 3.1);
  // coffee table
  mk(root, new RoundedBoxGeometry(1.8, 0.12, 0.9, 2, 0.05), wood, -3.4, 0.42, 1.4);
  mk(root, new THREE.CylinderGeometry(0.05, 0.05, 0.4), metal, -4.1, 0.2, 1.0, { cast: false });
  mk(root, new THREE.CylinderGeometry(0.05, 0.05, 0.4), metal, -2.7, 0.2, 1.8, { cast: false });
  // TV unit + TV on accent wall
  mk(root, new RoundedBoxGeometry(3, 0.5, 0.5, 2, 0.06), wood, -X / 2 + 0.5, 0.3, 1.4);
  mk(root, new THREE.BoxGeometry(0.08, 1.4, 2.4), dark, -X / 2 + 0.35, 1.7, 1.4, { cast: false });
  // floor lamp + plant
  mk(root, new THREE.CylinderGeometry(0.04, 0.04, 1.8), metal, -5.8, 0.9, 3.4, { cast: false });
  mk(root, new THREE.ConeGeometry(0.35, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe6b0, emissiveIntensity: 0.5 }), -5.8, 1.95, 3.4, { cast: false });
  potPlant(root, -5.9, 0, -2.0, metal);

  // ── Dining (center-rear) ──
  mk(root, new RoundedBoxGeometry(2.2, 0.12, 1.1, 2, 0.05), wood, -0.6, 0.78, -2.6);
  [[-1.4, -3.2], [0.2, -3.2], [-1.4, -2.0], [0.2, -2.0]].forEach(([x, z]) => { mk(root, new RoundedBoxGeometry(0.5, 0.5, 0.5, 2, 0.06), fabric, x, 0.45, z); mk(root, new THREE.BoxGeometry(0.5, 0.5, 0.06), wood, x, 0.95, z - 0.22, { cast: false }); });

  // ── Kitchen (back wall, right of dining) ──
  const kMat = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.5 });
  const counter = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.2 });
  // base cabinets + worktop along back wall
  mk(root, new RoundedBoxGeometry(4.2, 0.9, 0.7, 2, 0.04), kMat, 3.2, 0.45, -Z / 2 + 0.45);
  mk(root, new THREE.BoxGeometry(4.3, 0.08, 0.78), counter, 3.2, 0.92, -Z / 2 + 0.45, { cast: false });
  // upper cabinets
  mk(root, new RoundedBoxGeometry(4.2, 0.7, 0.4, 2, 0.04), kMat, 3.2, 2.2, -Z / 2 + 0.3);
  // hood + stove
  mk(root, new THREE.BoxGeometry(0.9, 0.4, 0.5), metal, 3.2, 1.85, -Z / 2 + 0.35, { cast: false });
  // island
  mk(root, new RoundedBoxGeometry(2.2, 0.9, 1.0, 2, 0.05), kMat, 4.3, 0.45, -1.4);
  mk(root, new THREE.BoxGeometry(2.3, 0.08, 1.1), counter, 4.3, 0.92, -1.4, { cast: false });

  // ── Bedroom (right-rear, behind partition) ──
  // bed
  mk(root, new RoundedBoxGeometry(2.6, 0.4, 3.0, 2, 0.06), wood, 4.6, 0.25, -3.0);
  mk(root, new RoundedBoxGeometry(2.5, 0.35, 2.7, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0xeae3d6, roughness: 1 }), 4.6, 0.55, -2.9);
  mk(root, new RoundedBoxGeometry(2.5, 0.18, 1.0, 2, 0.06), accentMat, 4.6, 0.75, -2.0); // duvet fold
  for (const px of [3.7, 5.5]) mk(root, new RoundedBoxGeometry(0.8, 0.3, 0.5, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), px, 0.78, -4.0); // pillows
  mk(root, new THREE.BoxGeometry(2.6, 1.2, 0.1), accentMat, 4.6, 1.1, -Z / 2 + 0.12, { cast: false }); // headboard panel
  // nightstand + lamp
  mk(root, new RoundedBoxGeometry(0.6, 0.5, 0.5, 2, 0.05), wood, 3.0, 0.25, -4.0);
  mk(root, new THREE.CylinderGeometry(0.16, 0.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffe6b0, emissiveIntensity: 0.6 }), 3.0, 0.72, -4.0, { cast: false });
  // wardrobe
  mk(root, new RoundedBoxGeometry(0.6, 2.4, 3.0, 2, 0.05), wood, X / 2 - 0.45, 1.2, -3.0);

  // ── Balcony + city view (front, z > Z/2) ──
  // glass sliding doors (front opening)
  mk(root, new THREE.BoxGeometry(X - 4, WH, 0.08), new THREE.MeshPhysicalMaterial({ color: 0xbfe0f5, roughness: 0.05, transmission: 0.85, transparent: true, opacity: 0.35, ior: 1.45 }), -1.5, WH / 2, Z / 2, { cast: false });
  // balcony slab + glass railing
  mk(root, new THREE.BoxGeometry(X, 0.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.7 }), 0, -0.1, Z / 2 + 1.2);
  mk(root, new THREE.BoxGeometry(X, 1.0, 0.06), railGlass, 0, 0.5, Z / 2 + 2.35, { cast: false });
  potPlant(root, X / 2 - 1, 0, Z / 2 + 0.9, metal);
  // outdoor lounge chair
  mk(root, new RoundedBoxGeometry(0.9, 0.3, 1.6, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0x9a8e7a, roughness: 1 }), -4, 0.25, Z / 2 + 1.2);

  // skyline beyond the balcony (the "view")
  scene.background = makeSky();
  mk(scene, new THREE.CircleGeometry(120, 48), new THREE.MeshStandardMaterial({ color: 0x738a55, roughness: 1 }), 0, -0.2, 0, { rx: -Math.PI / 2, cast: false });
  const distGlass = new THREE.MeshPhysicalMaterial({ color: 0x49627a, roughness: 0.12, metalness: 0.2, envMapIntensity: 1.2, clearcoat: 0.5 });
  for (let i = 0; i < 10; i++) { const x = -40 + i * 9 + (Math.random() * 4 - 2), h = 12 + Math.random() * 30; mk(scene, new THREE.BoxGeometry(6 + Math.random() * 3, h, 6), distGlass, x, h / 2, 26 + Math.random() * 14, { recv: false }); }

  const anchors = {
    overview: new THREE.Vector3(-1.5, 2.4, 2),
    living: new THREE.Vector3(-3.6, 1.1, 2),
    kitchen: new THREE.Vector3(3.4, 1.2, -3.2),
    bedroom: new THREE.Vector3(4.6, 1.2, -3.0),
    balcony: new THREE.Vector3(-1.5, 1.2, Z / 2 + 1.6),
  };
  const presets = {
    overview: { pos: new THREE.Vector3(-2, 2.3, 9.5), look: new THREE.Vector3(-1, 1.2, -1) },
    living: { pos: new THREE.Vector3(-0.6, 1.6, 3.4), look: new THREE.Vector3(-5.5, 1.3, 1.2) },
    kitchen: { pos: new THREE.Vector3(1.0, 1.6, 0.4), look: new THREE.Vector3(4.2, 1.1, -4) },
    bedroom: { pos: new THREE.Vector3(2.6, 1.6, 1.2), look: new THREE.Vector3(5.2, 1.2, -3.6) },
    balcony: { pos: new THREE.Vector3(-1.5, 1.6, 2.2), look: new THREE.Vector3(-1.5, 1.4, 14) },
  };
  return { anchors, presets, ring: null, pin: null, start: presets.overview, interior: true };
}

function potPlant(parent, x, y, z, metal) {
  mk(parent, new THREE.CylinderGeometry(0.28, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 1 }), x, y + 0.25, z, { cast: false });
  for (let b = 0; b < 4; b++) mk(parent, new THREE.IcosahedronGeometry(0.32 - b * 0.05, 0), new THREE.MeshStandardMaterial({ color: 0x3f8f4a, roughness: 1 }), x + (Math.random() - 0.5) * 0.3, 0.7 + b * 0.28, z + (Math.random() - 0.5) * 0.3, { cast: false });
}

function shortName(title = '') { return String(title).split('–')[0].split('-')[0].split('|')[0].trim().slice(0, 40); }

// =============================================================================
// COMPONENT
// =============================================================================
export default function Property3DShowcase({ property, coverImg, initialMode = 'exterior', onClose, onSchedule, onSave, saved }) {
  const mountRef = useRef(null);
  const sceneApi = useRef(null);
  const flyTarget = useRef(null);
  const autoRotateRef = useRef(true);

  const build = useMemo(() => deriveBuild(property), [property]);
  const [mode, setMode] = useState(initialMode === 'interior' ? 'interior' : 'exterior');
  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(initialMode !== 'interior');
  const [activeTopic, setActiveTopic] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const voiceRef = useRef(null);

  // Real interior = the listing's actual photos (exact, not a procedural room).
  const photos = useMemo(() => {
    const m = (property.media || property.images || []).filter(Boolean);
    return m.length ? m : (property.thumbnail ? [property.thumbnail] : []);
  }, [property]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const photoLayerRef = useRef(null);
  useEffect(() => { setPhotoIdx(0); }, [mode]);

  const topics = useMemo(() => {
    if (mode === 'interior') {
      const beds = build.bhk;
      const caps = ['Overview', 'A closer look', 'Details & finishes', 'Another view', 'More to see', 'Further view', 'Yet another angle', 'Last look'];
      const says = [
        `Here are the real photos of ${property.title}. It's a ${beds} B.H.K. ${build.type}${property.area ? ` of about ${property.area} square feet` : ''}${property.furnishing ? `, ${property.furnishing.toLowerCase()}` : ''}. Let me take you through them.`,
        `A closer look at the property and its spaces.`,
        `Notice the finishes and the natural light.`,
        `Another real view of the home.`,
        `${property.amenities?.length ? `Residents also enjoy ${property.amenities.slice(0, 3).join(', ')}.` : 'More of what the home offers.'}`,
        `A further look at the property in ${property.location || 'its neighbourhood'}.`,
        `One more angle of the home.`,
        `And a final look.`,
      ];
      if (!photos.length) {
        return [{ id: 'p0', photo: 0, icon: '🖼️', label: 'No photos', tip: 'No photos available.', say: `We don't have photos for ${property.title} yet.` }];
      }
      return photos.map((src, i) => ({
        id: 'p' + i, photo: i, icon: '🖼️',
        label: caps[i] || `Photo ${i + 1}`,
        tip: `Real photo ${i + 1} of ${photos.length}`,
        say: says[i] || says[7],
      }));
    }
    const sunWord = /east/i.test(build.facing) ? 'gentle morning sunlight' : /west/i.test(build.facing) ? 'warm afternoon and evening light' : /north/i.test(build.facing) ? 'soft, even daylight with low heat' : 'bright, sunny exposure through the day';
    const floorWord = build.yourFloor >= build.total * 0.75 ? 'a commanding high-rise vantage' : build.yourFloor >= build.total * 0.4 ? 'a comfortable mid-rise height' : 'an easy, low-floor convenience';
    return [
      { id: 'overview', icon: '🏢', label: 'Overview', tip: `A ${build.total}-storey ${build.type} project.`, say: `Let's take a look at ${property.title}. It's ${build.isVilla ? 'a low-rise home' : `a ${build.total}-storey tower`}, priced at ${spoken(property.price)}. Drag to orbit — I'll walk you through it.`, cam: 'overview' },
      { id: 'orientation', icon: '🧭', label: 'Sunlight & Facing', tip: `${build.facing}-facing — ${sunWord}.`, say: `This home is ${build.facing}-facing, so you get ${sunWord}. Watch how the sun falls across the glass facade.`, cam: 'sun' },
      { id: 'unit', icon: '📍', label: build.isVilla ? 'Your Home' : 'Your Floor', tip: build.isVilla ? 'Your independent home.' : `Floor ${build.yourFloor} of ${build.total}.`, say: build.isVilla ? `Here's your home, highlighted in gold.` : `Your unit is on floor ${build.yourFloor}, highlighted in gold with its own balcony, giving you ${floorWord}.`, cam: 'unit' },
      { id: 'amenities', icon: '🏊', label: build.isVilla ? 'Outdoor Space' : 'Sky Deck', tip: property.amenities?.length ? `${property.amenities.length} amenities.` : 'Premium amenities.', say: property.amenities?.length ? `${build.isVilla ? 'Your garden and deck sit here' : 'Up on the rooftop deck'} you have amenities like ${property.amenities.slice(0, 3).join(', ')}.` : `${build.isVilla ? 'Enjoy your private outdoor space.' : 'The rooftop deck offers an infinity pool and open city views.'}`, cam: 'deck' },
      { id: 'surroundings', icon: '🌳', label: 'Surroundings', tip: `${property.location || 'Prime location'}.`, say: `Looking around, ${property.title} sits in ${property.location || 'a prime neighbourhood'}, framed by greenery and well-connected roads.`, cam: 'wide' },
    ];
  }, [mode, build, property, photos]);

  // Build / rebuild the three.js EXTERIOR scene. Interior uses real photos (no WebGL).
  useEffect(() => {
    if (mode !== 'exterior') { setReady(true); return; }
    const mount = mountRef.current; if (!mount) return;
    setReady(false);
    const W = mount.clientWidth, H = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = makeSky();
    scene.fog = mode === 'interior' ? null : new THREE.Fog(0xdbe7f4, 110, 360);
    const camera = new THREE.PerspectiveCamera(mode === 'interior' ? 60 : 48, W / H, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = mode === 'interior' ? 1.0 : 1.06;
    mount.appendChild(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const built = createExterior(scene, build, coverImg, property);
    const { anchors, presets, ring, pin, start } = built;

    camera.position.copy(start.pos);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.target.copy(start.look);
    if (mode === 'interior') { controls.minDistance = 1.2; controls.maxDistance = 26; controls.maxPolarAngle = Math.PI / 2 + 0.15; controls.autoRotate = false; controls.autoRotateSpeed = 0.4; }
    else { const S = Math.max(built.presets.overview.pos.length(), 20); controls.minDistance = 6; controls.maxDistance = S * 2.4; controls.maxPolarAngle = Math.PI / 2 - 0.03; controls.autoRotate = true; controls.autoRotateSpeed = 0.6; }
    controls.addEventListener('start', () => { flyTarget.current = null; });

    // ── Post-processing for photoreal depth: GTAO (ambient occlusion) + bloom + SMAA ──
    const pr = renderer.getPixelRatio();
    const composer = new EffectComposer(renderer);
    composer.setSize(W, H);
    composer.addPass(new RenderPass(scene, camera));
    const gtao = new GTAOPass(scene, camera, W, H);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.updateGtaoMaterial({ radius: mode === 'interior' ? 0.6 : 3.2, distanceExponent: 1, thickness: 1, scale: 1.1, samples: 16, screenSpaceRadius: false });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 4, samples: 16 });
    composer.addPass(gtao);
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.16, 0.6, 0.9);
    composer.addPass(bloom);
    composer.addPass(new SMAAPass(W * pr, H * pr));
    composer.addPass(new OutputPass());

    sceneApi.current = { scene, camera, renderer, composer, controls, anchors, presets, mount, pmrem, ring, pin };

    let raf; const tmpV = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.autoRotate = autoRotateRef.current && !flyTarget.current;
      if (flyTarget.current) {
        camera.position.lerp(flyTarget.current.pos, 0.06); controls.target.lerp(flyTarget.current.look, 0.06);
        if (camera.position.distanceTo(flyTarget.current.pos) < 0.5) flyTarget.current = null;
      }
      if (ring) ring.rotation.z += 0.01;
      if (pin) pin.position.y += Math.sin(performance.now() * 0.003) * 0.004;
      controls.update(); composer.render();
      const rect = mount.getBoundingClientRect(); const next = [];
      for (const [id, pos] of Object.entries(anchors)) { tmpV.copy(pos).project(camera); next.push({ id, x: (tmpV.x * 0.5 + 0.5) * rect.width, y: (-tmpV.y * 0.5 + 0.5) * rect.height, visible: tmpV.z < 1 }); }
      setHotspots(next);
    };
    animate(); setReady(true);

    const onResize = () => { const w = mount.clientWidth, h = mount.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); composer.setSize(w, h); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); controls.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose(); }); });
      composer.dispose?.(); pmrem.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneApi.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build, mode, coverImg]);

  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { setActiveTopic(null); flyTarget.current = null; }, [mode]);

  useEffect(() => {
    if (!supported) return;
    const load = () => { const vs = window.speechSynthesis.getVoices(); voiceRef.current = vs.find(v => /en[-_]IN/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null; };
    load(); window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.cancel(); };
  }, [supported]);

  const speak = useCallback((text) => {
    if (!supported) return; window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); if (voiceRef.current) u.voice = voiceRef.current;
    u.lang = voiceRef.current?.lang || 'en-IN'; u.rate = 0.97; u.pitch = 1.05;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    setTimeout(() => window.speechSynthesis.speak(u), 80);
  }, [supported]);

  const goTopic = useCallback((topic) => {
    setActiveTopic(topic.id);
    if (mode === 'interior') {
      if (typeof topic.photo === 'number') setPhotoIdx(topic.photo);
      speak(topic.say);
      return;
    }
    const api = sceneApi.current; if (!api) return;
    const preset = api.presets[topic.cam] || Object.values(api.presets)[0];
    flyTarget.current = { pos: preset.pos.clone(), look: preset.look.clone() };
    setAutoRotate(false); speak(topic.say);
  }, [speak, mode]);

  // Navigate the real-photo interior (wraps + narrates the matching room line).
  const goPhoto = useCallback((i) => {
    if (!photos.length) return;
    const n = ((i % photos.length) + photos.length) % photos.length;
    setPhotoIdx(n); setActiveTopic('p' + n);
    const t = topics.find(tp => tp.id === 'p' + n);
    if (t) speak(t.say);
  }, [photos, topics, speak]);

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

  const switchMode = (m) => { if (m === mode) return; runFullRef.current = false; if (supported) window.speechSynthesis.cancel(); setMode(m); setAutoRotate(m !== 'interior'); };
  const labelFor = (id) => topics.find(t => t.id === id)?.label || id;

  return (
    <div className="pi-3d" role="dialog" aria-label="3D property showcase">
      {mode === 'interior' ? (
        photos.length ? (
          <div
            className="pi-3d-photo"
            onMouseMove={(e) => { const el = photoLayerRef.current; if (!el) return; const r = e.currentTarget.getBoundingClientRect(); const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `translate(${dx * -22}px, ${dy * -14}px) scale(1.06)`; }}
            onMouseLeave={() => { const el = photoLayerRef.current; if (el) el.style.transform = ''; }}
          >
            <div className="pi-3d-photo-layer" ref={photoLayerRef}>
              <img key={photoIdx} src={photos[photoIdx]} alt={property.title} className="pi-3d-photo-img" />
            </div>
            <div className="pi-3d-photo-scrim" />
            <button className="pi-3d-photo-tap left" onClick={() => goPhoto(photoIdx - 1)} aria-label="Previous photo" />
            <button className="pi-3d-photo-tap right" onClick={() => goPhoto(photoIdx + 1)} aria-label="Next photo" />
            <div className="pi-3d-photo-cap">
              <span className="pi-3d-photo-kicker">🖼️ Real listing photo · {photoIdx + 1} / {photos.length}</span>
              <strong>{property.title}</strong>
            </div>
            <div className="pi-3d-photo-thumbs">
              {photos.map((src, i) => (
                <button key={i} className={`pi-3d-photo-thumb ${i === photoIdx ? 'active' : ''}`} onClick={() => goPhoto(i)}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pi-3d-photo empty"><div><span>🖼️</span><h3>No interior photos yet</h3><p>This listing doesn&apos;t have interior images uploaded.</p></div></div>
        )
      ) : (
        <div ref={mountRef} className="pi-3d-canvas" />
      )}

      {mode === 'exterior' && ready && hotspots.map(h => h.visible && (
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
        <div className="pi-3d-modes">
          <button className={mode === 'exterior' ? 'active' : ''} onClick={() => switchMode('exterior')}>🏢 Exterior</button>
          <button className={mode === 'interior' ? 'active' : ''} onClick={() => switchMode('interior')}>🛋️ Interior</button>
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
        <button className="pi-3d-play-full" onClick={playFull} disabled={mode === 'interior' && !photos.length}>▶ Play full {mode === 'interior' ? 'home' : '3D'} tour</button>
        <div className="pi-3d-cta-row">
          <button className="primary" onClick={() => { onSchedule?.(); onClose(); }}>📅 Schedule Visit</button>
          <button className="ghost" onClick={() => onSave?.()}>{saved ? '♥ Saved' : '♡ Save'}</button>
        </div>
      </div>

      <div className="pi-3d-controls">
        {mode === 'interior' ? (
          <>
            <button onClick={() => goPhoto(photoIdx - 1)} disabled={!photos.length}>⏮ Prev</button>
            <button onClick={() => goPhoto(photoIdx + 1)} disabled={!photos.length}>⏭ Next</button>
            <span className="pi-3d-counter">{photos.length ? photoIdx + 1 : 0} / {photos.length}</span>
            <span className="pi-3d-hint">🖼️ Real listing photos · move mouse to look around</span>
          </>
        ) : (
          <>
            <button className={autoRotate ? 'on' : ''} onClick={() => setAutoRotate(r => !r)}>{autoRotate ? '⏸ Stop spin' : '↻ Auto-rotate'}</button>
            <button onClick={() => { goTopic(topics[0]); setActiveTopic(null); }}>⤢ Reset view</button>
            <span className="pi-3d-hint">🖱️ Drag to orbit · scroll to zoom</span>
          </>
        )}
      </div>

      {mode === 'exterior' && !ready && <div className="pi-3d-loading"><span className="pi-3d-spinner" />Building 3D model…</div>}
    </div>
  );
}

function spoken(price) {
  if (!price) return 'an attractive price';
  if (price >= 1e7) return `${(Math.round(price / 1e7 * 100) / 100).toString().replace(/\.0+$/, '')} crore rupees`;
  if (price >= 1e5) return `${(Math.round(price / 1e5 * 100) / 100).toString().replace(/\.0+$/, '')} lakh rupees`;
  return `${formatPriceIndian(price)}`;
}

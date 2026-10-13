import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

// The complete shaped excerpt stays together. Decorative points never alter
// its dots or spelling. This is the unvocalized excerpt of Qur'an 21:33.
const PHRASE = 'كل في فلك';
const WIDTH = 4096;
const HEIGHT = 1024;
const SEGMENTS = 256;
interface Band {
  inner: number; outer: number; elevation: number;
  top: number; bottom: number; count: number; size: number;
  metalness: number; roughness: number; gold: string[];
}
// Separate architectural roles, not three copies of the original ring.
const BANDS: Band[] = [
  { inner: 43.5, outer: 52.2, elevation: -.25, top: 8, bottom: 320, count: 36, size: 120, metalness: .35, roughness: .62, gold: ['#bba97d', '#9a8155', '#5d4933'] },
  { inner: 52.9, outer: 64.2, elevation: .48, top: 344, bottom: 680, count: 24, size: 260, metalness: .46, roughness: .43, gold: ['#ffe1a6', '#d1ae70', '#87613b'] },
  { inner: 64.9, outer: 74.0, elevation: .02, top: 704, bottom: 1016, count: 36, size: 200, metalness: .5, roughness: .52, gold: ['#dcc196', '#b68b5e', '#644732'] },
];

function strokeRule(ctx: CanvasRenderingContext2D, y: number, color: string, width: number) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
}

function drawPhrase(face: CanvasRenderingContext2D, relief: CanvasRenderingContext2D,
  x: number, y: number, size: number, available: number, colors: string[], pixelAspect: number) {
  // Compensate for unequal angular/radial UV scale. The canvas transform
  // restores the shaped glyph proportions on the actual architectural surface.
  face.font = `700 ${size}px Amiri`;
  const measured = face.measureText(PHRASE).width;
  const fitted = Math.min(size, size * available / Math.max(measured * pixelAspect, 1));
  for (const ctx of [face, relief]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(pixelAspect, 1);
    ctx.font = `700 ${fitted}px Amiri`;
    if (ctx === relief) {
      ctx.fillStyle = '#383838'; ctx.fillText(PHRASE, 0, 0);
    } else {
      ctx.fillStyle = '#060e18'; ctx.fillText(PHRASE, 1.4 / pixelAspect, 2.8);
      const gold = ctx.createLinearGradient(0, -fitted * .6, 0, fitted * .6);
      gold.addColorStop(0, colors[0]); gold.addColorStop(.42, colors[1]); gold.addColorStop(1, colors[2]);
      ctx.fillStyle = gold; ctx.fillText(PHRASE, 0, 0);
      ctx.strokeStyle = colors[0]; ctx.lineWidth = .65;
      ctx.strokeText(PHRASE, -.5 / pixelAspect, -.5);
    }
    ctx.restore();
  }
}

function engravedAtlas(anisotropy: number, maxTextureSize: number) {
  const face = document.createElement('canvas'); face.width = WIDTH; face.height = HEIGHT;
  const relief = face.cloneNode() as HTMLCanvasElement;
  const c = face.getContext('2d')!, h = relief.getContext('2d')!;
  c.fillStyle = '#172b3e'; c.fillRect(0, 0, WIDTH, HEIGHT);
  h.fillStyle = '#999999'; h.fillRect(0, 0, WIDTH, HEIGHT);
  for (const ctx of [c, h]) { ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
  let seed = 146;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  // A reproducible manuscript surface. Grain never runs in the frame loop.
  for (let i = 0; i < 70000; i++) {
    c.globalAlpha = .22; c.fillStyle = i % 4 ? '#3b4c56' : '#071422';
    c.fillRect(random() * WIDTH, random() * HEIGHT, 1 + random(), 1);
  }
  c.globalAlpha = 1;
  BANDS.forEach((band, index) => {
    const height = band.bottom - band.top, center = (band.top + band.bottom) / 2;
    const vignette = c.createLinearGradient(0, band.top, 0, band.bottom);
    vignette.addColorStop(0, '#050d1680'); vignette.addColorStop(.28, '#172d4100');
    vignette.addColorStop(.72, '#172d4100'); vignette.addColorStop(1, '#050d1680');
    c.fillStyle = vignette; c.fillRect(0, band.top, WIDTH, height);
    for (const inset of [5, 12, height - 12, height - 5]) {
      strokeRule(c, band.top + inset, inset === 12 ? '#b79559' : '#624e35', inset === 12 ? 2 : 1);
      strokeRule(h, band.top + inset, '#cccccc', 1);
    }
    const cell = WIDTH / band.count;
    const pixelAspect = (band.outer - band.inner) * WIDTH / (height * Math.PI * (band.inner + band.outer));
    for (let i = 0; i < band.count; i++) {
      const rhythm = i % 3;
      const x = (i + .5) * cell;
      const size = band.size * [1, .83, .94][rhythm];
      const y = center + (index === 0 ? -24 : index === 1 ? [-9, 9, 0][rhythm] : -12);
      drawPhrase(c, h, x, y, size, cell * .84, band.gold, pixelAspect);
      if (index === 1) {
        // Fine facing inscriptions frame each of the main cartouches.
        drawPhrase(c, h, x, band.top + 46, 36, cell * .72, band.gold, pixelAspect);
        drawPhrase(c, h, x, band.bottom - 43, 32, cell * .62, band.gold, pixelAspect);
        c.strokeStyle = '#806443'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - cell * .41, band.top + 64);
        c.lineTo(x - cell * .45, center); c.lineTo(x - cell * .41, band.bottom - 62); c.stroke();
      } else if (index === 0 && i % 4 < 2) {
        // Dense marginal notes occupy selected alternating manuscript regions.
        drawPhrase(c, h, x, band.bottom - 80, 33, cell * .9, band.gold, pixelAspect);
        drawPhrase(c, h, x, band.bottom - 37, 27, cell * .8, band.gold, pixelAspect);
      } else if (index === 2) {
        drawPhrase(c, h, x + (rhythm - 1) * cell * .06, band.bottom - 52, 44, cell * .74, band.gold, pixelAspect);
        if (i % 3 === 0) {
          // Geometric rivet ornament is deliberately separate from the script.
          const edge = i * cell;
          c.strokeStyle = '#b19062'; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(edge + 7, center - 9); c.lineTo(edge + 13, center);
          c.lineTo(edge + 7, center + 9); c.lineTo(edge + 1, center); c.closePath(); c.stroke();
        }
      }
    }
    // Sparse paired illuminations along the moldings, baked into the face.
    for (let i = 0; i < band.count; i += index === 1 ? 1 : 3) {
      const x = i * cell, y = band.top + 24;
      for (let j = -1; j <= 1; j++) {
        c.fillStyle = j ? '#397f7b' : '#a0e3cf';
        c.beginPath(); c.arc(x + j * 7, y, j ? 1.4 : 2.4, 0, Math.PI * 2); c.fill();
      }
    }
  });
  const images = [face, relief].map(canvas => {
    if (maxTextureSize >= WIDTH) return canvas;
    const resized = document.createElement('canvas');
    resized.width = maxTextureSize; resized.height = Math.max(1, Math.floor(HEIGHT * maxTextureSize / WIDTH));
    resized.getContext('2d')!.drawImage(canvas, 0, 0, resized.width, resized.height);
    return resized;
  });
  const map = new THREE.CanvasTexture(images[0]), bump = new THREE.CanvasTexture(images[1]);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bump]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = anisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return { map, bump };
}

// Polar UVs use a shared rectangular atlas. The 0/1 seam is in the gap between
// complete shaped phrases. Canvas tops face inward: the U/V handedness
// matches the surface normal, so front-facing Arabic is never reflected.
// Each lane has a gutter to isolate its mip levels.
function faceGeometry(band: Band) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const angle = i / SEGMENTS * Math.PI * 2;
    for (const radius of [band.inner, band.outer]) {
      positions.push(radius * Math.cos(angle), radius * Math.sin(angle), band.elevation);
      uv.push(i / SEGMENTS, 1 - (radius === band.inner ? band.top : band.bottom) / HEIGHT);
    }
    if (i < SEGMENTS) { const n = i * 2; indices.push(n, n + 1, n + 3, n, n + 3, n + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function bronzeArchitecture() {
  const pieces: THREE.BufferGeometry[] = [];
  BANDS.forEach(band => {
    // The support has a visible sidewall and bevel: an architectural slab.
    const shape = new THREE.Shape();
    shape.absarc(0, 0, band.outer + .15, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, band.inner - .15, 0, Math.PI * 2, true); shape.holes.push(hole);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .38, steps: 1, bevelEnabled: true, bevelSegments: 1, bevelSize: .08, bevelThickness: .06, curveSegments: 96 });
    geometry.translate(0, 0, band.elevation - .47); pieces.push(geometry);
  });
  const geometry = mergeGeometries(pieces)!;
  pieces.forEach(piece => piece.dispose());
  return geometry;
}

function lightTexture() {
  const size = 32, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const offset = (y * size + x) * 4;
    const radius = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(Math.max(0, 1 - radius) ** 2 * 255);
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true; return texture;
}

function lightClusters() {
  const positions: number[] = [];
  // Pair nearby positions in storage so reducing XR draw range keeps clusters.
  const six = [0, 3, 1, 4, 2, 5];
  const twelve = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5, 11];
  for (let i = 0; i < 12; i++) BANDS.forEach((band, index) => {
    const order = index === 1 ? twelve : six;
    if (i >= order.length) return;
    const angle = order[i] / order.length * Math.PI * 2;
    for (let j = -1; j <= 1; j++) {
      const a = angle + j * .008, radius = band.inner + .65;
      positions.push(radius * Math.cos(a), radius * Math.sin(a), band.elevation + .12);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); return geometry;
}

export function CalligraphyDepthArt({ paused = false, speed = 1 }: { paused?: boolean; speed?: number }) {
  const { gl } = useThree();
  const root = useRef<THREE.Group>(null);
  const worldScale = useMemo(() => new THREE.Vector3(), []);
  const maps = useMemo(() => engravedAtlas(Math.min(8, gl.capabilities.getMaxAnisotropy()), gl.capabilities.maxTextureSize), [gl]);
  const faces = useMemo(() => BANDS.map(faceGeometry), []);
  const backing = useMemo(bronzeArchitecture, []);
  const lights = useMemo(lightClusters, []);
  const glow = useMemo(lightTexture, []);
  const lightMaterial = useRef<THREE.PointsMaterial>(null);
  const illuminationPhase = useRef(0);
  useEffect(() => () => { maps.map.dispose(); maps.bump.dispose(); faces.forEach(g => g.dispose()); backing.dispose(); lights.dispose(); glow.dispose(); }, [maps, faces, backing, lights, glow]);
  useFrame((_, delta) => {
    if (!paused) illuminationPhase.current += Math.min(delta, .05) * .65 * speed;
    lights.setDrawRange(0, gl.xr.isPresenting ? 36 : 72);
    if (lightMaterial.current) {
      root.current?.getWorldScale(worldScale);
      // PointsMaterial size does not inherit a mesh's model scale.
      lightMaterial.current.size = .35 * Math.max(worldScale.x, worldScale.y, worldScale.z);
      lightMaterial.current.opacity = .62 + Math.sin(illuminationPhase.current) * .08;
    }
  });
  // Keep the wider deck below even the enlarged seven-letter planes and
  // Saturn's tilted rings; their choreography and transforms stay intact.
  return <group ref={root} name="calligraphy-depth-art" position={[0, -17.7, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, .74, 1]}>
    {BANDS.map((band, index) => <mesh key={index} geometry={faces[index]} raycast={() => null}>
      <meshStandardMaterial map={maps.map} bumpMap={maps.bump} bumpScale={.2} metalness={band.metalness} roughness={band.roughness}
        emissive="#b49c77" emissiveMap={maps.map} emissiveIntensity={.075} />
    </mesh>)}
    <mesh geometry={backing} raycast={() => null}><meshStandardMaterial color="#806441" metalness={.6} roughness={.5} /></mesh>
    <points geometry={lights} raycast={() => null}>
      <pointsMaterial ref={lightMaterial} map={glow} color="#8ce4ce" size={.35} transparent opacity={.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  </group>;
}

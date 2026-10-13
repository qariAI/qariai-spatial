import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Only the verified unvocalized excerpt from 21:33. Never split shaped words
// into individually rotated glyphs. Ornament dots are not added to the text.
const PHRASE = 'كل في فلك';
function engravedMaps(anisotropy: number) {
  const face = document.createElement('canvas');
  face.width = face.height = 2048;
  const relief = face.cloneNode() as HTMLCanvasElement;
  const c = face.getContext('2d')!;
  const h = relief.getContext('2d')!;
  c.fillStyle = '#213448'; c.fillRect(0, 0, 2048, 2048);
  h.fillStyle = '#999999'; h.fillRect(0, 0, 2048, 2048);
  // Deterministic fine manuscript grain, baked once rather than live particles.
  let seed = 145;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 42000; i++) {
    const x = random() * 2048, y = random() * 2048;
    c.fillStyle = i % 3 ? '#20303c' : '#0e1b28';
    c.globalAlpha = .32; c.fillRect(x, y, 1, 1);
  }
  c.globalAlpha = 1;
  for (const r of [764, 779, 1000, 1015]) {
    c.beginPath(); c.arc(1024, 1024, r, 0, Math.PI * 2);
    c.strokeStyle = r % 2 ? '#674c30' : '#bb985f'; c.lineWidth = 3; c.stroke();
  }
  for (const ctx of [c, h]) { ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
  // A principal cartouche row and a smaller manuscript marginal row share one
  // recessed annulus. Measure the full shaped phrase before fitting each cell.
  for (const row of [{ radius: 900, count: 12, size: 112 }, { radius: 808, count: 24, size:  32 }]) {
    for (let i = 0; i < row.count; i++) {
      const a = (i + (row.size < 40 ? .5 : (i % 3 - 1) * .035)) / row.count * Math.PI * 2;
      const size = row.size < 40 ? row.size : [112, 86, 100][i % 3];
      const radius = row.radius + (row.size < 40 ? 0 : [0, 14, -8][i % 3]);
      for (const ctx of [c, h]) {
        ctx.save(); ctx.translate(1024 + Math.cos(a) * radius, 1024 + Math.sin(a) * radius);
        ctx.rotate(a + Math.PI / 2); ctx.font = `700 ${size}px Amiri, serif`;
        const available = 2 * radius * Math.sin(Math.PI / row.count) * .82;
        const measured = ctx.measureText(PHRASE).width;
        if (measured > available) ctx.scale(available / measured, 1);
        if (ctx === h) { ctx.fillStyle = '#333333'; ctx.fillText(PHRASE, 0, 0); }
        else {
          ctx.fillStyle = '#040a10'; ctx.fillText(PHRASE, 2, 3);
          const gold = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
          gold.addColorStop(0, '#f0d39b'); gold.addColorStop(.45, '#c7a368'); gold.addColorStop(1, '#775632');
          ctx.fillStyle = gold; ctx.fillText(PHRASE, 0, 0);
          ctx.strokeStyle = '#e7cb94'; ctx.lineWidth = .6; ctx.strokeText(PHRASE, -.5, -.6);
        }
        ctx.restore();
      }
      // Sparse turquoise lights placed in the gaps, outside the glyph contours.
      if (row.size > 40 && i % 3 === 0) {
        const t = a + Math.PI / row.count;
        for (let j = -1; j <= 1; j++) {
          c.beginPath(); c.arc(1024 + Math.cos(t + j * .009) * 974, 1024 + Math.sin(t + j * .009) * 974, j ? 1.8 : 3, 0, Math.PI * 2);
          c.fillStyle = j ? '#377a79' : '#89d8c4'; c.fill();
        }
      }
    }
  }
  const map = new THREE.CanvasTexture(face), bump = new THREE.CanvasTexture(relief);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bump]) {
    texture.anisotropy = anisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }
  return { map, bump };
}

export function CalligraphyDepthArt() {
  const { gl } = useThree();
  const maps = useMemo(() => engravedMaps(Math.min(8, gl.capabilities.getMaxAnisotropy())), [gl]);
  useEffect(() => () => { maps.map.dispose(); maps.bump.dispose(); }, [maps]);
  return <group name="calligraphy-depth-art" position={[0, -12.6, 0]} scale={[1, 1, .74]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[45, 61, 192]} />
      <meshStandardMaterial map={maps.map} bumpMap={maps.bump} bumpScale={.22} emissive="#a58b65" emissiveMap={maps.map} emissiveIntensity={.1} metalness={.4} roughness={.48} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -.22, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[44.7, 61.3, 192]} />
      <meshStandardMaterial color="#715734" metalness={.65} roughness={.52} side={THREE.DoubleSide} />
    </mesh>
  </group>;
}

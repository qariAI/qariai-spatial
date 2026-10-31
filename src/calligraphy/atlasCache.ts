/// <reference types="vite/client" />
import * as THREE from 'three';
import fontOutline from '../orbit-art/generated/kaf-outline.json';
import type { engravedAtlas } from '../CalligraphyDepthArt';

type Atlas = ReturnType<typeof engravedAtlas>;
type Profile = Atlas['textureProfile'];
export type CachedAtlas = { width: number; height: number; face: Uint8ClampedArray; bump: Uint8Array; profile: Profile };
export type AtlasLookup = { key: string; record: CachedAtlas | null };
const CACHE = 'qari-native-atlas-v1';
const digest = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource)), v => v.toString(16).padStart(2, '0')).join('');

// The built module URL carries Vite's content hash. Browser/raster settings and
// texture capabilities also participate: a different rendering input is a miss.
export async function lookupAtlas(anisotropy: number, maxTextureSize: number): Promise<AtlasLookup> {
  if (import.meta.env.DEV || !('caches' in window)) return { key: '', record: null };
  const fingerprint = [import.meta.url, fontOutline.fontSha256, navigator.userAgent, devicePixelRatio, anisotropy, maxTextureSize].join('|');
  const key = new URL('/__qari_native_atlas__/' + await digest(new TextEncoder().encode(fingerprint)), location.origin).href;
  try {
    const cache = await caches.open(CACHE), response = await cache.match(key);
    if (!response) return { key, record: null };
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > 34 * 1024 * 1024 || await digest(bytes) !== response.headers.get('X-Qari-SHA256')) throw Error('Invalid atlas record');
    const headerLength = new DataView(bytes.buffer).getUint32(0);
    if (headerLength > 4096) throw Error('Invalid atlas header');
    const header = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + headerLength)));
    const length = 4096 * 1024 * 4;
    if (header.version !== 1 || header.width !== 4096 || header.height !== 1024 || bytes.length !== 4 + headerLength + length * 2 || !header.profile) throw Error('Invalid atlas dimensions');
    const start = 4 + headerLength;
    return { key, record: { width: header.width, height: header.height,
      face: new Uint8ClampedArray(bytes.slice(start, start + length).buffer),
      bump: bytes.slice(start + length), profile: header.profile } };
  } catch {
    // Storage is an optional optimization. Corrupt/unsupported records never
    // become artwork; the unchanged native baker remains the fallback.
    return { key, record: null };
  }
}

export async function storeAtlas(key: string, atlas: Atlas): Promise<void> {
  if (!key || !atlas.textureProfile || !(atlas.bump instanceof THREE.DataTexture)) return;
  try {
    const face = atlas.map.image as HTMLCanvasElement;
    const image = atlas.bump.image;
    if (face.width !== 4096 || face.height !== 1024 || image.width !== face.width || image.height !== face.height) return;
    const pixels = face.getContext('2d')!.getImageData(0, 0, face.width, face.height).data;
    const header = new TextEncoder().encode(JSON.stringify({ version: 1, width: face.width, height: face.height, profile: atlas.textureProfile }));
    const bytes = new Uint8Array(4 + header.length + pixels.length + image.data.length);
    new DataView(bytes.buffer).setUint32(0, header.length);
    bytes.set(header, 4); bytes.set(pixels, 4 + header.length); bytes.set(image.data, 4 + header.length + pixels.length);
    const hash = await digest(bytes), cache = await caches.open(CACHE);
    await cache.put(key, new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream', 'X-Qari-SHA256': hash } }));
    // Bound storage to one atlas. No shared GPU object survives a document.
    for (const request of await cache.keys()) if (request.url !== key) await cache.delete(request);
  } catch { /* Quota/private-mode failures simply retain the original bake. */ }
}

export function restoreAtlas(record: CachedAtlas, anisotropy: number): Atlas {
  const canvas = document.createElement('canvas'); canvas.width = record.width; canvas.height = record.height;
  const image = new ImageData(record.width, record.height); image.data.set(record.face);
  canvas.getContext('2d')!.putImageData(image, 0, 0);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.DataTexture(new Uint8Array(record.bump), record.width, record.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  bump.flipY = false; bump.generateMipmaps = true; bump.magFilter = THREE.LinearFilter; bump.needsUpdate = true;
  for (const texture of [map, bump]) { texture.wrapS = THREE.RepeatWrapping; texture.anisotropy = anisotropy; texture.minFilter = THREE.LinearMipmapLinearFilter; }
  return { map, bump, heroMask: null, raised: null, textureProfile: record.profile };
}

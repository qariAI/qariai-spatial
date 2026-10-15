export const DEPTH_LEVELS = [-.12, -.08, -.04, 0, .04, .08, .12] as const;
export const LOCKED_SOURCE = {
  verse: '67:3', wordCount: 18, courseSpans: [[1,5],[6,12],[13,14],[15,18]],
  sha256: 'fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc',
} as const;
export const QUALITY = {
  desktop: {textureSize:256, environmentSize:64, radialSegments:160, bevelSegments:3, shadowSize:512, dpr:1.4},
  quest: {textureSize:128, environmentSize:32, radialSegments:96, bevelSegments:2, shadowSize:256, dpr:1},
} as const;
export type Quality = keyof typeof QUALITY;

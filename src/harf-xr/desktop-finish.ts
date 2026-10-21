// Presentation only: no outline, centreline, progress or ink changes.
export const SAPPHIRE_STOPS = [
  [0, '#244b70'], [.32, '#426782'], [.48, '#53758c'],
  [.61, '#345976'], [1, '#142c4c'],
] as const;

export function satinSapphire(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 106, 0, 494);
  for (const [offset, color] of SAPPHIRE_STOPS) gradient.addColorStop(offset, color);
  return gradient;
}

export function installSapphireGuide(board: SVGSVGElement, body: SVGPathElement) {
  const ns = 'http://www.w3.org/2000/svg';
  const gradient = document.createElementNS(ns, 'linearGradient');
  gradient.id = 'sapphireGuide';
  for (const [name, value] of Object.entries({x1:'0', y1:'106', x2:'0', y2:'494', gradientUnits:'userSpaceOnUse'})) gradient.setAttribute(name, value);
  for (const [offset, color] of SAPPHIRE_STOPS) {
    const stop = document.createElementNS(ns, 'stop');
    stop.setAttribute('offset', String(offset));
    stop.setAttribute('stop-color', color);
    gradient.append(stop);
  }
  board.querySelector('defs')!.append(gradient);
  body.setAttribute('fill', 'url(#sapphireGuide)');
  body.setAttribute('stroke', '#7c9aad');
  // Keep the existing one-unit outline and all original paths unchanged.
  board.dataset.finish = 'sapphire';
}

// Baked directional edge shading changes RGB only. The complete native-shaped
// Arabic mask, including every diacritic, remains byte-for-byte unchanged.
export interface EngravedGlyph { canvas: HTMLCanvasElement; left: number; top: number }
export function paintHeroBevel(ctx: CanvasRenderingContext2D, phrase: string,
  cache: Map<string, EngravedGlyph>) {
  const key = `${ctx.font}:${phrase}`;
  let tile = cache.get(key);
  if (!tile) {
    const bounds = ctx.measureText(phrase), margin = 4;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(bounds.actualBoundingBoxLeft + bounds.actualBoundingBoxRight) + margin * 2;
    canvas.height = Math.ceil(bounds.actualBoundingBoxAscent + bounds.actualBoundingBoxDescent) + margin * 2;
    const mask = canvas.getContext('2d')!;
    mask.direction = 'rtl'; mask.textAlign = 'center'; mask.textBaseline = 'middle'; mask.font = ctx.font;
    const left = bounds.actualBoundingBoxLeft + margin, top = bounds.actualBoundingBoxAscent + margin;
    mask.fillStyle = '#ffffff'; mask.fillText(phrase, left, top);
    const pixels = mask.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
    const alpha = (x: number, y: number) => x < 0 || y < 0 || x >= canvas.width || y >= canvas.height
      ? 0 : data[(y * canvas.width + x) * 4 + 3] / 255;
    const base = [210, 164, 88], highlight = [255, 236, 183], bronze = [91, 57, 28];
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const offset = (y * canvas.width + x) * 4;
      if (!data[offset + 3]) continue;
      const light = (1 - alpha(x - 2, y - 2)) * .85;
      const shade = (1 - alpha(x + 2, y + 2)) * .28;
      for (let channel = 0; channel < 3; channel++) {
        const illuminated = base[channel] + (highlight[channel] - base[channel]) * light;
        data[offset + channel] = Math.round(illuminated + (bronze[channel] - illuminated) * shade);
      }
      // Alpha is never rewritten: edge shading cannot remove dots or strokes.
    }
    mask.putImageData(pixels, 0, 0);
    tile = { canvas, left, top }; cache.set(key, tile);
  }
  ctx.drawImage(tile.canvas, -tile.left, -tile.top);
}

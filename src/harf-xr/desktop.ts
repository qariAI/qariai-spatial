import { inkPath, GOLD_STOPS } from './ink';
import { BA, bodyPath } from './letters/definition';
import { progressDisplay } from './progress';
import { Tracing, GUIDE, DOT, type Point } from './tracing';
const board = document.querySelector<SVGSVGElement>('#board')!, guide = document.querySelector<SVGPathElement>('#bodyGuide')!, ink = document.querySelector<SVGGElement>('#ink')!;
const body = document.querySelector<SVGPathElement>('#bodyGlow')!, dot = document.querySelector<SVGPathElement>('#dotGuide')!, done = document.querySelector<SVGPathElement>('#dotDone')!;
const start = document.querySelector<SVGCircleElement>('#start')!, label = document.querySelector<SVGTextElement>('#startLabel')!;
const gradient=document.querySelector('#goldInk')!;
gradient.replaceChildren(...GOLD_STOPS.map(([offset,color])=>{const stop=document.createElementNS('http://www.w3.org/2000/svg','stop');stop.setAttribute('offset',String(offset));stop.setAttribute('stop-color',color);return stop;}));
body.setAttribute('d', BA.bodyOutline);
document.querySelector('#clipBody')!.setAttribute('d', BA.bodyOutline);
guide.setAttribute('d', bodyPath(BA));
dot.setAttribute('d', BA.dotOutline);
done.setAttribute('d', BA.dotOutline);
start.setAttribute('cx', String(GUIDE[0].x));
start.setAttribute('cy', String(GUIDE[0].y));
label.setAttribute('x', String(GUIDE[0].x));
label.setAttribute('y', String(GUIDE[0].y - 28));
const finish = document.createElementNS('http://www.w3.org/2000/svg', 'text');
finish.textContent = 'FINISH';
finish.setAttribute('x', String(GUIDE.at(-1)!.x));
finish.setAttribute('y', String(GUIDE.at(-1)!.y - 25));
finish.setAttribute('fill', '#dac5a0');
finish.setAttribute('font-size', '19');
finish.setAttribute('text-anchor', 'middle');
board.append(finish);
const trace = new Tracing();
let pointer: number | null = null, visible = true, demo = false, animation = 0;
function redraw(strokes = trace.strokes) {
    ink.replaceChildren();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', inkPath(strokes));
    path.setAttribute('fill', 'url(#goldInk)');
    ink.append(path);
}
function update() { const {percent,label:progressLabel}=progressDisplay(trace); document.querySelector('#counter')!.textContent = progressLabel; document.querySelector<HTMLElement>('#bar')!.style.width = `${percent}%`; document.querySelector('#feedback')!.textContent = trace.feedback; document.querySelector('#phaseLabel')!.textContent = trace.phase === 'body' ? 'Step 1 of 2 · trace the body' : trace.phase === 'dot' ? 'Step 2 of 2 · add the dot' : 'Complete · Bāʾ'; document.querySelector('#stepBody')!.classList.toggle('active', trace.phase === 'body'); document.querySelector('#stepDot')!.classList.toggle('active', trace.phase === 'dot'); done.setAttribute('visibility', trace.phase === 'complete' ? 'visible' : 'hidden'); dot.setAttribute('fill', trace.phase === 'dot' ? '#e5b96a' : '#96acaf'); start.setAttribute('visibility', trace.phase === 'body' ? 'visible' : 'hidden'); label.setAttribute('visibility', trace.phase === 'body' ? 'visible' : 'hidden'); redraw(); }
function point(e: PointerEvent): Point | null { const matrix = board.getScreenCTM(); if (!matrix)
    return null; const p = board.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(matrix.inverse()); }
function release() { if (pointer !== null && board.hasPointerCapture(pointer))
    board.releasePointerCapture(pointer); pointer = null; trace.end(); }
function reset() { cancelAnimationFrame(animation); demo = false; release(); trace.reset(); update(); }
board.addEventListener('pointerdown', e => { if (demo || pointer !== null)
    return; e.preventDefault(); const p = point(e); if (!p)
    return; pointer = e.pointerId; board.setPointerCapture(pointer); trace.begin(p); update(); });
board.addEventListener('pointermove', e => { if (e.pointerId !== pointer || demo)
    return; e.preventDefault(); const p = point(e); if (p) {
    trace.move(p);
    update();
} });
board.addEventListener('pointerup', release);
board.addEventListener('pointercancel', release);
board.addEventListener('lostpointercapture', () => { pointer = null; trace.end(); });
document.querySelector<HTMLButtonElement>('#reset')!.onclick = reset;
document.querySelector<HTMLButtonElement>('#guideToggle')!.onclick = e => { visible = !visible; guide.style.opacity = visible ? '.8' : '0'; body.style.opacity = visible ? '1' : '0'; const button = e.currentTarget as HTMLButtonElement; button.textContent = visible ? 'Hide guide' : 'Show guide'; button.setAttribute('aria-pressed', String(visible)); };
document.querySelector<HTMLButtonElement>('#demo')!.onclick = () => { reset(); demo = true; let began: number | null = null; function frame(time: number) { began ??= time; const count = Math.floor((time - began) / 12); redraw([GUIDE.slice(0, count + 1)]); document.querySelector('#feedback')!.textContent = BA.copy.body; if (count < GUIDE.length)
    animation = requestAnimationFrame(frame);
else
    reset(); } animation = requestAnimationFrame(frame); };
window.addEventListener('pagehide', () => { cancelAnimationFrame(animation); release(); }, { once: true });
// Make the exact shared definition available to DOM-only regression inspection.
board.dataset.letter = BA.character;
board.dataset.dotX = String(DOT.x);
board.dataset.dotY = String(DOT.y);
reset();

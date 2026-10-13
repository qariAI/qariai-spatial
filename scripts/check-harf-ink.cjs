const assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const code=buildSync({entryPoints:['src/harf-xr/ink.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);
const {smoothStroke,nibCorners,inkPath}=m.exports;
const raw=Array.from({length:21},(_,i)=>({x:300+i*3,y:i===0||i===20?300:300+(i%2?2:-2)})),saved=JSON.stringify(raw),smoothed=smoothStroke(raw);
assert.deepEqual(smoothed[0],raw[0]);assert.deepEqual(smoothed.at(-1),raw.at(-1));assert.equal(JSON.stringify(raw),saved);assert(Math.max(...smoothed.slice(1,-1).map(p=>Math.abs(p.y-300)))<2,'high-frequency visual jitter reduced');
const p={x:450,y:300},horizontal=nibCorners(p,{x:1,y:0}),vertical=nibCorners(p,{x:0,y:1});const extent=(v,key)=>Math.max(...v.map(p=>p[key]))-Math.min(...v.map(p=>p[key]));assert(extent(vertical,'x')>extent(horizontal,'y')*1.15,'broad nib has direction-dependent width');
const path=inkPath([raw]);assert(path.includes('M')&&path.includes('Z'));assert(!/NaN|Infinity/.test(path));assert.equal(inkPath([]),'');assert.equal(inkPath([[p]]),'');assert.equal(inkPath([[p,p]]),'');assert.equal(JSON.stringify(raw),saved);
const native=raw.map(p=>Object.create({get x(){return p.x},get y(){return p.y}}));assert.equal(inkPath([native]),path,'SVG points with inherited coordinate getters must render identically');
console.log('PASS broad-nib width variation, finite/empty/duplicate inputs, visual smoothing, exact endpoints and unmodified validation samples');

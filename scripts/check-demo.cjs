const {buildSync}=require('esbuild'),assert=require('node:assert/strict'),fs=require('node:fs');
function load(path){const code=buildSync({entryPoints:[path],bundle:true,write:false,format:'cjs',define:{'import.meta.env.DEV':'false'}}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const {allowedDemoHost,prepareDemo}=load('src/demo/mode.ts'),{SHOTS}=load('src/demo/sequence.ts');
assert(!allowedDemoHost('qariai-spatial.vercel.app'));assert(!allowedDemoHost('qariai.com'));assert(allowedDemoHost('localhost'));assert(allowedDemoHost('qariai-spatial-git-demo-example.vercel.app'));
const values=new Map();global.sessionStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
function url(s){const u=new URL(s);global.location={hostname:u.hostname,search:u.search,href:s,replace:n=>{global.redirect=String(n);}};}
url('https://qariai-spatial-git-demo-example.vercel.app/');assert(!prepareDemo().enabled);
url('https://qariai-spatial-git-demo-example.vercel.app/?competitionDemo=1&xrEmulator=1');assert(prepareDemo().emulate);
url('https://qariai-spatial-git-demo-example.vercel.app/harf-studio-xr.html');assert(prepareDemo().redirect);assert(global.redirect.includes('xrEmulator=1'));
url('https://qariai-spatial.vercel.app/?competitionDemo=1&xrEmulator=1');assert(!prepareDemo().enabled);assert.equal(values.size,0);
url('http://localhost/?competitionDemo=0');assert(!prepareDemo().enabled);
assert.equal(SHOTS[0].at,0);assert.equal(SHOTS.at(-1).end,174);for(let i=1;i<SHOTS.length;i++)assert.equal(SHOTS[i].at,SHOTS[i-1].end);
for(const file of ['src/App.tsx','src/CalligraphyDepthArt.tsx','src/harf-xr/main.ts','src/harf-xr/desktop.ts'])assert(!fs.readFileSync(file,'utf8').includes('competitionDemo'));
console.log('PASS explicit opt-in, production rejection, navigation persistence, opt-out and continuous 2:54 cue sheet');

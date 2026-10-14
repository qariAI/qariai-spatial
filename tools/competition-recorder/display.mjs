import {PNG} from 'pngjs';
export function verifyDisplay(items,settings){
 const active=items.filter(s=>s.sceneItemEnabled);
 if(active.length!==1||active[0].inputKind!=='monitor_capture')throw Error('Program scene must contain exactly one enabled Display Capture source (no overlays/groups/nested scenes). Disabled sources may remain.');
 if(settings.capture_cursor!==false||settings.method!==2)throw Error('Display Capture must use Windows Graphics Capture (method 2), cursor off.');
 return active[0];
}
export function compareCapture(browserPNG,obsPNG){
 const a=PNG.sync.read(browserPNG),b=PNG.sync.read(obsPNG);
 if(a.width!==1920||a.height!==1080||b.width!==a.width||b.height!==a.height)throw Error('Browser and OBS program capture must both be 1920×1080.');
 // Compare informative tiles, not merely a mostly black background. Moving stars
 // are tolerated, but a wrong monitor/OBS/console cannot pass via dark pixels.
 let informative=0,failed=0,total=0,error=0;
 for(let ty=0;ty<9;ty++)for(let tx=0;tx<16;tx++){
  let n=0,delta=0,min=255,max=0;
  for(let y=ty*120+4;y<(ty+1)*120;y+=8)for(let x=tx*120+4;x<(tx+1)*120;x+=8){const p=(y*1920+x)*4;const l=(a.data[p]+a.data[p+1]+a.data[p+2])/3;min=Math.min(min,l);max=Math.max(max,l);for(let c=0;c<3;c++)delta+=Math.abs(a.data[p+c]-b.data[p+c]);n+=3;}
  total+=n;error+=delta;if(max-min>35){informative++;if(delta/n>14)failed++;}
 }
 const meanError=error/total;if(informative<5||failed>Math.floor(informative*.08)||meanError>8)throw Error(`OBS program does not match fullscreen application: informative=${informative}, mismatched=${failed}, meanError=${meanError.toFixed(2)}. Check monitor, fit, overlays and OBS/terminal placement.`);
 return {informativeTiles:informative,mismatchedTiles:failed,meanError};
}
export async function verifyArrangement(obs,page,out,writeFile){
 const {currentProgramSceneName:scene}=await obs.call('GetCurrentProgramScene');
 const {sceneItems}=await obs.call('GetSceneItemList',{sceneName:scene});
 const active=sceneItems.filter(s=>s.sceneItemEnabled);if(active.length!==1)throw Error('Use one enabled Display Capture source in the program scene.');
 const {inputSettings}=await obs.call('GetInputSettings',{inputName:active[0].sourceName});const source=verifyDisplay(sceneItems,inputSettings);
 const browser=await page.screenshot({timeout:8000});
 const {imageData}=await obs.call('GetSourceScreenshot',{sourceName:scene,imageFormat:'png',imageWidth:1920,imageHeight:1080});
 const program=Buffer.from(imageData.split(',')[1],'base64');
 await writeFile(out+'/preflight-browser.png',browser);await writeFile(out+'/preflight-obs-program.png',program);
 return {scene,source:source.sourceName,...compareCapture(browser,program)};
}

export const SHOTS=[
 {at:0,end:12,cue:'seven',name:'Seven mirrored Arabic letters'},
 {at:12,end:30,cue:'mirrors',name:'Mirrored discovery'},
 {at:30,end:52,cue:'orbit',name:'Living Orbit'},
 {at:52,end:88,cue:'macro',name:'Engraved calligraphy'},
 {at:88,end:102,cue:'return',name:'Return to Orbit'},
 {at:102,end:112,cue:'studio',name:'Harf Studio'},
 {at:112,end:124,cue:'guide',name:'Amiri Naskh Bāʾ'},
 {at:124,end:158,cue:'body',name:'Body tracing'},
 {at:158,end:166,cue:'dot',name:'Separate dot — Letter complete'},
 {at:166,end:174,cue:'finish',name:'Return to Living Orbit'},
];
export function projectedPoint(p,rect){const scale=rect.height/(2*.85*Math.tan(Math.PI/8));return {x:rect.x+rect.width/2+(p.x/900-.5)*.72*scale,y:rect.y+rect.height/2-(.5-p.y/650)*.52*scale};}
export function verifyVideo(s){if(s.baseWidth!==1920||s.baseHeight!==1080||s.outputWidth!==1920||s.outputHeight!==1080||s.fpsNumerator/s.fpsDenominator!==30)throw Error('OBS must have 1920×1080 canvas/output and exactly 30 FPS.');}
export function ffmpegArgs(input,output){return ['-n','-i',input,'-t','174','-vf','fps=30,scale=1920:1080:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.35,fade=t=out:st=173.5:d=0.5','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',output];}

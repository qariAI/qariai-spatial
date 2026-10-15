// Optional evidence only. OBS program-image validation is separate and mandatory.
// Never spend a timed recording chapter's budget on a diagnostic still image.
export async function diagnosticScreenshot(page,report,{name,path,enabled=false,recording=false},warn=console.warn){
 report.screenshots??=[];
 const entry={name};report.screenshots.push(entry);
 if(!enabled||recording){entry.result='skipped';entry.reason=recording?'Timed recording: diagnostic stills disabled':'Optional screenshots disabled';return;}
 try{await page.screenshot({path,timeout:1000});entry.result='saved';}
 catch(error){if(error?.name!=='TimeoutError'){entry.result='failed';entry.error=String(error);throw error;}entry.result='warning';entry.warning=String(error);warn('Optional screenshot '+name+' timed out; continuing with all validation checks unchanged.');}
}

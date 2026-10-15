// Use real browser keyboard input. Window.dispatchEvent would make event.target
// the Window, which has no .closest() for the application's editable-field guard.
export async function keyboardCue(page,name,sleep,checkForeground){
 if(name!=='seven'&&name!=='mirrors')return false;
 checkForeground();
 if(name==='seven'){
  await page.getByRole('button',{name:/Reset view/}).click();
  await page.keyboard.press('ArrowLeft');
  const pause=page.getByRole('button',{name:/Pause motion/});if(await pause.count())await pause.click();
 }else{
  for(let i=1;i<=7;i++){checkForeground();await page.keyboard.press(String(i));await sleep(2100);}
 }
 return true;
}

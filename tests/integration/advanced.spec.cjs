const {test,expect}=require('@playwright/test');
test('redirect response navigates the real app when the size heuristic triggers',async({page})=>{
 await page.goto('/javascript.html');
 await expect.poll(()=>page.evaluate(()=>window.harness?.active.length||0)).toBe(1);
 await Promise.all([
  page.waitForURL('about:blank'),
  page.evaluate(()=>{Object.defineProperty(window,'outerWidth',{configurable:true,value:innerWidth+250});harness.latest.enable({console:true,consoleAction:'redirect'});})
 ]);
 expect(page.url()).toBe('about:blank');
});
test('real DevTools keyboard shortcuts are intercepted, editing fields stay exempt',async({page})=>{
 await page.goto('/javascript.html');
 await expect.poll(()=>page.evaluate(()=>window.harness?.active.length||0)).toBe(1);
 await page.evaluate(()=>harness.latest.enable({console:true,consoleAction:'noop'}));
 await page.locator('#protected').focus();await page.keyboard.press('Control+Shift+c');
 await expect.poll(()=>page.evaluate(()=>harness.events.filter(e=>e.type==='console_shortcut').length)).toBe(1);
 await page.locator('#input').focus();await page.keyboard.press('Control+Shift+c');
 expect(await page.evaluate(()=>harness.events.filter(e=>e.type==='console_shortcut').length)).toBe(1);
 await page.evaluate(()=>harness.latest.disable('console'));
 await page.locator('#protected').focus();await page.keyboard.press('F12');
 expect(await page.evaluate(()=>harness.events.filter(e=>e.type==='console_shortcut').length)).toBe(1);
});

test('default minification reports unsupported antiDebug before mutating active flags',async({page})=>{
 await page.goto('/stripped/javascript.html');
 await expect.poll(()=>page.evaluate(()=>window.harness?.active.length||0)).toBe(1);
 const result=await page.evaluate(()=>{
  const g=harness.latest, before=g.status();let error;
  try {g.enable({copy:false,antiDebug:true});} catch(e){error=e.message;}
  return {error,unchanged:JSON.stringify(before)===JSON.stringify(g.status())};
 });
 expect(result.error).toContain('preserves debugger');expect(result.unchanged).toBe(true);
});

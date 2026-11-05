const {test,expect}=require('@playwright/test');
const frameworks=['javascript','react','vue','angular','svelte','react-hydrated','vue-hydrated','svelte-hydrated','react-dev'];
for(const framework of frameworks) test.describe(framework,()=>{
 let errors;
 test.beforeEach(async({page})=>{
  errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(() => {
   window.testIntervals = new Set();
   const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
   window.setInterval=(fn,delay,...args)=>{const id=set(fn,delay,...args);window.testIntervals.add(id);return id;};
   window.clearInterval=id=>{window.testIntervals.delete(id);clear(id);};
  });
  await page.goto(framework==='react-dev'?'/dev/react.html':'/'+framework+'.html');
  await expect.poll(()=>page.evaluate(()=>window.harness?.active.length||0)).toBe(1);
  await expect(page.locator('#app')).toContainText('Your content');
 });
 test.afterEach(()=>expect(errors).toEqual([]));
 if (framework==='react-dev') test('development Strict Mode performs setup-cleanup-setup safely',async({page})=>{
  expect(await page.evaluate(()=>harness.records.length)).toBe(2);
  expect(await page.evaluate(()=>harness.records.filter(r=>r.destroyed).length)).toBe(1);
 });
 test('whole-page controls, editable exceptions, real keyboard and print CSS',async({page})=>{
  const result=await page.evaluate(()=>{
   const send=(id,type,keys={})=>{const event=type==='keydown'?new KeyboardEvent(type,{bubbles:true,cancelable:true,...keys}):new Event(type,{bubbles:true,cancelable:true});document.querySelector(id).dispatchEvent(event);return event.defaultPrevented;};
   return {copy:send('#protected','copy'),right:send('#protected','contextmenu'),select:send('#protected','selectstart'),save:send('#protected','keydown',{key:'s',metaKey:true}),exceptions:['#input','#textarea','#select','#editable','#allowed'].map(id=>send(id,'copy')),selectCSS:getComputedStyle(document.querySelector('#protected')).userSelect,inputCSS:getComputedStyle(document.querySelector('#input')).userSelect};
  });
  expect(result).toEqual({copy:true,right:true,select:true,save:true,exceptions:[false,false,false,false,false],selectCSS:'none',inputCSS:'text'});
  await page.locator('#input').fill('Forms remain editable');
  await page.locator('#protected').click({button:'right'});
  await expect.poll(()=>page.evaluate(()=>harness.events.filter(e=>e.type==='right_click').length)).toBe(2);
  await page.locator('#protected').focus();await page.keyboard.press('Control+s');
  await expect.poll(()=>page.evaluate(()=>harness.events.filter(e=>e.type==='save_page').length)).toBe(2);
  await page.evaluate(()=>{harness.latest.enable({select:false});const r=document.createRange();r.selectNodeContents(document.querySelector('#protected'));getSelection().removeAllRanges();getSelection().addRange(r);});
  await page.keyboard.press('Control+c');
  await expect.poll(()=>page.evaluate(()=>harness.events.filter(e=>e.type==='copy').length)).toBe(2);
  await page.emulateMedia({media:'print'});await expect(page.locator('html')).toBeHidden();
  await page.evaluate(()=>harness.latest.disable('print'));await expect(page.locator('#protected')).toBeVisible();
 });
 test('pause, resume, updates, errors, subscriptions and permanent cleanup',async({page})=>{
  const result=await page.evaluate(()=>{
   const g=harness.latest;const copy=()=>{const e=new Event('copy',{bubbles:true,cancelable:true});document.querySelector('#protected').dispatchEvent(e);return e.defaultPrevented;};
   let count=0;const off=g.on('violation',()=>count++);
   const blocked=copy();const removed=off();const removedAgain=off();copy();g.disable();const paused=copy();g.enable();const resumed=copy();
   const before=g.status();try{g.enable({copy:false,print:'invalid'});}catch{}const atomic=JSON.stringify(before)===JSON.stringify(g.status());
   g.enable({copy:false});const updated=copy();g.lock({copy:true});g.unlock('copy');const aliasOff=copy();g.enable();const aliasOn=copy();g.unlockAll();g.enable();
   return {blocked,count,removed,removedAgain,paused,resumed,atomic,updated,aliasOff,aliasOn};
  });
  expect(result).toEqual({blocked:true,count:1,removed:true,removedAgain:false,paused:false,resumed:true,atomic:true,updated:false,aliasOff:false,aliasOn:true});
  await page.locator('#unmount').click();await expect.poll(()=>page.evaluate(()=>harness.active.length)).toBe(0);
  expect(await page.evaluate(()=>{const g=harness.records.at(-1).controller;g.destroy();try{g.enable();return false;}catch{return true;}})).toBe(true);
  await expect(page.locator('[data-browser-guard]')).toHaveCount(0);
 });
 test('20 real mount/unmount cycles leave no styles, duplicate subscriptions or active guards',async({page})=>{
  for(let i=0;i<20;i++){
   await page.locator('#unmount').click();await expect.poll(()=>page.evaluate(()=>harness.active.length)).toBe(0);
   expect(await page.evaluate(()=>{const e=new Event('copy',{bubbles:true,cancelable:true});document.querySelector('#protected').dispatchEvent(e);return e.defaultPrevented;})).toBe(false);
   await expect(page.locator('[data-browser-guard]')).toHaveCount(0);
   expect(await page.locator('style').evaluateAll(styles=>styles.filter(s=>s.textContent.includes('data-browser-guard')).length)).toBe(0);
   await page.locator('#mount').click();await expect.poll(()=>page.evaluate(()=>harness.active.length)).toBe(1);
  }
  expect(await page.evaluate(()=>{harness.events.length=0;document.querySelector('#protected').dispatchEvent(new Event('copy',{bubbles:true,cancelable:true}));return harness.events.length;})).toBe(1);
 });
 test('scoped instances, custom exceptions and overlapping ownership survive framework cleanup',async({page})=>{
  const result=await page.evaluate(()=>{
   harness.latest.disable();
   const a=harness.Guard.create({target:'#outside',allow:['#allowed'],console:false});a.enable();
   const b=harness.Guard.create({target:'#outside'});b.enable({copy:true});
   const copy=id=>{const e=new Event('copy',{bubbles:true,cancelable:true});document.querySelector(id).dispatchEvent(e);return e.defaultPrevented;};
   const custom=copy('#input'),outside=copy('#app'),allowed=copy('#allowed');
   a.destroy();const overlap=copy('#protected');b.destroy();const cleaned=copy('#protected');return {custom,outside,allowed,overlap,cleaned};
  });
  expect(result).toEqual({custom:true,outside:false,allowed:false,overlap:true,cleaned:false});
 });
 test('advanced controls restore hidden content and stop timers on unmount',async({page})=>{
  const result=await page.evaluate(()=>{
   Object.defineProperty(window,'outerWidth',{configurable:true,value:innerWidth+250});
   harness.latest.enable({console:true,consoleAction:'hide',antiDebug:true});
   const hidden=getComputedStyle(document.body).display==='none';
   harness.latest.disable(['console','antiDebug']);
   const restored=getComputedStyle(document.body).display!=='none';
   harness.latest.enable({console:true,consoleAction:'noop',antiDebug:true});
   return {hidden,restored,advanced:harness.latest.status()};
  });
  expect(await page.evaluate(()=>testIntervals.size)).toBe(2);
  expect(result.hidden).toBe(true);expect(result.restored).toBe(true);expect(result.advanced.console).toBe(true);expect(result.advanced.antiDebug).toBe(true);
  await page.locator('#unmount').click();await expect.poll(()=>page.evaluate(()=>harness.active.length)).toBe(0);
  expect(await page.evaluate(()=>testIntervals.size)).toBe(0);
  const count=await page.evaluate(()=>harness.events.length);
  await page.waitForTimeout(1100);
  expect(await page.evaluate(()=>harness.events.length)).toBe(count);
  expect(await page.evaluate(()=>harness.records.at(-1).controller.status().antiDebug)).toBe(false);
 });
});

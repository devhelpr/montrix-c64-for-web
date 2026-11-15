// Optional visual QA: PLAYWRIGHT_MODULE can point to a locally installed Playwright.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname,file=path.join(root,name==='/'?'index.html':name);const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end();}});
let browser;
try{
await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1152,height:900}}),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.montrix);
await page.screenshot({path:path.join(root,'../web/title-desktop.png')});
await page.locator('#start').click();let before=await page.evaluate(()=>montrix.game.player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>montrix.game.player.x)>before);
await page.keyboard.down('Space');await page.waitForTimeout(500);await page.keyboard.up('Space');assert.ok(await page.evaluate(()=>montrix.game.shotsFired)>0);
await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>montrix.game.mode),'paused');await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>montrix.game.mode),'playing');
await page.keyboard.press('KeyM');assert.equal(await page.locator('#sound').textContent(),'Sound on');await page.keyboard.press('KeyM');
await page.screenshot({path:path.join(root,'../web/play-desktop.png')});
await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.addStyleTag({content:'.touch{display:flex}'});
await page.locator('#start').click();const box=await page.locator('[data-key="right"]').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(250);await page.mouse.up();
assert.ok(await page.evaluate(()=>montrix.game.player.x)>84);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.screenshot({path:path.join(root,'../web/play-mobile.png')});
assert.deepEqual(errors,[]);assert.ok(requests.every(u=>!(/\.wasm|ram\.bin|VIC-II|VICE/i.test(u))));
const report={passed:true,checks:['browser-load','keyboard-move','keyboard-fire','pause-resume','sound-toggle','touch-move','mobile-layout','no-console-errors','no-simulator-requests'],requests:requests.length};
await writeFile(path.join(root,'../web/browser-check.json'),JSON.stringify(report,null,2));console.log(report);
}finally{await browser?.close();await new Promise(r=>server.close(r));}

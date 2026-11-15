import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('offline HTML initializes, draws and handles input without network or a simulator',async()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('src="main.mjs"'));assert.ok(!html.includes("fetch('assets/rooms.json')"));
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const handlers={},nodes=new Map(),draws=[];let nextFrame;
 const ctx=new Proxy({}, {get:(_,key)=> (...args)=>draws.push([key,...args])});
 const node=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',value:'',options:[{}],dataset:{},showModal(){this.open=true;},close(){this.open=false;},getContext:()=>ctx,remove(){this.removed=true;},setAttribute(k,v){this[k]=v;},focus(){},addEventListener(k,f){if(k==='close')this.onclose=f;else this[k]=f;}});return nodes.get(id);};
 const document={hidden:false,querySelector:node,querySelectorAll:s=>s==='button'?['#start','#pause','#sound','#fullscreen'].map(node):[],addEventListener(k,f){handlers[k]=f;}};
 const window={addEventListener(k,f){handlers[k]=f;}};
 let decoded=0;
 class Image{get src(){return this.url;} set src(s){this.url=s;assert.ok(s.startsWith('data:image/png;base64,'));const png=Buffer.from(s.split(',')[1],'base64');assert.equal(png.subarray(1,4).toString(),'PNG');decoded++;queueMicrotask(()=>this.onload());}}
 await vm.runInNewContext(script,{document,window,Image,HTMLButtonElement:class{},requestAnimationFrame:f=>{nextFrame=f;},console});
 assert.equal(decoded,62);assert.equal(node('#loading').removed,true);assert.equal(window.montrix.game.mode,'title');
 nextFrame(20);assert.ok(draws.some(d=>d[0]==='drawImage'));
 node('#infinite-lives').onchange({target:{checked:true}});node('#infinite-shield').onchange({target:{checked:true}});
 assert.equal(window.montrix.game.infiniteLives,true);assert.equal(window.montrix.game.infiniteShield,true);
 // Choosing and searching only previews; confirmation changes all start paths.
 node('#start-room').value='choose';node('#start-room').onchange();
 assert.equal(node('#room-dialog').open,true);
 node('#room-search').value='60';node('#room-search').oninput();
 assert.equal(node('#room-name').textContent,'Room 60');
 assert.ok(node('#room-preview').src.startsWith('data:image/png;base64,'));
 assert.equal(window.montrix.game.startRoom,0);
 node('#room-set').onclick();assert.equal(window.montrix.game.startRoom,59);
 node('#start').onclick();assert.equal(window.montrix.game.room,59);
 window.montrix.game.reset();assert.equal(window.montrix.game.room,59);
 node('#start-room').value='choose';node('#start-room').onchange();
 node('#room-search').value='missing';node('#room-search').oninput();
 assert.equal(node('#room-set').disabled,true);assert.equal(node('#room-empty').hidden,false);
 node('#room-close').onclick();assert.equal(window.montrix.game.startRoom,59);
 node('#start-room').value='reset';node('#start-room').onchange();
 assert.equal(window.montrix.game.startRoom,0);
 node('#start').onclick();assert.equal(window.montrix.game.room,0);
 node('#start').onclick();assert.equal(window.montrix.game.infiniteLives,true);assert.equal(window.montrix.game.infiniteShield,true);const before=window.montrix.game.player.x;
 handlers.keydown({code:'ArrowRight',preventDefault(){},target:{}});for(let t=40;t<440;t+=20)nextFrame(t);handlers.keyup({code:'ArrowRight',preventDefault(){}});
 assert.ok(window.montrix.game.player.x>before);
 handlers.keydown({code:'Space',preventDefault(){},target:{}});for(let t=440;t<840;t+=20)nextFrame(t);handlers.keyup({code:'Space',preventDefault(){}});assert.ok(window.montrix.game.shotsFired>0);
 node('#pause').onclick();assert.equal(window.montrix.game.mode,'paused');node('#pause').onclick();assert.equal(window.montrix.game.mode,'playing');handlers.blur();assert.equal(window.montrix.game.mode,'paused');
 assert.ok(draws.some(d=>d[0]==='fillRect'));assert.equal(window.montrix.game.data.rooms.length,60);
 // Check the renderer's actual source and destination rectangles across a
 // complete opening/closing cycle, including both frame boundaries.
 const game=window.montrix.game;game.reset();game.enter(10,84,1);game.invulnerable=100000;
 let cropped=0;
 for(let t=0;t<800;t++){
   draws.length=0;window.montrix.draw();
   for(const d of draws.filter(d=>d[0]==='drawImage'&&d.length===10)){
     const [, ,sx,sy,sw,sh,dx,dy,dw,dh]=d;
     if(dx===62||dx===72||dx===86){
       assert.ok(dy>=74&&dy+dh<=156,'door stays inside the fixed frame');
       assert.ok(sh>0&&sh<=21);assert.equal(sh,dh);
       if(sh<21)cropped++;
     }
   }
   game.update();
 }
 assert.ok(cropped>100,'both doors are cropped while entering their frames');

});

import {Game, HZ} from './game.mjs';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false}),input={},loading=document.querySelector('#loading');
const roomDialog=document.querySelector('#room-dialog'),roomSelect=document.querySelector('#start-room'),roomList=document.querySelector('#room-list'),roomSearch=document.querySelector('#room-search');
let previewRoom=0;
let game,images,muted=true,audio,acc=0,last=0;
const controls=[...document.querySelectorAll('button')];controls.forEach(b=>b.disabled=true);
function tone(type){if(muted)return;audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;const f={fire:650,kill:130,hit:85,room:330,win:880,key:990,rocket:180}[type]||220;o.type=type==='fire'?'square':'sawtooth';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,f/5),t+.12);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.17);}
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Could not load ${src}`));im.src=src;});}
function text(s,x,y,color='#bfce72',size=8){ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y);}
function overlay(title,subtitle){ctx.fillStyle='#000d';ctx.fillRect(63,86,258,81);text(title,192,114,'#bfce72',12);text(subtitle,192,140,'#b4b0a0',7);}
const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
function number(n,x,y,count){const s=String(n).padStart(count,'0');ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,count*5+1,8);ctx.fillStyle='#bfc7a1';[...s].forEach((c,k)=>{[...digits[+c]].forEach((v,i)=>{if(v==='1')ctx.fillRect(x+k*5+i%3,y+Math.floor(i/3),1,1);});});}
function sprite(id,x,y,scaleX=1,scaleY=1,aperture=null){
  if(!Number.isInteger(id))return;
  const top=Math.round(y+36),left=Math.round(x+32);
  // Crop in sprite coordinates so the same rows disappear in either
  // direction; the fixed frame never moves with an individual door piece.
  const first=aperture?Math.max(0,(aperture[0]-top)/scaleY):0;
  const end=aperture?Math.min(21,(aperture[1]-top)/scaleY):21;
  if(end<=first)return;
  ctx.drawImage(images.sprites,0,id*21+first,24,end-first,left,top+first*scaleY,24*scaleX,(end-first)*scaleY);
}
function draw(){document.querySelector('#options').hidden=game.mode!=='title';ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,384,272);if(game.mode==='title'){ctx.drawImage(images.title,0,0);if(Math.floor(game.tick/28)%2===0)text('PRESS SPACE OR FIRE TO START',192,96,'#bfce72',7);return;}
ctx.drawImage(images.rooms[game.room],0,0);
ctx.fillStyle='#000';for(const o of game.removedObjects())ctx.fillRect(o.x+32,o.y+36,o.w,o.h);
ctx.save();ctx.beginPath();ctx.rect(32,36,320,160);ctx.clip();
// Draw higher slots first, matching the original sprite priority.
for(const e of [...game.enemies].reverse())if(e.visible){
  // The third room's telescoping doors slide behind the fixed upper and
  // lower frames. Keep this aperture fixed while the leaves and pistons move.
  const door=game.room===10 && e.kind>=197 && e.kind<=202;
  if(e.rocket&&e.launched){ctx.fillStyle=game.tick%2?'#f8d878':'#c87028';ctx.fillRect(e.x+42,e.y+55,4,5+game.tick%3);}
  sprite(e.sprite,e.x,e.y,e.scaleX,e.scaleY,door?[74,156]:null);
}
if(!game.invulnerable||Math.floor(game.tick/4)%2===0)sprite(game.data.playerTurnFrames[game.turnFrame],game.player.x,game.player.y);
for(const b of [...game.bullets,...game.enemyShots]){ctx.fillStyle=b.vx===8||b.vx===-8?'#fff':'#bfce72';ctx.fillRect(Math.round(b.x+32),Math.round(b.y+36),b.vx?5:2,b.vy?5:2);}for(const p of game.particles){ctx.fillStyle=p.life>9?'#bfce72':'#885429';ctx.fillRect(Math.round(p.x+32),Math.round(p.y+36),2,2);}ctx.restore();
number(game.score,208,221,6);if(game.infiniteLives){ctx.fillStyle='#000';ctx.fillRect(282,203,12,10);text('∞',288,211,'#bfc7a1',10);}else number(game.lives,284,205,1);
if(game.infiniteShield)text('SHIELD ∞',192,249,'#bfce72',7);
if(game.keys.size)text(`KEYS ${game.keys.size}/19`,192,261,'#bfce72',7);
if(game.mode==='paused')overlay('PAUSED','PRESS P OR PAUSE TO CONTINUE');if(game.mode==='over')overlay('GAME OVER','PRESS SPACE OR FIRE TO TRY AGAIN');if(game.mode==='won')overlay('MISSION COMPLETE','PRESS SPACE OR FIRE TO PLAY AGAIN');}
const keymap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'fire',Enter:'fire'};
function clearInput(){for(const k in input)input[k]=false;}
function sync(){document.querySelector('#pause').textContent=game.mode==='paused'?'Resume':'Pause';document.querySelector('#pause').setAttribute('aria-pressed',String(game.mode==='paused'));document.querySelector('#status').textContent=`Room ${game.room+1}. Score ${game.score}. ${game.infiniteLives?'Infinite lives':game.lives+' reserve lives'}. ${game.infiniteShield?'Infinite shield. ':''} ${game.mode}.`;}
function togglePause(){game.pause();sync();}
function toggleSound(){muted=!muted;document.querySelector('#sound').textContent=muted?'Sound off':'Sound on';document.querySelector('#sound').setAttribute('aria-pressed',String(!muted));if(!muted)tone('room');}
window.addEventListener('keydown',e=>{if(!game||roomDialog.open||e.target instanceof HTMLButtonElement||['INPUT','SELECT'].includes(e.target.tagName))return;if(keymap[e.code]){e.preventDefault();input[keymap[e.code]]=true;}if(!e.repeat){if(['KeyP','Escape'].includes(e.code))togglePause();if(e.code==='KeyR'){game.reset();sync();}if(e.code==='KeyM')toggleSound();}});
window.addEventListener('keyup',e=>{if(keymap[e.code]){e.preventDefault();input[keymap[e.code]]=false;}});window.addEventListener('blur',()=>{clearInput();if(game?.mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{last=0;acc=0;if(document.hidden){clearInput();if(game?.mode==='playing')togglePause();}});
for(const [id,property] of [['#infinite-lives','infiniteLives'],['#infinite-shield','infiniteShield']])document.querySelector(id).onchange=e=>{game[property]=e.target.checked;sync();};
document.querySelector('#start').onclick=()=>{game.reset();sync();canvas.focus();};document.querySelector('#pause').onclick=()=>{togglePause();canvas.focus();};document.querySelector('#sound').onclick=()=>{toggleSound();canvas.focus();};document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.screen').requestFullscreen();}catch{}canvas.focus();};
for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[b.dataset.key]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>{input[b.dataset.key]=false;};}
canvas.addEventListener('pointerdown',()=>{canvas.focus();if(game.mode==='title'||game.mode==='over'||game.mode==='won'){game.reset();sync();}});
function updateStartRoom(id){
  game.startRoom=id;
  roomSelect.options[0].textContent=`Room ${id+1}${id===0?' (default)':''}`;
  roomSelect.value='current';
  document.querySelector('#status').textContent=`Start room set to Room ${id+1}.`;
}
function preview(id){
  previewRoom=id;
  const image=document.querySelector('#room-preview');
  image.src=images.rooms[id].src;image.alt=`Preview of Room ${id+1}`;
  document.querySelector('#room-name').textContent=`Room ${id+1}${id===0?' · Default start':''}`;
}
function filterRooms(){
  const query=roomSearch.value.trim().toLowerCase();
  const matches=game.data.rooms.map((_,id)=>id).filter(id=>`room ${id+1}`.includes(query));
  roomList.innerHTML=matches.map(id=>`<option value="${id}">Room ${id+1}</option>`).join('');
  const found=matches.length>0;
  document.querySelector('#room-empty').hidden=found;
  document.querySelector('#room-set').disabled=!found;
  document.querySelector('#room-preview').hidden=!found;
  document.querySelector('#room-name').hidden=!found;
  if(found){const id=matches.includes(previewRoom)?previewRoom:matches[0];roomList.value=String(id);preview(id);}
}
roomSelect.onchange=()=>{
  const action=roomSelect.value;roomSelect.value='current';
  if(action==='reset')updateStartRoom(0);
  if(action==='choose'){
    clearInput();previewRoom=game.startRoom;roomSearch.value='';filterRooms();roomDialog.showModal();roomSearch.focus();
  }
};
roomSearch.oninput=filterRooms;
roomList.onchange=()=>preview(Number(roomList.value));
document.querySelector('#room-close').onclick=()=>roomDialog.close();
document.querySelector('#room-set').onclick=()=>{updateStartRoom(previewRoom);roomDialog.close();};
document.querySelector('#room-reset').onclick=()=>{updateStartRoom(0);roomDialog.close();};
roomDialog.addEventListener('close',()=>{clearInput();roomSelect.focus();});
function frame(time){if(last)acc+=Math.min((time-last)/1000,.1);last=time;while(acc>=1/HZ){if(!roomDialog.open)game.update(input);acc-=1/HZ;}draw();requestAnimationFrame(frame);}
try{const response=await fetch('assets/rooms.json');if(!response.ok)throw Error('Room data is unavailable');const data=await response.json();const [title,sprites,...rooms]=await Promise.all(['title.png','sprites.png',...data.rooms.map((_,i)=>`room-${i}.png`)].map(p=>loadImage(`assets/${p}`)));images={title,sprites,rooms};game=new Game(data,tone);loading.remove();controls.forEach(b=>b.disabled=false);sync();requestAnimationFrame(frame);window.montrix={game,input,draw};}catch(error){loading.textContent=`Couldn't load the game. Reload to retry. (${error.message})`;}

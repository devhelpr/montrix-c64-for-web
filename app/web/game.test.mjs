import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game, actorPose} from './game.mjs';
const data=JSON.parse(readFileSync(new URL('assets/rooms.json',import.meta.url)));
const fresh=()=>{let g=new Game(data);g.reset();return g;};
test('all 60 captured rooms are reachable and sprite references are valid',()=>{assert.equal(data.rooms.length,60);const seen=new Set([0]),queue=[0];for(const i of queue)for(const n of data.rooms[i].links)if(n<60&&!seen.has(n)){seen.add(n);queue.push(n);}assert.equal(seen.size,60);for(const r of data.rooms){assert.equal(r.collision.length,800);for(const a of r.actors)for(const f of a.frames)assert.ok(f>=0&&f<data.spriteCount);}});
test('room identities and every directional link match the original snapshot',()=>{
  const ram=readFileSync(new URL('../evidence/ram.bin',import.meta.url));
  for(const [id,room] of data.rooms.entries()) {
    assert.equal(room.capturedRoom,id,`room ${id} capture identity`);
    const pointer=ram.readUInt16LE(0x2800+id*4);
    assert.deepEqual(room.links,[...ram.subarray(pointer,pointer+4)],`room ${id}: up/down/left/right`);
  }
  // These captures used to drift into the neighbour while recording actors.
  for(const [room,neighbour] of [[8,9],[15,17]]) {
    assert.notDeepEqual(data.rooms[room].collision,data.rooms[neighbour].collision);
    assert.notDeepEqual(readFileSync(new URL(`assets/room-${room}.png`,import.meta.url)),
      readFileSync(new URL(`assets/room-${neighbour}.png`,import.meta.url)));
  }
});
test('every connected room edge can be crossed through its own collision map',()=>{
  const g=fresh();g.keys=new Set(Array.from({length:19},(_,i)=>i+1));
  for(const [id,room] of data.rooms.entries())for(const [direction,next] of room.links.entries()) {
    if(next>=60)continue;
    g.enter(id,84,65);
    const vertical=direction<2;
    const positions=Array.from({length:vertical?295:141},(_,i)=>i+(vertical?1:0));
    const offset=positions.find(n=>!g.blocked(vertical?n:direction===2?0:296,
      vertical?(direction===0?-1:141):n));
    assert.notEqual(offset,undefined,`room ${id} has an opening toward ${next}`);
    g.enter(id,vertical?offset:direction===2?1:295,vertical?(direction===0?0:140):offset);
    g.drift=0;g.coast=0;
    g.update({[['up','down','left','right'][direction]]:true});
    assert.equal(g.room,next,`room ${id} ${['up','down','left','right'][direction]} leads to ${next}`);
  }
});
test('native movement, pause, fire cooldown and reset',()=>{let g=fresh(),x=g.player.x;for(let i=0;i<20;i++)g.update({right:true});assert.equal(g.player.x,x+20);g.pause();const pos={...g.player};for(let i=0;i<20;i++)g.update({right:true,fire:true});assert.deepEqual(g.player,pos);assert.equal(g.shotsFired,0);g.pause();for(let i=0;i<31;i++)g.update({fire:true});assert.equal(g.shotsFired,4);g.reset();assert.equal(g.score,0);assert.equal(g.lives,4);assert.equal(g.room,0);});
test('captured solid tiles block the player and native projectiles',()=>{let g=fresh();let wall=g.data.rooms[0].collision.findIndex(v=>v===128);assert.ok(wall>=0);let x=wall%40*8,y=Math.floor(wall/40)*8;assert.equal(g.solid(x,y),true);assert.equal(g.blocked(x-4,y-5),true);g.bullets=[{x:x-8,y:y+1,vx:8,vy:0,life:5}];g.update();assert.equal(g.bullets.length,0);});
test('captured room links, final exit and absent exits',()=>{let g=fresh();assert.equal(g.transition(0,10,10),false);assert.equal(g.transition(1,84,1),true);assert.equal(g.room,1);assert.equal(g.transition(0,84,139),true);assert.equal(g.room,0);g.enter(59,84,0);assert.equal(g.transition(0,84,139),true);assert.equal(g.mode,'won');});
test('combat awards score and records defeated enemies',()=>{let g=fresh();g.enemies=[{id:'0:test',x:140,y:65,kind:0,phase:0,vx:0,vy:0,hp:1,frames:[0]}];g.bullets=[{x:144,y:75,vx:8,vy:0,life:8}];g.update();assert.equal(g.kills,1);assert.equal(g.score,5);assert.ok(g.cleared.has('0:test'));assert.equal(g.enemies.length,0);});
test('respawn protection, four reserves and game over',()=>{let g=fresh();g.hurt();assert.equal(g.lives,4);for(let i=0;i<4;i++){g.invulnerable=0;g.hurt();assert.equal(g.lives,3-i);assert.equal(g.invulnerable,128);}g.invulnerable=0;g.hurt();assert.equal(g.mode,'over');g.update({fire:true});assert.equal(g.mode,'playing');assert.equal(g.lives,4);});
test('actual first-room exit is traversable with native collision',()=>{let g=fresh();g.enemies=[];for(let i=0;i<65;i++)g.update({right:true});for(let i=0;i<100;i++)g.update({down:true});assert.equal(g.room,1);});
test('stationary original room objects stay fixed instead of receiving generic patrol motion',()=>{
  const g=fresh();g.enter(2,20,20);g.invulnerable=10000;
  const original=g.enemies.map(e=>[e.id,e.x,e.y,e.sprite]);
  assert.equal(original.length,5);
  for(let i=0;i<900;i++)g.update();
  assert.deepEqual(g.enemies.map(e=>[e.id,e.x,e.y,e.sprite]),original);
});
test('capture holds, visibility, sprite expansion and recorded loops survive playback',()=>{
  for(const r of data.rooms)for(const a of r.actors){
    assert.equal(a.poses.reduce((n,[,hold])=>n+hold,0),a.duration);
    for(const [p,hold] of a.poses){assert.ok(Number.isInteger(hold)&&hold>0);assert.ok(p[2]>=0&&p[2]<data.spriteCount);assert.equal(typeof p[3],'boolean');assert.ok([1,2].includes(p[4]));assert.ok([1,2].includes(p[5]));}
    if(a.loopStart!==null){assert.ok(a.loopStart<a.duration);assert.deepEqual(actorPose(a,a.duration),actorPose(a,a.loopStart));}
  }
  const g=fresh();g.enter(10,20,20);g.invulnerable=10000;
  for(let i=0;i<120;i++){g.update();const [body,left,right]=g.enemies;assert.equal(left.x-body.x,-10);assert.equal(right.x-body.x,14);}
});
test('ship coasts, brakes on reversal and turns through original poses without looping at rest',()=>{
  const g=fresh();g.enemies=[];const start=g.player.x;
  g.update({right:true});for(let i=0;i<20;i++)g.update();
  assert.equal(g.player.x,start+17);
  for(let i=0;i<25;i++)g.update();assert.equal(g.turnFrame,0);
  for(let i=0;i<20;i++)g.update({right:true});const x=g.player.x;
  for(let i=0;i<16;i++)g.update({left:true});assert.ok(g.player.x>x);
  for(let i=0;i<16;i++)g.update({left:true});assert.equal(g.direction,1);assert.equal(g.turnFrame,6);
  g.update({up:true});assert.equal(g.direction,1);g.fire();assert.equal(g.bullets.at(-1).vx,-8);
  g.reset();assert.equal(g.turnFrame,0);assert.equal(g.roomTick,0);
});
test('pause freezes the animation clock and every actor pose',()=>{
  const g=fresh();for(let i=0;i<20;i++)g.update();g.pause();
  const before=JSON.stringify([g.tick,g.roomTick,g.enemies,g.turnFrame,g.particles]);
  for(let i=0;i<100;i++)g.update({left:true});
  assert.equal(JSON.stringify([g.tick,g.roomTick,g.enemies,g.turnFrame,g.particles]),before);
});

test('third screen down keeps both multipart doors joined across animation wraps',()=>{
  const g=fresh();g.transition(1,84,1);g.transition(1,84,1);
  assert.equal(g.room,10);g.invulnerable=100000;
  for(let i=0;i<10000;i++) {
    const [top,left,right,bottom,lowerLeft,lowerRight]=g.enemies;
    assert.equal(top.x,left.x+10);assert.equal(top.y,left.y-20);
    assert.equal(bottom.x,lowerLeft.x+10);assert.equal(bottom.y,lowerLeft.y+21);
    assert.equal(right.x,left.x+24);assert.equal(right.y,left.y);
    assert.equal(lowerRight.x,lowerLeft.x+24);assert.equal(lowerRight.y,lowerLeft.y);
    g.update();
  }
  g.enter(10,84,1);
  assert.equal(g.enemies[0].y,g.enemies[1].y-20);
  assert.equal(g.enemies[3].y,g.enemies[4].y+21);
});

test('door piston artwork follows its joined height rather than its independent animation clock',()=>{
  const g=fresh();g.enter(10,84,1);g.invulnerable=100000;
  const seen=new Set();
  for(let t=0;t<1600;t++){
    for(const e of g.enemies.filter(e=>e.attachment)){
      const distances=e.poses.map(([p])=>Math.abs(p[1]-e.y));
      const closest=Math.min(...distances);
      const matching=e.poses.filter(([p])=>Math.abs(p[1]-e.y)===closest);
      assert.ok(matching.some(([p])=>p[2]===e.sprite));
      seen.add(e.sprite);
    }
    g.update();
  }
  assert.ok(seen.size>10,'both stems extend and retract through their masked artwork');
});


test('all 19 original keys unlock exactly the doors with their own ID and persist on room changes',()=>{
  const g=fresh(),keyObjects=data.rooms.flatMap((r,room)=>r.interactions.filter(o=>o.type==='key').map(o=>({...o,room})));
  assert.deepEqual(keyObjects.map(o=>o.key).sort((a,b)=>a-b),Array.from({length:19},(_,i)=>i+1));
  for(const key of keyObjects) {
    g.reset();g.infiniteShield=true;g.enter(key.room,key.x,key.y);g.enemies=[];g.update();
    assert.equal(g.keys.size,1);assert.ok(g.keys.has(key.key));assert.equal(g.removedObjects().filter(o=>o.type==='key').length,1);
    const score=g.score;g.update();assert.equal(g.score,score,'cannot collect twice');
    for(const [room,r] of data.rooms.entries())for(const door of r.interactions.filter(o=>o.type==='door')) {
      g.enter(room,20,20);
      assert.equal(g.solid(door.x+4,door.y+4),door.key!==key.key,`key ${key.key}, door ${door.key} in ${room}`);
    }
    g.enter(key.room,key.x,key.y);assert.ok(g.removedObjects().some(o=>o.type==='key'&&o.key===key.key));
  }
  g.reset();assert.equal(g.keys.size,0);assert.equal(g.collected.size,0);
});
test('locked exits stop the ship until its matching key is collected',()=>{
  const g=fresh();g.enter(1,24,77);g.enemies=[];
  for(let i=0;i<40;i++)g.update({left:true});assert.equal(g.room,1);
  g.keys.add(1);for(let i=0;i<40;i++)g.update({left:true});assert.equal(g.room,1,'wrong key keeps left door locked');
  g.keys.add(2);for(let i=0;i<40&&g.room===1;i++)g.update({left:true});assert.equal(g.room,2);
});
test('every rocket waits for an overhead pass, launches upward, freezes on pause, and can hit the ship',()=>{
  for(const [room,r] of data.rooms.entries())for(const a of r.actors.filter(a=>a.kind===172)) {
    const g=fresh();g.infiniteShield=true;g.enter(room,20,20);const rocket=g.enemies.find(e=>e.rocket&&e.launchX===a.launchX);
    assert.ok(rocket);g.enemies=[rocket];g.update();assert.equal(rocket.launched,false);
    g.player={x:rocket.x,y:rocket.y+12};g.update();assert.equal(rocket.launched,false,'flying below does not launch');
    g.player={x:rocket.x,y:Math.max(0,rocket.y-40)};g.update();assert.equal(rocket.launched,true);const y=rocket.y;
    g.pause();g.update();assert.equal(rocket.y,y);g.pause();g.update();assert.equal(rocket.y,y-2);
    g.infiniteShield=false;g.invulnerable=0;g.player={x:rocket.x,y:rocket.y-2};const lives=g.lives;g.update();assert.equal(g.lives,lives-1);
    g.infiniteShield=true;for(let i=0;i<100;i++)g.update();assert.equal(g.enemies.length,0);
  }
});
test('infinite lives and shield are independent and survive restarts',()=>{
  const g=fresh();g.infiniteLives=true;g.lives=0;g.invulnerable=0;g.hurt();assert.equal(g.mode,'playing');assert.equal(g.lives,0);assert.equal(g.invulnerable,128);
  g.infiniteLives=false;g.infiniteShield=true;g.invulnerable=0;g.player={x:120,y:20};g.hurt();assert.deepEqual(g.player,{x:120,y:20});assert.equal(g.mode,'playing');assert.equal(g.lives,0);
  g.reset();assert.equal(g.infiniteShield,true);assert.equal(g.infiniteLives,false);g.infiniteShield=false;g.invulnerable=0;g.hurt();assert.equal(g.lives,3);
});

test('displayed Room 17 star collects on contact and grants a persistent four-direction volley',()=>{
  const g=fresh();g.enter(16,28,56);g.enemies=[];
  const star=g.interactions.find(o=>o.type==='fourWay');assert.ok(star);
  assert.deepEqual([star.x,star.y,star.w,star.h],[40,56,16,16]);
  g.fire();assert.deepEqual(g.bullets.map(b=>[b.vx,b.vy]),[[8,0]]);
  g.bullets=[];g.cooldown=0;
  g.pause();g.update({right:true});assert.equal(g.fourWay,false);g.pause();
  g.update({right:true});assert.equal(g.fourWay,true);
  assert.ok(g.removedObjects().includes(star));
  g.fire();assert.deepEqual(g.bullets.map(b=>[b.vx,b.vy]),[[8,0],[-8,0],[0,-8],[0,8]]);
  g.fire();assert.equal(g.bullets.length,4,'cooldown applies to the whole volley');
  g.enter(0,84,65);g.invulnerable=0;g.hurt();assert.equal(g.fourWay,true);
  g.enter(16,28,56);assert.ok(g.removedObjects().some(o=>o.type==='fourWay'));
  g.reset();assert.equal(g.fourWay,false);g.enter(16,28,56);
  assert.equal(g.removedObjects().some(o=>o.type==='fourWay'),false);
});

test('chosen rooms start at a clear entrance and respawn there',()=>{
  const g=fresh(), entries=new Map([[0,null]]), queue=[0];
  for(const id of queue)for(const [direction,next] of data.rooms[id].links.entries()) {
    if(next>=0 && next<data.rooms.length && !entries.has(next)) {
      entries.set(next,direction^1);queue.push(next);
    }
  }
  for(let room=1;room<data.rooms.length;room++) {
    g.startRoom=room;g.reset();g.enemies=[];
    assert.equal(g.room,room);
    const {x,y}=g.player,edge=entries.get(room);
    assert.ok([y<=40,y>=100,x<=41,x>=255][edge],`Room ${room+1} starts beside its entry edge`);
    assert.equal(g.blocked(x,y),false,`Room ${room+1} entrance is clear`);
    g.update();assert.equal(g.room,room,'idle ship stays in the chosen room');
    const entrance={...g.spawn};g.player={x:84,y:65};g.invulnerable=0;g.hurt();
    assert.deepEqual(g.player,entrance);
    g.reset();assert.deepEqual(g.player,entrance,'restart uses the same entrance');
  }
  g.startRoom=0;g.reset();assert.deepEqual(g.player,{x:84,y:65});
  g.startRoom=999;g.reset();assert.equal(g.room,0);assert.deepEqual(g.player,{x:84,y:65});
});

test('all snakes follow horizontally, bend their bodies, and keep their tails anchored',()=>{
  for(const room of [17,19,34]) {
    const g=fresh();g.enter(room,20,20);g.infiniteShield=true;
    const {head,parts}=g.snake;
    assert.equal(parts.length,5);assert.equal(g.enemies.some(e=>e.kind===162),false);
    const ys=parts.map(e=>e.y),tailX=parts.at(-1).x,start=head.x;
    for(let i=0;i<100;i++)g.update();
    assert.ok(head.x<start);assert.equal(head.x,head.restX-24);
    assert.ok(head.tilt<0 && Math.abs(head.tilt)<0.18);
    assert.deepEqual(parts.map(e=>e.y),ys);assert.equal(parts.at(-1).x,tailX);
    for(let i=1;i<parts.length;i++)assert.ok(Math.abs(parts[i].x-parts[i-1].x)<24);
    g.player={x:head.restX+24,y:20};
    for(let i=0;i<150;i++)g.update();
    assert.equal(head.x,g.player.x);assert.ok(parts[1].x>parts[1].restX);
    assert.ok(head.tilt>0 && head.tilt<0.18);
    const before=JSON.stringify([parts,g.enemyShots,g.snake.cooldown]);
    g.pause();for(let i=0;i<100;i++)g.update();
    assert.equal(JSON.stringify([parts,g.enemyShots,g.snake.cooldown]),before);
    g.pause();g.enter(0,84,65);assert.equal(g.snake,null);assert.equal(g.enemyShots.length,0);
  }
});
test('snake shots aim at the player, cause damage, and stop when the head dies',()=>{
  const g=fresh();g.enter(17,170,20);g.infiniteShield=true;
  for(let i=0;i<44;i++)g.update();assert.equal(g.enemyShots.length,0);
  g.update();assert.equal(g.enemyShots.length,1);
  const shot=g.enemyShots[0],head=g.snake.head;
  const origin={x:shot.x-shot.vx,y:shot.y-shot.vy};
  assert.equal(origin.x,head.x+12);assert.equal(origin.y,head.y+10);
  const dx=g.player.x+12-origin.x,dy=g.player.y+10-origin.y;
  assert.ok(Math.abs(shot.vx*dy-shot.vy*dx)<1e-8);
  assert.ok(Math.abs(Math.hypot(shot.vx,shot.vy)-2.3)<1e-8);
  g.infiniteShield=false;g.invulnerable=0;
  g.enemyShots=[{x:g.player.x+12-2,y:g.player.y+10,vx:2,vy:0,life:20}];
  const lives=g.lives;g.update();assert.equal(g.lives,lives-1);
  g.infiniteShield=true;head.hp=1;g.snake.cooldown=80;
  g.bullets=[{x:head.x+12-8,y:head.y+10,vx:8,vy:0,life:5}];
  g.update();assert.equal(head.hp,0);
  g.enemyShots=[];for(let i=0;i<200;i++)g.update();assert.equal(g.enemyShots.length,0);
});

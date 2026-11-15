// Native game rules. No CPU, RAM snapshot, VICE, or hardware simulation.
export const HZ = 50.125;
// Pose records retain the original order, holds, coordinates, visibility and
// sprite expansion. Deduplicated atlas IDs are artwork, never animation order.
export function actorPose(actor, age) {
  if (!actor.poses?.length) return null;
  const end=actor.duration;
  let t=Math.max(0, age);
  if (t>=end) {
    if (actor.loopStart !== null) t=actor.loopStart+(t-actor.loopStart)%(end-actor.loopStart);
    else {
      // Nonperiodic reference paths retrace continuously instead of teleporting
      // at the recording boundary. Reactive AI is still an approximation.
      const span=Math.max(1,end-1), phase=t%(span*2);
      t=phase<=span?phase:span*2-phase;
    }
  }
  for (const [pose,hold] of actor.poses) { if(t<hold)return pose; t-=hold; }
  return actor.poses.at(-1)[0];
}
export class Game {
  constructor(data, sound = () => {}) { this.data = data; this.sound = sound; this.mode = 'title'; this.tick = 0; this.best = 0; this.startRoom = 0; this.infiniteLives = false; this.infiniteShield = false; this.reset(); this.mode = 'title'; }
  reset() { this.tick = 0; this.turnFrame = 0; this.drift = 0; this.coast = 0; this.score = 0; this.lives = 4; this.cooldown = 0; this.invulnerable = 64; this.direction = 0; this.fourWay = false; this.shotsFired = 0; this.kills = 0; this.keys = new Set(); this.collected = new Set(); this.visited = new Set(); this.cleared = new Set(); this.particles = []; this.mode = 'playing'; const room = Number.isInteger(this.startRoom) && this.startRoom >= 0 && this.startRoom < this.data.rooms.length ? this.startRoom : 0; this.enter(room, 84, 65); if(room !== 0) this.startAtEntrance(); }
  enter(id, x, y) {
    this.room = id; this.visited.add(id); this.player = {x, y}; this.spawn = {x, y}; this.bullets = []; this.enemyShots = [];
    this.roomTick = 0; this.particles = [];
    this.interactions = this.data.rooms[id].interactions || [];
    this.enemies = this.data.rooms[id].actors.slice(1).map((a, i) => ({...a,
      id: `${id}:${i}`, x: a.x - 24, y: a.y - 51,
      hp: Math.max(1, a.health || 1), phase: 0,
    })).filter(a => a.poses?.some(([p]) => p[3] && p[1] > -21 && p[1] < 160) && !this.cleared.has(a.id));
    for (const e of this.enemies) { this.placeActor(e); if(e.kind===172) {e.rocket=true;e.launched=false;e.x=e.launchX??e.x;e.y=e.launchY??e.y;e.launchX=e.x;e.launchY=e.y;e.sprite=23;e.hp=8;e.visible=true;} }
    this.invulnerable = Math.max(this.invulnerable, 35);
  }
  startAtEntrance() {
    // Follow the room graph from the normal start to identify the entry edge.
    // Actor captures record idle positions, not room entrances.
    const entries = new Map([[0, null]]), queue = [0];
    for(const id of queue) for(const [direction, next] of this.data.rooms[id].links.entries()) {
      if(next >= 0 && next < this.data.rooms.length && !entries.has(next)) {
        entries.set(next, direction ^ 1); queue.push(next);
      }
    }
    const edge = entries.get(this.room);
    if(edge === undefined) return;
    const vertical = edge < 2;
    const offsets = Array.from({length: vertical ? 295 : 140}, (_, i) => i + 1)
      .sort((a,b) => Math.abs(a-(vertical?148:70))-Math.abs(b-(vertical?148:70)));
    const position = (offset, depth) => vertical
      ? {x:offset, y:edge===0?depth:140-depth}
      : {x:edge===2?depth+1:295-depth, y:offset};
    const wall = p => [[4,4],[18,4],[4,10],[18,10]].some(([dx,dy]) => {
      const x=p.x+dx, y=p.y+dy;
      if(this.interactions.some(o => o.type==='door' && x>=o.x && x<o.x+o.w && y>=o.y && y<o.y+o.h)) return false;
      return x>=0 && x<320 && y>=0 && y<160 &&
        this.data.rooms[this.room].collision[Math.floor(y/8)*40+Math.floor(x/8)]===128;
    });
    // Stay in the doorway's opening; step inward past a locked door if needed.
    let openings = offsets.filter(offset => !wall(position(offset,0)));
    for(let depth=1; depth<=40 && openings.length; depth++) {
      openings = openings.filter(offset => !wall(position(offset,depth)));
      const offset = openings.find(offset => {
        const p=position(offset,depth); return !this.blocked(p.x,p.y);
      });
      if(offset === undefined) continue;
      this.player=position(offset,depth); this.spawn={...this.player};
      this.direction=edge===3?1:0; this.turnFrame=this.direction===1?6:0;
      return;
    }
  }
  placeActor(e) {
    if(e.rocket) return;
    // Give both doors a slightly gentler pace, sharing the same clock for
    // their leaves and attached pistons.
    const age=this.room===10 && e.kind>=197 && e.kind<=202
      ? this.roomTick*0.9 : this.roomTick;
    const pose=actorPose(e, age);
    if (!pose) return;
    [e.x,e.y,e.sprite,e.visible,e.scaleX,e.scaleY]=pose;
    // The piston and the two door leaves form one object. The leaves carry
    // the opening/closing motion; keep the piston joined to their inner edge
    // even when its independently captured animation wraps.
    if (e.attachment) {
      const {actor, dx, dy}=e.attachment;
      const anchor=actorPose(this.data.rooms[this.room].actors[actor], age);
      if (anchor) {
        e.x=anchor[0]+dx; e.y=anchor[1]+dy; e.visible=anchor[3];
        // Piston images already contain the original frame-edge masking.
        // Match their image to the joined position, not an independent clock:
        // otherwise a short, masked image jumps along a fully extended stem.
        const matching=e.poses.reduce((best,[p]) =>
          Math.abs(p[1]-e.y)<Math.abs(best[1]-e.y) ? p : best, e.poses[0][0]);
        e.sprite=matching[2]; e.scaleX=matching[4]; e.scaleY=matching[5];
      }
    }
  }
  removedObjects() { return this.interactions.filter(o => o.type==='door' ? this.keys.has(o.key) : this.collected.has(`${this.room}:${o.type==='key'?o.key:o.type}`)); }
  solid(x, y) { if (x < 0 || x >= 320 || y < 0 || y >= 160) return false; if(this.removedObjects().some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h))return false; return this.data.rooms[this.room].collision[Math.floor(y / 8) * 40 + Math.floor(x / 8)] === 128 || this.interactions.some(o=>o.type==='door'&&!this.keys.has(o.key)&&x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h); }
  blocked(x, y) { return [[4,4],[18,4],[4,10],[18,10]].some(([dx,dy]) => this.solid(x+dx, y+dy)); }
  transition(index, x, y) {
    const next = this.data.rooms[this.room].links[index];
    if (next === 60) { this.mode = 'won'; this.best = Math.max(this.best,this.score); this.sound('win'); return true; }
    if (!Number.isInteger(next) || next < 0 || next >= this.data.rooms.length) return false;
    this.enter(next, x, y); this.sound('room'); return true;
  }
  fire() {
    const dirs = [[8,0],[-8,0],[0,-8],[0,8]];
    const volley = this.fourWay ? dirs : [dirs[this.direction]];
    if (this.cooldown || this.bullets.length + volley.length > 8) return;
    for(const [vx,vy] of volley) this.bullets.push({x:this.player.x+12, y:this.player.y+10, vx,vy,life:45});
    this.cooldown = 10; this.shotsFired++; this.sound('fire');
  }
  burst(x,y) { for(let i=0;i<12;i++) this.particles.push({x:x+12,y:y+10,vx:Math.cos(i*2.4)*(1+i%3),vy:Math.sin(i*2.4)*(1+i%3),life:18}); }
  hurt() {
    if (this.infiniteShield || this.invulnerable) return;
    this.burst(this.player.x,this.player.y); this.sound('hit');
    if(!this.infiniteLives && this.lives === 0) {this.mode='over';this.best=Math.max(this.best,this.score);return;}
    if(!this.infiniteLives)this.lives--; this.player={...this.spawn}; this.invulnerable=128; this.enemyShots=[];
  }
  update(input = {}) {
    if(this.mode === 'paused') return;
    this.tick++;
    if(this.mode !== 'playing') {if(input.fire && this.mode !== 'paused') this.reset(); return;}
    this.cooldown=Math.max(0,this.cooldown-1);this.invulnerable=Math.max(0,this.invulnerable-1);
    let dx=Number(!!input.right)-Number(!!input.left),dy=Number(!!input.down)-Number(!!input.up);
    // The original horizontal controller coasts for sixteen updates and
    // brakes before reversing. Vertical input keeps the horizontal facing.
    const wasCoasting=this.coast>0;
    if(dx && (!this.drift || dx===this.drift || !this.coast)) {
      this.drift=dx; this.coast=16; this.direction=dx>0?0:1;
    } else if(this.coast) this.coast--;
    dx=this.coast || dx || wasCoasting ? this.drift : 0;
    if(this.tick%2===0) this.turnFrame+=Math.sign((this.direction===0?0:6)-this.turnFrame);
    const p=this.player;
    if(dx && !this.blocked(p.x+dx,p.y)) p.x+=dx;
    if(dy && !this.blocked(p.x,p.y+dy)) p.y+=dy;
    if(p.y<0) {if(this.transition(0,p.x,139)) return; p.y=0;}
    if(p.y>140) {if(this.transition(1,p.x,1)) return; p.y=140;}
    if(p.x<1) {if(this.transition(2,294,p.y)) return; p.x=1;}
    if(p.x>295) {if(this.transition(3,2,p.y)) return; p.x=295;}
    for(const o of this.interactions) if(o.type==='key' && !this.collected.has(`${this.room}:${o.key}`) && p.x+18>o.x && p.x+4<o.x+o.w && p.y+14>o.y && p.y+3<o.y+o.h) {
      this.keys.add(o.key); this.collected.add(`${this.room}:${o.key}`); this.score=Math.min(999999,this.score+100); this.sound('key');
    }
    for(const o of this.interactions) if(o.type==='fourWay' && !this.collected.has(`${this.room}:${o.type}`) && p.x+18>o.x && p.x+4<o.x+o.w && p.y+14>o.y && p.y+3<o.y+o.h) {
      this.fourWay=true; this.collected.add(`${this.room}:${o.type}`); this.sound('key');
    }
    if(input.fire) this.fire();
    this.roomTick++;
    for(const e of this.enemies) {
      this.placeActor(e);
      if(e.rocket) {
        if(!e.launched && p.y+10<e.launchY && Math.abs(p.x+12-e.x-12)<12) {e.launched=true;this.sound('rocket');}
        if(e.launched) { e.y-=2; if(e.y+21<0) {e.hp=0;continue;} }
      }
      if(e.visible !== false && Math.abs(e.x-p.x)<16 && Math.abs(e.y-p.y)<14) this.hurt();
    }
    for(const b of this.bullets) {
      b.x+=b.vx;b.y+=b.vy;b.life--;
      if(this.solid(b.x,b.y)) b.life=0;
      if(b.life>0) for(const e of this.enemies) if(e.hp>0 && e.visible !== false && Math.abs(b.x-e.x-12)<13 && Math.abs(b.y-e.y-10)<12) {
        b.life=0;e.hp--;if(e.hp===0){this.cleared.add(e.id);this.kills++;this.score=Math.min(999999,this.score+[5,1,20,50,100,1000][(e.kind&31)%6]);this.burst(e.x,e.y);this.sound('kill');}break;
      }
    }
    this.enemies=this.enemies.filter(e=>e.hp>0);
    for(const b of this.enemyShots) {b.x+=b.vx;b.y+=b.vy;b.life--;if(this.solid(b.x,b.y)) b.life=0;if(Math.abs(b.x-p.x-12)<9&&Math.abs(b.y-p.y-10)<8){this.hurt();b.life=0;}}
    const alive=b=>b.life>0&&b.x>=0&&b.x<320&&b.y>=0&&b.y<160;
    this.bullets=this.bullets.filter(alive);this.enemyShots=this.enemyShots.filter(alive);
    for(const q of this.particles){q.x+=q.vx;q.y+=q.vy;q.life--;}
    this.particles=this.particles.filter(q=>q.life>0);
  }
  pause() {if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';}
}

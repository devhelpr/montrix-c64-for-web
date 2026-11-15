import {referenceInteractions} from './reference-interactions.mjs';
import {mkdir,cp,readFile,stat,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const data=JSON.parse(await readFile(path.join(root,'web/assets/rooms.json'),'utf8'));
const referenceRam=await readFile(path.join(root,'evidence/ram.bin'));
for(const [room,record] of data.rooms.entries()) {
  record.interactions=referenceInteractions(referenceRam,room);
  // The star in displayed Room 17 is character artwork (tiles 129–132),
  // not a sprite or a key in the drawing-command stream.
  if(room===16) {
    const tile=record.collision.findIndex((v,i)=>v===129 && record.collision[i+1]===130 && record.collision[i+40]===131 && record.collision[i+41]===132);
    if(tile<0)throw Error('Room 17 weapon pickup is missing');
    record.interactions.push({type:'fourWay',x:tile%40*8,y:Math.floor(tile/40)*8,w:16,h:16});
  }
  const pointer=referenceRam.readUInt16LE(0x2800+room*4), high=referenceRam[pointer+4];
  for(const [slot,actor] of record.actors.entries())if(actor.kind===172) {
    actor.launchX=referenceRam[pointer+6+(slot-1)*3]+((high&(1<<slot))?256:0)-24;
    actor.launchY=referenceRam[pointer+7+(slot-1)*3]-51;
  }
}
await writeFile(path.join(root,'web/assets/rooms.json'),JSON.stringify(data));
if(data.rooms.length!==60)throw Error('Expected all 60 rooms');
for(const [i,r] of data.rooms.entries()){if(r.collision.length!==800||r.links.length!==4)throw Error(`Invalid room ${i}`);await stat(path.join(root,`web/assets/room-${i}.png`));}
await mkdir(path.join(root,'dist'),{recursive:true});
for(const f of ['index.html','style.css','main.mjs','game.mjs','assets'])await cp(path.join(root,'web',f),path.join(root,'dist',f),{recursive:true});
// Also make the entry point a single offline file: open it directly in a browser.
let html=await readFile(path.join(root,'web/index.html'),'utf8');
const css=await readFile(path.join(root,'web/style.css'),'utf8');
let rules=(await readFile(path.join(root,'web/game.mjs'),'utf8')).replaceAll('export ','');
let main=(await readFile(path.join(root,'web/main.mjs'),'utf8')).replace("import {Game, HZ} from './game.mjs';",'');
const assets={};
for(const name of ['title.png','sprites.png',...data.rooms.map((_,i)=>`room-${i}.png`)]) assets[name]='data:image/png;base64,'+(await readFile(path.join(root,'web/assets',name))).toString('base64');
main=main.replace("const response=await fetch('assets/rooms.json');if(!response.ok)throw Error('Room data is unavailable');const data=await response.json();",'const data=embeddedData;');
main=main.replace('im.src=src;',"im.src=embeddedAssets[src.replace('assets/','')];");
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="main.mjs"></script>',`<script>(async()=>{const embeddedData=${JSON.stringify(data)};const embeddedAssets=${JSON.stringify(assets)};${rules}\n${main}})();</script>`);
await writeFile(path.join(root,'dist/index.html'),html);
await writeFile(path.join(root,'index.html'),html);
console.log('Built standalone web game in app/dist — 60 rooms; no simulator or runtime dependencies.');

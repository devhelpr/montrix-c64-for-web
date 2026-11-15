// Build-time decoding of the original room drawing commands. $3e doors and
// $3f keys share the explicit index stored in the fourth command byte ($b700).
// High-bit commands repeat coordinates until the high bit on the final X.
// The browser receives only the decoded objects, never the reference RAM.
export function referenceInteractions(ram, room) {
  const start=ram.readUInt16LE(0x2802+room*4), objects=[];
  let offset=0, repeat=false, type=0;
  for(let count=0;count<256;count++) {
    if(ram[start+offset]===255 && ram[start+offset+1]===255)return objects;
    if(!repeat) {const command=ram[start+offset++];type=command&63;repeat=!!(command&128);}
    const x=ram[start+offset++],y=ram[start+offset++];
    if(type===62||type===63)objects.push({type:type===63?'key':'door',key:ram[start+offset++],x:(x&127)*8,y:y*8,w:16,h:type===63?16:32});
    if(x&128)repeat=false;
  }
  throw Error(`Unterminated reference room ${room}`);
}

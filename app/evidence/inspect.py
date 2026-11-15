import struct,zlib,pathlib,sys
m=pathlib.Path('app/evidence/ram.bin').read_bytes()
# Standard MOS 6502 opcode table, for offline inspection only.
rows=['BRK:imp ORA:ix ? ? ? ORA:zp ASL:zp ? PHP:imp ORA:im ASL:acc ? ? ORA:ab ASL:ab ?', 'BPL:rel ORA:iy ? ? ? ORA:zx ASL:zx ? CLC:imp ORA:ay ? ? ? ORA:ax ASL:ax ?', 'JSR:ab AND:ix ? ? BIT:zp AND:zp ROL:zp ? PLP:imp AND:im ROL:acc ? BIT:ab AND:ab ROL:ab ?', 'BMI:rel AND:iy ? ? ? AND:zx ROL:zx ? SEC:imp AND:ay ? ? ? AND:ax ROL:ax ?', 'RTI:imp EOR:ix ? ? ? EOR:zp LSR:zp ? PHA:imp EOR:im LSR:acc ? JMP:ab EOR:ab LSR:ab ?', 'BVC:rel EOR:iy ? ? ? EOR:zx LSR:zx ? CLI:imp EOR:ay ? ? ? EOR:ax LSR:ax ?', 'RTS:imp ADC:ix ? ? ? ADC:zp ROR:zp ? PLA:imp ADC:im ROR:acc ? JMP:ind ADC:ab ROR:ab ?', 'BVS:rel ADC:iy ? ? ? ADC:zx ROR:zx ? SEI:imp ADC:ay ? ? ? ADC:ax ROR:ax ?', '? STA:ix ? ? STY:zp STA:zp STX:zp ? DEY:imp ? TXA:imp ? STY:ab STA:ab STX:ab ?', 'BCC:rel STA:iy ? ? STY:zx STA:zx STX:zy ? TYA:imp STA:ay TXS:imp ? ? STA:ax ? ?', 'LDY:im LDA:ix LDX:im ? LDY:zp LDA:zp LDX:zp ? TAY:imp LDA:im TAX:imp ? LDY:ab LDA:ab LDX:ab ?', 'BCS:rel LDA:iy ? ? LDY:zx LDA:zx LDX:zy ? CLV:imp LDA:ay TSX:imp ? LDY:ax LDA:ax LDX:ay ?', 'CPY:im CMP:ix ? ? CPY:zp CMP:zp DEC:zp ? INY:imp CMP:im DEX:imp ? CPY:ab CMP:ab DEC:ab ?', 'BNE:rel CMP:iy ? ? ? CMP:zx DEC:zx ? CLD:imp CMP:ay ? ? ? CMP:ax DEC:ax ?', 'CPX:im SBC:ix ? ? CPX:zp SBC:zp INC:zp ? INX:imp SBC:im NOP:imp ? CPX:ab SBC:ab INC:ab ?', 'BEQ:rel SBC:iy ? ? ? SBC:zx INC:zx ? SED:imp SBC:ay ? ? ? SBC:ax INC:ax ?']
ops=[v for row in rows for v in row.split()]
def dis(start,end):
 p=start
 while p<end:
  a=p; item=ops[m[p]]; p+=1
  if item=='?': print(f'{a:04x}  .byte ${m[a]:02x}'); continue
  op,mode=item.split(':'); n=0 if mode in ['imp','acc'] else 2 if mode in ['ab','ax','ay','ind'] else 1
  v=int.from_bytes(m[p:p+n],'little'); p+=n
  arg='' if n==0 else f'${v:04x}' if n==2 else f'${v:02x}'
  if mode=='im': arg='#'+arg
  if mode=='rel': arg=f'${(p+(v if v<128 else v-256))&65535:04x}'
  if mode in ['ix','iy','ind']: arg='('+arg+(' ,X)' if mode=='ix' else '),Y' if mode=='iy' else ')')
  if mode in ['ax','zx']: arg+=',X'
  if mode in ['ay','zy']: arg+=',Y'
  print(f'{a:04x}  {op} {arg}')
def png(path,w,h,pix):
 def ch(t,d): return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 pathlib.Path(path).write_bytes(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+ch(b'IDAT',zlib.compress(b''.join(b'\0'+bytes(pix[y*w*3:(y+1)*w*3]) for y in range(h))))+ch(b'IEND',b''))
if __name__=='__main__': dis(int(sys.argv[1],16),int(sys.argv[2],16))

import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url)),port=Number(process.env.PORT||5173);
const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.json':'application/json','.png':'image/png'};
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);if(!file.startsWith(root)){res.writeHead(403);res.end();return;}const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Montrix: http://127.0.0.1:${port}`));

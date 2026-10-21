import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat, realpath } from 'node:fs/promises';
import { watch } from 'node:fs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const preview=process.argv.includes('--dist');
const publicRoot=path.join(root,preview?'dist':'site');
const port=Number(process.env.PORT||(preview?4173:5173));
const hostname=process.env.HOST||'0.0.0.0';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.web3forms.com; form-action 'self' https://api.web3forms.com; frame-ancestors 'none'; base-uri 'self'";
const clients=new Set();
const baseReal=await realpath(publicRoot);
function inside(base,file){const rel=path.relative(base,file);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));}
function networkAddresses(){const result=[];const seen=new Set();for(const [name,entries] of Object.entries(os.networkInterfaces()))for(const e of entries||[]){if((e.family==='IPv4'||e.family===4)&&!e.internal&&!e.address.startsWith('169.254.')&&!seen.has(e.address)){seen.add(e.address);result.push({name,address:e.address});}}const virtual=/virtual|docker|wsl|vpn|tailscale|vethernet/i;return result.sort((a,b)=>Number(virtual.test(a.name))-Number(virtual.test(b.name)));}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',csp);
  try{
    const url=new URL(req.url||'/','http://local');
    if(url.pathname==='/__events'&&!preview){res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive'});res.write('data: ready\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
    if(url.pathname==='/__live.js'&&!preview){res.setHeader('Content-Type','text/javascript');res.end("const e=new EventSource('/__events');e.onmessage=x=>{if(x.data==='reload')location.reload();};");return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
    let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end('Invalid path');return;}
    if(decoded.includes('\\0')||decoded.includes('\\')||decoded.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    let filename=path.resolve(publicRoot,'.'+decoded);
    if(!inside(publicRoot,filename)){res.writeHead(403);res.end('Forbidden');return;}
    let entry=await stat(filename).catch(()=>null);
    if(entry?.isDirectory())filename=path.join(filename,'index.html');else if(!entry&&!path.extname(filename))filename+='.html';
    try{
      const real=await realpath(filename);if(!inside(baseReal,real))throw new Error('Outside root');
      let data=await readFile(real);if(real.endsWith('.html')&&!preview)data=Buffer.from(data.toString().replace(/<\/body>/i,'<script src="/__live.js" defer></script></body>'));
      res.statusCode=200;res.setHeader('Content-Type',mime[path.extname(real).toLowerCase()]||'application/octet-stream');res.setHeader('Content-Length',data.length);res.end(req.method==='HEAD'?undefined:data);
    }catch{
      const file=await readFile(path.join(publicRoot,'404.html')).catch(()=>Buffer.from('Not found'));res.statusCode=404;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.method==='HEAD'?undefined:file);
    }
  }catch(err){if(!res.writableEnded){res.statusCode=500;res.end('Unable to complete request.');}console.error(err.message);}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use.`:e.message);process.exit(1);});
server.listen(port,hostname,()=>{console.log('\nPAT\'S DONUTS / DELIVERY SITE\n');console.log(`Home:     http://localhost:${port}/`);console.log(`Delivery: http://localhost:${port}/delivery/`);if(hostname==='0.0.0.0'||hostname==='::')for(const x of networkAddresses())console.log(`Network:  http://${x.address}:${port}/  (${x.name})`);console.log(`\nServing: ${publicRoot}`);console.log('Web3Forms key: site/assets/delivery.js\nCtrl+C stops the server.\n');});
if(!preview){try{let timer;watch(publicRoot,{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(()=>{for(const c of clients)if(!c.writableEnded)c.write('data: reload\n\n');},160);});}catch{console.log('Auto reload unavailable; refresh after saving.');}}
process.on('SIGINT',()=>{for(const c of clients)c.end();server.close(()=>process.exit(0));});

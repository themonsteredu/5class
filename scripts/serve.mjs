import http from 'node:http';import path from 'node:path';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const root=process.cwd();const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff':'font/woff','.json':'application/json'};
// /api/gemini는 Vercel 함수와 같은 파일을 불러 실행합니다. 제미나이 키는 GEMINI_API_KEY 환경 변수로 넣습니다.
async function api(req,res,url){
 const {default:fn}=await import(pathToFileURL(path.join(root,'api/gemini.js')).href);
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const headers=Object.fromEntries(Object.entries(req.headers).map(([k,v])=>[k,Array.isArray(v)?v.join(', '):String(v)]));
 const response=await fn.fetch(new Request(new URL(url.pathname,`http://${req.headers.host||'localhost'}`),{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}));
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/gemini')return await api(req,res,url);const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);}catch{if(!res.headersSent){res.writeHead(404);res.end('Not found');}}}).listen(5175,'0.0.0.0',()=>console.log('5class http://localhost:5175'));

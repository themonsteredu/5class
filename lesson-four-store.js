// 4차시 기록(모둠 분류, 로봇 모둠 배정, 로봇이 배운 문장)을 3차시 문장판 저장 함수에 함께 보관합니다.
// 수업코드 앞에 r을 붙인 별도 방을 쓰므로 3차시 문장판에는 섞이지 않습니다.
const API='https://awjndrxyyqyngybulyor.supabase.co/rest/v1/rpc/';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3am5kcnh5eXF5bmd5YnVseW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTEwMTUsImV4cCI6MjA5OTg4NzAxNX0.9G8aCw9jG8eSmeUaLOSiD0Fl34GpOD44XVOqTwCMWa4';
const STORE='moakit-5class-l3';
// 분류 결과를 300자 안에 담기 위해 유물마다 한 글자 번호를 씁니다. 순서를 바꾸지 않습니다.
const codeIds=['susan','dancers','guests','kitchen','spoon','house','armor','figurines','gold-crown','belt','pagoda','buddha','seosan','glass','ingot','tombs','star','burner','tomb','mural','crown'];
const nationNames=['고구려','백제','신라','가야'];

export function loadSession(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return {code:/^[0-9a-z]{4,12}$/.test(v.code||'')?v.code:'',group:Number.isInteger(v.group)&&v.group>=0&&v.group<=6?v.group:null,author:/^[a-f0-9]{64}$/.test(v.author||'')?v.author:''};}catch{return {code:'',group:null,author:''};}}
export function saveSession(value){try{localStorage.setItem(STORE,JSON.stringify(value));}catch{}}
export function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function rpc(name,body){
 let response;
 try{response=await fetch(API+name,{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',apikey:KEY,Authorization:`Bearer ${KEY}`},body:JSON.stringify(body)});}
 catch{throw Error('인터넷 연결이 느려요. 잠시 뒤 ‘다시 불러오기’를 눌러 주세요.');}
 if(!response.ok)throw Error('저장 공간에 연결하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
 const value=await response.json();
 if(value&&value.error)throw Error(value.error);
 return value;
}

export const roomOf=code=>code.length<12?`r${code}`:`r${code.slice(1)}`;
export function encodeBins(bins){return JSON.stringify(bins.map(b=>[b.name,b.items.map(id=>codeIds.indexOf(id)).filter(i=>i>=0).map(i=>i.toString(36)).join('')]));}
export function decodeBins(text){try{return JSON.parse(text).map(([name,items])=>({name:String(name),items:[...String(items)].map(c=>codeIds[parseInt(c,36)]).filter(Boolean)}));}catch{return [];}}

// 같은 모둠이 여러 번 저장하면 마지막 저장을 씁니다.
const last=(rows,match)=>{const out={};for(const r of rows)if(match(r))out[r.group]=r;return Object.values(out);};
export function readRoom(rows){
 const sorts=last(rows,r=>r.artifact==='S').map(r=>({group:r.group,criterion:r.sentence,bins:decodeBins(r.original),id:r.id,mine:r.mine}));
 const teams=last(rows,r=>/^T\|/.test(r.artifact)).map(r=>({group:r.group,nation:r.artifact.slice(2)})).filter(t=>nationNames.includes(t.nation));
 const facts=rows.filter(r=>/^R\|/.test(r.artifact)).map(r=>{const [,nation,artifact,flag]=r.artifact.split('|');return {id:r.id,nation,robot:r.group,group:flag==='t'?0:r.group,artifact:artifact||'',sentence:r.sentence,original:r.original||'',status:r.status,source:r.source||'',mine:r.mine};}).filter(f=>nationNames.includes(f.nation));
 return {sorts,teams,facts};
}
export async function loadRoom(code,author){const v=await rpc('class5_list',{p_code:roomOf(code),p_author:author});return {rows:Array.isArray(v.sentences)?v.sentences:[],...readRoom(Array.isArray(v.sentences)?v.sentences:[])};}
const add=(code,author,group,artifact,sentence,status,original='',source='')=>rpc('class5_add',{p_code:roomOf(code),p_group:group,p_artifact:artifact,p_sentence:sentence,p_source:source,p_status:status,p_author:author,p_original:original});
async function removeOwn(code,author,rows){for(const r of rows)try{await rpc('class5_remove',{p_code:roomOf(code),p_id:r.id,p_author:author});}catch{}}

export async function saveSort(code,author,group,criterion,bins,rows){
 await add(code,author,group,'S',criterion,'고친 문장',encodeBins(bins));
 await removeOwn(code,author,rows.filter(r=>r.artifact==='S'&&r.group===group&&r.mine));
}
export async function setTeam(code,author,group,nation,rows){
 await add(code,author,group,`T|${nation}`,'로봇 모둠 배정','사실 확인');
 await removeOwn(code,author,rows.filter(r=>/^T\|/.test(r.artifact)&&r.group===group&&r.mine));
}
// 문장은 배우는 로봇(모둠) 칸에 저장합니다. 선생님 문장은 t 표시로 구분합니다.
export function teach(code,author,group,fact){
 return add(code,author,fact.robot||group||1,`R|${fact.nation}|${fact.artifact||''}|${group?'':'t'}`,fact.sentence,fact.status,fact.status==='고친 문장'?fact.original:'',fact.source||'');
}
export function forget(code,author,id){return rpc('class5_remove',{p_code:roomOf(code),p_id:id,p_author:author});}

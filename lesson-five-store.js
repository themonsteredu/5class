// 5차시 기록: 로봇 프로필(P), 로봇 디자인(D), 더 가르친 문장(R|나라|유물|n), 로봇 그림.
// 모두 3차시 문장판 저장 함수(class5_add/list/remove)를 빌려 씁니다. 새 저장 공간을 만들지 않습니다.
// 로봇 그림은 작게 줄인 사진을 글자(base64)로 바꾼 뒤, 그림마다 새로 만든 방에 700자씩 나눠 저장합니다.
// 한 줄에 sentence 300자 + original 300자 + source 100자가 들어가고, 한 방은 모둠 칸 1~6에 40줄씩(240줄)까지 씁니다.
import {rpc,roomOf} from './lesson-four-store.js';

export const personalities=['씩씩한','친절한','수줍은','장난꾸러기','똑똑한','느긋한'];
export const catchphrases=['삐빅!','철컹!','뚝딱!','반짝!'];
// 성격마다 기기 목소리의 높낮이와 빠르기를 바꿉니다.
export const voices={'씩씩한':{pitch:1.15,rate:1.1},'친절한':{pitch:1.3,rate:1},'수줍은':{pitch:1.6,rate:0.9},'장난꾸러기':{pitch:1.8,rate:1.2},'똑똑한':{pitch:1,rate:1},'느긋한':{pitch:0.9,rate:0.85}};
export const parts=['머리','얼굴','몸통','팔','다리','장식','들고 있는 것'];
export const backgrounds=['#f4e7c5','#dbe9d3','#d8e4f2','#f2dcd8','#e6dcf2','#eeeeea'];
export const limits={name:12,personality:12,catchphrase:12,intro:60,evidence:40,stickers:3,source:100};
const ROW=700,ROWS=240,ROOM=/^p[a-z0-9]{11}$/;
export const maxImageChars=ROW*ROWS;

const clip=(value,size)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,size).trim();
const json=text=>{try{const v=JSON.parse(text||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}};
const artifactId=value=>/^[a-z][a-z-]{1,15}$/.test(String(value||''))?String(value):'';

export function encodeProfile(profile){
 return {name:clip(profile.name,limits.name),raw:JSON.stringify({p:clip(profile.personality,limits.personality),t:clip(profile.catchphrase,limits.catchphrase),i:clip(profile.intro,limits.intro),f:artifactId(profile.favorite)})};
}
export function decodeProfile(row){
 if(!row)return null;
 const v=json(row.raw);
 return {name:clip(row.name,limits.name),personality:clip(v.p,limits.personality),catchphrase:clip(v.t,limits.catchphrase),intro:clip(v.i,limits.intro),favorite:artifactId(v.f)};
}
// 꾸미기는 300자 안에 담습니다. 넘치면 근거 글을 조금씩 줄입니다.
export function encodeDesign(design){
 let stickers=(design.stickers||[]).map(s=>({part:parts.includes(s?.part)?s.part:parts[0],artifact:artifactId(s?.artifact),evidence:clip(s?.evidence,limits.evidence)})).filter(s=>s.artifact||s.evidence).slice(0,limits.stickers);
 const pack=()=>JSON.stringify({b:Math.max(0,backgrounds.indexOf(design.background)),s:stickers.map(s=>[parts.indexOf(s.part),s.artifact,s.evidence])});
 let raw=pack();
 while(raw.length>300&&stickers.some(s=>s.evidence)){stickers=stickers.map(s=>({...s,evidence:s.evidence.slice(0,Math.max(0,s.evidence.length-5))}));raw=pack();}
 return raw;
}
export function decodeDesign(row){
 if(!row)return null;
 const v=json(row.raw);
 return {image:ROOM.test(row.image||'')?row.image:'',background:backgrounds[Number.isInteger(v.b)?v.b:0]||backgrounds[0],stickers:(Array.isArray(v.s)?v.s:[]).slice(0,limits.stickers).map(s=>Array.isArray(s)?{part:parts[s[0]]||parts[0],artifact:artifactId(s[1]),evidence:clip(s[2],limits.evidence)}:null).filter(Boolean)};
}

// 그림 사진(data URL) ↔ 저장 줄
export function newImageRoom(){const abc='abcdefghijklmnopqrstuvwxyz0123456789';return 'p'+Array.from(crypto.getRandomValues(new Uint8Array(11)),b=>abc[b%36]).join('');}
export function splitImage(dataUrl){
 const m=/^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/]+=*)$/.exec(String(dataUrl||''));
 if(!m)throw Error('그림을 읽지 못했어요. 다른 사진으로 해 보세요.');
 const [,mime,b64]=m,total=Math.ceil(b64.length/ROW);
 if(total>ROWS)throw Error('그림이 너무 커요. 사진을 조금 더 확대해서 다시 저장해 보세요.');
 return Array.from({length:total},(_,index)=>{const part=b64.slice(index*ROW,(index+1)*ROW);return {index,total,mime,sentence:part.slice(0,300),original:part.slice(300,600),source:part.slice(600)};});
}
export function joinImage(rows){
 const pieces=new Map();let total=0,mime='';
 for(const r of rows||[]){
  const m=/^I\|(\d+)\|(\d+)\|(webp|jpeg|png)$/.exec(r.artifact||'');if(!m)continue;
  const i=+m[1],n=+m[2];if(!n||n>ROWS||i>=n)continue;
  if(total&&(n!==total||m[3]!==mime))continue;
  total=n;mime=m[3];pieces.set(i,(r.sentence||'')+(r.original||'')+(r.source||''));
 }
 if(!total||pieces.size!==total)return '';
 const b64=Array.from({length:total},(_,i)=>pieces.get(i)).join('');
 return /^[A-Za-z0-9+/]+=*$/.test(b64)?`data:image/${mime};base64,${b64}`:'';
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function uploadImage(author,dataUrl,onProgress=()=>{}){
 const room=newImageRoom(),rows=splitImage(dataUrl),queue=[...rows];let done=0;
 async function send(row){
  for(let attempt=0;;attempt++){
   try{await rpc('class5_add',{p_code:room,p_group:1+row.index%6,p_artifact:`I|${row.index}|${row.total}|${row.mime}`,p_sentence:row.sentence,p_source:row.source,p_status:row.original?'고친 문장':'사실 확인',p_author:author,p_original:row.original});break;}
   catch(err){if(attempt>=2)throw err;await wait(600*(attempt+1));}
  }
  onProgress(++done,rows.length);
 }
 await Promise.all(Array.from({length:6},async()=>{while(queue.length)await send(queue.shift());}));
 return room;
}
export async function loadImage(author,room){
 if(!ROOM.test(room||''))return '';
 const v=await rpc('class5_list',{p_code:room,p_author:author});
 return joinImage(Array.isArray(v.sentences)?v.sentences:[]);
}

const add=(code,author,group,artifact,sentence,original,source='')=>rpc('class5_add',{p_code:roomOf(code),p_group:group,p_artifact:artifact,p_sentence:sentence,p_source:source,p_status:original?'고친 문장':'사실 확인',p_author:author,p_original:original});
// 새로 저장한 뒤 이 태블릿이 올렸던 예전 것은 지웁니다. 다른 태블릿 것은 남아도 마지막 저장만 씁니다.
async function replace(code,author,group,artifact,sentence,original,rows){
 await add(code,author,group,artifact,sentence,original);
 for(const r of rows.filter(r=>r.artifact===artifact&&r.group===group&&r.mine))try{await rpc('class5_remove',{p_code:roomOf(code),p_id:r.id,p_author:author});}catch{}
}
export function saveProfile(code,author,group,profile,rows){const {name,raw}=encodeProfile(profile);return replace(code,author,group,'P',name||`${group}모둠 로봇`,raw,rows);}
export function saveDesign(code,author,group,image,design,rows){return replace(code,author,group,'D',ROOM.test(image||'')?image:'-',encodeDesign(design),rows);}
export function teachMore(code,author,group,fact){
 return rpc('class5_add',{p_code:roomOf(code),p_group:group,p_artifact:`R|${fact.nation}|${fact.artifact}|n`,p_sentence:fact.sentence,p_source:clip(fact.source,limits.source),p_status:fact.status,p_author:author,p_original:fact.status==='고친 문장'?fact.original:''});
}

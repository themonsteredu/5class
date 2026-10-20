// 박물관 전용 방: 학습 문장과 분리. 기존 수업코드 RPC의 용량/작성자 규칙을 유지합니다.
import {rpc} from './lesson-four-store.js';
import {decode,validConfig} from './museum-model.js';
export async function museumRoom(code,suffix='config'){
 const bytes=new TextEncoder().encode(`class5-museum-v1:${code}:${suffix}`);
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return 'm'+[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,11);
}
export async function listMuseum(code,author,suffix='config'){
 const room=await museumRoom(code,suffix),result=await rpc('class5_list',{p_code:room,p_author:author});
 return Array.isArray(result.sentences)?result.sentences:[];
}
export function readConfig(rows){return validConfig(decode([...rows].reverse().find(r=>r.artifact==='C')?.sentence));}
export async function writeMuseum(code,author,suffix,group,key,sentence,original='',replace=true){
 if(sentence.length>300||original.length>300)throw Error('기록이 너무 길어요. 짧게 다시 적어 주세요.');
 const room=await museumRoom(code,suffix);
 // 먼저 저장 성공을 확인한 뒤 자신의 이전 기록만 제거합니다.
 const previous=replace?await listMuseum(code,author,suffix):[];
 const result=await rpc('class5_add',{p_code:room,p_group:group,p_artifact:key,p_sentence:sentence,p_original:original,p_source:'museum-v1',p_status:original?'고친 문장':'사실 확인',p_author:author});
 for(const row of previous.filter(r=>r.group===group&&r.artifact===key&&r.mine)){
  try{await rpc('class5_remove',{p_code:room,p_id:row.id,p_author:author});}catch{}
 }
 return result;
}
export const saveConfig=(session,config)=>writeMuseum(session.code,session.author,'config',1,'C',JSON.stringify(config));

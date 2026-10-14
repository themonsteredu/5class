// 4차시 '제미나이로 확인하기'에서 선생님 화면이 부르는 서버 기능입니다(Vercel 함수, 주소 /api/gemini).
// 제미나이 API 키는 Vercel 환경 변수 GEMINI_API_KEY에만 두고 브라우저에는 보내지 않습니다.
// 요청문은 화면과 같은 gemini-prompt.js로 서버에서 다시 만들므로, 아무 글이나 제미나이에게 보낼 수는 없습니다.
import {cleanRequest,sectionsFor,promptText,schemaFor,readReply} from '../gemini-prompt.js';

const API='https://generativelanguage.googleapis.com/v1beta/models/';
// 앞의 모델이 없어졌거나(404) 무료 사용량이 찼으면(429) 다음 모델로 넘어갑니다. GEMINI_MODEL로 맨 앞 모델을 바꿀 수 있습니다.
// flash-lite는 무료 사용량이 넉넉하고 빨라서 앞에 둡니다. 마지막 이름은 구글이 늘 최신 flash-lite로 이어 주는 별명입니다.
export const defaultModels=['gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-3.8-flash','gemini-flash-lite-latest'];
const validModel=name=>/^[a-z0-9][a-z0-9.-]{2,60}$/.test(name||'');
// flash-lite는 생각을 가장 적게(minimal), 나머지 flash는 minimal을 받지 않아 low로 둡니다.
export const thinkingFor=model=>/flash-lite/.test(model)?'minimal':'low';
const WINDOW=10*60*1000,PER_IP=40,PER_SERVER=150,MAX_BODY=20000;

class GeminiError extends Error{constructor(message,status,code){super(message);this.status=status;this.code=code;}}
const json=(status,value)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});

export function geminiBody(request,model,{thinking=true}={}){
 const generationConfig={maxOutputTokens:request.mode==='check'?4096:1024,responseMimeType:'application/json',responseJsonSchema:schemaFor(request.mode)};
 if(thinking)generationConfig.thinkingConfig={thinkingLevel:thinkingFor(model)};
 return {contents:[{role:'user',parts:[{text:promptText(sectionsFor(request))}]}],generationConfig};
}
// 제미나이의 대답에서 생각 과정을 빼고 JSON만 꺼냅니다.
export function readGemini(data){
 if(data?.promptFeedback?.blockReason)throw new GeminiError('제미나이가 이 내용에는 대답하지 않았어요. 문장을 조금 바꿔 다시 해 보세요.',422,'blocked');
 const candidate=data?.candidates?.[0];
 const text=(candidate?.content?.parts||[]).filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('').trim();
 if(!text){
  if(['SAFETY','BLOCKLIST','PROHIBITED_CONTENT','SPII','RECITATION'].includes(candidate?.finishReason))throw new GeminiError('제미나이가 이 내용에는 대답하지 않았어요. 문장을 조금 바꿔 다시 해 보세요.',422,'blocked');
  throw new GeminiError('제미나이가 빈 대답을 보냈어요. 다시 눌러 주세요.',502,'empty');
 }
 try{return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,''));}
 catch{throw new GeminiError(candidate?.finishReason==='MAX_TOKENS'?'제미나이 대답이 너무 길어 잘렸어요. 다시 눌러 주세요.':'제미나이 대답을 읽지 못했어요. 다시 눌러 주세요.',502,'unreadable');}
}
function upstreamError(status,data){
 const message=String(data?.error?.message||''),reason=JSON.stringify(data?.error?.details||'');
 if(/API_KEY_INVALID|API key not valid/i.test(reason+message))return new GeminiError('제미나이 API 키가 맞지 않아요. 선생님이 Vercel에 넣은 키를 다시 확인해 주세요.',502,'bad-key');
 if(status===403)return new GeminiError('이 API 키로는 제미나이를 쓸 수 없어요. Google AI Studio에서 키를 다시 만들어 주세요.',502,'bad-key');
 if(status===429)return new GeminiError('제미나이 무료 사용량이 잠깐 넘쳤어요. 1분쯤 뒤에 다시 눌러 주세요.',429,'quota');
 if(status===404)return new GeminiError('제미나이 모델을 찾지 못했어요.',502,'model');
 if(status===400&&/location is not supported/i.test(message))return new GeminiError('지금 위치에서는 제미나이 API를 쓸 수 없다고 해요.',502,'region');
 if(status===400)return new GeminiError('제미나이가 요청을 받지 않았어요. 잠시 뒤 다시 눌러 주세요.',502,'invalid');
 return new GeminiError('제미나이가 지금 바빠요. 잠시 뒤 다시 눌러 주세요.',502,'busy');
}

export function createHandler({env=process.env,fetchImpl=(...a)=>fetch(...a),now=()=>Date.now()}={}){
 const seen=new Map(),retired=new Set();
 function allowed(ip){
  const t=now(),keep=list=>list.filter(x=>t-x<WINDOW);
  const mine=keep(seen.get(ip)||[]),all=keep(seen.get('*')||[]);
  if(mine.length>=PER_IP||all.length>=PER_SERVER)return false;
  seen.set(ip,[...mine,t]);seen.set('*',[...all,t]);
  if(seen.size>500)for(const k of seen.keys())if(k!=='*'&&!keep(seen.get(k)).length)seen.delete(k);
  return true;
 }
 async function call(request,model,key,thinking){
  let response;
  try{response=await fetchImpl(`${API}${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(geminiBody(request,model,{thinking})),signal:AbortSignal.timeout(25000)});}
  catch{throw new GeminiError('제미나이가 너무 오래 대답하지 않았어요. 다시 눌러 주세요.',504,'timeout');}
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw upstreamError(response.status,data);
  return readGemini(data);
 }
 // 없어진 모델은 기억해 두고 다시 부르지 않습니다. 사용량이 찬 모델은 이번 요청에서만 건너뜁니다.
 async function ask(request,key){
  const models=[...new Set([env.GEMINI_MODEL,...defaultModels].filter(validModel))].filter(m=>!retired.has(m));
  let last,quota;
  for(const model of models){
   try{return {value:await call(request,model,key,true),model};}
   catch(err){
    last=err;
    if(err.code==='invalid'){try{return {value:await call(request,model,key,false),model};}catch(again){last=again;}}
    if(last.code==='model'){retired.add(model);continue;}
    if(last.code==='quota'){quota=last;continue;}
    throw last;
   }
  }
  throw quota||last||new GeminiError('제미나이 모델을 찾지 못했어요.',502,'model');
 }
 return async function handle(req){
  if(req.method!=='POST')return json(405,{error:'POST로만 부를 수 있어요.'});
  const origin=req.headers.get('origin');
  if(origin){try{if(new URL(origin).host!==req.headers.get('host'))return json(403,{error:'이 사이트에서만 쓸 수 있어요.'});}catch{return json(403,{error:'이 사이트에서만 쓸 수 있어요.'});}}
  const key=String(env.GEMINI_API_KEY||'').trim();
  if(!key)return json(503,{error:'아직 사이트에 제미나이 API 키가 연결되지 않았어요.',code:'no-key'});
  const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim()||'local';
  if(!allowed(ip))return json(429,{error:'제미나이에게 너무 자주 물어봤어요. 몇 분 뒤에 다시 눌러 주세요.',code:'too-many'});
  let request;
  try{const text=await req.text();if(text.length>MAX_BODY)return json(413,{error:'보낸 글이 너무 길어요.'});request=cleanRequest(JSON.parse(text));}
  catch(err){return json(400,{error:err instanceof SyntaxError?'요청을 읽지 못했어요.':err.message,code:'bad-request'});}
  try{const {value,model}=await ask(request,key);return json(200,{mode:request.mode,model,...readReply(request,value)});}
  catch(err){return json(err.status||502,{error:err.message||'제미나이가 대답하지 못했어요.',code:err.code||'busy'});}
 };
}

export default {fetch:createHandler()};

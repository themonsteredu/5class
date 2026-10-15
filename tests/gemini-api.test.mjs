import test from 'node:test';import assert from 'node:assert/strict';
import {createHandler,geminiBody,readGemini,thinkingFor,defaultModels} from '../api/gemini.js';
const facts=[{artifact:'금관',status:'사실 확인',sentence:'금관은 금으로 만든 신라의 관이다.'},{artifact:'금관',status:'사실 확인',sentence:'금관은 고구려 무덤에서 나왔다.'}];
const reply=value=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'생각 중',thought:true},{text:JSON.stringify(value)}]}}]})});
const fail=(status,error)=>({ok:false,status,json:async()=>({error})});
const post=(body,headers={})=>new Request('https://5class.vercel.app/api/gemini',{method:'POST',headers:{'content-type':'application/json',host:'5class.vercel.app',origin:'https://5class.vercel.app','x-teacher-pin':'2468',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const check={mode:'check',robot:'2모둠 신라 로봇',facts};
test('check answers come back matched to each taught sentence',async()=>{
 const calls=[];
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async(url,init)=>{calls.push({url,init});return reply({results:[{no:1,verdict:'맞아요',reason:'맞아요',fix:''},{no:2,verdict:'고쳐야 해요',reason:'황남대총은 신라 무덤이에요.',fix:'금관은 신라 무덤에서 나왔다.'}],tip:'유리 제품도 가르쳐요'});}});
 const res=await handle(post(check));const value=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(value.results.map(r=>r.verdict),['맞아요','고쳐야 해요']);
 assert.equal(value.results[1].fix,'금관은 신라 무덤에서 나왔다.');assert.equal(value.model,defaultModels[0]);
 assert.match(calls[0].url,/gemini-3\.5-flash-lite:generateContent$/);
 assert.equal(calls[0].init.headers['x-goog-api-key'],'k');
 const body=JSON.parse(calls[0].init.body);
 assert.match(body.contents[0].parts[0].text,/2\. \(금관\) \[사실 확인\] 금관은 고구려 무덤에서 나왔다\./);
 assert.equal(body.generationConfig.responseMimeType,'application/json');
 assert.deepEqual(body.generationConfig.thinkingConfig,{thinkingLevel:'minimal'});
 assert.equal('temperature' in body.generationConfig,false);
});
test('missing key, wrong origin, bad body and wrong method are refused before calling Gemini',async()=>{
 let called=0;const fetchImpl=async()=>{called++;return reply({});};
 assert.equal((await createHandler({env:{},fetchImpl})(post(check))).status,503);
 assert.equal((await (await createHandler({env:{},fetchImpl})(post(check))).json()).code,'no-key');
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl});
 assert.equal((await handle(post(check,{origin:'https://evil.example'}))).status,403);
 assert.equal((await handle(post('{bad'))).status,400);
 assert.equal((await handle(post({mode:'chat',robot:'x',facts}))).status,400);
 assert.equal((await handle(post({mode:'check',robot:'x',facts:[]}))).status,400);
 assert.equal((await handle(post('x'.repeat(30000)))).status,413);
 assert.equal((await handle(new Request('https://5class.vercel.app/api/gemini',{method:'PUT'}))).status,405);
 assert.deepEqual(await (await handle(new Request('https://5class.vercel.app/api/gemini'))).json(),{key:true,pin:true});
 assert.deepEqual(await (await createHandler({env:{GEMINI_API_KEY:' '}})(new Request('https://x/api/gemini'))).json(),{key:false,pin:false});
 assert.equal(called,0);
});
test('a retired model falls through to the next one and is remembered',async()=>{
 const urls=[];
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async url=>{urls.push(url);return url.includes(defaultModels[0])?fail(404,{code:404,message:'models/x is not found',status:'NOT_FOUND'}):reply({answer:'몰라요',say:'아직 배우지 않았어요.'});}});
 const first=await (await handle(post({mode:'ask',robot:'r',facts,question:'첨성대는?'}))).json();
 assert.equal(first.answer,'몰라요');assert.equal(first.model,defaultModels[1]);
 await handle(post({mode:'ask',robot:'r',facts,question:'또?'}));
 assert.equal(urls.filter(u=>u.includes(defaultModels[0])).length,1);
});
test('a rejected thinking setting is retried once without it',async()=>{
 const bodies=[];
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468',GEMINI_MODEL:'gemini-3.8-flash'},fetchImpl:async(url,init)=>{const b=JSON.parse(init.body);bodies.push(b);return b.generationConfig.thinkingConfig?fail(400,{code:400,message:'Thinking level is not supported',status:'INVALID_ARGUMENT'}):reply({answer:'맞아요',say:'네'});}});
 const value=await (await handle(post({mode:'ask',robot:'r',facts,question:'금관은 금이야?'}))).json();
 assert.equal(value.answer,'맞아요');assert.equal(bodies.length,2);assert.deepEqual(bodies[0].generationConfig.thinkingConfig,{thinkingLevel:'low'});
});
test('key, quota and blocked errors become friendly Korean messages',async()=>{
 const run=async upstream=>{const res=await createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async()=>upstream})(post(check));return {status:res.status,...await res.json()};};
 const bad=await run(fail(400,{code:400,message:'API key not valid. Please pass a valid API key.',status:'INVALID_ARGUMENT',details:[{reason:'API_KEY_INVALID'}]}));
 assert.equal(bad.code,'bad-key');assert.match(bad.error,/API 키가 맞지 않아요/);
 const quota=await run(fail(429,{code:429,status:'RESOURCE_EXHAUSTED'}));assert.equal(quota.status,429);assert.match(quota.error,/1분쯤 뒤/);
 const blocked=await run({ok:true,status:200,json:async()=>({promptFeedback:{blockReason:'SAFETY'}})});assert.equal(blocked.code,'blocked');
 const cut=await run({ok:true,status:200,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"results":[{"no":1'}]}}]})});assert.equal(cut.code,'unreadable');
 const down=await createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async()=>{throw new TypeError('fetch failed');}})(post(check));assert.equal((await down.json()).code,'network');
 const slow=await createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async()=>{throw Object.assign(Error('t'),{name:'TimeoutError'});}})(post(check));assert.equal((await slow.json()).code,'timeout');
});
test('one tablet cannot spend the whole class quota',async()=>{
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async()=>reply({answer:'몰라요',say:'.'}),now:()=>1e9});
 const ask=()=>handle(post({mode:'ask',robot:'r',facts,question:'q'},{'x-forwarded-for':'1.2.3.4'}));
 for(let i=0;i<60;i++)assert.equal((await ask()).status,200);
 assert.equal((await ask()).status,429);
 assert.equal((await handle(post({mode:'ask',robot:'r',facts,question:'q'},{'x-forwarded-for':'5.6.7.8'}))).status,200);
});
test('body helpers pick the thinking level per model and strip code fences',()=>{
 assert.equal(thinkingFor('gemini-3.1-flash-lite'),'minimal');assert.equal(thinkingFor('gemini-3.8-flash'),'low');
 assert.equal(geminiBody({mode:'check',robot:'r',facts,question:''},'m',{thinking:false}).generationConfig.thinkingConfig,undefined);
 assert.deepEqual(readGemini({candidates:[{content:{parts:[{text:'```json\n{"answer":"맞아요"}\n```'}]}}]}),{answer:'맞아요'});
});
test('a model whose free quota is used up hands the question to the next model',async()=>{
 const urls=[];
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async url=>{urls.push(url);return url.includes(defaultModels[0])?fail(429,{code:429,status:'RESOURCE_EXHAUSTED'}):reply({answer:'맞아요',say:'네'});}});
 const value=await (await handle(post({mode:'ask',robot:'r',facts,question:'금관은 금이야?'}))).json();
 assert.equal(value.model,defaultModels[1]);
 await handle(post({mode:'ask',robot:'r',facts,question:'또?'}));
 assert.equal(urls.filter(u=>u.includes(defaultModels[0])).length,2);
});
test('only the teacher PIN set in Vercel opens Gemini, and guessing is slowed down',async()=>{
 let called=0;const fetchImpl=async()=>{called++;return reply({answer:'몰라요',say:'.'});};
 const ask={mode:'ask',robot:'r',facts,question:'q'};
 const noPin=await createHandler({env:{GEMINI_API_KEY:'k'},fetchImpl})(post(ask));
 assert.equal(noPin.status,503);assert.equal((await noPin.json()).code,'no-pin');
 let t=1e9;const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl,now:()=>t});
 const wrong=await handle(post(ask,{'x-teacher-pin':'1111','x-forwarded-for':'9.9.9.9'}));
 assert.equal(wrong.status,401);assert.equal((await wrong.json()).code,'pin');
 assert.equal((await handle(post(ask,{'x-teacher-pin':'','x-forwarded-for':'9.9.9.9'}))).status,401);
 for(let i=0;i<28;i++)await handle(post(ask,{'x-teacher-pin':String(i),'x-forwarded-for':'9.9.9.9'}));
 const locked=await handle(post(ask,{'x-forwarded-for':'9.9.9.9'}));
 assert.equal(locked.status,401);assert.match((await locked.json()).error,/너무 많이 틀렸어요/);
 assert.equal(called,0);
 t+=11*60*1000;
 assert.equal((await handle(post(ask,{'x-forwarded-for':'9.9.9.9'}))).status,200);
 const bad=await createHandler({env:{GEMINI_API_KEY:'AQ.키\u200b',TEACHER_PIN:'2468'},fetchImpl})(post(ask));
 assert.equal((await bad.json()).code,'bad-key');
});
test('an overloaded model hands the question to the next model',async()=>{
 const handle=createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async url=>url.includes(defaultModels[0])?fail(503,{code:503,status:'UNAVAILABLE'}):reply({answer:'맞아요',say:'네'})});
 const value=await (await handle(post({mode:'ask',robot:'r',facts,question:'q'}))).json();
 assert.equal(value.model,defaultModels[1]);
 const allBusy=await createHandler({env:{GEMINI_API_KEY:'k',TEACHER_PIN:'2468'},fetchImpl:async()=>fail(503,{code:503})})(post({mode:'ask',robot:'r',facts,question:'q'}));
 assert.equal((await allBusy.json()).code,'busy');
});

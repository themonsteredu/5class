import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
import {observationIds} from './lesson-one.js';
import {loadSession as load,saveSession,token,rpc,loadRoom,readRoom,readCache,writeCache,saveSort,teach as teachRobot,forget} from './lesson-four-store.js';
import {askNationRobot,findArtifact} from './robot.js';
import * as room from './robot-room.js';
import {tidyRequest,checkSections,askSections,promptText,expectedVerdict} from './gemini-prompt.js';

// 4차시: 3차시 문장판의 유물을 우리 기준으로 나누고, 나라별 역사 로봇에게 우리 반 검증 문장을 가르칩니다.
export const fourthSteps=['우리 기준으로 나누기','모둠 로봇 가르치기','로봇에게 묻기','제미나이로 확인하기'];
const fourthTimes=[15,10,8,7];
const groups=[1,2,3,4,5,6];
const art=id=>artifacts.find(a=>a.id===id);
const nameOf=id=>art(id)?.name||id;
const who=g=>g===0?'선생님':`${g}모둠`;
export const criterionExamples=[
 ['나라','고구려 / 백제 / 신라 / 가야','아이들이 가장 먼저 떠올려요.'],
 ['재료','흙 / 금속 / 돌 / 유리 / 벽에 그린 그림','2차시에 확인한 재료를 그대로 써요.'],
 ['쓰임','먹고 사는 데 / 몸에 걸친 것 / 믿음 / 즐거움','생활 모습으로 이어져요.'],
 ['실물인가, 본뜬 것인가','실제로 쓰던 물건 / 본뜨거나 그린 것 / 믿음을 위해 만든 것','그림과 모형은 실제와 다를 수 있어요.'],
 ['누구의 생활인가','왕·귀족 / 여러 사람 / 자료로는 알 수 없음','판단 보류 칸이 자연스럽게 생겨요.'],
 ['어디에 남아 있었나','무덤에서 나온 것 / 땅 위에 남은 것 / 확인 필요','옛 생활 자료가 어디서 왔는지 생각해요.'],
 ['오늘날과 비교','지금도 비슷한 것을 쓰는 것 / 지금은 쓰지 않는 것','아이들 생활과 연결돼요.'],
 ['우리가 얼마나 확실히 아나','사실 확인이 많은 유물 / 고친 문장이 있는 유물 / 판단 보류가 많은 유물','3차시 문장판이 근거가 돼요.']
];

let session=load(),tab=0,sentences=[],sorts=[],teams=[],facts=[],roomRows=[],loaded=false,error='',notice='',timer=null;
// boardOk: 3차시 문장판(유물 문장)을 받았는지. 못 받았으면 받을 때까지 8초마다 다시 부릅니다.
let boardOk=false,roomOk=false,live=false,fromCache=false;
let draft=null,own={artifact:'',status:'사실 확인',sentence:'',original:''},robotSel=0,chats={},voiceOn=true,listening=false,teacherRobot=1,trapOpen=false;
const blankOwn=()=>({artifact:'',status:'사실 확인',sentence:'',original:''});

const joined=()=>session.code&&session.group!==null&&session.author;
const teacher=()=>session.group===0;
function boardIds(){const named=new Set(sentences.map(s=>artifacts.find(a=>a.name===s.artifact)?.id).filter(Boolean));const ids=artifacts.filter(a=>named.has(a.id)).map(a=>a.id);return ids.length?ids:[...observationIds];}
const sentencesOf=id=>sentences.filter(s=>s.artifact===nameOf(id));
const statusMark={'사실 확인':'✓','고친 문장':'✎','판단 보류':'?'};

function ensureDraft(){
 if(draft||teacher())return;
 const saved=sorts.find(s=>s.group===session.group);
 draft=saved?{criterion:saved.criterion,bins:saved.bins.map(b=>({name:b.name,items:[...b.items]})),dirty:false}:{criterion:'',bins:[{name:'',items:[]},{name:'',items:[]}],dirty:false};
}
const binOf=id=>draft?.bins.findIndex(b=>b.items.includes(id));

function joinView(){
 return `<section class="c3-card c3-join"><p class="c3-kicker">4차시 · 분류와 AI 로봇</p><h1>수업코드를 넣고 입장해요</h1><p class="c3-lead">3차시와 같은 수업코드를 넣어요.</p><form data-c4-form="join"><label class="field"><span>수업코드</span><input name="code" inputmode="numeric" autocomplete="off" maxlength="12" value="${e(session.code)}" placeholder="3차시와 같은 숫자" required></label><fieldset class="c3-choices c3-group-pick"><legend>우리 모둠</legend>${groups.map(g=>`<label><input type="radio" name="group" value="${g}" ${session.group===g?'checked':''}><span>${g}모둠</span></label>`).join('')}</fieldset><button class="primary c3-wide" type="submit">입장하기</button><button class="quiet c3-wide" type="submit" name="teacher" value="1">선생님 화면</button></form>${error?`<p class="c3-message" role="alert">${e(error)}</p>`:''}</section>`;
}

function artifactCard(id){
 const a=art(id),list=sentencesOf(id),at=binOf(id);
 return `<article class="c4-art ${at>=0?'is-placed':''}"><img src="assets/images/${e(a.image)}" alt=""><div><h3>${e(a.name)}</h3><details><summary>3차시 문장 ${list.length}개</summary><ul>${list.map(s=>`<li>${statusMark[s.status]||''} ${e(s.sentence)}</li>`).join('')||'<li>아직 올린 문장이 없어요.</li>'}</ul></details><div class="c4-bins" role="group" aria-label="${e(a.name)} 묶음 고르기">${draft.bins.map((b,i)=>b.name.trim()?`<button type="button" class="small ${at===i?'primary':'quiet'}" data-c4="place" data-id="${id}" data-bin="${i}" aria-pressed="${at===i}">${e(b.name)}</button>`:'').join('')||'<small>위에서 묶음 이름을 먼저 지어요.</small>'}</div></div></article>`;
}
function sortView(){
 if(teacher())return `<section class="c3-board c4-wide" data-live="sorts">${sortsView()}</section>`;
 if(!loaded)return '';
 ensureDraft();
 if(!boardOk&&!fromCache)return '<section class="c3-card"><p class="c3-guide">3차시 유물 문장을 불러오는 중이에요… 인터넷이 느리면 조금 걸려요. 8초마다 자동으로 다시 불러와요.</p></section>';
 const ids=boardIds(),left=ids.filter(id=>binOf(id)<0).length;
 return `<section class="c3-card"><p class="c3-guide">정답은 없어요. <b>규칙이 하나</b>이고, <b>모든 유물이 어딘가에 들어가고</b>, <b>3차시 문장으로 이유를 말할 수 있으면</b> 좋은 기준이에요.</p><form data-c4-form="sort"><label class="field"><span>1. 우리 기준</span><input name="criterion" maxlength="100" value="${e(draft.criterion)}" placeholder="예: 무엇에 썼는지로 나눴어요"></label><div class="c4-bin-names"><span>2. 묶음 이름</span>${draft.bins.map((b,i)=>`<label><input name="bin-${i}" data-bin="${i}" maxlength="20" value="${e(b.name)}" placeholder="묶음 ${i+1}">${draft.bins.length>1?`<button type="button" class="quiet small" data-c4="bin-remove" data-bin="${i}" aria-label="묶음 ${i+1} 빼기">×</button>`:''}</label>`).join('')}${draft.bins.length<6?'<button type="button" class="quiet small" data-c4="bin-add">묶음 추가 +</button>':''}</div></form><h3 class="c4-sub">3. 유물 카드를 묶음에 넣어요 <small>${left?`아직 안 넣은 유물 ${left}개`:'모두 넣었어요!'}</small></h3><div class="c4-arts">${ids.map(artifactCard).join('')}</div><button class="primary c3-wide" type="button" data-c4="sort-save">우리 분류 저장하기</button>${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</section><section class="c3-board" data-live="sorts">${sortsView()}</section>`;
}
function sortsView(){
 return `<div class="c3-board-head"><h2>모둠별 분류</h2></div><div class="c4-sorts">${groups.map(g=>{const s=sorts.find(x=>x.group===g);return `<section class="c3-group ${g===session.group?'is-mine':''}"><h3>${g}모둠</h3>${s?`<p class="c4-criterion">${e(s.criterion)}</p>${s.bins.map(b=>`<div class="c4-bin"><b>${e(b.name)}</b><span>${b.items.map(id=>e(nameOf(id))).join(', ')||'—'}</span></div>`).join('')}`:'<p class="c3-empty">아직 저장하지 않았어요.</p>'}</section>`;}).join('')}</div>${teacher()?`<details class="c4-teacher"><summary>교사용 기준 예시 (학생에게 보여 주지 마세요)</summary><table><thead><tr><th>기준</th><th>나뉘는 모습</th><th>좋은 점</th></tr></thead><tbody>${criterionExamples.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table><p>정답 기준은 없습니다. 규칙이 하나인지, 모든 유물이 들어갔는지, 3차시 문장으로 이유를 말하는지만 확인합니다.</p></details>`:''}`;
}


// 모둠 로봇: 모둠마다 로봇이 하나씩 있고, 그 모둠이 3차시에 조사한 유물만 설명합니다.
const idOfName=room.idOfName;
const nationOfRobot=g=>room.nationOfRobot(sentences,g);
const robotName=g=>room.robotName(sentences,g);
const groupArtifacts=g=>room.groupArtifacts(sentences,g);
const robotOf=f=>room.robotOf(sentences,f);
const robotFacts=g=>room.robotFacts(sentences,facts,g);
const robotFace=room.robotFace;
const statusLine=s=>s.status==='고친 문장'&&s.original?`<s>${e(s.original)}</s> → ${e(s.sentence)}`:e(s.sentence);
const objectJosa=word=>{const code=word.charCodeAt(word.length-1)-0xac00;return word+(code>=0&&code<11172&&code%28?'을':'를');};
const currentRobot=()=>robotSel||(teacher()?1:session.group);

function factLine(f,removable=true){
 return `<li><span class="c3-status" data-status="${e(f.status)}">${statusMark[f.status]||''} ${e(f.status)}</span> ${f.artifact?`<span class="c3-tag">${e(nameOf(f.artifact))}</span> `:''}${statusLine(f)} <small>${who(f.group)}</small>${removable&&f.mine?` <button class="quiet small" type="button" data-c4="forget" data-id="${e(f.id)}">지우기</button>`:''}</li>`;
}
function robotsView(){
 return `<div class="c3-board-head"><h2>모둠 로봇이 배운 문장</h2></div><div class="c4-nations c4-robots">${groups.map(g=>{const list=robotFacts(g),items=groupArtifacts(g);return `<section class="c3-group ${!teacher()&&g===session.group?'is-mine':''}"><h3>${robotFace[nationOfRobot(g)]} ${robotName(g)} <small>${list.length}문장</small></h3><p class="c4-team">담당 유물: ${items.map(id=>e(nameOf(id))).join(', ')||'아직 없음'}</p>${list.length?`<ul>${list.map(f=>factLine(f)).join('')}</ul>`:'<p class="c3-empty">아직 배운 문장이 없어요.</p>'}</section>`;}).join('')}</div>`;
}
function ownForm(robot){
 const ids=groupArtifacts(robot),fixed=own.status==='고친 문장';
 return `<form data-c4-form="own" class="c4-own"><h3 class="c4-sub">직접 문장을 가르쳐요 ${teacher()?'<small>함정 문장을 하나 넣어 보세요</small>':''}</h3>${teacher()?`<label class="field"><span>어느 로봇에게?</span><select name="robot">${groups.map(g=>`<option value="${g}" ${g===robot?'selected':''}>${e(robotName(g))}</option>`).join('')}</select></label>`:''}<label class="field"><span>유물</span><select name="artifact"><option value="">유물을 골라 주세요</option>${ids.map(id=>`<option value="${id}" ${own.artifact===id?'selected':''}>${e(nameOf(id))}</option>`).join('')}</select></label><fieldset class="c3-choices c3-status-pick"><legend>어떤 문장인가요?</legend>${['사실 확인','고친 문장','판단 보류'].map(s=>`<label><input type="radio" name="status" value="${s}" ${own.status===s?'checked':''}><span><b>${s}</b></span></label>`).join('')}</fieldset>${fixed?`<label class="field c3-original"><span>틀렸던 원래 문장</span><input name="original" maxlength="300" value="${e(own.original)}"></label>`:''}<label class="field"><span>${fixed?'바르게 고친 문장':'가르칠 문장'}</span><input name="sentence" maxlength="300" value="${e(own.sentence)}" placeholder="예: 토우는 흙으로 만들었다."></label><button class="primary c3-wide" type="submit">로봇에게 가르치기</button></form>`;
}
function teachView(){
 if(teacher())return `<section class="c3-board" data-live="robots">${robotsView()}</section><details class="c4-teacher" ${trapOpen?'open':''}><summary data-c4="trap">선생님: 함정 문장 넣기 (학생에게 보이지 않게 열어 주세요)</summary>${ownForm(teacherRobot)}${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</details>`;
 const g=session.group,known=new Set(robotFacts(g).map(f=>f.source).filter(Boolean));
 const board=sentences.filter(s=>s.group===g);
 return `<section class="c3-card"><div class="c4-robot-head"><span class="c4-face" aria-hidden="true">🤖<i>${robotFace[nationOfRobot(g)]}</i></span><div><h2>우리 모둠 로봇 · ${e(robotName(g))}</h2><p>담당 유물: ${groupArtifacts(g).map(id=>e(nameOf(id))).join(', ')||'3차시 문장이 아직 없어요'}</p></div></div><p class="c3-guide">우리 로봇은 <b>우리 모둠이 3차시에 조사한 유물</b>만 설명해요. 같은 나라라도 다른 모둠 유물은 그 모둠 로봇이 맡아요.</p><h3 class="c4-sub">3차시에 우리 모둠이 올린 문장 <small>${board.length}개</small></h3><ul class="c4-board-list">${board.map(s=>`<li><span class="c3-status" data-status="${e(s.status)}">${statusMark[s.status]||''} ${e(s.status)}</span> <span class="c3-tag">${e(s.artifact)}</span> ${statusLine(s)} ${known.has(s.id)?'<b class="c3-check">✓ 배웠어요</b>':`<button class="quiet small" type="button" data-c4="teach" data-id="${e(s.id)}">가르치기</button>`}</li>`).join('')||'<li class="c3-empty">3차시에 올린 문장이 아직 없어요.</li>'}</ul>${ownForm(g)}${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</section><section class="c3-board" data-live="robots">${robotsView()}</section>`;
}

const kinds={'맞아요':'ok','아니에요':'no','알려 줄게요':'ok','알 수 없어요':'mixed','몰라요':'unknown'};
function robotView(){
 const g=currentRobot(),list=chats[g]||[];
 const speech=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 return `<section class="c3-card c4-robot"><div class="c4-team-pick"><span>누구에게 물어볼까요?</span>${groups.map(x=>`<button type="button" class="small ${x===g?'primary':'quiet'}" data-c4="robot" data-group="${x}" aria-pressed="${x===g}">${robotFace[nationOfRobot(x)]} ${e(robotName(x))} · ${robotFacts(x).length}</button>`).join('')}</div><div class="c4-robot-head"><span class="c4-face" aria-hidden="true">🤖<i>${robotFace[nationOfRobot(g)]}</i></span><div><h2>${e(robotName(g))}</h2><p>담당 유물: ${groupArtifacts(g).map(id=>e(nameOf(id))).join(', ')||'아직 없음'} · 배운 문장 ${robotFacts(g).length}개</p></div><button class="quiet small" type="button" data-c4="voice" aria-pressed="${voiceOn}">${voiceOn?'🔊 목소리 켜짐':'🔇 목소리 꺼짐'}</button></div><form data-c4-form="ask"><label class="field"><span>로봇에게 물어볼 말</span><input name="question" maxlength="120" autocomplete="off" placeholder="예: 토우는 무엇으로 만들었어?"></label><div class="c4-ask-row">${speech?`<button class="quiet c4-mic ${listening?'is-on':''}" type="button" data-c4="listen">${listening?'듣는 중… 말해 주세요':'🎤 말로 묻기'}</button>`:''}<button class="primary" type="submit">⌨️ 글로 묻기</button></div></form>${speech?'':'<p class="c3-empty">이 기기에서는 말로 묻기가 안 돼요. 글로 물어봐 주세요.</p>'}<ol class="c4-chat">${list.map(({q,r})=>`<li><p class="c4-q">${e(q)}</p><p class="c4-a" data-kind="${kinds[r.answer]||'unknown'}"><b>${e(r.answer)}</b> ${e(r.say)}</p><p class="c4-thought">로봇의 생각 · 유물: ${e(r.thought.artifact||'못 찾음')}${r.thought.match?` · 가장 비슷한 배운 문장(${r.thought.score}%): ${e(r.thought.match)}`:''}${r.thought.words.length?` · 같은 말: ${e(r.thought.words.join(', '))}`:''}</p>${r.fact?`<p class="c4-thought">근거: ${e(who(r.fact.group))}이 가르친 문장</p>`:''}</li>`).join('')}</ol><p class="c3-guide">로봇의 대답이 이상하면 <b>근거 문장</b>을 보세요. 틀린 문장을 가르쳤다면 2번에서 지우고 바른 문장을 가르쳐요. 다른 모둠 유물은 그 모둠 로봇에게 물어봐요.</p></section>`;
}

// 4단계: 모둠 로봇이 배운 문장을 한눈에 정리하고, 선생님이 제미나이에게 맞는지 확인하거나 두 로봇에게 같은 질문을 합니다.
// 요청문은 gemini-prompt.js가 만들고, 서버(api/gemini.js)도 같은 파일로 같은 글을 만들어 제미나이에게 보냅니다.
let aiRobot=0,aiChecks={},aiAsks={},aiBusy=false,aiGen=0,aiPin=null,liveRoot=null,paintedFacts='',aiSetup=null,setupLoading=false;
// 선생님 비밀번호(Vercel의 TEACHER_PIN)는 선생님 기기에만 기억합니다. 학생 태블릿은 몰라서 제미나이를 부를 수 없습니다.
const PIN_STORE='moakit-5class-teacher-pin';
const savedPin=()=>{try{return localStorage.getItem(PIN_STORE)||'';}catch{return '';}};
const keepPin=pin=>{try{pin?localStorage.setItem(PIN_STORE,pin):localStorage.removeItem(PIN_STORE);}catch{}};
const factsSignature=()=>JSON.stringify(facts.map(f=>[f.id,robotOf(f),f.status,f.artifact,f.sentence,f.original]));
const aiRobotNow=()=>aiRobot||(teacher()?1:session.group);
const aiRequest=(mode,g,question='')=>tidyRequest({mode,robot:robotName(g),question,facts:robotFacts(g).map(f=>({artifact:f.artifact?nameOf(f.artifact):'',status:f.status,sentence:f.sentence,original:f.original}))});
const sameFacts=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function resetAi(){aiRobot=0;aiChecks={};aiAsks={};aiBusy=false;aiPin=null;aiGen++;}
const verdictOf=(c,i)=>c.results.find(r=>r.no===i+1);
function verdictCounts(c){let same=0,diff=0;c.facts.forEach((f,i)=>{const r=verdictOf(c,i);if(r)r.verdict===expectedVerdict[f.status]?same++:diff++;});return {same,diff};}

async function callGemini(request){
 let response;
 try{response=await fetch('/api/gemini',{method:'POST',headers:{'Content-Type':'application/json','x-teacher-pin':savedPin()},body:JSON.stringify(request),signal:AbortSignal.timeout(58000)});}
 catch{throw Object.assign(Error('제미나이에게 연결하지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.'),{code:'network'});}
 let value={};try{value=await response.json();}catch{}
 if(value.code==='pin')keepPin('');
 if(!response.ok||value.error)throw Object.assign(Error(value.error||(response.status===404?'이 사이트에는 아직 제미나이 연결 기능이 없어요.':'제미나이가 대답하지 못했어요. 잠시 뒤 다시 눌러 주세요.')),{code:value.code||String(response.status)});
 return value;
}
// 사이트에 제미나이 키와 선생님 비밀번호가 들어 있는지 먼저 확인합니다(값은 받지 않습니다).
async function loadSetup(){
 if(setupLoading)return;setupLoading=true;
 try{const response=await fetch('/api/gemini',{signal:AbortSignal.timeout(10000)});aiSetup=response.ok?await response.json():{missing:true};}
 catch{aiSetup={offline:true};}
 setupLoading=false;rerender();
}
const setupReady=()=>!aiSetup||aiSetup.offline||(aiSetup.key&&aiSetup.pin);
function setupView(){
 if(!aiSetup||setupReady())return '';
 const need=aiSetup.missing?'이 사이트에는 아직 제미나이 연결 기능이 없어요.':`아직 Vercel에 ${[!aiSetup.key&&'제미나이 API 키(GEMINI_API_KEY)',!aiSetup.pin&&'선생님 비밀번호(TEACHER_PIN)'].filter(Boolean).join('와 ')}가 없어요.`;
 return `<p class="c3-message" role="status">${need}</p>${keyHelp()}`;
}
// 비밀번호가 없으면 먼저 묻고, 넣은 뒤에 하려던 일을 이어서 합니다.
function withPin(action){if(!setupReady())return rerender();if(savedPin())return action();aiPin={action,error:''};rerender();}
const stopAll=new Set(['no-key','bad-key','no-pin','pin','too-many','quota','404','network']);
async function runCheck(root,g){
 const request=aiRequest('check',g),gen=aiGen;
 if(!request.facts.length||aiChecks[g]?.status==='loading')return;
 aiChecks[g]={status:'loading',facts:request.facts};rerender();
 let next;
 try{const value=await callGemini(request);next={status:'done',facts:request.facts,results:Array.isArray(value.results)?value.results:[],tip:value.tip||''};}
 catch(err){next={status:'error',facts:request.facts,error:err.message,code:err.code};}
 if(gen!==aiGen)return;
 aiChecks[g]=next;
 if(next.code==='pin')aiPin={action:()=>runCheck(root,g),error:next.error};
 rerender();
}
async function runAllChecks(root){
 if(aiBusy)return;
 const gen=aiGen;aiBusy=true;rerender();
 for(const g of groups){
  if(gen!==aiGen)return;
  if(!robotFacts(g).length)continue;
  await runCheck(root,g);
  // 키·비밀번호·사용량 문제는 다른 로봇도 똑같으니 멈추고, 그 로봇을 골라 안내를 보여 줍니다.
  if(aiChecks[g]?.status==='error'&&stopAll.has(aiChecks[g].code)){aiRobot=g;if(aiChecks[g].code==='pin')aiPin={action:()=>runAllChecks(root),error:aiChecks[g].error};break;}
 }
 if(gen!==aiGen)return;
 aiBusy=false;rerender();
}
async function runAsk(root,g,question){
 const q=String(question||'').replace(/\s+/g,' ').trim().slice(0,120),gen=aiGen;if(!q)return;
 const item={q,ours:askGroupRobot(q,g),gemini:{status:'loading'}};
 aiAsks[g]=[item,...(aiAsks[g]||[])].slice(0,4);rerender();
 try{const value=await callGemini(aiRequest('ask',g,q));item.gemini={status:'done',answer:value.answer||'몰라요',say:value.say||''};}
 catch(err){item.gemini={status:'error',error:err.message,code:err.code};if(err.code==='pin'&&gen===aiGen)aiPin={action:()=>runAsk(root,g,q),error:err.message};}
 if(gen===aiGen)rerender();
}
// 두 로봇을 시험해 볼 질문: 함정(고치기 전 문장), 판단 보류, 배운 유물, 배우지 않은 유물
function testQuestions(g){
 const list=robotFacts(g),out=[];
 const fixed=list.find(f=>f.status==='고친 문장'&&f.original);if(fixed)out.push(fixed.original);
 const held=list.find(f=>f.status==='판단 보류');if(held)out.push(held.sentence);
 const known=list.find(f=>f.artifact);if(known)out.push(`${nameOf(known.artifact)}에 대해 알려 줘`);
 const mine=new Set([...groupArtifacts(g),...list.map(f=>f.artifact)]);
 const other=groups.filter(x=>x!==g).flatMap(groupArtifacts).find(id=>!mine.has(id));
 out.push(other?`${nameOf(other)}에 대해 알려 줘`:`${nationOfRobot(g)} 사람들은 무엇을 먹었어?`);
 return [...new Set(out.map(q=>q.slice(0,120)))].slice(0,4);
}

function summaryCard(g){
 const list=robotFacts(g),pick=g===aiRobotNow(),check=aiChecks[g],count=s=>list.filter(f=>f.status===s).length;
 const arts=[...new Set(list.map(f=>f.artifact))],mark=check?.status==='done'?verdictCounts(check):null;
 return `<section class="c3-group c4-sum ${pick?'is-mine':''}"><h3><button type="button" class="c4-sum-pick" data-c4="ai-robot" data-group="${g}" aria-pressed="${pick}">${robotFace[nationOfRobot(g)]} ${e(robotName(g))}</button></h3><p class="c4-counts">배운 문장 <b>${list.length}</b> · <span data-status="사실 확인">✓ ${count('사실 확인')}</span> · <span data-status="고친 문장">✎ ${count('고친 문장')}</span> · <span data-status="판단 보류">? ${count('판단 보류')}</span></p>${arts.map(a=>`<div class="c4-sum-art"><b>${e(a?nameOf(a):'유물 표시 없음')}</b><ul>${list.filter(f=>f.artifact===a).map(f=>`<li><span class="c3-status" data-status="${e(f.status)}">${statusMark[f.status]||''}</span> ${statusLine(f)}</li>`).join('')}</ul></div>`).join('')||'<p class="c3-empty">아직 배운 문장이 없어요.</p>'}${mark?`<p class="c4-sum-ai">✨ 제미나이: 같은 생각 ${mark.same} · 생각이 달라요 ${mark.diff}</p>`:check?.status==='loading'?'<p class="c4-sum-ai">✨ 제미나이가 확인하는 중…</p>':check?.status==='error'?`<p class="c4-sum-ai c4-sum-err">⚠️ 확인하지 못했어요: ${e(check.error)}</p>`:''}</section>`;
}
function summaryView(){
 return `<div class="c3-board-head"><h2>모둠 로봇이 배운 내용 한눈에 보기</h2><div class="c4-sum-tools">${teacher()?'<button class="quiet small" type="button" data-c4="handout">🖨 모둠별 활동지 인쇄</button>':''}`+`<button class="quiet small" type="button" data-c4="ai-all" ${aiBusy||!setupReady()?'disabled':''}>${aiBusy?'✨ 제미나이가 차례로 확인하는 중…':'✨ 모든 로봇 제미나이로 확인하기'}</button></div></div><div class="c4-sums">${groups.map(summaryCard).join('')}</div>`;
}
function promptCard(sections){
 return `<ol class="c4-prompt-card">${sections.map(s=>`<li><b>${e(s.title)}</b>${s.lines?`<${s.numbered?'ol':'ul'}>${s.lines.map(line=>`<li>${e(line)}</li>`).join('')||'<li>(아직 없음)</li>'}</${s.numbered?'ol':'ul'}>`:`<p>${e(s.text)}</p>`}</li>`).join('')}</ol>`;
}
const keyHelp=()=>'<p class="c3-guide">선생님: Vercel 프로젝트 <b>Settings → Environment Variables</b>에 <b>GEMINI_API_KEY</b>와 <b>TEACHER_PIN</b>을 넣고, <b>Deployments</b>에서 <b>Redeploy</b>를 눌러 주세요(1분쯤). 그 뒤에 이 버튼이 작동해요. 그 전에는 <b>요청문 복사</b> → <b>제미나이 앱 열기</b>로 물어보세요.</p>';
const setupCodes=new Set(['no-key','bad-key','no-pin','404']);
const pinView=()=>aiPin?`<form data-c4-form="ai-pin" class="c4-ai-pin"><label class="field"><span>선생님 비밀번호 <small>${teacher()?'Vercel에 넣은 TEACHER_PIN · 이 기기에만 기억해요':'선생님이 이 태블릿에 한 번만 넣어 주세요 · 이 태블릿에 기억해요'}</small></span><input name="pin" type="password" autocomplete="off" maxlength="40" required></label><button class="primary" type="submit">확인</button><button class="quiet" type="button" data-c4="ai-pin-cancel">닫기</button>${aiPin.error?`<p class="c3-message" role="alert">${e(aiPin.error)}</p>`:''}</form>`:'';
function checkView(g){
 const c=aiChecks[g];if(!c)return '';
 if(c.status==='loading')return '<p class="c3-guide c4-ai-wait" role="status">✨ 제미나이가 문장을 하나씩 확인하고 있어요… (10~20초)</p>';
 if(c.status==='error')return c.code==='pin'?'':`<p class="c3-message" role="alert">${e(c.error)}</p>${setupCodes.has(c.code)?keyHelp():''}`;
 const stale=!sameFacts(c.facts,aiRequest('check',g).facts);
 return `<h3 class="c4-sub">제미나이의 대답 <small>우리 반 표시와 제미나이 판정을 견주어 봐요</small></h3><ol class="c4-verdicts">${c.facts.map((f,i)=>{const r=verdictOf(c,i),same=r&&r.verdict===expectedVerdict[f.status];return `<li data-same="${r?same:'none'}"><p class="c4-v-sentence">${f.artifact?`<span class="c3-tag">${e(f.artifact)}</span> `:''}${f.original?`<s>${e(f.original)}</s> → `:''}${e(f.sentence)}</p><div class="c4-v-pair"><p><small>우리 반 표시</small><b class="c3-status" data-status="${e(f.status)}">${statusMark[f.status]||''} ${e(f.status)}</b></p><p><small>제미나이 판정</small><b class="c4-verdict" data-verdict="${r?e(r.verdict):''}">${r?e(r.verdict):'대답 없음'}</b></p>${r?`<p class="c4-v-same">${same?'👍 같은 생각':'🔍 생각이 달라요'}</p>`:''}</div>${r?`<p class="c4-v-reason">${e(r.reason)}${r.fix?`<br><b>제미나이가 고친 문장</b> ${e(r.fix)}`:''}</p>`:''}</li>`;}).join('')}</ol>${c.tip?`<p class="c3-guide"><b>✨ 제미나이의 추천</b> ${e(c.tip)}</p>`:''}${stale?'<p class="c3-message">확인한 뒤에 로봇이 문장을 새로 배웠거나 잊었어요. 다시 확인해 보세요.</p>':''}<p class="c3-guide">제미나이도 틀릴 수 있어요. <b>생각이 다른 문장</b>은 교과서 쪽수나 2차시 자료를 펴서 선생님과 함께 확인해요.</p>`;
}
const geminiAnswer=x=>x.status==='loading'?'<p class="c4-a" data-kind="unknown">✨ 생각하는 중…</p>':x.status==='error'?`<p class="c3-message">${e(x.error)}</p>${setupCodes.has(x.code)?keyHelp():''}`:`<p class="c4-a" data-kind="${kinds[x.answer]||'unknown'}"><b>${e(x.answer)}</b> ${e(x.say)}</p>`;
function askView(g){
 const list=aiAsks[g]||[],waiting=list.some(x=>x.gemini.status==='loading');
 return `<h3 class="c4-sub">B. 같은 질문, 두 로봇의 대답 <small>우리 로봇은 규칙으로, 제미나이는 배운 문장만 쓰라는 부탁을 받고 대답해요</small></h3><div class="c4-examples">${testQuestions(g).map(q=>`<button type="button" class="quiet small" data-c4="ai-try" data-q="${e(q)}" ${waiting||!setupReady()?'disabled':''}>${e(q)}</button>`).join('')}</div><form data-c4-form="ai-ask" class="c4-ai-ask"><label class="field"><span>두 로봇에게 똑같이 물어볼 말</span><input name="question" maxlength="120" autocomplete="off" placeholder="예: 금관은 무엇으로 만들었어?"></label><button class="primary" type="submit" ${waiting||!setupReady()?'disabled':''}>두 로봇에게 묻기</button></form><ol class="c4-chat c4-duel">${list.map(item=>`<li><p class="c4-q">${e(item.q)}</p><div class="c4-duel-row"><div><small>🤖 우리 로봇 (규칙)</small><p class="c4-a" data-kind="${kinds[item.ours.answer]||'unknown'}"><b>${e(item.ours.answer)}</b> ${e(item.ours.say)}</p></div><div><small>✨ 제미나이 로봇</small>${geminiAnswer(item.gemini)}</div></div></li>`).join('')}</ol><details class="c4-teacher"><summary>제미나이 로봇에게 보내는 요청문 보기</summary>${promptCard(askSections(aiRequest('ask',g,list[0]?.q||'')))}</details>`;
}
// 학생에게 나눠 줄 활동지: 로봇마다 한 장, 번호는 TV의 제미나이 판정 번호와 같습니다.
let handoutFilled=false;
const box=label=>`<span class="c4-box">☐ ${label}</span>`;
function handoutSheet(g,filled){
 const list=aiRequest('check',g).facts,c=aiChecks[g],done=filled&&c?.status==='done'&&sameFacts(c.facts,list);
 const sections=checkSections({robot:robotName(g),facts:list});
 return `<section class="c4-sheet"><header><span>4차시 · 제미나이로 확인하기 활동지</span><span>수업코드 ${e(session.code)}</span></header><h2>${e(robotName(g))}</h2><p class="c4-sheet-names">모둠 친구 이름: <span></span></p>
 <h3>① 우리 로봇이 배운 문장 <small>제미나이에게 묻기 전에 내 예상을 먼저 표시해요.</small></h3>
 <table class="c4-sheet-table"><thead><tr><th>번호</th><th>유물</th><th>로봇에게 가르친 문장</th><th>우리 반 표시</th><th>내 예상</th><th>제미나이 판정</th><th>같은 생각?</th></tr></thead><tbody>${list.map((f,i)=>{const r=done?verdictOf(c,i):null;return `<tr><td>${i+1}</td><td>${e(f.artifact)}</td><td>${f.original?`<s>${e(f.original)}</s> → `:''}${e(f.sentence)}</td><td>${statusMark[f.status]||''} ${e(f.status)}</td><td>${box('맞아요')}<br>${box('고쳐야 해요')}<br>${box('알 수 없어요')}</td><td>${r?`<b>${e(r.verdict)}</b>`:''}</td><td>${r?(r.verdict===expectedVerdict[f.status]?'👍 같아요':'🔍 달라요'):`${box('예')}<br>${box('아니요')}`}</td></tr>`;}).join('')}</tbody></table>
 <h3>② 생각이 다른 문장을 자료로 확인해요 <small>교과서 쪽수나 2차시 자료를 찾아봐요.</small></h3>
 <table class="c4-sheet-table c4-sheet-check"><thead><tr><th>번호</th><th>확인한 자료(쪽수)</th><th>누구 말이 맞았나요?</th><th>그렇게 생각한 까닭</th></tr></thead><tbody>${[0,1].map(()=>`<tr><td></td><td></td><td>${box('우리 반')} ${box('제미나이')}<br>${box('둘 다 아니에요')}</td><td></td></tr>`).join('')}</tbody></table>
 <h3>③ 선생님은 제미나이에게 이렇게 물었어요</h3>
 <ol class="c4-sheet-prompt">${sections.slice(0,3).map(x=>`<li><b>${e(x.title)}</b> ${x.lines?x.lines.map(e).join(' / '):e(x.text)}</li>`).join('')}<li><b>확인할 문장</b> 위 표의 문장 ${list.length}개</li></ol>
 <h3>④ 오늘 알게 된 점 <small>진짜 AI도 틀릴 수 있을까요?</small></h3><div class="writing-lines c4-sheet-lines"></div></section>`;
}
function openHandouts(only=0){
 const dialog=document.getElementById('modal');if(!dialog)return;
 const robots=(only?[only]:groups).filter(g=>aiRequest('check',g).facts.length);
 const any=robots.some(g=>aiChecks[g]?.status==='done');
 dialog.innerHTML=`<div class="modal-top c4-sheet-tools">${any?`<label class="check"><input type="checkbox" data-c4-sheet="filled" ${handoutFilled?'checked':''}>제미나이 판정도 채워서 인쇄</label>`:''}<button type="button" class="primary" data-action="print">활동지 인쇄 · PDF 저장</button><button type="button" class="quiet" data-action="close">닫기 ×</button></div><article class="printable c4-handouts">${robots.map(g=>handoutSheet(g,handoutFilled)).join('')||'<p>아직 문장을 배운 로봇이 없어요. 2번 화면에서 먼저 가르쳐 주세요.</p>'}</article>`;
 dialog.querySelector('[data-c4-sheet=filled]')?.addEventListener('change',event=>{handoutFilled=event.target.checked;openHandouts(only);});
 if(!dialog.open)dialog.showModal();
}

function compareView(){
 const g=aiRobotNow(),request=aiRequest('check',g),loading=aiChecks[g]?.status==='loading',ready=setupReady();
 if(!aiSetup)loadSetup();
 return `<section class="c3-board" data-live="summary">${summaryView()}</section><section class="c3-card c4-ai"><div class="c4-team-pick"><span>어느 로봇을 확인할까요?</span>${groups.map(x=>`<button type="button" class="small ${x===g?'primary':'quiet'}" data-c4="ai-robot" data-group="${x}" aria-pressed="${x===g}">${robotFace[nationOfRobot(x)]} ${e(robotName(x))} · ${robotFacts(x).length}</button>`).join('')}</div><h2>✨ 제미나이와 확인하기 · ${e(robotName(g))}</h2><h3 class="c4-sub">A. 가르친 문장, 정말 맞을까? <small>제미나이에게 이렇게 물어봐요</small></h3><p class="c4-prompt-tip">좋은 요청문은 <b>① 역할</b> → <b>② 할 일</b> → <b>③ 답하는 방법</b> → <b>④ 자료</b> 순서로 써요.</p><div data-live="ai-prompt">${promptCard(checkSections(request))}</div>${`<div class="c4-ai-actions"><button class="primary" type="button" data-c4="ai-check" ${!request.facts.length||loading||!ready?'disabled':''}>${loading?'✨ 확인하는 중…':'✨ 제미나이에게 확인 받기'}</button><button class="quiet" type="button" data-c4="ai-copy">요청문 복사</button>${teacher()?`<button class="quiet" type="button" data-c4="handout" data-group="${g}">🖨 이 로봇 활동지</button>`:''}<a class="button quiet" href="https://gemini.google.com/app" target="_blank" rel="noopener">제미나이 앱 열기 ↗</a></div>${setupView()}${pinView()}${request.facts.length?'':'<p class="c3-empty">이 로봇은 아직 배운 문장이 없어요. 2번 화면에서 먼저 가르쳐 주세요.</p>'}<p class="c4-ai-note">제미나이에게는 로봇 이름과 가르친 문장만 보내요. 학생 이름은 문장에 쓰지 않아요.</p>${checkView(g)}${askView(g)}`}</section><section class="c3-card"><h3 class="c4-sub">비교하며 이야기해요</h3><ul class="c4-steps-list"><li>제미나이와 우리 반의 생각이 <b>다른 문장</b>은 무엇인가요? 누구 말이 맞는지 교과서로 확인해요.</li><li>제미나이 로봇은 우리가 <b>가르치지 않은 것</b>도 대답했나요? 누가 “몰라요”를 더 잘했나요?</li><li>선생님이 몰래 넣은 함정 문장을 제미나이는 찾아냈나요?</li></ul><div class="c3-guide c3-done"><b>오늘의 정리</b><br>① 로봇은 배운 것만 안다. ② 틀리게 가르치면 틀리게 대답한다. ③ 진짜 AI도 틀릴 수 있으니 근거로 확인한다.</div><p class="c3-guide">다음 시간(5차시)에는 우리 모둠 로봇의 모습을 유물에서 근거를 찾아 디자인해요.</p></section>`;
}
// 결과가 도착해 화면을 다시 그릴 때 보던 자리와 쓰던 질문을 지킵니다.
function rerender(){
 const root=liveRoot;
 if(!root?.isConnected||tab!==3)return;
 const active=document.activeElement,typing=active?.name==='question'&&root.contains(active)?active.value:null,y=window.scrollY;
 render(root);window.scrollTo(0,y);
 if(typing!==null){const input=root.querySelector('input[name=question]');if(input){input.value=typing;input.focus();}}
}

function statusView(){
 return `${error?`<p class="c3-message" role="alert">${e(error)}</p>`:''}${!loaded?'<p class="c3-guide">반 자료를 불러오는 중이에요…</p>':fromCache&&!live&&!error?'<p class="c3-guide">마지막으로 불러온 자료를 먼저 보여 주고 있어요. 새 자료를 불러오는 중이에요…</p>':''}`;
}
// 이 기기에 기억해 둔 자료가 있으면 화면을 열자마자 먼저 보여 줍니다.
function showCached(){
 const c=readCache(session.code);if(!c||!joined())return;
 sentences=c.board;roomRows=c.rows;({sorts,teams,facts}=readRoom(c.rows));loaded=true;fromCache=true;
}
function render(root){
 if(!joined()){root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 const body=[sortView,teachView,robotView,compareView][tab]();paintedFacts=factsSignature();
 root.innerHTML=`<div class="c3-page c4-page ${teacher()?'c4-tv':''}"><div class="c3-bar"><p>수업코드 <b>${e(session.code)}</b> · <b>${teacher()?'선생님 화면':e(robotName(session.group))}</b></p><div><button class="quiet small" type="button" data-c4="refresh">다시 불러오기</button><button class="quiet small" type="button" data-c4="leave">나가기</button></div></div><nav class="c4-tabs" aria-label="4차시 활동 순서">${fourthSteps.map((label,i)=>`<button type="button" data-c4="tab" data-tab="${i}" ${i===tab?'aria-current="step"':''}><span>${i+1}</span>${label}<small>${fourthTimes[i]}분</small></button>`).join('')}</nav><div data-live="status">${statusView()}</div>${body}</div>`;
}
// 바뀐 곳만 다시 그리고, 선생님이 글을 고르고(복사하려고) 있으면 건드리지 않습니다.
function put(el,html){
 if(!el||el.dataset.v===html)return;
 const sel=window.getSelection?.();if(sel&&!sel.isCollapsed&&el.contains(sel.anchorNode))return;
 el.innerHTML=html;el.dataset.v=html;
}
function paintLive(root){
 if(tab===3&&factsSignature()!==paintedFacts)return rerender();
 put(root.querySelector('[data-live=sorts]'),sortsView());
 put(root.querySelector('[data-live=robots]'),robotsView());
 put(root.querySelector('[data-live=summary]'),summaryView());
 put(root.querySelector('[data-live=ai-prompt]'),promptCard(checkSections(aiRequest('check',aiRobotNow()))));
}

async function refresh(root,full=false){
 if(!joined())return;
 const code=session.code,author=session.author;
 const [list,data]=await Promise.allSettled([full||!boardOk?rpc('class5_list',{p_code:code,p_author:author}):Promise.resolve(null),loadRoom(code,author)]);
 if(code!==session.code||author!==session.author)return;
 const problems=[];let boardChanged=false;
 if(list.status==='fulfilled'&&list.value){const next=Array.isArray(list.value.sentences)?list.value.sentences:[];boardChanged=!boardOk||JSON.stringify(next)!==JSON.stringify(sentences);sentences=next;boardOk=true;}
 else if(list.status==='rejected')problems.push(list.reason?.message||'유물 문장을 불러오지 못했어요.');
 if(data.status==='fulfilled'){({sorts,teams,facts,rows:roomRows}=data.value);roomOk=true;}
 else problems.push(data.reason?.message||'로봇 자료를 불러오지 못했어요.');
 if(boardOk||roomOk)writeCache(code,sentences,roomRows);
 const firstLive=!live&&boardOk&&roomOk;if(firstLive)live=true;
 const wasLoaded=loaded;loaded=true;
 error=problems.length?`인터넷이 느려서 ${list.status==='rejected'?'3차시 유물 문장':'로봇 자료'}을 아직 못 불러왔어요. 8초마다 자동으로 다시 불러와요.${fromCache||boardOk?' 그동안 마지막으로 불러온 자료를 보여 줘요.':''}`:'';
 if(firstLive&&draft&&!draft.dirty)draft=null;
 if(!root.isConnected)return;
 if(!wasLoaded||boardChanged||firstLive&&fromCache)return render(root);
 put(root.querySelector('[data-live=status]'),statusView());
 paintLive(root);
}

function speak(text){
 if(!voiceOn||!('speechSynthesis' in window)||!text)return;
 speechSynthesis.cancel();
 const say=new SpeechSynthesisUtterance(text);say.lang='ko-KR';say.pitch=1.3;
 const voice=speechSynthesis.getVoices().find(v=>v.lang?.startsWith('ko'));if(voice)say.voice=voice;
 speechSynthesis.speak(say);
}
export function askGroupRobot(question,g){
 const nation=nationOfRobot(g),r=askNationRobot(question,nation,robotFacts(g).map(f=>({...f,nation})),nameOf);
 const hit=findArtifact(String(question||''));
 if(r.answer==='몰라요'&&hit){const owners=groups.filter(x=>x!==g&&(groupArtifacts(x).includes(hit.id)||robotFacts(x).some(f=>f.artifact===hit.id)));if(owners.length)r.say=`저는 ${objectJosa(nameOf(hit.id))} 배우지 않았어요. ${owners.map(o=>`${o}모둠 로봇`).join(', ')}에게 물어봐 주세요!`;}
 return r;
}
function ask(root,question){
 const g=currentRobot(),q=String(question||'').trim();if(!q)return;
 const r=askGroupRobot(q,g);
 chats[g]=[{q,r},...(chats[g]||[])].slice(0,6);render(root);
 speak(r.answer==='알려 줄게요'||r.say.startsWith(r.answer)?r.say:`${r.answer}. ${r.say}`);
 root.querySelector('input[name=question]')?.focus();
}
function listen(root){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition||listening)return;
 const rec=new Recognition();rec.lang='ko-KR';rec.interimResults=false;rec.maxAlternatives=1;
 rec.onresult=event=>{listening=false;ask(root,event.results[0][0].transcript);};
 rec.onerror=event=>{error=event.error==='not-allowed'?'마이크 사용을 허락해 주세요. 주소창 옆 자물쇠에서 마이크를 허용할 수 있어요.':'잘 듣지 못했어요. 다시 말해 주세요.';};
 rec.onend=()=>{if(listening){listening=false;render(root);}};
 listening=true;error='';render(root);
 try{rec.start();}catch{listening=false;render(root);}
}

// 다른 차시(5차시 '제미나이로 확인하기' 단추)에서 4차시의 특정 화면을 열 때 씁니다.
export function openStep(i){tab=i;}
export function mountLessonFour(root){
 const fresh=load();if(fresh.code!==session.code||fresh.group!==session.group){session=fresh;loaded=false;draft=null;sentences=[];sorts=[];teams=[];facts=[];roomRows=[];chats={};robotSel=0;resetAi();boardOk=roomOk=live=fromCache=false;}
 if(!loaded)showCached();
 liveRoot=root;error='';notice='';render(root);
 clearInterval(timer);
 timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);if(document.visibilityState==='visible')refresh(root);},8000);
 refresh(root,true);
 root.addEventListener('input',event=>{
  const el=event.target,form=el.form?.dataset.c4Form;
  if(form==='sort'){if(el.name==='criterion')draft.criterion=el.value;else if(el.dataset.bin){draft.bins[+el.dataset.bin].name=el.value;}draft.dirty=true;}
  if(form==='own'&&(el.name==='sentence'||el.name==='original'))own[el.name]=el.value;
 });
 root.addEventListener('change',event=>{
  const el=event.target,form=el.form?.dataset.c4Form;
  if(form==='sort'&&el.dataset.bin){notice='';render(root);root.querySelector(`input[data-bin="${el.dataset.bin}"]`)?.focus();}
  if(form==='own'&&['artifact','status','robot'].includes(el.name)){
   if(el.name==='robot'){teacherRobot=+el.value;own.artifact='';}else own[el.name]=el.value;
   notice='';render(root);root.querySelector(`[data-c4-form=own] [name=${el.name}]${el.type==='radio'?`[value="${el.value}"]`:''}`)?.focus();
  }
 });
 root.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,data=Object.fromEntries(new FormData(form)),kind=form.dataset.c4Form;
  if(kind==='join'){
   const code=String(data.code||'').trim().toLowerCase(),asTeacher=event.submitter?.name==='teacher';
   if(!/^[0-9a-z]{4,12}$/.test(code)){error='수업코드는 숫자 4~12자리로 입력해 주세요.';return render(root);}
   if(!asTeacher&&!data.group){error='우리 모둠을 골라 주세요.';session.code=code;return render(root);}
   session={code,group:asTeacher?0:Number(data.group),author:session.author||token()};saveSession(session);
   loaded=false;draft=null;robotSel=0;own=blankOwn();resetAi();error='';sentences=[];sorts=[];teams=[];facts=[];roomRows=[];boardOk=roomOk=live=fromCache=false;showCached();render(root);refresh(root,true);return;
  }
  if(kind==='own'){
   Object.assign(own,{sentence:String(data.sentence||''),original:String(data.original??own.original)});
   const robot=teacher()?teacherRobot:session.group;
   if(!own.artifact){error='어떤 유물에 대한 문장인지 골라 주세요.';return render(root);}
   if(!own.sentence.trim()){error='가르칠 문장을 적어 주세요.';return render(root);}
   if(own.status==='고친 문장'&&!own.original.trim()){error='틀렸던 원래 문장도 적어 주세요.';return render(root);}
   try{await teachRobot(session.code,session.author,session.group,{robot,nation:nationOfRobot(robot),artifact:own.artifact,sentence:own.sentence.trim(),original:own.original.trim(),status:own.status,source:''});
    own={...own,sentence:'',original:''};error='';notice=`${robotName(robot)}이 새 문장을 배웠어요!`;await refresh(root);render(root);}
   catch(err){error=err.message;render(root);}
  }
  if(kind==='ask')ask(root,data.question);
  if(kind==='ai-ask'){form.reset();const g=aiRobotNow(),q=data.question;withPin(()=>runAsk(root,g,q));}
  if(kind==='ai-pin'&&aiPin){const pin=String(data.pin||'').trim();if(!pin)return;keepPin(pin);const next=aiPin.action;aiPin=null;rerender();next();}
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c4]');if(!el)return;
  const action=el.dataset.c4;
  if(action==='tab'){tab=+el.dataset.tab;notice='';error='';render(root);window.scrollTo(0,0);}
  if(action==='leave'){session={code:session.code,group:null,author:session.author};saveSession(session);draft=null;chats={};robotSel=0;own=blankOwn();trapOpen=false;resetAi();render(root);}
  if(action==='trap'){event.preventDefault();trapOpen=!trapOpen;render(root);}
  if(action==='refresh'){await refresh(root,true);if(tab===3){aiSetup=null;rerender();}}
  if(action==='bin-add'&&draft.bins.length<6){draft.bins.push({name:'',items:[]});render(root);root.querySelector(`input[data-bin="${draft.bins.length-1}"]`)?.focus();}
  if(action==='bin-remove'&&draft.bins.length>1){draft.bins.splice(+el.dataset.bin,1);draft.dirty=true;render(root);}
  if(action==='place'){const id=el.dataset.id,i=+el.dataset.bin;const already=draft.bins[i].items.includes(id);draft.bins.forEach(b=>b.items=b.items.filter(x=>x!==id));if(!already)draft.bins[i].items.push(id);draft.dirty=true;notice='';const y=window.scrollY;render(root);window.scrollTo(0,y);}
  if(action==='sort-save'){
   const bins=draft.bins.filter(b=>b.name.trim()).map(b=>({name:b.name.trim(),items:b.items}));
   if(!draft.criterion.trim()){error='우리 기준을 적어 주세요.';return render(root);}
   if(!bins.length){error='묶음 이름을 하나 이상 지어 주세요.';return render(root);}
   try{await saveSort(session.code,session.author,session.group,draft.criterion.trim(),bins,roomRows);draft.dirty=false;error='';notice='우리 분류를 저장했어요. TV에서 다른 모둠과 비교해 봐요.';await refresh(root);render(root);}
   catch(err){error=err.message;render(root);}
  }
  if(action==='teach'){
   const s=sentences.find(x=>x.id===el.dataset.id);if(!s)return;
   el.disabled=true;
   if(robotFacts(session.group).some(f=>f.source===s.id)){el.disabled=false;return;}
   try{await teachRobot(session.code,session.author,session.group,{robot:session.group,nation:nationOfRobot(session.group),artifact:idOfName(s.artifact),sentence:s.sentence,original:s.original||'',status:s.status,source:s.id});error='';notice='';await refresh(root);const y=window.scrollY;render(root);window.scrollTo(0,y);}
   catch(err){error=err.message;render(root);}
  }
  if(action==='forget'&&confirm('로봇이 이 문장을 잊게 할까요?')){
   try{await forget(session.code,session.author,el.dataset.id);facts=facts.filter(f=>f.id!==el.dataset.id);paintLive(root);}
   catch(err){error=err.message;render(root);}
  }
  if(action==='robot'){robotSel=+el.dataset.group;render(root);refresh(root);}
  if(action==='voice'){voiceOn=!voiceOn;if(!voiceOn&&'speechSynthesis' in window)speechSynthesis.cancel();render(root);}
  if(action==='listen')listen(root);
  if(action==='ai-robot'){aiRobot=+el.dataset.group;rerender();}
  if(action==='ai-check'){const g=aiRobotNow();withPin(()=>runCheck(root,g));}
  if(action==='ai-all')withPin(()=>runAllChecks(root));
  if(action==='ai-try'){const g=aiRobotNow(),q=el.dataset.q;withPin(()=>runAsk(root,g,q));}
  if(action==='ai-pin-cancel'){aiPin=null;rerender();}
  if(action==='handout')openHandouts(+el.dataset.group||0);
  if(action==='ai-copy'){
   const text=promptText(checkSections(aiRequest('check',aiRobotNow())));
   let copied=false;
   try{await navigator.clipboard.writeText(text);copied=true;}
   catch{const box=document.createElement('textarea');box.value=text;box.setAttribute('readonly','');box.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(box);box.select();try{copied=document.execCommand('copy');}catch{}box.remove();}
   el.textContent=copied?'복사했어요! 제미나이에 붙여 넣으세요':'복사하지 못했어요. 위 글을 길게 눌러 복사해 주세요';
  }
 });
}

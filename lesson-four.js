import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
import {observationIds} from './lesson-one.js';
import {loadSession as load,saveSession,token,rpc,loadRoom,saveSort,teach as teachRobot,forget} from './lesson-four-store.js';
import {askNationRobot,nationPrompt,findArtifact,defaultTeams} from './robot.js';

// 4차시: 3차시 문장판의 유물을 우리 기준으로 나누고, 나라별 역사 로봇에게 우리 반 검증 문장을 가르칩니다.
export const fourthSteps=['우리 기준으로 나누기','모둠 로봇 가르치기','로봇에게 묻기','진짜 AI와 비교하기'];
const fourthTimes=[15,10,12,3];
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
 const ids=boardIds(),left=ids.filter(id=>binOf(id)<0).length;
 return `<section class="c3-card"><p class="c3-guide">정답은 없어요. <b>규칙이 하나</b>이고, <b>모든 유물이 어딘가에 들어가고</b>, <b>3차시 문장으로 이유를 말할 수 있으면</b> 좋은 기준이에요.</p><form data-c4-form="sort"><label class="field"><span>1. 우리 기준</span><input name="criterion" maxlength="100" value="${e(draft.criterion)}" placeholder="예: 무엇에 썼는지로 나눴어요"></label><div class="c4-bin-names"><span>2. 묶음 이름</span>${draft.bins.map((b,i)=>`<label><input name="bin-${i}" data-bin="${i}" maxlength="20" value="${e(b.name)}" placeholder="묶음 ${i+1}">${draft.bins.length>1?`<button type="button" class="quiet small" data-c4="bin-remove" data-bin="${i}" aria-label="묶음 ${i+1} 빼기">×</button>`:''}</label>`).join('')}${draft.bins.length<6?'<button type="button" class="quiet small" data-c4="bin-add">묶음 추가 +</button>':''}</div></form><h3 class="c4-sub">3. 유물 카드를 묶음에 넣어요 <small>${left?`아직 안 넣은 유물 ${left}개`:'모두 넣었어요!'}</small></h3><div class="c4-arts">${ids.map(artifactCard).join('')}</div><button class="primary c3-wide" type="button" data-c4="sort-save">우리 분류 저장하기</button>${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</section><section class="c3-board" data-live="sorts">${sortsView()}</section>`;
}
function sortsView(){
 return `<div class="c3-board-head"><h2>모둠별 분류</h2></div><div class="c4-sorts">${groups.map(g=>{const s=sorts.find(x=>x.group===g);return `<section class="c3-group ${g===session.group?'is-mine':''}"><h3>${g}모둠</h3>${s?`<p class="c4-criterion">${e(s.criterion)}</p>${s.bins.map(b=>`<div class="c4-bin"><b>${e(b.name)}</b><span>${b.items.map(id=>e(nameOf(id))).join(', ')||'—'}</span></div>`).join('')}`:'<p class="c3-empty">아직 저장하지 않았어요.</p>'}</section>`;}).join('')}</div>${teacher()?`<details class="c4-teacher"><summary>교사용 기준 예시 (학생에게 보여 주지 마세요)</summary><table><thead><tr><th>기준</th><th>나뉘는 모습</th><th>좋은 점</th></tr></thead><tbody>${criterionExamples.map(r=>`<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table><p>정답 기준은 없습니다. 규칙이 하나인지, 모든 유물이 들어갔는지, 3차시 문장으로 이유를 말하는지만 확인합니다.</p></details>`:''}`;
}


// 모둠 로봇: 모둠마다 로봇이 하나씩 있고, 그 모둠이 3차시에 조사한 유물만 설명합니다.
const nationOf=id=>art(id)?.nation||'';
const idOfName=name=>artifacts.find(a=>a.name===name)?.id||'';
function boardNation(group){
 const ids=sentences.filter(s=>s.group===group).slice(0,3).map(s=>idOfName(s.artifact)).filter(Boolean);if(!ids.length)return '';
 const count={};ids.forEach(id=>count[id]=(count[id]||0)+1);
 return nationOf(ids.reduce((best,id)=>count[id]>count[best]?id:best,ids[0]));
}
const nationOfRobot=g=>boardNation(g)||defaultTeams[g]||'고구려';
const robotName=g=>`${g}모둠 ${nationOfRobot(g)} 로봇`;
const groupArtifacts=g=>[...new Set(sentences.filter(s=>s.group===g).map(s=>idOfName(s.artifact)).filter(Boolean))];
const robotFacts=g=>facts.filter(f=>f.robot===g);
const robotFace={'고구려':'🔴','백제':'🟡','신라':'🟢','가야':'🔵'};
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
 return `<section class="c3-card c4-robot"><div class="c4-team-pick"><span>누구에게 물어볼까요?</span>${groups.map(x=>`<button type="button" class="small ${x===g?'primary':'quiet'}" data-c4="robot" data-group="${x}" aria-pressed="${x===g}">${robotFace[nationOfRobot(x)]} ${e(robotName(x))} · ${robotFacts(x).length}</button>`).join('')}</div><div class="c4-robot-head"><span class="c4-face" aria-hidden="true">🤖<i>${robotFace[nationOfRobot(g)]}</i></span><div><h2>${e(robotName(g))}</h2><p>담당 유물: ${groupArtifacts(g).map(id=>e(nameOf(id))).join(', ')||'아직 없음'} · 배운 문장 ${robotFacts(g).length}개</p></div><button class="quiet small" type="button" data-c4="voice" aria-pressed="${voiceOn}">${voiceOn?'🔊 목소리 켜짐':'🔇 목소리 꺼짐'}</button></div><form data-c4-form="ask"><label class="field"><span>로봇에게 물어볼 말</span><input name="question" maxlength="120" autocomplete="off" placeholder="예: 토우는 무엇으로 만들었어?"></label><div class="c4-ask-row">${speech?`<button class="quiet c4-mic ${listening?'is-on':''}" type="button" data-c4="listen">${listening?'듣는 중… 말해 주세요':'🎤 말로 묻기'}</button>`:''}<button class="primary" type="submit">⌨️ 글로 묻기</button></div></form>${speech?'':'<p class="c3-empty">이 기기에서는 말로 묻기가 안 돼요. 글로 물어봐 주세요.</p>'}<ol class="c4-chat">${list.map(({q,r})=>`<li><p class="c4-q">${e(q)}</p><p class="c4-a" data-kind="${kinds[r.answer]||'unknown'}"><b>${e(r.answer)}</b> ${e(r.say)}</p><p class="c4-thought">로봇의 생각 · 유물: ${e(r.thought.artifact||'못 찾음')}${r.thought.match?` · 가장 비슷한 배운 문장(${r.thought.score}%): ${e(r.thought.match)}`:''}${r.thought.words.length?` · 같은 말: ${e(r.thought.words.join(', '))}`:''}</p>${r.fact?`<p class="c4-thought">근거: ${e(who(r.fact.group))}가 가르친 문장</p>`:''}</li>`).join('')}</ol><p class="c3-guide">로봇의 대답이 이상하면 <b>근거 문장</b>을 보세요. 틀린 문장을 가르쳤다면 2번에서 지우고 바른 문장을 가르쳐요. 다른 모둠 유물은 그 모둠 로봇에게 물어봐요.</p></section>`;
}

function promptFor(g){const label=`${g}모둠 ${nationOfRobot(g)}`;return nationPrompt(label,robotFacts(g).map(f=>({...f,nation:label})),nameOf);}
function compareView(){
 return `<section class="c3-card"><h2>진짜 AI도 배운 것만 말할까요?</h2>${teacher()?`<ol class="c4-steps-list"><li>모둠 로봇의 <b>요청문 복사</b>를 눌러요.</li><li>챗GPT 새 대화에 붙여 넣어요. 휴대폰 챗GPT의 <b>음성 대화</b>를 쓰면 진짜 로봇처럼 말로 대화할 수 있어요.</li><li>우리 로봇에게 했던 질문을 진짜 AI에게도 똑같이 해요.</li></ol><div class="c4-copy">${groups.map(g=>`<button class="quiet" type="button" data-c4="copy" data-group="${g}">${robotFace[nationOfRobot(g)]} ${e(robotName(g))} 요청문 복사</button>`).join('')}</div><textarea class="c4-prompt" readonly rows="8" aria-label="진짜 AI 요청문">${e(promptFor(teacherRobot))}</textarea>`:'<p>선생님이 우리 모둠이 가르친 문장을 진짜 AI에게 넣고, 같은 질문을 해요.</p>'}<h3 class="c4-sub">비교하며 이야기해요</h3><ul class="c4-steps-list"><li>진짜 AI는 우리가 <b>가르치지 않은 것</b>도 대답했나요?</li><li>누가 “몰라요”를 더 잘했나요?</li><li>틀린 문장(함정)을 가르쳤을 때 두 로봇은 어떻게 대답했나요?</li></ul><div class="c3-guide c3-done"><b>오늘의 정리</b><br>① 로봇은 배운 것만 안다. ② 틀리게 가르치면 틀리게 대답한다. ③ 모르면 “몰라요”라고 하는 로봇이 좋은 로봇이다.</div><p class="c3-guide">다음 시간(5차시)에는 우리 모둠 로봇의 모습을 유물에서 근거를 찾아 디자인해요.</p></section>`;
}

function render(root){
 if(!joined()){root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 const body=[sortView,teachView,robotView,compareView][tab]();
 root.innerHTML=`<div class="c3-page c4-page ${teacher()?'c4-tv':''}"><div class="c3-bar"><p>수업코드 <b>${e(session.code)}</b> · <b>${teacher()?'선생님 화면':e(robotName(session.group))}</b></p><div><button class="quiet small" type="button" data-c4="refresh">다시 불러오기</button><button class="quiet small" type="button" data-c4="leave">나가기</button></div></div><nav class="c4-tabs" aria-label="4차시 활동 순서">${fourthSteps.map((label,i)=>`<button type="button" data-c4="tab" data-tab="${i}" ${i===tab?'aria-current="step"':''}><span>${i+1}</span>${label}<small>${fourthTimes[i]}분</small></button>`).join('')}</nav>${error?`<p class="c3-message" role="alert">${e(error)}</p>`:''}${!loaded?'<p class="c3-guide">반 자료를 불러오는 중이에요…</p>':''}${body}</div>`;
}
function paintLive(root){
 const s=root.querySelector('[data-live=sorts]');if(s)s.innerHTML=sortsView();
 const r=root.querySelector('[data-live=robots]');if(r)r.innerHTML=robotsView();
}

async function refresh(root,full=false){
 if(!joined())return;
 try{
  const [list,room]=await Promise.all([full||!loaded?rpc('class5_list',{p_code:session.code,p_author:session.author}):null,loadRoom(session.code,session.author)]);
  if(list)sentences=Array.isArray(list.sentences)?list.sentences:[];
  ({sorts,teams,facts,rows:roomRows}=room);
  const first=!loaded;loaded=true;error='';
  if(first&&draft&&!draft.dirty)draft=null;
  if(first)return render(root);
 }catch(err){error=err.message;if(!loaded){loaded=true;return render(root);}}
 if(root.isConnected)paintLive(root);
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

export function mountLessonFour(root){
 const fresh=load();if(fresh.code!==session.code||fresh.group!==session.group){session=fresh;loaded=false;draft=null;sentences=[];sorts=[];teams=[];facts=[];chats={};robotSel=0;}
 error='';notice='';render(root);
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
   loaded=false;draft=null;robotSel=0;own=blankOwn();error='';render(root);refresh(root,true);return;
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
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c4]');if(!el)return;
  const action=el.dataset.c4;
  if(action==='tab'){tab=+el.dataset.tab;notice='';error='';render(root);window.scrollTo(0,0);}
  if(action==='leave'){session={code:session.code,group:null,author:session.author};saveSession(session);draft=null;chats={};robotSel=0;own=blankOwn();trapOpen=false;render(root);}
  if(action==='trap'){event.preventDefault();trapOpen=!trapOpen;render(root);}
  if(action==='refresh')refresh(root,true);
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
  if(action==='copy'){
   teacherRobot=+el.dataset.group;const text=promptFor(teacherRobot);
   render(root);
   try{await navigator.clipboard.writeText(text);notice='';const b=root.querySelector(`[data-c4=copy][data-group="${teacherRobot}"]`);if(b)b.textContent='복사했어요! 챗GPT에 붙여 넣으세요';}
   catch{root.querySelector('.c4-prompt')?.select();}
  }
 });
}

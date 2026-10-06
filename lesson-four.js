import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
import {observationIds} from './lesson-one.js';
import {load,saveSession,token,rpc,newArtifacts} from './lesson-three.js';
import {askRobot,realAiPrompt,nations,materials} from './robot.js';

// 4차시: 3차시 문장판의 유물을 우리 기준으로 나누고, 지식 카드로 우리 반 역사 로봇을 가르칩니다.
export const fourthSteps=['우리 기준으로 나누기','로봇 가르치기','로봇 시험하고 고치기','진짜 AI와 비교하기'];
const fourthTimes=[15,10,12,3];
const groups=[1,2,3,4,5,6];
const bonusIds=['guests','belt'];
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
const examples=['금관은 고구려 유물이다','토우는 흙으로 만들었다','첨성대는 돌로 만들었다','가야 유물은 모두 철로 만들었다','갑옷은 몸을 보호했다'];

let session=load(),tab=0,sentences=[],sorts=[],cards=[],loaded=false,error='',notice='',timer=null,fitRoot=null;
let draft=null,teach={artifact:'',nation:'',material:'',use:'',feature:''},chat=[];

const joined=()=>session.code&&session.group!==null&&session.author;
const teacher=()=>session.group===0;
function boardIds(){const named=new Set(sentences.map(s=>artifacts.find(a=>a.name===s.artifact)?.id).filter(Boolean));return [...observationIds,...Object.values(newArtifacts),...bonusIds.filter(id=>named.has(id))];}
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

function teachView(){
 const ids=boardIds(),chosen=teach.artifact;
 const ref=chosen?sentencesOf(chosen):[];
 return `<section class="c3-card"><p class="c3-guide">${teacher()?'선생님 카드도 로봇에게 들어가요. 일부러 틀린 <b>함정 카드</b>를 하나 넣어 보세요.':'<b>3차시 문장판에서 확인한 내용만</b> 가르쳐요. 로봇은 우리가 가르친 것만 알아요.'}</p><form data-c4-form="teach"><div class="two-cols"><label class="field"><span>1. 무엇을 가르칠까요?</span><select name="artifact"><option value="">나라 전체의 특징</option>${ids.map(id=>`<option value="${id}" ${chosen===id?'selected':''}>${e(nameOf(id))}</option>`).join('')}</select></label><label class="field"><span>2. 나라</span><select name="nation"><option value="">골라 주세요</option>${nations.map(n=>`<option ${teach.nation===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="two-cols"><label class="field"><span>3. 재료</span><select name="material"><option value="">가르치지 않음</option>${materials.map(m=>`<option ${teach.material===m?'selected':''}>${m}</option>`).join('')}</select></label><label class="field"><span>4. 쓰임</span><input name="use" maxlength="80" value="${e(teach.use)}" placeholder="예: 몸과 머리를 보호"></label></div><label class="field"><span>5. 특징</span><input name="feature" maxlength="200" value="${e(teach.feature)}" placeholder="예: 철판을 이어 만들었다"></label><button class="primary c3-wide" type="submit">로봇에게 가르치기</button></form>${ref.length?`<details class="c4-ref" open><summary>3차시 문장판의 ${e(nameOf(chosen))} 문장</summary><ul>${ref.map(s=>`<li>${statusMark[s.status]||''} ${e(s.sentence)}</li>`).join('')}</ul></details>`:''}${notice?`<p class="c3-guide c3-done" role="status">${e(notice)}</p>`:''}</section><section class="c3-board" data-live="cards">${cardsView()}</section>`;
}
function cardLine(c,removable=true){
 return `<li><b>${e(c.artifact?nameOf(c.artifact):`${c.nation} 전체`)}</b>${c.material?` · 재료 ${e(c.material)}`:''}${c.use?` · 쓰임 ${e(c.use)}`:''}${c.feature?` · ${e(c.feature)}`:''} <small>${who(c.group)}</small>${removable&&c.mine?` <button class="quiet small" type="button" data-c4="card-remove" data-id="${e(c.id)}">지우기</button>`:''}</li>`;
}
function cardsView(){
 return `<div class="c3-board-head"><h2>우리 반 로봇이 배운 것 <small>카드 ${cards.length}장</small></h2></div><div class="c4-nations">${nations.map(n=>`<section class="c3-group"><h3>${n}</h3>${cards.some(c=>c.nation===n)?`<ul>${cards.filter(c=>c.nation===n).map(c=>cardLine(c)).join('')}</ul>`:'<p class="c3-empty">아직 배운 카드가 없어요.</p>'}</section>`).join('')}</div>`;
}

function robotView(){
 const badge={'맞아요':'ok','아니에요':'no','몰라요':'unknown','헷갈려요':'mixed','못 알아들었어요':'unknown'};
 return `<section class="c3-card c4-robot"><div class="c4-robot-head"><span aria-hidden="true">🤖</span><div><h2>우리 반 역사 로봇</h2><p>카드 ${cards.length}장을 배웠어요. 문장을 말하면 맞아요 · 아니에요 · 몰라요로 대답해요.</p></div></div><form data-c4-form="ask"><label class="field"><span>로봇에게 물어볼 문장</span><input name="question" maxlength="120" autocomplete="off" placeholder="예: 금관은 고구려 유물이다"></label><button class="primary c3-wide" type="submit">로봇에게 묻기</button></form><div class="c4-examples">${examples.map(q=>`<button class="quiet small" type="button" data-c4="example" data-q="${e(q)}">${e(q)}</button>`).join('')}</div><ol class="c4-chat">${chat.map(({q,r})=>`<li><p class="c4-q">${e(q)}</p><p class="c4-a" data-kind="${badge[r.answer]||'unknown'}"><b>${e(r.answer)}</b> ${e(r.reason)}</p><p class="c4-thought">로봇의 생각 · 유물: ${e(r.thought.artifact||'못 찾음')} · 나라: ${e(r.thought.nation||'—')} · 재료: ${e(r.thought.material||'—')}${r.thought.words.length?` · 같은 말: ${e(r.thought.words.join(', '))}`:''}</p>${r.evidence.length?`<ul class="c4-evidence">${r.evidence.map(c=>cardLine(c,false)).join('')}</ul>`:''}</li>`).join('')}</ol><p class="c3-guide">로봇이 틀렸다면 <b>근거 카드</b>를 보세요. 틀린 카드가 있으면 2번에서 고쳐요. 내가 가르친 카드만 지울 수 있어요. 다른 모둠 카드라면 그 모둠에 알려 주세요.</p></section>`;
}

function compareView(){
 const prompt=realAiPrompt(cards,nameOf);
 return `<section class="c3-card"><h2>진짜 AI에게 같은 카드를 주면 어떻게 대답할까요?</h2>${teacher()?`<ol class="c4-steps-list"><li>아래 <b>요청문 복사하기</b>를 눌러요.</li><li>챗GPT나 제미나이의 새 대화에 붙여 넣어요.</li><li>아이들이 우리 로봇에게 했던 질문을 진짜 AI에게도 똑같이 해요.</li></ol><button class="primary" type="button" data-c4="copy">요청문 복사하기</button><textarea class="c4-prompt" readonly rows="8" aria-label="진짜 AI 요청문">${e(prompt)}</textarea>`:'<p>선생님이 TV에서 진짜 AI에게 우리 반 카드를 넣고 같은 질문을 해요.</p>'}<h3 class="c4-sub">비교하며 이야기해요</h3><ul class="c4-steps-list"><li>진짜 AI는 우리가 <b>가르치지 않은 것</b>도 대답했나요?</li><li>누가 “몰라요”를 더 잘했나요?</li><li>함정 카드가 있을 때 두 로봇은 어떻게 대답했나요?</li></ul><div class="c3-guide c3-done"><b>오늘의 정리</b><br>① 로봇은 배운 것만 안다. ② 틀리게 가르치면 틀리게 대답한다. ③ 모르면 “몰라요”라고 하는 로봇이 좋은 로봇이다.</div><p class="c3-guide">다음 시간(5차시)에는 우리 분류 묶음으로 AI에게 그림을 그리게 하고, 그림 속 실수를 근거로 찾아요.</p></section>`;
}

function render(root){
 if(!joined()){root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 const body=[sortView,teachView,robotView,compareView][tab]();
 root.innerHTML=`<div class="c3-page c4-page ${teacher()?'c4-tv':''}"><div class="c3-bar"><p>수업코드 <b>${e(session.code)}</b> · <b>${teacher()?'선생님 화면':session.group+'모둠'}</b></p><div><button class="quiet small" type="button" data-c4="refresh">다시 불러오기</button><button class="quiet small" type="button" data-c4="leave">나가기</button></div></div><nav class="c4-tabs" aria-label="4차시 활동 순서">${fourthSteps.map((label,i)=>`<button type="button" data-c4="tab" data-tab="${i}" ${i===tab?'aria-current="step"':''}><span>${i+1}</span>${label}<small>${fourthTimes[i]}분</small></button>`).join('')}</nav>${error?`<p class="c3-message" role="alert">${e(error)}</p>`:''}${!loaded?'<p class="c3-guide">반 자료를 불러오는 중이에요…</p>':''}${body}</div>`;
}
function paintLive(root){
 const s=root.querySelector('[data-live=sorts]');if(s)s.innerHTML=sortsView();
 const c=root.querySelector('[data-live=cards]');if(c)c.innerHTML=cardsView();
}

async function refresh(root,full=false){
 if(!joined())return;
 try{
  const [list,sortList,cardList]=await Promise.all([full||!loaded?rpc('class5_list',{p_code:session.code,p_author:session.author}):null,rpc('class5_sort_list',{p_code:session.code}),rpc('class5_card_list',{p_code:session.code,p_author:session.author})]);
  if(list)sentences=Array.isArray(list.sentences)?list.sentences:[];
  sorts=Array.isArray(sortList.sorts)?sortList.sorts:[];cards=Array.isArray(cardList.cards)?cardList.cards:[];
  const first=!loaded;loaded=true;error='';
  if(first&&draft&&!draft.dirty)draft=null;
  if(first)return render(root);
 }catch(err){error=err.message;if(!loaded){loaded=true;return render(root);}}
 if(root.isConnected)paintLive(root);
}

export function mountLessonFour(root){
 fitRoot=root;
 const fresh=load();if(fresh.code!==session.code||fresh.group!==session.group){session=fresh;loaded=false;draft=null;sentences=[];sorts=[];cards=[];chat=[];}
 error='';notice='';render(root);
 clearInterval(timer);
 timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);if(document.visibilityState==='visible')refresh(root);},8000);
 refresh(root,true);
 root.addEventListener('input',event=>{
  const el=event.target,form=el.form?.dataset.c4Form;
  if(form==='sort'){if(el.name==='criterion')draft.criterion=el.value;else if(el.dataset.bin){draft.bins[+el.dataset.bin].name=el.value;}draft.dirty=true;}
  if(form==='teach'&&el.name in teach&&el.tagName!=='SELECT')teach[el.name]=el.value;
 });
 root.addEventListener('change',event=>{
  const el=event.target;
  if(el.form?.dataset.c4Form==='sort'&&el.dataset.bin){notice='';render(root);root.querySelector(`input[data-bin="${el.dataset.bin}"]`)?.focus();}
  if(el.form?.dataset.c4Form==='teach'&&el.tagName==='SELECT'){teach[el.name]=el.value;if(el.name==='artifact'&&el.value)teach.nation=art(el.value)?.nation||teach.nation;notice='';render(root);root.querySelector(`select[name=${el.name}]`)?.focus();}
 });
 root.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,data=Object.fromEntries(new FormData(form)),kind=form.dataset.c4Form;
  if(kind==='join'){
   const code=String(data.code||'').trim().toLowerCase(),asTeacher=event.submitter?.name==='teacher';
   if(!/^[0-9a-z]{4,12}$/.test(code)){error='수업코드는 숫자 4~12자리로 입력해 주세요.';return render(root);}
   if(!asTeacher&&!data.group){error='우리 모둠을 골라 주세요.';session.code=code;return render(root);}
   session={code,group:asTeacher?0:Number(data.group),author:session.author||token()};saveSession(session);
   loaded=false;draft=null;error='';render(root);refresh(root,true);return;
  }
  if(kind==='teach'){
   Object.assign(teach,{use:String(data.use||''),feature:String(data.feature||'')});
   if(!teach.nation){error='나라를 골라 주세요.';return render(root);}
   if(!teach.material&&!teach.use.trim()&&!teach.feature.trim()){error='재료·쓰임·특징 중 하나는 가르쳐 주세요.';return render(root);}
   try{await rpc('class5_card_add',{p_code:session.code,p_group:session.group,p_artifact:teach.artifact,p_nation:teach.nation,p_material:teach.material,p_use:teach.use.trim(),p_feature:teach.feature.trim(),p_author:session.author});
    teach={...teach,material:'',use:'',feature:''};error='';notice='로봇이 새 카드를 배웠어요!';await refresh(root);render(root);}
   catch(err){error=err.message;render(root);}
  }
  if(kind==='ask'){
   const q=String(data.question||'').trim();if(!q)return;
   chat=[{q,r:askRobot(q,cards,nameOf)},...chat].slice(0,6);render(root);root.querySelector('input[name=question]')?.focus();
  }
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c4]');if(!el)return;
  const action=el.dataset.c4;
  if(action==='tab'){tab=+el.dataset.tab;notice='';error='';render(root);window.scrollTo(0,0);}
  if(action==='leave'){session={code:session.code,group:null,author:session.author};saveSession(session);draft=null;chat=[];render(root);}
  if(action==='refresh')refresh(root,true);
  if(action==='bin-add'&&draft.bins.length<6){draft.bins.push({name:'',items:[]});render(root);root.querySelector(`input[data-bin="${draft.bins.length-1}"]`)?.focus();}
  if(action==='bin-remove'&&draft.bins.length>1){draft.bins.splice(+el.dataset.bin,1);draft.dirty=true;render(root);}
  if(action==='place'){const id=el.dataset.id,i=+el.dataset.bin;const already=draft.bins[i].items.includes(id);draft.bins.forEach(b=>b.items=b.items.filter(x=>x!==id));if(!already)draft.bins[i].items.push(id);draft.dirty=true;notice='';const y=window.scrollY;render(root);window.scrollTo(0,y);}
  if(action==='sort-save'){
   const bins=draft.bins.filter(b=>b.name.trim()).map(b=>({name:b.name.trim(),items:b.items}));
   if(!draft.criterion.trim()){error='우리 기준을 적어 주세요.';return render(root);}
   if(!bins.length){error='묶음 이름을 하나 이상 지어 주세요.';return render(root);}
   try{await rpc('class5_sort_save',{p_code:session.code,p_group:session.group,p_criterion:draft.criterion.trim(),p_bins:bins,p_author:session.author});draft.dirty=false;error='';notice='우리 분류를 저장했어요. TV에서 다른 모둠과 비교해 봐요.';await refresh(root);render(root);}
   catch(err){error=err.message;render(root);}
  }
  if(action==='card-remove'&&confirm('이 카드를 로봇에게서 지울까요?')){
   try{await rpc('class5_card_remove',{p_code:session.code,p_id:el.dataset.id,p_author:session.author});cards=cards.filter(c=>c.id!==el.dataset.id);paintLive(root);}
   catch(err){error=err.message;render(root);}
  }
  if(action==='example'){const input=root.querySelector('input[name=question]');if(input){input.value=el.dataset.q;input.form.requestSubmit();}}
  if(action==='copy'){
   const text=realAiPrompt(cards,nameOf);
   try{await navigator.clipboard.writeText(text);el.textContent='복사했어요!';}
   catch{const area=root.querySelector('.c4-prompt');area?.select();el.textContent='위 글을 길게 눌러 복사해 주세요';}
  }
 });
}

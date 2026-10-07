import {escapeHtml as e} from './model.js';
import {artifacts,coreArtifacts} from './data.js';
import {observationIds} from './lesson-one.js';
import {verificationSets} from './lesson-two-data.js';
import {extraSets} from './lesson-three-data.js';

// 3차시: 수업코드로 입장한 모둠이 검증한 문장을 우리 반 문장판에 올립니다.
const API='https://awjndrxyyqyngybulyor.supabase.co/rest/v1/rpc/';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3am5kcnh5eXF5bmd5YnVseW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTEwMTUsImV4cCI6MjA5OTg4NzAxNX0.9G8aCw9jG8eSmeUaLOSiD0Fl34GpOD44XVOqTwCMWa4';
const STORE='moakit-5class-l3';
export const sentenceStatuses=[['사실 확인','자료로 맞다고 확인한 문장'],['고친 문장','틀린 문장을 자료에 맞게 고친 문장'],['판단 보류','자료로는 맞는지 알 수 없는 문장']];
export const groupGoal=6;
const groups=[1,2,3,4,5,6];
// 2차시 문장 4개를 올린 모둠은 아직 아무도 조사하지 않은 교과서 유물을 하나씩 맡습니다.
const firstGoal=3;
export const newArtifacts={1:'kitchen',2:'dancers',3:'gold-crown',4:'buddha',5:'seosan',6:'glass'};
const bonusArtifacts=['guests','belt'];
const shortNames={kitchen:'부엌·고기 창고 그림',dancers:'춤추는 사람들 그림','gold-crown':'황남대총 금관',buddha:'연가 7년명 금동 불상',seosan:'서산 마애여래 삼존상',glass:'신라 유리 제품'};
export const art=id=>artifacts.find(a=>a.id===id);
const idOfName=name=>artifacts.find(a=>a.name===name)?.id||'';
const claimsFor=id=>extraSets[id]?.claims||verificationSets[id]?.claims||[];
// 모둠의 첫 문장(2차시 유물)의 나라를 보고, 같은 나라에서 아직 조사하지 않은 유물을 새로 맡깁니다.
// 첫 문장들(2차시 문장) 가운데 가장 많이 고른 유물을 그 모둠의 유물로 봅니다.
function firstArtifact(group){
 const ids=rows.filter(x=>x.group===group).slice(0,firstGoal).map(r=>idOfName(r.artifact)).filter(Boolean);
 if(!ids.length)return '';
 const count={};ids.forEach(id=>count[id]=(count[id]||0)+1);
 return ids.reduce((best,id)=>count[id]>count[best]?id:best,ids[0]);
}
// 새 유물이 맞지 않으면 모둠 태블릿에서 직접 바꿀 수 있습니다.
const pickKey=()=>`${STORE}-pick-${state.code}-${state.group}`;
function picked(){try{return localStorage.getItem(pickKey())||'';}catch{return '';}}
function pick(id){try{localStorage.setItem(pickKey(),id);}catch{}}
// 모둠 순서대로 같은 나라 유물을 나눠 줍니다. 아무도 조사하지 않았고 다른 모둠이 받지 않은 유물을 먼저 줍니다.
function assignments(){
 const owns=Object.fromEntries(groups.map(g=>[g,firstArtifact(g)]));
 const owned=new Set(Object.values(owns).filter(Boolean)),taken=new Set(),out={};
 for(const g of groups){
  const own=owns[g],nation=art(own)?.nation;if(!nation)continue;
  const pool=coreArtifacts.filter(a=>a.nation===nation&&a.id!==own&&claimsFor(a.id).length).map(a=>a.id);
  const choice=pool.find(id=>!owned.has(id)&&!taken.has(id))||pool.find(id=>!taken.has(id))||pool[0];
  if(choice){out[g]=choice;taken.add(choice);}
 }
 return out;
}
export function assignedArtifact(group){
 if(group===state.group&&claimsFor(picked()).length)return picked();
 return assignments()[group]||newArtifacts[group];
}
const shortName=id=>shortNames[id]||art(id)?.name||'';
const stepOf=count=>count<firstGoal?0:count<groupGoal?1:2;
let shownStep=-1;

let state=load(),rows=cached(),message='',boardError='',loaded=false,loading=false,big=false,timer=null;
let draft={artifact:'',sentence:'',original:'',source:'',status:'사실 확인'};

export function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return {code:/^[0-9a-z]{4,12}$/.test(v.code||'')?v.code:'',group:Number.isInteger(v.group)&&v.group>=0&&v.group<=6?v.group:null,author:/^[a-f0-9]{64}$/.test(v.author||'')?v.author:''};}catch{return {code:'',group:null,author:''};}}
function keep(){saveSession(state);}
export function saveSession(value){try{localStorage.setItem(STORE,JSON.stringify(value));}catch{}}
// 인터넷이 잠깐 끊겨도 마지막으로 불러온 문장판을 계속 보여 줍니다.
function cached(){try{const v=JSON.parse(localStorage.getItem(`${STORE}-rows`)||'{}');return v.code===load().code&&Array.isArray(v.rows)?v.rows:[];}catch{return [];}}
function cache(){try{localStorage.setItem(`${STORE}-rows`,JSON.stringify({code:state.code,rows}));}catch{}}
export function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function rpc(name,body){
 let response;
 try{response=await fetch(API+name,{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',apikey:KEY,Authorization:`Bearer ${KEY}`},body:JSON.stringify(body)});}
 catch{throw Error('인터넷 연결이 느려요. 잠시 뒤 ‘다시 불러오기’를 눌러 주세요.');}
 if(!response.ok)throw Error('문장판에 연결하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
 const value=await response.json();
 if(value&&value.error)throw Error(value.error);
 return value;
}
export function groupCounts(list){return groups.map(g=>list.filter(r=>r.group===g).length);}

const joined=()=>state.code&&state.group!==null&&state.author;
const nameFor=id=>artifacts.find(a=>a.id===id)?.name||'';
// 2차시 유물마다 '거짓'인 학습용 문장은 하나뿐이므로 원래 문장으로 미리 넣어 줍니다.
const wrongSentence=name=>{const id=observationIds.find(key=>nameFor(key)===name);return verificationSets[id]?.claims.find(c=>c.result==='거짓')?.text||'';};
let autoOriginal='';
function suggestOriginal(){if(draft.status!=='고친 문장')return;const next=wrongSentence(draft.artifact);if(!draft.original.trim()||draft.original===autoOriginal){draft.original=next;autoOriginal=next;}}

function joinView(){
 return `<section class="c3-card c3-join"><p class="c3-kicker">3차시 · 우리 반 문장 모으기</p><h1>수업코드를 넣고 입장해요</h1><p class="c3-lead">2차시에 검증한 문장을 우리 반 문장판에 올립니다.</p><form data-c3-form="join"><label class="field"><span>수업코드</span><input name="code" inputmode="numeric" autocomplete="off" maxlength="12" value="${e(state.code)}" placeholder="선생님이 알려 준 숫자" required></label><fieldset class="c3-choices c3-group-pick"><legend>우리 모둠</legend>${groups.map(g=>`<label><input type="radio" name="group" value="${g}" ${state.group===g?'checked':''}><span>${g}모둠</span></label>`).join('')}</fieldset><button class="primary c3-wide" type="submit">입장하기</button><button class="quiet c3-wide" type="submit" name="teacher" value="1">선생님 · 문장판만 보기</button></form>${message?`<p class="c3-message" role="alert">${e(message)}</p>`:''}</section>`;
}

function stepsView(step,count){
 const items=[['2차시 문장 올리기',`${Math.min(count,firstGoal)} / ${firstGoal}`],['새 유물 문장 확인하기',`${Math.max(0,Math.min(count-firstGoal,groupGoal-firstGoal))} / ${groupGoal-firstGoal}`],['문장판 함께 보기','']];
 return `<ol class="c3-steps">${items.map(([t,c],i)=>`<li class="${i<step?'is-done':i===step?'is-now':''}"><span>${i<step?'✓':i+1}</span><b>${t}</b>${c?`<small>${c}</small>`:''}</li>`).join('')}</ol>`;
}
function researchCard(a,label){
 return `<section class="c3-research"><img src="assets/images/${e(a.image)}" alt="${e(a.name)}"><div><p class="c3-kicker">${label}</p><h2>${e(a.name)}</h2><p class="c3-meta">${e(a.nation)} · 교과서 ${a.page}쪽</p><p class="c3-fact">${e(a.fact)}</p><p class="c3-caution">이렇게 단정하지 않아요: ${e(a.caution)}</p><small>사진: ${e(a.credit)}</small></div></section>`;
}
function guideView(step){
 if(step===0)return `<p class="c3-guide">2차시 활동지 2쪽에서 <b>검증한 문장 3개</b>를 올려요. 틀렸던 문장은 ‘고친 문장’을 골라요.</p>`;
 const a=art(assignedArtifact(state.group));
 if(step===1)return `${researchCard(a,`우리 모둠이 새로 맡은 ${a.nation} 유물`)}<details class="c3-pick"><summary>새 유물이 우리 나라와 다르면 여기서 바꿔요</summary><label class="field"><span>새로 맡을 유물</span><select data-c3-pick>${['고구려','백제','신라','가야'].map(n=>`<optgroup label="${n}">${coreArtifacts.filter(x=>x.nation===n&&claimsFor(x.id).length).map(x=>`<option value="${x.id}" ${x.id===a.id?'selected':''}>${e(x.name)}</option>`).join('')}</optgroup>`).join('')}</select></label></details>${claimsView(a.id)}`;
 return `<p class="c3-guide c3-done"><b>우리 모둠 ${groupGoal}문장 완성!</b> 아래 문장판에서 다른 모둠 문장을 읽고 <b>‘처음 알게 된 문장’ 하나</b>를 골라 두세요.</p><details class="c3-bonus"><summary>더 올리고 싶다면 · 보너스 유물</summary>${bonusArtifacts.map(id=>researchCard(art(id),'보너스 유물')+bonusClaims(id)).join('')}</details>`;
}
// 새 유물의 확인할 문장 3개: 카드와 교과서를 보고 판단한 뒤 고르면 아래 입력 칸이 채워집니다.
function claimsView(id){
 const set={claims:claimsFor(id)};if(!set.claims.length)return '';
 const done=text=>rows.some(r=>r.group===state.group&&(r.sentence===text||r.original===text));
 return `<section class="c3-claims"><h3>확인할 문장 3개</h3><p class="c3-guide">위 카드와 교과서를 읽고 문장마다 판단을 골라요. 고르면 아래 칸이 채워지고, <b>문장판에 올리기</b>를 누르면 끝이에요.</p><ol>${set.claims.map((c,i)=>`<li class="${done(c.text)?'is-done':''}"><p><span>문장 ${i+1}</span>${e(c.text)}${done(c.text)?' <b class="c3-check">✓ 올림</b>':''}</p>${done(c.text)?'':`<div>${[['사실 확인','맞아요'],['고친 문장','틀려서 고칠래요'],['판단 보류','자료로 알 수 없어요']].map(([s,label])=>`<button class="quiet small" type="button" data-c3="claim" data-i="${i}" data-status="${s}">${label}</button>`).join('')}</div>`}</li>`).join('')}</ol></section>`;
}
function bonusClaims(id){return `<ol class="c3-bonus-claims">${extraSets[id].claims.map(c=>`<li>${e(c.text)}</li>`).join('')}</ol>`;}
function syncStep(){
 const step=stepOf(rows.filter(r=>r.group===state.group).length);
 if(step===1&&shownStep!==1){const a=art(assignedArtifact(state.group));Object.assign(draft,{artifact:a.name,status:'사실 확인',original:'',source:`교과서 ${a.page}쪽`});}
 shownStep=step;return step;
}

function formView(){
 const step=syncStep();
 const mine=rows.filter(r=>r.group===state.group).length;
 const fixed=draft.status==='고친 문장';
 const options=`<option value="">유물을 골라 주세요</option>`+coreArtifacts.map(a=>`<option ${draft.artifact===a.name?'selected':''}>${e(a.name)}</option>`).join('');
 return `<section class="c3-card">${stepsView(step,mine)}${guideView(step)}<div class="c3-form-head"><h2>문장 올리기</h2><p class="c3-goal"><b>${mine}</b> / ${groupGoal}문장</p></div><form data-c3-form="add"><label class="field"><span>1. 어떤 유물인가요?</span><select name="artifact">${options}</select></label><fieldset class="c3-choices c3-status-pick"><legend>2. 어떤 문장인가요?</legend>${sentenceStatuses.map(([s,help])=>`<label><input type="radio" name="status" value="${s}" ${draft.status===s?'checked':''}><span><b>${s}</b><small>${help}</small></span></label>`).join('')}</fieldset>${fixed?`<label class="field c3-original"><span>3. 틀렸던 원래 문장</span><textarea name="original" rows="2" maxlength="300" placeholder="예: 토우는 쇠를 녹여 만든 조각이다." required>${e(draft.original)}</textarea>${draft.original&&draft.original===autoOriginal?'<small class="c3-hint">2차시 활동지에서 ‘거짓’이었던 문장을 넣어 두었어요. 다르면 고쳐 쓰세요.</small>':''}</label><label class="field"><span>4. 자료에 맞게 고친 문장</span><textarea name="sentence" rows="2" maxlength="300" placeholder="예: 토우는 흙으로 사람이나 동물 모습을 만든 것이다." required>${e(draft.sentence)}</textarea></label>`:`<label class="field"><span>3. 검증한 문장</span><textarea name="sentence" rows="3" maxlength="300" placeholder="예: 집 모양 토기는 흙으로 만들었다." required>${e(draft.sentence)}</textarea></label>`}<label class="field"><span>${fixed?5:4}. 확인한 자료</span><input name="source" maxlength="100" value="${e(draft.source)}" placeholder="예: 교과서 28쪽"></label><button class="primary c3-wide" type="submit">문장판에 올리기</button></form>${message?`<p class="c3-message" role="alert">${e(message)}</p>`:''}</section>`;
}

function boardView(){
 const counts=groupCounts(rows);
 return `${state.group===0?`<p class="c3-assign"><b>새 유물</b>${groups.map(g=>firstArtifact(g)?`<span>${g}모둠 ${shortName(assignedArtifact(g))} ${art(assignedArtifact(g)).page}쪽</span>`:'').join('')}</p>`:''}<div class="c3-board-head"><h2>우리 반 문장판 <small>${rows.length}문장</small></h2><div>${state.group?`<button class="quiet small" type="button" data-c3="big">${big?'작은 화면':'큰 화면'}</button>`:''}<button class="quiet small" type="button" data-c3="refresh">${loading?'불러오는 중':'문장판 다시 불러오기'}</button></div></div>${boardError?`<p class="c3-message" role="alert">${e(boardError)}${rows.length?' 마지막으로 불러온 문장을 보여 주고 있어요.':''}</p>`:''}${!rows.length&&!loaded?'<p class="c3-guide">문장판을 불러오는 중이에요…</p>':''}<div class="c3-groups">${groups.map((g,i)=>`<section class="c3-group ${g===state.group?'is-mine':''}"><h3>${g}모둠 <small>${counts[i]} / ${groupGoal}</small></h3>${counts[i]?`<ol>${rows.filter(r=>r.group===g).map(r=>`<li><span class="c3-tag">${e(r.artifact)}</span>${r.status==='고친 문장'&&r.original?`<p class="c3-was"><span>원래</span><s>${e(r.original)}</s></p><p class="c3-now"><span>고친 문장</span>${e(r.sentence)}</p>`:`<p>${e(r.sentence)}</p>`}<small>${r.source?e(r.source)+' · ':''}<b class="c3-status" data-status="${e(r.status)}">${e(r.status)}</b></small>${r.mine?`<button class="quiet small" type="button" data-c3="remove" data-id="${e(r.id)}">지우기</button>`:''}</li>`).join('')}</ol>`:'<p class="c3-empty">아직 올린 문장이 없어요.</p>'}</section>`).join('')}</div>`;
}

function render(root){
 if(!joined()){root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 const teacher=state.group===0;
 root.innerHTML=`<div class="c3-page ${big||teacher?'c3-fit':''}"><div class="c3-bar"><p>수업코드 <b>${e(state.code)}</b> · <b>${teacher?'선생님 화면':state.group+'모둠'}</b>${teacher||big?'':' · <a href="#c3-board" data-c3="jump">문장판 보기 ↓</a>'}</p><button class="quiet small" type="button" data-c3="leave">나가기</button></div>${teacher||big?'':formView()}<section class="c3-board" id="c3-board">${boardView()}</section></div>`;
 fit(root);
}
// 큰 화면에서는 모든 문장이 스크롤 없이 한 화면에 들어오도록 글자 크기를 줄입니다.
function fit(root){
 const page=root.querySelector('.c3-fit');if(!page)return;
 let size=26;page.style.setProperty('--c3-size',`${size}px`);
 while(size>11&&document.documentElement.scrollHeight>window.innerHeight+1){size--;page.style.setProperty('--c3-size',`${size}px`);}
}
let fitRoot=null;
window.addEventListener('resize',()=>{if(fitRoot?.isConnected)fit(fitRoot);});
const paintBoard=root=>{
 const board=root.querySelector('#c3-board'),form=root.querySelector('[data-c3-form=add]');
 if(!board||(form&&stepOf(rows.filter(r=>r.group===state.group).length)!==shownStep))return render(root);
 board.innerHTML=boardView();const goal=root.querySelector('.c3-goal b');if(goal)goal.textContent=rows.filter(r=>r.group===state.group).length;fit(root);
};

async function refresh(root){
 if(!joined()||loading)return;
 loading=true;
 try{const value=await rpc('class5_list',{p_code:state.code,p_author:state.author});rows=Array.isArray(value.sentences)?value.sentences:[];boardError='';loaded=true;cache();}
 catch(error){boardError=error.message;}
 finally{loading=false;if(root.isConnected)paintBoard(root);}
}

export function mountLessonThree(root,source){
 fitRoot=root;
 const fresh=load();if(fresh.code!==state.code||fresh.group!==state.group){state=fresh;rows=cached();loaded=false;shownStep=-1;}
 if(!draft.artifact)draft.artifact=nameFor(observationIds.includes(source)?source:'');
 message='';render(root);
 clearInterval(timer);
 timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);if(document.visibilityState==='visible')refresh(root);},8000);
 refresh(root);
 root.addEventListener('input',event=>{const el=event.target;if(el.form?.dataset.c3Form==='add'&&el.name in draft&&el.type!=='radio')draft[el.name]=el.value;});
 root.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-c3-pick]')){pick(el.value);shownStep=-1;message='';render(root);return;}if(el.form?.dataset.c3Form==='add'&&el.name in draft){draft[el.name]=el.value;if(el.name==='status'||el.name==='artifact')suggestOriginal();if(el.name==='status'||(el.name==='artifact'&&draft.status==='고친 문장')){render(root);root.querySelector(el.name==='status'?`input[name=status][value="${el.value}"]`:'select[name=artifact]')?.focus();}}});
 root.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,data=Object.fromEntries(new FormData(form));
  if(form.dataset.c3Form==='join'){
   const code=String(data.code||'').trim().toLowerCase(),teacher=event.submitter?.name==='teacher';
   if(!/^[0-9a-z]{4,12}$/.test(code)){message='수업코드는 숫자 4~12자리로 입력해 주세요.';return render(root);}
   if(!teacher&&!data.group){message='우리 모둠을 골라 주세요.';state.code=code;return render(root);}
   if(code!==state.code){rows=[];loaded=false;}if(code!==state.code||(teacher?0:Number(data.group))!==state.group){draft={artifact:'',sentence:'',original:'',source:'',status:'사실 확인'};shownStep=-1;}state={code,group:teacher?0:Number(data.group),author:state.author||token()};keep();message='';boardError='';big=false;render(root);refresh(root);return;
  }
  if(form.dataset.c3Form==='add'){
   const button=form.querySelector('button[type=submit]');
   Object.assign(draft,{artifact:data.artifact||draft.artifact,sentence:String(data.sentence||''),original:String(data.original??draft.original),source:String(data.source||''),status:data.status||draft.status});
   const fixed=draft.status==='고친 문장';
   if(fixed&&!draft.original.trim()){message='틀렸던 원래 문장을 적어 주세요.';return render(root);}
   if(!draft.artifact){message='어떤 유물인지 골라 주세요.';return render(root);}
   if(rows.some(r=>r.group===state.group&&r.sentence.replace(/\s+/g,'')===draft.sentence.replace(/\s+/g,'')&&draft.sentence.trim())){message='이미 올린 문장이에요. 문장판에서 확인해 주세요.';return render(root);}
   if(!draft.sentence.trim()){message=fixed?'자료에 맞게 고친 문장을 적어 주세요.':'검증한 문장을 적어 주세요.';return render(root);}
   button.disabled=true;button.textContent='올리는 중…';
   try{await rpc('class5_add',{p_code:state.code,p_group:state.group,p_artifact:draft.artifact,p_sentence:draft.sentence.trim(),p_source:draft.source.trim(),p_status:draft.status,p_author:state.author,p_original:fixed?draft.original.trim():''});draft.sentence='';draft.original='';autoOriginal='';suggestOriginal();draft.source='';message='';render(root);await refresh(root);render(root);root.querySelector('textarea[name=sentence]')?.focus();}
   catch(error){message=error.message;render(root);}
  }
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c3]');if(!el)return;
  const action=el.dataset.c3;
  if(action==='leave'){state={code:state.code,group:null,author:state.author};keep();message='';boardError='';big=false;render(root);}
  if(action==='refresh')refresh(root);
  if(action==='claim'){
   const a=art(assignedArtifact(state.group)),c=claimsFor(a.id)[Number(el.dataset.i)];if(!c)return;
   const fixed=el.dataset.status==='고친 문장';
   Object.assign(draft,{artifact:a.name,status:el.dataset.status,original:fixed?c.text:'',sentence:fixed?'':c.text,source:`교과서 ${a.page}쪽`});autoOriginal=fixed?c.text:'';message='';render(root);
   const target=root.querySelector(fixed?'textarea[name=sentence]':'[data-c3-form=add] button[type=submit]');target?.scrollIntoView({behavior:'smooth',block:'center'});if(fixed)target?.focus();
  }
  if(action==='jump'){event.preventDefault();root.querySelector('#c3-board')?.scrollIntoView({behavior:'smooth'});}
  if(action==='big'){big=!big;render(root);}
  if(action==='remove'&&confirm('이 문장을 문장판에서 지울까요?')){
   try{await rpc('class5_remove',{p_code:state.code,p_id:el.dataset.id,p_author:state.author});rows=rows.filter(r=>r.id!==el.dataset.id);paintBoard(root);}
   catch(error){message=error.message;render(root);}
  }
 });
}


export function thirdWorksheet(source,school,group){
 const name=nameFor(source);
 return `<article class="worksheet printable"><header><span>${e(school)||'MOAKIT'} · AI × 사회</span><span>5학년 · 3차시</span></header><h2>우리 반 문장판에 올릴 문장</h2><p>모둠: ${e(group)||'____________'}　이름: ____________　날짜: ____________</p>${name?`<p class="worksheet-question">2차시 유물: ${e(name)}</p>`:''}<p>2차시 활동지에서 우리 질문의 답 1개와 검증한 문장 3개를 옮기고, 새로 맡은 유물의 문장 3개를 더 적습니다.</p>${[1,2,3,4,5,6,7].map(n=>`<section><h3>${n}. 유물 / 문장 / 확인한 자료 / 사실 확인 · 고친 문장 · 판단 보류</h3><div class="writing-lines"></div></section>`).join('')}</article>`;
}

export function thirdAnswers(){
 return `<h2>교사용 정답·근거 · 3차시 새 유물</h2><p>학생이 판단을 고른 뒤 함께 확인합니다. 판단은 교과서와 카드의 설명을 기준으로 합니다. ‘판단하기 어려움’ 문장은 사실처럼 고쳐 쓰지 않습니다.</p>${[...groups.map(g=>[g+'모둠',assignedArtifact(g)]),...bonusArtifacts.map(id=>['보너스',id])].map(([who,id])=>{const a=art(id);return `<h3>${who} · ${e(a.name)} (교과서 ${a.page}쪽)</h3><ol class="l2-teacher-answers">${claimsFor(id).map(c=>`<li><p>${e(c.text)}</p><p><b>${e(c.result)}</b> · ${e(c.reason)}</p>${c.fix?`<p>고친 문장 예시: ${e(c.fix)}</p>`:''}</li>`).join('')}</ol>`;}).join('')}`;
}

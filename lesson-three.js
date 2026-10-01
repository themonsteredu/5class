import {escapeHtml as e} from './model.js';
import {artifacts,coreArtifacts} from './data.js';
import {observationIds} from './lesson-one.js';

// 3차시: 수업코드로 입장한 모둠이 검증한 문장을 우리 반 문장판에 올립니다.
const API='https://awjndrxyyqyngybulyor.supabase.co/rest/v1/rpc/';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3am5kcnh5eXF5bmd5YnVseW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTEwMTUsImV4cCI6MjA5OTg4NzAxNX0.9G8aCw9jG8eSmeUaLOSiD0Fl34GpOD44XVOqTwCMWa4';
const STORE='moakit-5class-l3';
export const sentenceStatuses=[['사실 확인','자료로 맞다고 확인한 문장'],['고친 문장','틀린 문장을 자료에 맞게 고친 문장'],['판단 보류','자료로는 맞는지 알 수 없는 문장']];
export const groupGoal=7;
const groups=[1,2,3,4,5,6];

let state=load(),rows=[],message='',loading=false,big=false,timer=null;
let draft={artifact:'',sentence:'',original:'',source:'',status:'사실 확인'};

function load(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return {code:/^[0-9a-z]{4,12}$/.test(v.code||'')?v.code:'',group:Number.isInteger(v.group)&&v.group>=0&&v.group<=6?v.group:null,author:/^[a-f0-9]{64}$/.test(v.author||'')?v.author:''};}catch{return {code:'',group:null,author:''};}}
function keep(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch{}}
function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
async function rpc(name,body){
 let response;
 try{response=await fetch(API+name,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:`Bearer ${KEY}`},body:JSON.stringify(body)});}
 catch{throw Error('인터넷 연결을 확인하고 다시 눌러 주세요.');}
 if(!response.ok)throw Error('문장판에 연결하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
 const value=await response.json();
 if(value&&value.error)throw Error(value.error);
 return value;
}
export function groupCounts(list){return groups.map(g=>list.filter(r=>r.group===g).length);}

const joined=()=>state.code&&state.group!==null&&state.author;
const nameFor=id=>artifacts.find(a=>a.id===id)?.name||'';

function joinView(){
 return `<section class="c3-card c3-join"><p class="c3-kicker">3차시 · 우리 반 문장 모으기</p><h1>수업코드를 넣고 입장해요</h1><p class="c3-lead">2차시에 검증한 문장을 우리 반 문장판에 올립니다.</p><form data-c3-form="join"><label class="field"><span>수업코드</span><input name="code" inputmode="numeric" autocomplete="off" maxlength="12" value="${e(state.code)}" placeholder="선생님이 알려 준 숫자" required></label><fieldset class="c3-choices c3-group-pick"><legend>우리 모둠</legend>${groups.map(g=>`<label><input type="radio" name="group" value="${g}" ${state.group===g?'checked':''}><span>${g}모둠</span></label>`).join('')}</fieldset><button class="primary c3-wide" type="submit">입장하기</button><button class="quiet c3-wide" type="submit" name="teacher" value="1">선생님 · 문장판만 보기</button></form>${message?`<p class="c3-message" role="alert">${e(message)}</p>`:''}</section>`;
}

function formView(){
 const mine=rows.filter(r=>r.group===state.group).length;
 const fixed=draft.status==='고친 문장';
 const options=coreArtifacts.map(a=>`<option ${draft.artifact===a.name?'selected':''}>${e(a.name)}</option>`).join('');
 return `<section class="c3-card"><div class="c3-form-head"><h2>검증한 문장 올리기</h2><p class="c3-goal"><b>${mine}</b> / ${groupGoal}문장</p></div><form data-c3-form="add"><label class="field"><span>1. 어떤 유물인가요?</span><select name="artifact">${options}</select></label><fieldset class="c3-choices c3-status-pick"><legend>2. 어떤 문장인가요?</legend>${sentenceStatuses.map(([s,help])=>`<label><input type="radio" name="status" value="${s}" ${draft.status===s?'checked':''}><span><b>${s}</b><small>${help}</small></span></label>`).join('')}</fieldset>${fixed?`<label class="field c3-original"><span>3. 틀렸던 원래 문장</span><textarea name="original" rows="2" maxlength="300" placeholder="예: 토우는 쇠를 녹여 만든 조각이다." required>${e(draft.original)}</textarea></label><label class="field"><span>4. 자료에 맞게 고친 문장</span><textarea name="sentence" rows="2" maxlength="300" placeholder="예: 토우는 흙으로 사람이나 동물 모습을 만든 것이다." required>${e(draft.sentence)}</textarea></label>`:`<label class="field"><span>3. 검증한 문장</span><textarea name="sentence" rows="3" maxlength="300" placeholder="예: 집 모양 토기는 흙으로 만들었다." required>${e(draft.sentence)}</textarea></label>`}<label class="field"><span>${fixed?5:4}. 확인한 자료</span><input name="source" maxlength="100" value="${e(draft.source)}" placeholder="예: 교과서 28쪽"></label><button class="primary c3-wide" type="submit">문장판에 올리기</button></form>${message?`<p class="c3-message" role="alert">${e(message)}</p>`:''}<details class="c3-help"><summary>무엇을 올리나요?</summary><p>2차시 활동지에서 <b>우리 질문의 답 1개</b>와 <b>검증한 문장 3개</b>를 올립니다. 틀렸던 문장은 ‘고친 문장’을 고르고 원래 문장과 고친 문장을 함께 적습니다. 판단하기 어려웠던 문장은 ‘판단 보류’를 고릅니다. 남은 시간에는 선생님이 정해 준 새 유물의 문장을 교과서에서 확인해 3개 더 올립니다.</p></details></section>`;
}

function boardView(){
 const counts=groupCounts(rows);
 return `<div class="c3-board-head"><h2>우리 반 문장판 <small>${rows.length}문장</small></h2><div>${state.group?`<button class="quiet small" type="button" data-c3="big">${big?'작은 화면':'큰 화면'}</button>`:''}<button class="quiet small" type="button" data-c3="refresh">${loading?'불러오는 중':'문장판 다시 불러오기'}</button></div></div><div class="c3-groups">${groups.map((g,i)=>`<section class="c3-group ${g===state.group?'is-mine':''}"><h3>${g}모둠 <small>${counts[i]}문장</small></h3>${counts[i]?`<ol>${rows.filter(r=>r.group===g).map(r=>`<li><span class="c3-tag">${e(r.artifact)}</span>${r.status==='고친 문장'&&r.original?`<p class="c3-was"><span>원래</span><s>${e(r.original)}</s></p><p class="c3-now"><span>고친 문장</span>${e(r.sentence)}</p>`:`<p>${e(r.sentence)}</p>`}<small>${r.source?e(r.source)+' · ':''}<b class="c3-status" data-status="${e(r.status)}">${e(r.status)}</b></small>${r.mine?`<button class="quiet small" type="button" data-c3="remove" data-id="${e(r.id)}">지우기</button>`:''}</li>`).join('')}</ol>`:'<p class="c3-empty">아직 올린 문장이 없어요.</p>'}</section>`).join('')}</div>`;
}

function render(root){
 if(!joined()){root.innerHTML=`<div class="c3-page">${joinView()}</div>`;return;}
 const teacher=state.group===0;
 root.innerHTML=`<div class="c3-page ${big||teacher?'c3-big':''}"><div class="c3-bar"><p>수업코드 <b>${e(state.code)}</b> · <b>${teacher?'선생님 화면':state.group+'모둠'}</b></p><button class="quiet small" type="button" data-c3="leave">나가기</button></div>${teacher||big?'':formView()}<section class="c3-board" id="c3-board">${boardView()}</section></div>`;
}
const paintBoard=root=>{const board=root.querySelector('#c3-board');if(board)board.innerHTML=boardView();else render(root);const goal=root.querySelector('.c3-goal b');if(goal)goal.textContent=rows.filter(r=>r.group===state.group).length;};

async function refresh(root){
 if(!joined()||loading)return;
 loading=true;
 try{const value=await rpc('class5_list',{p_code:state.code,p_author:state.author});rows=Array.isArray(value.sentences)?value.sentences:[];}
 catch(error){message=error.message;}
 finally{loading=false;if(root.isConnected)paintBoard(root);}
}

export function mountLessonThree(root,source){
 if(!draft.artifact)draft.artifact=nameFor(observationIds.includes(source)?source:'')||coreArtifacts[0].name;
 message='';render(root);
 clearInterval(timer);
 timer=setInterval(()=>{if(!root.isConnected)return clearInterval(timer);if(document.visibilityState==='visible')refresh(root);},8000);
 refresh(root);
 root.addEventListener('input',event=>{const el=event.target;if(el.form?.dataset.c3Form==='add'&&el.name in draft&&el.type!=='radio')draft[el.name]=el.value;});
 root.addEventListener('change',event=>{const el=event.target;if(el.form?.dataset.c3Form==='add'&&el.name in draft){draft[el.name]=el.value;if(el.name==='status'){render(root);root.querySelector(`input[name=status][value="${el.value}"]`)?.focus();}}});
 root.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target,data=Object.fromEntries(new FormData(form));
  if(form.dataset.c3Form==='join'){
   const code=String(data.code||'').trim().toLowerCase(),teacher=event.submitter?.name==='teacher';
   if(!/^[0-9a-z]{4,12}$/.test(code)){message='수업코드는 숫자 4~12자리로 입력해 주세요.';return render(root);}
   if(!teacher&&!data.group){message='우리 모둠을 골라 주세요.';state.code=code;return render(root);}
   state={code,group:teacher?0:Number(data.group),author:state.author||token()};keep();message='';big=false;rows=[];render(root);refresh(root);return;
  }
  if(form.dataset.c3Form==='add'){
   const button=form.querySelector('button[type=submit]');
   Object.assign(draft,{artifact:data.artifact||draft.artifact,sentence:String(data.sentence||''),original:String(data.original??draft.original),source:String(data.source||''),status:data.status||draft.status});
   const fixed=draft.status==='고친 문장';
   if(fixed&&!draft.original.trim()){message='틀렸던 원래 문장을 적어 주세요.';return render(root);}
   if(!draft.sentence.trim()){message=fixed?'자료에 맞게 고친 문장을 적어 주세요.':'검증한 문장을 적어 주세요.';return render(root);}
   button.disabled=true;button.textContent='올리는 중…';
   try{await rpc('class5_add',{p_code:state.code,p_group:state.group,p_artifact:draft.artifact,p_sentence:draft.sentence.trim(),p_source:draft.source.trim(),p_status:draft.status,p_author:state.author,p_original:fixed?draft.original.trim():''});draft.sentence='';draft.original='';draft.source='';message='';render(root);await refresh(root);root.querySelector('textarea[name=sentence]')?.focus();}
   catch(error){message=error.message;render(root);}
  }
 });
 root.addEventListener('click',async event=>{
  const el=event.target.closest('[data-c3]');if(!el)return;
  const action=el.dataset.c3;
  if(action==='leave'){state={code:state.code,group:null,author:state.author};keep();rows=[];message='';big=false;render(root);}
  if(action==='refresh')refresh(root);
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

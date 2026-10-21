import {escapeHtml as e} from './model.js';
import {artifactById,nameOf,answerMystery,shuffle,groupState,canSubmit} from './museum-model.js';
import {listMuseum,readConfig,saveConfig,writeMuseum} from './museum-store.js';
const cuts=new Set(['spoon','house','armor','figurines','gold-crown','belt','pagoda','buddha','seosan','glass','burner','star']);
export function exhibitImage(id){const a=artifactById(id);return cuts.has(id)?`assets/museum/${id}.webp`:id==='crown'?'assets/museum/gold-crown.webp':`assets/images/${a?.image||''}`;}
export function mountMuseum(root,getContext,{answersOnly=false}={}){
 let config=null,rows=[],loading=true,problem='',message='',busy=false,selected=-1,historyGroup=null,answers=[],draftDirty=false,transient={},questionDraft='',lastFocus=null,closed=false,voice=false,syncing=false;
 let setupIds=null,setupGroups=null,setupLimit=5,scrolled=false;
 const mountedSession={...getContext().session};
 const context=()=>({...getContext(),session:mountedSession}),isTeacher=()=>mountedSession.group===0;
 const active=()=>!closed&&root.isConnected;
 const key=()=>`class5-museum-draft:${context().session.code}:${config?.run}:${context().session.group}`;
 const state=g=>groupState(rows,g,config);
 const own=()=>state(context().session.group);
 const enabled=()=>config?.groups.includes(context().session.group);
 const exposed=i=>config.open||(!isTeacher()&&own().correct[i]);
 const used=i=>own().questions.filter(r=>r.artifact===`Q|${i}`).length;
 const remaining=i=>Math.max(0,config.limit-used(i));
 const safeMessage=()=>`<div class="museum-message" role="status">${e(problem||message||'')}</div>`;
 function restore(){
  const s=own();answers=Array.isArray(s.draft.a)?s.draft.a.slice(0,config.ids.length):s.submission?.a?.slice()||Array(config.ids.length).fill('');
  try{const cache=JSON.parse(localStorage.getItem(key())||'null');if(cache?.dirty&&Array.isArray(cache.a)){answers=cache.a;draftDirty=true;}}catch{}
 }
 function cache(){try{localStorage.setItem(key(),JSON.stringify({a:answers,dirty:draftDirty}));}catch{problem='기기 저장 공간이 부족해요. 답안 저장을 눌러 서버에 보관해 주세요.';}}
 async function fetchState(){
  if(syncing||!active())return;syncing=true;
  try{
   const {session}=context(),next=readConfig(await listMuseum(session.code,session.author));
   if(!active())return;
   const changed=next?.run!==config?.run,opened=next?.open!==config?.open;
   config=next;
   if(config){rows=await listMuseum(session.code,session.author,config.run);if(!active())return;if(changed){draftDirty=false;transient={};selected=-1;restore();}else if(!draftDirty)restore();}
   loading=false;problem='';
   if(changed||opened||!root.querySelector('.museum'))render();else updateLive();
  }catch(err){problem=err.message;loading=false;if(active())updateLive();}
  finally{syncing=false;}
 }
 async function reloadRows(){const {session}=context();rows=await listMuseum(session.code,session.author,config.run);}
 function setup(){
  const facts=context().facts;
  const taught=[...new Set(facts.filter(f=>f.artifact&&f.status!=='판단 보류').map(f=>f.artifact))].filter(artifactById);
  setupIds??=taught.slice(0,6);setupGroups??=[...new Set(facts.map(f=>f.robot||f.group).filter(g=>g>=1&&g<=6))];
  if(!setupGroups.length)setupGroups=[1,2,3,4,5,6];
  return `<section class="museum-setup"><p class="museum-eyebrow">전시 준비 · 교사용</p><h2>우리 반이 가르친 유물로 박물관을 열어요</h2><p>서로 다른 유물 2~6개를 고르세요. 전시 번호와 이름 후보는 각각 섞어서 배치돼요.</p>${taught.length<2?'<p class="c3-message">아직 전시할 유물이 부족해요. 4차시 또는 ‘더 가르치기’에서 두 종류 이상의 유물에 특징을 가르쳐 주세요.</p>':''}<form data-museum-form="start"><fieldset><legend>전시할 유물</legend><div class="museum-choices">${taught.map(id=>`<label><input type="checkbox" name="artifact" value="${id}" ${setupIds.includes(id)?'checked':''}><span>${e(nameOf(id))}<small>배운 문장 ${facts.filter(f=>f.artifact===id).length}개</small></span></label>`).join('')}</div></fieldset><fieldset><legend>참여 모둠</legend><div class="museum-group-pick">${[1,2,3,4,5,6].map(g=>`<label><input type="checkbox" name="group" value="${g}" ${setupGroups.includes(g)?'checked':''}> ${g}조</label>`).join('')}</div></fieldset><label class="field"><span>유물 하나당 질문 횟수</span><select name="limit">${[3,4,5].map(n=>`<option value="${n}" ${n===setupLimit?'selected':''}>${n}회</option>`).join('')}</select></label><p>모둠마다 대표 태블릿 한 대로 질문하고 제출해 주세요. 나라·시대·이름 질문과 배우지 않은 질문은 횟수를 차감하지 않아요.</p><button class="primary" ${busy?'disabled':''}>박물관 개막하기</button></form></section>`;
 }
 function gallery(){
  return `<div class="museum-room" aria-label="입체 유물 전시관"><div class="museum-wall" aria-hidden="true"><span>THE MUSEUM OF QUESTIONS</span><b>우리반의 역사박물관</b><i></i></div><div class="museum-floor" aria-hidden="true"></div><div class="museum-exhibits">${config.ids.map((id,i)=>{
   const reveal=exposed(i),winners=config.groups.filter(g=>state(g).correct[i]);
   return `<div class="museum-exhibit exhibit-${i+1} ${reveal?'is-revealed':''}" ><button class="museum-exhibit-hit" data-museum="exhibit" data-index="${i}" aria-label="${i+1}번 ${reveal?e(nameOf(id)):'미확인 유물'}"><span class="museum-glow" aria-hidden="true"></span><span class="m5-object"><img src="${reveal?exhibitImage(id):'assets/museum/guide.webp'}" alt="${reveal?e(nameOf(id)):'정체를 숨긴 공통 로봇'}" draggable="false" decoding="async"></span><span class="museum-plinth"><b>${String(i+1).padStart(2,'0')}</b><span>${reveal?e(nameOf(id)):'미확인 유물'}</span></span></button><span class="museum-exhibit-status">${isTeacher()?`맞힌 모둠 · ${winners.length?winners.map(g=>`<button type="button" class="museum-winner" data-museum="history" data-index="${i}" data-group="${g}" aria-label="${i+1}번 유물을 맞힌 ${g}조 질문 기록">${g}조</button>`).join(' · '):'아직 없어요'}`:reveal?'전시 공개 ✓':`${remaining(i)}회 질문 가능`}</span></div>`;
  }).join('')}</div></div>`;
 }
 function candidates(){
  const names=shuffle(config.ids,config.run+'-names');
  return `<section class="museum-candidates"><div><p class="museum-eyebrow">NAME COLLECTION</p><h3>유물 이름표 보관함</h3><p>이 이름들 중에서 각 전시대의 정체를 찾아요.</p></div><ul>${names.map(id=>{const index=answers.indexOf(id);return `<li>${e(nameOf(id))}${!isTeacher()&&index>=0?`<small>${index+1}번에 배치</small>`:''}</li>`;}).join('')}</ul></section>`;
 }
 function answerSheet(){
  if(!enabled())return '<p class="museum-note">이번 박물관 참여 모둠에 포함되지 않았어요. 선생님께 알려 주세요.</p>';
  const s=own(),options=shuffle(config.ids,config.run+'-names');
  return `<section class="museum-answers" id="museum-answers"><div class="museum-section-heading"><div><p class="museum-eyebrow">OUR DISCOVERIES</p><h2>우리 모둠의 최종 답안</h2></div><span>${answers.filter(Boolean).length} / ${config.ids.length} 작성</span></div><p>번호마다 유물 이름을 골라 주세요. 이미 배치한 이름을 고르면 서로 자리를 바꿔요.</p><div class="museum-answer-list">${config.ids.map((id,i)=>`<label><span class="museum-answer-number">${String(i+1).padStart(2,'0')}</span><select data-museum-answer="${i}" aria-label="${i+1}번 유물 이름" ${config.open||busy?'disabled':''}><option value="">유물 이름 선택</option>${options.map(candidate=>`<option value="${candidate}" ${answers[i]===candidate?'selected':''}>${e(nameOf(candidate))}</option>`).join('')}</select><span class="museum-answer-result">${s.submission?(s.correct[i]?'✓ 정답':'다시 추리'):''}</span></label>`).join('')}</div><div class="museum-actions"><button class="quiet" data-museum="save" ${busy||config.open?'disabled':''}>답안 저장</button><button class="primary" data-museum="submit" ${busy||config.open||!canSubmit(answers,config.ids)?'disabled':''}>${s.submission?'수정한 답안 전체 제출':'전체 답안 제출하기'}</button></div><p class="museum-note">${config.open?'선생님이 전체 유물을 공개했어요. 활동이 끝났습니다.':s.complete?'모든 유물의 정체를 찾았어요! 전시대를 눌러 실제 유물을 살펴보세요.':draftDirty?'수정 중 · 전체 제출을 눌러야 정답이 반영돼요.':s.submission?'제출 완료 · 틀린 답을 수정해 다시 제출할 수 있어요.':'아직 제출하지 않았어요. 제출 전에는 정답을 공개하지 않아요.'}</p></section>`;
 }
 function teacherSummary(){
  const submitted=config.groups.filter(g=>state(g).submission).length,complete=config.groups.filter(g=>state(g).complete).length;
  return `<section class="museum-summary"><div class="museum-section-heading"><h2>우리 반 탐구 현황</h2><span>제출 ${submitted}/${config.groups.length} · 전체 정답 ${complete}/${config.groups.length}</span></div><div class="museum-table-wrap"><table><thead><tr><th>모둠</th>${config.ids.map((_,i)=>`<th>${i+1}번</th>`).join('')}<th>진행</th></tr></thead><tbody>${config.groups.map(g=>{const s=state(g);return `<tr><th>${g}조</th>${s.correct.map((ok,i)=>`<td>${ok?`<button class="museum-winner" data-museum="history" data-index="${i}" data-group="${g}" aria-label="${g}조 ${i+1}번 질문 기록">정답 ↗</button>`:s.submission?'다시 도전':'—'}</td>`).join('')}<td>${s.complete?'전체 정답':s.submission?'제출 완료':s.joined?'활동 중':'입장 대기'}</td></tr>`;}).join('')}</tbody></table></div><p>${submitted===config.groups.length?'모든 모둠이 제출했어요.':'아직 탐구 중인 모둠이 있어요.'} ${complete===config.groups.length?'모든 모둠이 전체 유물을 맞혔어요!':''}</p><div class="museum-actions"><button class="primary" data-museum="reveal" ${busy||config.open?'disabled':''}>${config.open?'전체 공개 완료':'유물 전체 공개'}</button><button class="quiet" data-museum="new" ${busy?'disabled':''}>새 박물관 준비</button></div><p class="museum-note">전체 공개 전까지 TV에는 번호와 맞힌 모둠만 표시됩니다. 자동 갱신 8초.</p></section>`;
 }
 function modalContent(){
  if(selected<0||!config)return '';
  const i=selected,id=config.ids[i],reveal=exposed(i),a=artifactById(id);
  if(isTeacher()&&historyGroup!==null){
   const records=state(historyGroup).questions.filter(r=>r.artifact===`Q|${i}`);
   return `<div class="museum-modal-top"><div><p class="museum-eyebrow">질문으로 찾은 단서</p><h2>${i+1}번 유물 · ${historyGroup}조 질문 기록</h2></div><button class="quiet" data-museum="close">닫기 ×</button></div><p class="museum-note">정답을 맞힌 모둠 · 저장된 질문 ${records.length}개</p><ol class="museum-history">${records.map((r,n)=>`<li><p class="museum-history-label">질문 ${n+1}</p><p class="museum-history-question">${e(r.sentence)}</p><p class="museum-history-answer"><b>로봇의 답변</b>${e(r.original||'저장된 답변이 없어요.')}</p></li>`).join('')||'<li>저장된 질문이 없어요. 대화 없이 답을 제출했을 수 있어요.</li>'}</ol><p class="museum-note">질문 횟수에 포함된 대화를 순서대로 보여 줍니다. 차단되었거나 로봇이 답하지 못한 질문은 저장되지 않아요.</p>`;
  }
  if(isTeacher())return `<div class="museum-modal-top"><h2>${i+1}번 ${reveal?e(nameOf(id)):'미확인 유물'}</h2><button class="quiet" data-museum="close" aria-label="닫기">닫기 ×</button></div><div class="museum-detail-image"><img src="${reveal?exhibitImage(id):'assets/museum/guide.webp'}" alt="${reveal?e(nameOf(id)):'공통 로봇'}"></div><table><thead><tr><th>모둠</th><th>진행</th><th>남은 질문</th></tr></thead><tbody>${config.groups.map(g=>{const s=state(g);return `<tr><th>${g}조</th><td>${s.correct[i]?'정답':s.submission?'다시 도전':s.joined?'조사 중':'입장 대기'}</td><td>${Math.max(0,config.limit-s.questions.filter(r=>r.artifact===`Q|${i}`).length)}회</td></tr>`;}).join('')}</tbody></table>`;
  if(reveal)return `<div class="museum-modal-top"><h2>${i+1}번 · ${e(nameOf(id))}</h2><button class="quiet" data-museum="close">닫기 ×</button></div><div class="museum-detail-image"><img src="${exhibitImage(id)}" alt="${e(nameOf(id))}"></div><p>${e(a.fact)}</p><p class="museum-note">${cuts.has(id)?'실제 자료를 바탕으로 만든 전시용 입체 이미지입니다. 세부 모습은 원본 자료에서 확인해요.':'자료 사진을 전시한 이미지입니다.'}</p><a href="${e(a.creditUrl||a.url)}" target="_blank" rel="noopener noreferrer">${e(a.credit||a.source)} · 원본 자료 ↗</a>`;
  const records=own().questions.filter(r=>r.artifact===`Q|${i}`).map(r=>({q:r.sentence,say:r.original})),local=transient[i]||[];
  return `<div class="museum-modal-top"><div><p class="museum-eyebrow">EXHIBIT ${String(i+1).padStart(2,'0')}</p><h2>${i+1}번 로봇과 대화</h2></div><button class="quiet" data-museum="close">닫기 ×</button></div><div class="museum-chat-head"><img src="assets/museum/guide.webp" alt="공통 로봇"><div><strong>질문 ${remaining(i)} / ${config.limit}회 남음</strong><p>재료·생김새·쓰임을 물어보세요.<br>나라·시대·유물 이름은 비밀이에요.</p><button class="quiet small" data-museum="voice" aria-pressed="${voice}">${voice?'음성 켜짐':'음성 듣기'}</button></div></div><ol class="museum-chat">${[...records,...local].map(r=>`<li><p class="m5-question">${e(r.q)}</p><p>${e(r.say)}</p></li>`).join('')||'<li>“어떤 재료로 만들었어?”처럼 질문해 보세요.</li>'}</ol><form data-museum-form="ask"><label class="field"><span>궁금한 점</span><input name="question" maxlength="120" value="${e(questionDraft)}" placeholder="어떤 모양으로 생겼어?" autocomplete="off" ${busy||!remaining(i)?'disabled':''}></label><button class="primary" ${busy||!remaining(i)?'disabled':''}>${busy?'저장하는 중…':'질문하기'}</button></form>${!remaining(i)?'<p>질문 기회를 모두 사용했어요. 대화 기록과 후보 이름을 비교해 주세요.</p>':''}<label class="field"><span>${i+1}번의 정체는?</span><select data-museum-answer="${i}" ${busy?'disabled':''}><option value="">후보 이름 선택</option>${shuffle(config.ids,config.run+'-names').map(candidate=>`<option value="${candidate}" ${answers[i]===candidate?'selected':''}>${e(nameOf(candidate))}</option>`).join('')}</select></label><p class="museum-note">여기서는 답을 기록만 해요. 모든 번호를 작성한 뒤 전체 제출해 주세요.</p>${safeMessage()}`;
 }
 function updateLive(){
  if(!active())return;
  if(!config||!root.querySelector('[data-museum-gallery]'))return render();
  const area=root.querySelector('[data-museum-gallery]');area.innerHTML=gallery();
  const summary=root.querySelector('[data-museum-summary]');if(summary)summary.innerHTML=isTeacher()?teacherSummary():answerSheet();
  const notice=root.querySelector('[data-museum-notice]');if(notice)notice.innerHTML=safeMessage();
  // Polling never replaces a focused question or candidate select in the open dialog.
  const dialog=root.querySelector('dialog');if(dialog?.open&&isTeacher()){const scroll=dialog.scrollTop;dialog.innerHTML=modalContent();dialog.scrollTop=scroll;}
 }
 function render(){
  if(!active())return;
  root.innerHTML=`<section class="museum ${isTeacher()?'museum-tv':''}"><header class="museum-heading"><div><p class="museum-eyebrow">MOAKIT · HISTORY MUSEUM</p><h1>이름을 잃어버린 박물관</h1><p>${isTeacher()?'우리 반의 질문이 유물을 깨웁니다.':`${context().session.group}조 큐레이터 · 로봇과 대화해 유물의 정체를 찾아보세요.`}</p></div><button class="quiet" data-museum="refresh">현황 새로고침</button></header><div data-museum-notice>${safeMessage()}</div>${loading?'<p>박물관 문을 여는 중이에요…</p>':!config?(isTeacher()?setup():'<div class="museum-wait"><img src="assets/museum/guide.webp" alt="박물관 안내 로봇"><h2>박물관 개막을 기다리고 있어요</h2><p>로봇 가르치기가 끝나면 선생님이 전시를 열어 주세요.</p></div>'):`<div data-museum-gallery>${gallery()}</div>${!isTeacher()?candidates():''}<div data-museum-summary>${isTeacher()?teacherSummary():answerSheet()}</div>`}<dialog class="museum-dialog" aria-label="유물 대화 및 현황"></dialog></section>`;
  if(selected>=0&&config){const dialog=root.querySelector('dialog');dialog.innerHTML=modalContent();dialog.showModal();}
  if(answersOnly&&config&&!isTeacher()&&!scrolled){root.querySelector('#museum-answers')?.scrollIntoView({block:'start'});scrolled=true;}
 }
 async function doWork(fn){if(busy)return;busy=true;problem='';root.querySelectorAll('button,select').forEach(el=>el.disabled=true);try{await fn();}catch(err){problem=err.message;}finally{busy=false;render();}}
 function talk(text){if(!voice||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.95;window.speechSynthesis.speak(u);}
 async function join(){if(!config||isTeacher()||!enabled()||own().joined)return;const {session}=context();await writeMuseum(session.code,session.author,config.run,session.group,'J','입장');await reloadRows();}
 async function saveDraft(){const {session}=context();await writeMuseum(session.code,session.author,config.run,session.group,'D',JSON.stringify({a:answers}));draftDirty=false;cache();await reloadRows();}
 root.addEventListener('input',event=>{if(event.target.name==='question')questionDraft=event.target.value;});
 root.addEventListener('change',event=>{
  const el=event.target;if(el.dataset.museumAnswer!==undefined){
   const i=+el.dataset.museumAnswer,v=el.value,other=v?answers.indexOf(v):-1;
   if(other>=0&&other!==i)answers[other]=answers[i]||'';answers[i]=v;draftDirty=true;cache();message='답안을 기록했어요. 전체 제출 전까지 바꿀 수 있어요.';render();
  }
  if(el.closest('[data-museum-form=start]')){const data=new FormData(el.form);setupIds=data.getAll('artifact');setupGroups=data.getAll('group').map(Number);setupLimit=+data.get('limit');}
 });
 root.addEventListener('submit',event=>{
  const kind=event.target.dataset.museumForm;if(!kind)return;event.preventDefault();event.stopPropagation();
  const data=new FormData(event.target);
  if(kind==='start'&&isTeacher())doWork(async()=>{
   const ids=data.getAll('artifact'),groups=data.getAll('group').map(Number),limit=+data.get('limit');
   if(ids.length<2||ids.length>6)throw Error('전시할 유물을 2~6개 골라 주세요.');if(!groups.length)throw Error('참여할 모둠을 골라 주세요.');
   const run=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
   const next={run,ids:shuffle(ids,run),groups,limit,open:false};await saveConfig(context().session,next);config=next;rows=[];answers=[];message='박물관이 개막했어요. 학생 화면에도 곧 나타나요.';
  });
  if(kind==='ask'&&!isTeacher()&&enabled()){
   const q=String(data.get('question')||'').trim().slice(0,120),i=selected;if(!q||i<0)return;
   doWork(async()=>{
    await reloadRows();const fresh=readConfig(await listMuseum(context().session.code,context().session.author));
    if(fresh?.run!==config.run||fresh.open)throw Error('전시 상태가 바뀌었어요. 현황 새로고침을 눌러 주세요.');
    if(!remaining(i))throw Error('이 유물의 질문 기회를 모두 사용했어요.');
    const reply=answerMystery(q,config.ids[i],context().facts);
    if(reply.charged){const {session}=context();await writeMuseum(session.code,session.author,config.run,session.group,`Q|${i}`,q,reply.say,false);await reloadRows();}
    else{transient[i]=[...(transient[i]||[]),{q,say:reply.say}].slice(-10);}
    questionDraft='';message='';talk(reply.say);
   });
  }
 });
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-museum]');if(!button)return;const action=button.dataset.museum;
  if(action==='history'&&isTeacher()){const i=Number(button.dataset.index),g=Number(button.dataset.group);if(!config?.groups.includes(g)||!state(g).correct[i])return;selected=i;historyGroup=g;render();}
  if(action==='exhibit'){historyGroup=null;if(!isTeacher()&&!enabled())return;lastFocus=button;selected=+button.dataset.index;questionDraft='';problem='';message='';render();}
  if(action==='close'){const index=selected;selected=-1;historyGroup=null;root.querySelector('dialog')?.close();root.querySelector(`[data-museum=exhibit][data-index="${index}"]`)?.focus();}
  if(action==='voice'){voice=!voice;if(!voice)window.speechSynthesis?.cancel();render();}
  if(action==='refresh'){fetchState();}
  if(action==='save'&&enabled())doWork(async()=>{await saveDraft();message='답안을 서버에 저장했어요.';});
  if(action==='submit'&&enabled())doWork(async()=>{
   if(!canSubmit(answers,config.ids))throw Error('모든 번호에 서로 다른 이름을 골라 주세요.');
   const {session}=context(),fresh=readConfig(await listMuseum(session.code,session.author));
   if(fresh?.run!==config.run||fresh.open)throw Error('전시가 종료되었거나 바뀌었어요. 현황 새로고침을 눌러 주세요.');
   await saveDraft();await writeMuseum(session.code,session.author,config.run,session.group,'S',JSON.stringify({a:answers}));await reloadRows();message=`전체 답안을 제출했어요. ${own().correct.filter(Boolean).length}개 유물을 찾았어요!`;selected=-1;
  });
  if(action==='reveal'&&isTeacher()&&confirm('유물 이름과 이미지를 모두 공개하고 답안 제출을 마칠까요?'))doWork(async()=>{const next={...config,open:true};await saveConfig(context().session,next);config=next;message='모든 유물을 공개했어요.';});
  if(action==='new'&&isTeacher()&&confirm('새 전시를 준비할까요? 개막하기를 누르면 이전 전시가 종료됩니다.')){config=null;selected=-1;setupIds=null;render();}
 });
 root.addEventListener('cancel',event=>{if(event.target.tagName==='DIALOG')selected=-1;},true);
 render();fetchState().then(()=>join()).catch(err=>{problem=err.message;updateLive();});
 const timer=setInterval(()=>{if(!active()){clearInterval(timer);closed=true;return;}if(document.visibilityState==='visible'&&!busy&&!root.querySelector('[data-museum-form=start]'))fetchState().then(()=>join()).catch(err=>{problem=err.message;updateLive();});},8000);
 return ()=>{closed=true;clearInterval(timer);window.speechSynthesis?.cancel();};
}

import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
const artifactName=id=>artifacts.find(a=>a.id===id)?.name||id||'유물';
export function questionPool(facts){
 const known=facts.filter(f=>['사실 확인','고친 문장'].includes(f.status)&&f.artifact&&f.sentence?.trim());
 const truths=new Set(known.map(f=>f.sentence.trim()));
 const seen=new Set(),pool=[];
 for(const f of known){
  const add=(text,answer)=>{text=text?.trim();if(!text||text.length>180||seen.has(text))return;seen.add(text);pool.push({text,answer,artifact:artifactName(f.artifact),reason:f.sentence.trim(),source:f.source||'로봇에게 가르친 문장',group:f.robot||f.group||''});};
  add(f.sentence,'O');
  if(f.status==='고친 문장'&&!truths.has(f.original?.trim()))add(f.original,'X');
 }
 return pool;
}
export function initialQuestions(pool){
 const yes=pool.filter(q=>q.answer==='O'),no=pool.filter(q=>q.answer==='X'),chosen=[];
 // A corrected pair stays on separate sheets/questions only if no alternative exists.
 const usedReasons=new Set();
 for(let i=0;chosen.length<20&&i<pool.length;i++){
  const list=i%2?yes:no;const q=list.find(q=>!chosen.includes(q)&&!usedReasons.has(q.reason));
  if(q){chosen.push({...q});usedReasons.add(q.reason);}
 }
 for(const q of pool)if(chosen.length<20&&!chosen.some(x=>x.text===q.text)&&!usedReasons.has(q.reason)){chosen.push({...q});usedReasons.add(q.reason);}
 while(chosen.length<20)chosen.push({text:'',answer:'O',artifact:'',reason:'',source:'',group:''});
 return chosen;
}
const header=(school,subject,lesson=5)=>`<div class="leap-top"><b>2026. AI연구학교</b><b>${e(school)} (5학년)</b></div><div class="leap-logo"><img src="assets/worksheets/leap-original-logo.png" alt="AI-L.E.A.P. 활동지 · Boseong Elementary School"></div><table class="leap-meta"><colgroup><col style="width:17%"><col style="width:55%"><col style="width:28%"></colgroup><tr><th>단 원</th><td>AI와 함께하는 역사 탐구</td><td>${lesson} 차시</td></tr><tr><th>주 제</th><td>${e(subject)}</td><td>이름:</td></tr></table>`;
const lines=(n=2)=>`<div class="leap-lines">${'<div></div>'.repeat(n)}</div>`;
function worksheetPage({school='보성초등학교',code='',questions=[],key=false,lesson=5,offset=0}){
 const qs=questions.filter(q=>q.text.trim());
 if(key)return `<article class="leap-pages printable"><section class="leap-page">${header(school,'우리반의 역사박물관 · 교사용 정답',6)}<h3>마무리 OX 정답과 근거</h3><p>수업코드 ${e(code)} · 인쇄 전 교과서와 자료로 최종 확인해 주세요.</p><ol class="leap-key" start="${offset+1}">${qs.map(q=>`<li><strong>${e(q.answer)} · ${e(q.artifact)}</strong><p>${e(q.text)}</p><p><b>확인한 내용:</b> ${e(q.reason||'교사가 직접 출제한 문항입니다.')}</p><small>출처: ${e(q.source||'직접 출제')}${q.group?` · ${q.group}모둠`:''}</small></li>`).join('')}</ol></section></article>`;
 const full=`<article class="leap-pages printable"><section class="leap-page">${header(school,'우리반의 역사박물관')}<h3>◎ 오늘의 미션</h3><p>유물의 특징을 로봇에게 가르치고, 질문으로 친구 모둠의 유물을 찾아보자!</p><h3>1. 우리 모둠의 유물 로봇을 준비해 봅시다.</h3><table class="leap-grid"><tr><th>모둠</th><td>　　　 모둠</td><th>대표 유물</th><td></td></tr><tr><th>로봇 이름</th><td></td><th>성격·말버릇</th><td></td></tr></table><h3>2. 로봇에게 무엇을 가르쳤나요?</h3><p>자료로 확인한 사실과 출처를 적어 봅시다.</p><table class="leap-grid leap-teach"><thead><tr><th>가르친 내용</th><th>확인한 자료·쪽수</th></tr></thead><tbody><tr><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table><h3>3. 질문으로 유물의 정체를 찾아봅시다.</h3><p>재료·생김새·쓰임을 질문하고, 단서가 된 답변을 적어요.</p><table class="leap-grid leap-investigate"><thead><tr><th>번호</th><th>우리 모둠의 질문</th><th>답변에서 찾은 단서</th></tr></thead><tbody>${[1,2].map(()=>'<tr><td>　번</td><td></td><td></td></tr>').join('')}</tbody></table><h3>4. 전시 번호에 알맞은 유물 이름을 적어 봅시다.</h3><table class="leap-grid leap-mapping"><tbody>${[0,1,2].map(i=>`<tr><th>${i*2+1}번</th><td></td><th>${i*2+2}번</th><td></td></tr>`).join('')}</tbody></table><p class="leap-foot">전시되지 않은 번호는 비워 두세요. · 수업코드 ${e(code)} · 5차시</p></section><section class="leap-page">${header(school,'배운 내용을 확인해요 · OX 퀴즈',6)}<h3>1. 우리 반이 가르친 내용을 떠올리며 OX 문제를 풀어 봅시다.</h3><p>맞으면 O, 틀리면 X에 표시해요.</p><table class="leap-grid leap-quiz"><colgroup><col style="width:8%"><col style="width:74%"><col style="width:18%"></colgroup><thead><tr><th>번호</th><th>문제</th><th>내 생각</th></tr></thead><tbody>${qs.length?qs.map((q,i)=>`<tr><th>${offset+i+1}</th><td>${q.artifact?`<small>【${e(q.artifact)}】</small>`:''}${e(q.text)}</td><td class="leap-ox">O　X</td></tr>`).join(''):'<tr><td colspan="3">교사 화면에서 출제할 문장을 먼저 확인해 주세요.</td></tr>'}</tbody></table><h3>2. X라고 생각한 문장을 바르게 고쳐 봅시다.</h3><p>문제 번호: (　　　)번 · 고친 문장과 그 까닭</p>${lines(3)}<h3>3. 활동을 마친 후 느낀 점을 한 줄로 써 봅시다.</h3><p>로봇이 잘 설명하도록 하려면, 우리는 어떻게 가르쳐야 할까요?</p>${lines(2)}<p class="leap-foot">우리반의 역사박물관 · 수업코드 ${e(code)} · 6차시</p></section></article>`;
 const parts=full.split('</section><section class="leap-page">');
 return lesson===6?'<article class="leap-pages printable"><section class="leap-page">'+parts[1]:parts[0]+'</section></article>';
}
export function worksheetPages(options={}){
 const {questions=[],lesson=5,key=false}=options;
 if(lesson===5&&!key)return worksheetPage(options);
 const qs=questions.filter(q=>q.text.trim());
 const pages=[];
 for(let offset=0;offset<Math.max(1,qs.length);offset+=6){
  let page=worksheetPage({...options,questions:qs.slice(offset,offset+6),offset});
  if(!key&&offset+6<qs.length)page=page.replace(/<h3>2\. X라고[\s\S]*?(?=<p class="leap-foot">)/,'');
  pages.push(page.replace(/^<article class="leap-pages printable">/,'').replace(/<\/article>$/,''));
 }
 return '<article class="leap-pages printable">'+pages.join('')+'</article>';
}
export function openFifthWorksheet({facts,code,lesson=5}){
 const dialog=document.getElementById('modal');if(!dialog)return;
 if(lesson===5){dialog.innerHTML=`<div class="modal-top"><h2>5차시 박물관 활동지</h2><button data-action="print" class="primary">인쇄 · PDF 저장</button><button data-action="close" class="quiet">닫기 ×</button></div>${worksheetPages({code,lesson:5})}`;if(!dialog.open)dialog.showModal();return;}
 const pool=questionPool(facts),questions=initialQuestions(pool);let key=false,school='보성초등학교',reviewed=false;
 const render=()=>{
  dialog.innerHTML=`<div class="leap-controls"><div class="modal-top"><h2>6차시 활동지 · 마무리 OX</h2><button data-action="close" class="quiet">닫기 ×</button></div><p>우리 반이 가르친 내용으로 최대 20문제를 준비하고, 6문제씩 나누어 인쇄합니다. 정답지는 별도로 인쇄해 주세요.</p><label>학교명 <input data-leap-school maxlength="40" value="${e(school)}"></label><p>확인된 문장 ${pool.length}개 · ${pool.some(q=>q.answer==='X')?'고치기 전 문장을 X 문제로 활용할 수 있어요.':'저장된 틀린 문장이 없어 자동 문제는 O입니다. 필요하면 문장을 직접 수정하고 정답을 X로 설정하세요.'} 판단 보류 문장은 제외합니다.</p><details open><summary>출제할 문제 확인·수정 (최대 20문제)</summary><div class="leap-editor">${questions.map((q,i)=>`<fieldset><legend>${i+1}번 문제</legend><label>배운 문장 선택<select data-leap-pick="${i}"><option value="">직접 작성 / 현재 문장 유지</option>${pool.map((x,n)=>`<option value="${n}" ${x.text===q.text?'selected':''}>${e(x.artifact)} · ${x.answer} · ${e(x.text)}</option>`).join('')}</select></label><label>문제 문장<textarea data-leap-text="${i}" maxlength="180" rows="2">${e(q.text)}</textarea></label><label>정답<select data-leap-answer="${i}"><option ${q.answer==='O'?'selected':''}>O</option><option ${q.answer==='X'?'selected':''}>X</option></select></label><label>정답 근거<textarea data-leap-reason="${i}" maxlength="300" rows="2">${e(q.reason)}</textarea></label></fieldset>`).join('')}</div></details><p>빈 문제는 인쇄하지 않습니다. 문장을 수정했다면 정답과 근거도 함께 확인해 주세요.</p><label><input type="checkbox" data-leap-review ${reviewed?'checked':''}> 문제·정답·근거를 확인했습니다.</label><div class="leap-actions"><button class="quiet" data-leap-view="student">학생용 미리 보기</button><button class="quiet" data-leap-view="key">교사용 정답 보기</button><button class="primary" data-leap-print ${!reviewed||!questions.some(q=>q.text.trim())?'disabled':''}>${key?'교사용 정답':'학생용 활동지'} 인쇄 · PDF 저장</button></div></div><div data-leap-preview>${worksheetPages({school,code,questions,key,lesson})}</div>`;
 };
 render();if(!dialog.open)dialog.showModal();
 dialog.oninput=event=>{const el=event.target;if(el.matches('[data-leap-review]'))return;if(el.matches('[data-leap-school]'))school=el.value;for(const [attr,field] of [['leapText','text'],['leapReason','reason']])if(el.dataset[attr]!==undefined)questions[+el.dataset[attr]][field]=el.value;reviewed=false;const check=dialog.querySelector('[data-leap-review]');if(check)check.checked=false;dialog.querySelector('[data-leap-print]').disabled=true;};
 dialog.onchange=event=>{const el=event.target;if(el.dataset.leapPick!==undefined&&el.value!==''){questions[+el.dataset.leapPick]={...pool[+el.value]};reviewed=false;render();}if(el.dataset.leapAnswer!==undefined){questions[+el.dataset.leapAnswer].answer=el.value;reviewed=false;}if(el.matches('[data-leap-review]')){reviewed=el.checked;dialog.querySelector('[data-leap-print]').disabled=!reviewed||!questions.some(q=>q.text.trim());}};
 dialog.onclick=event=>{const el=event.target.closest('[data-leap-view],[data-leap-print]');if(!el)return;if(el.dataset.leapView){key=el.dataset.leapView==='key';render();}else if(reviewed&&questions.some(q=>q.text.trim())){dialog.querySelector('[data-leap-preview]').innerHTML=worksheetPages({school,code,questions,key,lesson});window.print();}};
 dialog.addEventListener('close',()=>{dialog.oninput=dialog.onchange=dialog.onclick=null;},{once:true});
}

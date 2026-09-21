import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
import {lessonOneFigure,observationIds} from './lesson-one.js';
export const thirdSteps=['지난 기록 살피기','생활 모습 생각하기','근거 설명하기','소개문 쓰기','서로 읽어 보기','소개 나누기'];
const times=[5,7,8,10,6,4];
export const lifeQuestions={susan:'그림 속 사람들의 옷차림과 크기는 어떻게 다른가요?',spoon:'수저의 쓰임에서 어떤 식생활을 생각할 수 있나요?',house:'토기에 표현된 집의 모습에서 무엇을 살펴볼 수 있나요?',figurines:'토우에 나타난 사람의 모습과 행동은 무엇인가요?',armor:'갑옷과 투구는 사람의 어느 부분을 보호했을까요?',pagoda:'절에 세운 석탑에서 당시 사람들의 종교를 어떻게 알 수 있나요?'};
export function thirdArtifact(source){return observationIds.includes(source)?artifacts.find(a=>a.id===source):null;}
const paper=t=>`<div class="l1-paper-note"><span>종이 활동지</span><p>${t}</p></div>`;
export function lessonThree({step,source,btn}){
 const a=thirdArtifact(source);
 if(!a)return `<article class="l1-content"><h1>2차시 기록을 이어서 준비해요.</h1><p>2차시에서 고른 유물과 종이 활동지를 사용합니다. 이 기기에 선택 기록이 없다면 2차시 화면에서 활동지와 같은 유물을 표시해 주세요.</p><a class="button primary" href="#lesson/2">2차시 기록 연결하기 →</a></article>`;
 const titles=['지난 시간에 무엇을 확인했나요?','이 유물은 어떤 생활을 보여 주나요?','왜 그렇게 생각했나요?','우리 유물을 소개해 봅시다.','친구가 쓴 설명을 읽어 봅시다.','우리 유물에서 찾은 생활을 소개해요.'];
 const leads=['2차시 활동지에서 사실로 확인한 내용과 바로잡은 설명을 읽어 봅시다.','확인한 사실을 바탕으로 옛사람들의 생활을 생각해 봅시다.','우리 생각을 뒷받침하는 내용을 지난 활동지에서 찾아봅시다.','확인한 사실과 생활 모습을 연결하여 두세 문장으로 써 봅시다.','짝과 활동지를 바꾸어 읽고, 근거가 있는 설명인지 살펴봅시다.','소개문을 읽고 어떤 근거를 사용했는지 설명해 봅시다.'];
 const bodies=[
 `<div class="l1-observe">${lessonOneFigure(a.id)}<div class="l1-observe-copy"><h2>2차시 활동지를 펼쳐 봅시다.</h2><p>사실로 확인한 내용 중 소개에 쓸 부분에 밑줄을 그어 봅시다.</p><p>‘판단하기 어려움’으로 남긴 내용은 사실로 소개하지 않습니다.</p><p>유물 이름과 출처는 지난 활동지를 참고합니다.</p></div></div>`,
 `<div class="l1-share-statement"><span>우리 유물에 대해 생각하기</span><p>${lifeQuestions[a.id]}</p></div>${paper('1번에 이 유물에서 알 수 있거나 짐작할 수 있는 생활 모습을 써 봅시다.')}<p class="l1-note">유물 하나의 특징을 당시 모든 사람의 생활로 넓혀 말하지 않습니다.</p>`,
 `<div class="l2-exit"><h2>생각과 근거 연결하기</h2><p>2차시에서 확인한 어떤 내용이 내 생각을 뒷받침하나요?</p><p>연결되는 근거가 없다면 생각을 고치거나, 필요한 부분만 자료에서 더 찾아봅시다.</p></div>${paper('2번에 그렇게 생각한 까닭을 써 봅시다. 2차시 활동지의 관련 근거에 표시해 봅시다.')}<p class="l1-note">새 자료를 참고했다면 기관 이름과 자료 제목 또는 교과서 쪽수를 함께 적습니다.</p>`,
 `<div class="l1-share-statement"><span>소개문 쓰기에 도움을 주는 문장</span><p>이 유물은 ______입니다.<br>자료에서 ______을 확인했습니다.<br>이를 통해 ______을 알 수 있습니다 / ______했을 것으로 짐작합니다.</p></div>${paper('3번에 친구들에게 들려줄 소개문을 두세 문장으로 써 봅시다. 문장 틀은 필요한 부분만 사용해도 됩니다.')}<p class="l1-note">자료에서 확인한 사실과 내가 짐작한 내용을 구분해 씁니다.</p>`,
 `<div class="l2-check-guide"><p><b>사실 확인</b> 2차시에서 확인한 내용과 맞나요?</p><p><b>근거 확인</b> 생활 모습을 설명할 근거가 있나요?</p><p><b>표현 확인</b> 짐작한 내용을 사실처럼 쓰지는 않았나요?</p></div>${paper('친구와 확인란에 표시하고, 필요한 부분은 소개문에서 직접 고쳐 봅시다.')}`,
 `<div class="l1-share-statement"><span>소개하고 듣기</span><p>“우리가 소개할 유물은 …입니다. …이라는 근거에서 …을 알 수 있습니다 / 짐작할 수 있습니다.”</p></div><p>친구의 소개에서 새롭게 알게 된 생활 모습을 이야기해 봅시다.</p><div class="l1-next-lesson"><span>다음 시간</span><p>모둠 친구들이 소개한 유물을 모아 재료나 쓰임 등의 기준으로 나누어 봅니다. 종이 활동지는 역사관을 만들 때 다시 사용합니다.</p></div>`
 ];
 return `<div class="l1-workspace"><nav class="l1-progress" aria-label="3차시 활동 순서"><ol>${thirdSteps.map((s,i)=>`<li>${btn(`<span>0${i+1}</span>${s}`,'l3-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`)}</li>`).join('')}</ol></nav><article class="l1-content"><header class="l1-page-heading"><p class="l1-kicker">3차시 · EXPLORE <span>${thirdSteps[step]} · ${times[step]}분</span></p><h1>${titles[step]}</h1><p class="l1-lead">${leads[step]}</p></header><p class="l2-example-label">2차시에서 이어 온 유물 · ${e(a.name)} · 교과서 ${a.page}쪽</p>${bodies[step]}<nav class="l1-nav">${btn('← 이전','l3-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}<span>${step+1} / 6</span>${step<5?btn('다음 →','l3-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/4">4차시로 →</a>'}</nav></article></div>`;
}
export function thirdWorksheet(source,school,group){
 const a=thirdArtifact(source);
 if(!a)return '<p>2차시에서 사용한 유물을 먼저 연결해 주세요.</p>';
 return `<article class="worksheet printable l3-worksheet"><header><span>${e(school)||'MOAKIT'} · AI × 사회</span><span>5학년 · 3차시</span></header><h2>유물에서 옛사람들의 생활 찾기</h2><p>모둠: ${e(group)||'____________'}　이름: ____________　날짜: ____________</p><p class="worksheet-question">${e(a.name)} · ${e(a.nation)} · 교과서 ${a.page}쪽</p><p>2차시 활동지를 함께 보며 활동해 봅시다. 유물 이름과 출처는 다시 쓰지 않아도 됩니다.</p><section><h3>1. 이 유물은 어떤 생활 모습을 보여 주나요?</h3><p>${lifeQuestions[a.id]}</p><div class="writing-lines"></div></section><section><h3>2. 그렇게 생각한 까닭은 무엇인가요?</h3><p>2차시에서 확인한 근거와 연결하여 써 봅시다.</p><div class="writing-lines"></div><p>새로 참고한 자료가 있다면: ____________________________________</p></section><section><h3>3. 친구들에게 유물을 소개하는 글을 써 봅시다.</h3><p>확인한 사실과 생활 모습을 연결하여 두세 문장으로 씁니다. 짐작한 내용은 ‘~했을 것으로 짐작합니다’라고 표현합니다.</p><div class="writing-lines introduction-lines"></div></section><footer>친구와 확인하기　□ 확인한 사실과 맞습니다.　□ 근거가 있습니다.　□ 사실과 추측을 구분했습니다.</footer></article>`;
}

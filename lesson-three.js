import {escapeHtml as e} from './model.js';
import {artifacts} from './data.js';
import {lessonOneFigure,observationIds} from './lesson-one.js';
export const thirdSteps=['지난 기록 보기','소개문 쓰기','함께 확인하기'];
export const lifeQuestions={susan:'그림 속 사람들의 옷차림과 크기는 어떻게 다른가요?',spoon:'수저의 쓰임에서 어떤 식생활을 생각할 수 있나요?',house:'토기에 표현된 집의 모습에서 무엇을 살펴볼 수 있나요?',figurines:'토우에 나타난 사람의 모습과 행동은 무엇인가요?',armor:'갑옷과 투구는 사람의 어느 부분을 보호했을까요?',pagoda:'절에 세운 석탑에서 당시 사람들의 종교를 어떻게 알 수 있나요?'};
export function thirdArtifact(source){return observationIds.includes(source)?artifacts.find(a=>a.id===source):null;}
export function lessonThree({step,source,btn}){
 const a=thirdArtifact(source);
 if(!a)return `<article class="l3-page"><h1>2차시 활동지를 준비해 주세요.</h1><p>지난 시간에 고른 유물을 연결하면 이어서 시작할 수 있습니다.</p><a class="button primary" href="#lesson/2">2차시로 →</a></article>`;
 step=Math.max(0,Math.min(2,step));
 const titles=['지난 시간에 확인한 내용을 읽어 봅시다.','우리 유물을 소개해 봅시다.','친구와 읽고 고쳐 봅시다.'];
 const bodies=[
 `<div class="l3-observe">${lessonOneFigure(a.id)}<div><p>2차시 활동지에서 소개에 쓸 사실에 밑줄을 그어 보세요.</p><h2>${lifeQuestions[a.id]}</h2><p>이 유물이 보여 주는 생활 모습을 이야기해 봅시다.</p></div></div>`,
 `<p class="l3-lead">확인한 사실과 생활 모습을 연결해 활동지에 두세 문장으로 써 보세요.</p><div class="l3-writing"><p>이 유물은 ______입니다.</p><p>______을 통해 당시의 ______을 알 수 있습니다.</p></div><p class="l3-note">짐작한 내용은 ‘~했을 것으로 짐작합니다’라고 씁니다.</p>`,
 `<p class="l3-lead">2차시 활동지와 소개문을 함께 보며 확인해 보세요.</p><ul class="l3-check"><li>확인한 사실과 맞나요?</li><li>생활 모습을 설명할 근거가 있나요?</li><li>사실과 추측을 구분했나요?</li></ul><p>필요한 부분을 고친 뒤, 친구들에게 소개해 봅시다.</p>`
 ];
 return `<article class="l3-page"><nav class="l3-steps" aria-label="3차시 활동 순서">${thirdSteps.map((label,i)=>btn(`${i+1}. ${label}`,'l3-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`,'quiet')).join('')}</nav><header class="l3-heading"><p>3차시 · ${e(a.name)}</p><h1>${titles[step]}</h1></header>${bodies[step]}<nav class="l3-nav">${btn('← 이전','l3-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}${step<2?btn('다음 →','l3-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/4">4차시로 →</a>'}</nav></article>`;
}
export function thirdWorksheet(source,school,group){
 const a=thirdArtifact(source);
 if(!a)return '<p>2차시에서 사용한 유물을 먼저 연결해 주세요.</p>';
 return `<article class="worksheet printable l3-worksheet"><header><span>${e(school)||'MOAKIT'} · AI × 사회</span><span>5학년 · 3차시</span></header><h2>우리 유물 소개하기</h2><p>모둠: ${e(group)||'____________'}　이름: ____________　날짜: ____________</p><p class="worksheet-question">${e(a.name)} · ${e(a.nation)}</p><section><h3>1. 이 유물에서 어떤 생활 모습을 알 수 있나요?</h3><p>2차시에서 확인한 내용을 바탕으로 까닭과 함께 써 봅시다.</p><div class="writing-lines"></div></section><section><h3>2. 친구들에게 유물을 소개해 봅시다.</h3><p>확인한 사실과 생활 모습을 연결하여 두세 문장으로 씁니다.</p><div class="writing-lines introduction-lines"></div></section><footer>친구와 확인하기　□ 사실과 맞나요?　□ 근거가 있나요?　□ 사실과 추측을 구분했나요?</footer></article>`;
}

import {escapeHtml as e} from './model.js';
import {artifacts,textbook} from './data.js';
import {lessonOneFigure,observationIds} from './lesson-one.js';
import {verificationSets} from './lesson-two-data.js';
export const thirdSteps=['기록 살피기','더 조사하기','모둠 자료 모으기'];
export function thirdArtifact(source){return observationIds.includes(source)?artifacts.find(a=>a.id===source):null;}
const rows=[['재료','무엇으로 만들었나요? 벽화는 어디에 그렸나요?'],['모양과 특징','다른 자료와 구별되는 특징은 무엇인가요?'],['쓰임이나 표현한 모습','무엇에 쓰였나요? 그림이나 모형이라면 무엇을 나타냈나요?']];
export function lessonThree({step,source,btn}){
 const a=thirdArtifact(source);
 if(!a)return `<article class="l3-page"><h1>2차시 활동지를 준비해 주세요.</h1><p>지난 시간에 고른 유물을 연결하면 이어서 시작할 수 있습니다.</p><a class="button primary" href="#lesson/2">2차시로 →</a></article>`;
 const set=verificationSets[a.id];step=Math.max(0,Math.min(2,step));
 const titles=['알고 있는 것과 더 알아볼 것을 나누어 봅시다.','자료에서 필요한 내용을 찾아봅시다.','우리 모둠의 조사 자료를 모아 봅시다.'];
 const bodies=[
 `<div class="l3-observe">${lessonOneFigure(a.id)}<div><p>2차시 활동지에서 사실로 확인한 내용과 고친 문장을 읽어 보세요.</p><h2>재료 · 특징 · 쓰임</h2><p>이미 확인한 항목에 표시하고, 더 알아볼 항목을 찾아봅시다.</p><p class="l3-note">지난 기록은 그대로 활용합니다. 모르는 내용만 더 조사합니다.</p></div></div>`,
 `<p class="l3-lead">교과서와 박물관 자료를 읽고, 조사표의 빈 항목을 채워 보세요.</p><table class="l3-research"><thead><tr><th>알아볼 내용</th><th>찾을 때 생각할 질문</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table><div class="l3-sources"><a href="${e(textbook.url)}" target="_blank" rel="noopener">교과서 ${a.page}쪽 ↗</a><a href="${e(set.url)}" target="_blank" rel="noopener">${e(set.site)} ↗</a></div><p class="l3-note">${set.direct?'공식 자료의 해당 유물 설명을 읽습니다.':`기관 사이트에서 ‘${e(set.search)}’을 검색해 보세요.`} 찾은 내용 옆에 교과서 쪽수나 자료 제목을 적습니다. 찾지 못한 내용은 ‘확인 필요’로 남깁니다.</p>`,
 `<p class="l3-lead">친구들의 조사표를 한곳에 모으고, 서로의 근거를 확인해 보세요.</p><ol class="l3-check"><li>각자 알아낸 특징 하나와 확인한 자료를 말합니다.</li><li>친구는 그 자료에서 같은 내용을 찾을 수 있는지 확인합니다.</li><li>잘못 옮기거나 빠뜨린 내용을 조사표에서 고칩니다.</li></ol><p>다음 시간에는 이 자료들을 재료나 쓰임 등의 기준으로 나눕니다.</p><details class="l3-transfer"><summary>모둠 기기에 자료 정리하기</summary><p>자료실에서 모둠이 조사한 유물을 담고, 아래 조사표에 확인한 특징을 입력합니다. 종이 조사표를 보며 모둠 기록 담당자가 정리합니다.</p><a class="button quiet" href="#library">자료실 열기 →</a><a class="button quiet" href="#research">모둠 조사표 열기 →</a></details>`
 ];
 return `<article class="l3-page"><nav class="l3-steps" aria-label="3차시 활동 순서">${thirdSteps.map((label,i)=>btn(`${i+1}. ${label}`,'l3-step',`data-step="${i}" ${i===step?'aria-current="step"':''}`,'quiet')).join('')}</nav><header class="l3-heading"><p>3차시 · ${e(a.name)}</p><h1>${titles[step]}</h1></header>${bodies[step]}<nav class="l3-nav">${btn('← 이전','l3-step',`data-step="${step-1}" ${step===0?'disabled':''}`,'quiet')}${step<2?btn('다음 →','l3-step',`data-step="${step+1}"`,'primary'):'<a class="button primary" href="#lesson/4">4차시로 →</a>'}</nav></article>`;
}
export function thirdWorksheet(source,school,group){
 const a=thirdArtifact(source);if(!a)return '<p>2차시에서 사용한 유물을 먼저 연결해 주세요.</p>';
 return `<article class="worksheet printable l3-worksheet l3-research-sheet"><header><span>${e(school)||'MOAKIT'} · AI × 사회</span><span>5학년 · 3차시</span></header><h2>우리 모둠의 유물 조사</h2><p>모둠: ${e(group)||'____________'}　이름: ____________　날짜: ____________</p><p class="worksheet-question">${e(a.name)} · ${e(a.nation)} · ${e(a.period)}</p><p>이미 확인한 항목에 표시하고, 빈 항목을 더 조사해 봅시다.</p><table class="l3-research"><thead><tr><th>조사할 내용</th><th>확인한 내용</th><th>근거가 있는 곳</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${r[0]}<p>□ 2차시에서 확인</p></th><td></td><td></td></tr>`).join('')}</tbody></table><p>지난 기록을 활용할 때: ‘2차시 ○번 근거’ / 새 자료: 교과서 쪽수 또는 기관 이름·자료 제목</p><section><h3>더 확인해야 할 내용이 있나요?</h3><div class="writing-lines"></div></section><footer>친구와 확인하기　□ 근거를 다시 찾을 수 있습니다.　□ 확인하지 못한 내용은 구분했습니다.</footer></article>`;
}

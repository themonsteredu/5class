import test from 'node:test';import assert from 'node:assert/strict';import {askRobot,realAiPrompt,sameWords} from '../robot.js';
const names={'gold-crown':'금관',figurines:'토우',armor:'철 갑옷과 투구',star:'첨성대',glass:'유리 제품',seosan:'마애여래 삼존상'};
const nameOf=id=>names[id]||id;
const cards=[
 {id:'a',group:3,artifact:'gold-crown',nation:'신라',material:'금',use:'머리에 쓰는 관',feature:'나뭇가지 모양 장식이 있다'},
 {id:'b',group:5,artifact:'figurines',nation:'신라',material:'흙',use:'',feature:'사람의 모습을 작게 만들었다'},
 {id:'c',group:4,artifact:'armor',nation:'가야',material:'철',use:'몸과 머리를 보호',feature:'철판을 이어 만들었다'},
 {id:'d',group:0,artifact:'',nation:'가야',material:'',use:'',feature:'철을 잘 다루었다'}];
const ask=q=>askRobot(q,cards,nameOf);
test('robot checks nation and material against taught cards',()=>{
 assert.equal(ask('금관은 고구려 유물이다').answer,'아니에요');
 assert.match(ask('금관은 고구려 유물이다').reason,/신라 유물이에요/);
 assert.equal(ask('금관은 신라 유물이다').answer,'맞아요');
 assert.equal(ask('토우는 흙으로 만들었다').answer,'맞아요');
 assert.equal(ask('토우는 철로 만들었다').answer,'아니에요');
 assert.equal(ask('금관은 유리로 만들었다').answer,'아니에요');
 assert.equal(ask('금관은 유리로 만들었다').thought.material,'유리');
});
test('robot says it does not know what it was not taught',()=>{
 assert.equal(ask('첨성대는 돌로 만들었다').answer,'몰라요');
 assert.equal(ask('유리 제품은 신라 유물이다').answer,'몰라요');
 assert.equal(ask('오늘 날씨가 좋다').answer,'못 알아들었어요');
});
test('robot flips answers for negative sentences and reports conflicting cards',()=>{
 assert.equal(ask('금관은 고구려 유물이 아니다').answer,'맞아요');
 const wrong=[...cards,{id:'e',group:1,artifact:'gold-crown',nation:'고구려',material:'금',use:'',feature:''}];
 assert.equal(askRobot('금관은 신라 유물이다',wrong,nameOf).answer,'헷갈려요');
});
test('robot handles nation-wide sentences and matching words with evidence',()=>{
 assert.equal(ask('가야는 철을 잘 다루었다').answer,'맞아요');
 assert.equal(ask('신라 유물은 모두 금으로 만들었다').answer,'아니에요');
 assert.match(ask('신라 유물은 모두 금으로 만들었다').reason,/토우\(흙\)/);
 const armor=ask('갑옷은 몸을 보호했다');
 assert.equal(armor.answer,'맞아요');assert.deepEqual(armor.evidence.map(c=>c.id),['c']);
 assert.ok(sameWords('보호했다','몸과 머리를 보호').includes('보호'));
});
test('real AI prompt lists only the taught cards',()=>{const p=realAiPrompt(cards,nameOf);assert.match(p,/금관 \| 나라: 신라 \| 재료: 금/);assert.match(p,/가야 전체/);assert.match(p,/몰라요/);});

import test from 'node:test';import assert from 'node:assert/strict';import {askNationRobot,nationPrompt,findArtifact} from '../robot.js';
const names={susan:'수산리 고분 벽화',kitchen:'안악 3호분 부엌 그림',dancers:'무용총 춤 그림',buddha:'금동 불상','gold-crown':'금관',star:'첨성대'};
const nameOf=id=>names[id]||id;
const facts=[
 {id:1,nation:'고구려',artifact:'susan',sentence:'수산리 고분 벽화는 고구려의 무덤에 그려진 그림이다',original:'수산리 고분 벽화는 백제의 무덤에 그려진 그림이다',status:'고친 문장'},
 {id:2,nation:'고구려',artifact:'susan',sentence:'벽화에서 옛 사람들의 옷차림을 살펴볼 수 있다.',original:'',status:'사실 확인'},
 {id:3,nation:'고구려',artifact:'kitchen',sentence:'안악 3호분 벽화에는 음식을 준비하는 부엌과 고기를 보관하는 창고가 그려져 있다.',original:'',status:'사실 확인'},
 {id:4,nation:'고구려',artifact:'dancers',sentence:'고구려 사람들은 모두 매일 춤을 추었다.',original:'',status:'판단 보류'},
 {id:5,nation:'고구려',artifact:'buddha',sentence:'이 불상은 구리로 만든 뒤 겉에 금을 입힌 금동 불상이다.',original:'이 불상은 순금으로만 만들었다.',status:'고친 문장'}];
const ask=q=>askNationRobot(q,'고구려',facts,nameOf);
test('corrected sentences make the robot reject the original wrong claim',()=>{
 assert.equal(ask('수산리 벽화는 백제 무덤에 있어?').answer,'아니에요');
 assert.match(ask('수산리 벽화는 백제 무덤에 있어?').say,/고구려의 무덤/);
 assert.equal(ask('금동 불상은 순금으로 만들었다').answer,'아니에요');
 assert.equal(ask('수산리 고분 벽화는 신라의 무덤에 그려진 그림이다').answer,'아니에요');
});
test('verified sentences answer questions and confirm statements',()=>{
 const kitchen=ask('안악 3호분 벽화에는 뭐가 그려져 있어?');
 assert.equal(kitchen.answer,'알려 줄게요');assert.equal(kitchen.fact.id,3);
 assert.equal(ask('벽화에서 옛 사람들의 옷차림을 볼 수 있다').answer,'맞아요');
 assert.match(ask('고구려 유물은 뭐가 있어?').say,/수산리 고분 벽화/);
});
test('held judgments and untaught things stay unknown',()=>{
 assert.equal(ask('고구려 사람들은 매일 춤을 췄어?').answer,'알 수 없어요');
 assert.equal(ask('금관은 누가 썼어?').answer,'몰라요');
 assert.match(ask('금관은 누가 썼어?').say,/금관을 배우지 않았어요/);
 assert.equal(ask('첨성대는 돌로 만들었다').answer,'몰라요');
 assert.equal(ask('오늘 급식 뭐야?').answer,'몰라요');
 assert.equal(askNationRobot('토우는 흙으로 만들었다','신라',facts,nameOf).answer,'몰라요');
});
test('artifact names are found by the earliest mention',()=>{assert.equal(findArtifact('금관은 유리로 만들었다').id,'gold-crown');assert.equal(findArtifact('서산 마애 삼존상').id,'seosan');});
test('real AI prompt carries only that nation and the statuses',()=>{const p=nationPrompt('고구려',[...facts,{nation:'신라',artifact:'gold-crown',sentence:'금관은 신라 유물이다',original:'',status:'사실 확인'}],nameOf);assert.match(p,/고구려 역사 로봇/);assert.match(p,/\[고친 문장\] \(수산리 고분 벽화\)/);assert.doesNotMatch(p,/금관은 신라/);});

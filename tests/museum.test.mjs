import test from 'node:test';
import assert from 'node:assert/strict';
import {answerMystery,blockedQuestion,maskSecrets,shuffle,validConfig,groupState,canSubmit} from '../museum-model.js';
import {museumRoom} from '../museum-store.js';
const facts=[{artifact:'gold-crown',status:'사실 확인',sentence:'신라의 황남대총 북분 금관은 금으로 만들었어요.'},{artifact:'gold-crown',status:'고친 문장',sentence:'금관에는 나뭇가지 모양의 장식이 있어요.',original:'금관은 나무로 만들었다.'},{artifact:'house',status:'사실 확인',sentence:'집 모양 토기는 흙으로 만들었어요.'}];
test('country, region, aliases and direct identity questions do not consume opportunities',()=>{
 for(const q of ['너 신라 유물이야?','고 구 려 유물이니?','어느 나라에서 왔어?','무슨 시대야?','어디에서 발견됐어?','왕조는?','너 금관이지?','네 이름은 뭐야?'])assert.ok(blockedQuestion(q),q);
 assert.equal(blockedQuestion('어떤 재료로 만들었어?'),'');
 assert.equal(answerMystery('신라야?','gold-crown',facts).charged,false);
});
test('only taught artifact facts are used and corrected originals never leak',()=>{
 const r=answerMystery('어떤 재료로 만들었어?','gold-crown',facts);
 assert.equal(r.charged,true);assert.match(r.say,/금으로/);assert.doesNotMatch(r.say,/신라|황남대총|금관|흙/);
 const shape=answerMystery('어떤 모양이야?','gold-crown',facts);assert.match(shape.say,/나뭇가지/);
 assert.equal(answerMystery('무게가 몇 킬로야?','gold-crown',facts).charged,false);
 assert.equal(answerMystery('무엇으로 만들었어?','gold-crown',[]).charged,false);
 assert.equal(answerMystery('재료는?','gold-crown',[{...facts[0],status:'판단 보류'}]).charged,false);
});
test('name/country masking, stable shuffle and strict config',()=>{
 assert.doesNotMatch(maskSecrets('백제 금동대향로와 신라 금관'),/백제|금동대향로|신라|금관/);
 const a=['house','gold-crown','spoon','armor','belt','glass'];assert.deepEqual(shuffle(a,'seed'),shuffle(a,'seed'));assert.deepEqual([...shuffle(a,'seed')].sort(),[...a].sort());assert.deepEqual(a,['house','gold-crown','spoon','armor','belt','glass']);
 const c={run:'abc12345',ids:['house','gold-crown'],groups:[1,2],limit:5};assert.ok(validConfig(c));assert.equal(validConfig({...c,ids:['house','house']}),null);assert.equal(validConfig({...c,limit:6}),null);
});
test('drafts never mark exhibits correct; submissions grade separately for every group',()=>{
 const c={ids:['house','gold-crown']},rows=[{group:1,artifact:'D',sentence:'{"a":["house","gold-crown"]}'},{group:2,artifact:'S',sentence:'{"a":["house","gold-crown"]}'},{group:1,artifact:'Q|0',sentence:'재료는?',original:'흙이에요.'}];
 assert.deepEqual(groupState(rows,1,c).correct,[false,false]);assert.equal(groupState(rows,1,c).questions.length,1);assert.equal(groupState(rows,2,c).complete,true);
 rows.push({group:1,artifact:'S',sentence:'{"a":["gold-crown","house"]}'});assert.equal(groupState(rows,1,c).complete,false);
 assert.equal(canSubmit(['house','house'],c.ids),false);assert.equal(canSubmit(['house','gold-crown'],c.ids),true);
});
test('classroom and round rooms are deterministic, isolated and within RPC limits',async()=>{
 const a=await museumRoom('123456789012');assert.match(a,/^[a-z0-9]{12}$/);assert.equal(a,await museumRoom('123456789012'));
 assert.notEqual(a,await museumRoom('223456789012'));assert.notEqual(a,await museumRoom('123456789012','abc12345'));
});

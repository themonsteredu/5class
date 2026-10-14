import test from 'node:test';import assert from 'node:assert/strict';
import {cleanRequest,tidyRequest,sectionsFor,promptText,readCheck,readAsk,expectedVerdict,limits} from '../gemini-prompt.js';
const facts=[
 {artifact:'금관',status:'사실 확인',sentence:'황남대총 북분 금관은 금으로 만든 신라의 관이다.'},
 {artifact:'토우',status:'고친 문장',sentence:'토우는 흙으로 만든 인형이다.',original:'토우는 돌로 만들었다.'},
 {artifact:'금관',status:'판단 보류',sentence:'왕이 이 금관을 매일 머리에 쓰고 다녔다.',original:'무시될 원래 문장'}];
test('check prompt lists every taught sentence with its status in order',()=>{
 const text=promptText(sectionsFor(cleanRequest({mode:'check',robot:'2모둠 신라 로봇',facts})));
 assert.match(text,/^\[역할\]/);
 assert.match(text,/"2모둠 신라 로봇"에게/);
 assert.match(text,/1\. \(금관\) \[사실 확인\] 황남대총/);
 assert.match(text,/2\. \(토우\) \[고친 문장\] 토우는 흙으로 만든 인형이다\. \(고치기 전 문장: 토우는 돌로 만들었다\.\)/);
 assert.match(text,/3\. \(금관\) \[판단 보류\] 왕이/);
 assert.doesNotMatch(text,/무시될 원래 문장/);
});
test('ask prompt carries the learned sentences and the question',()=>{
 const text=promptText(sectionsFor(cleanRequest({mode:'ask',robot:'5모둠 신라 로봇',facts,question:'  금관은   무엇으로 만들었어? '})));
 assert.match(text,/"5모둠 신라 로봇"이야/);
 assert.match(text,/- \[고친 문장\] \(토우\) 토우는 흙으로 만든 인형이다\. \/ 고치기 전 문장: 토우는 돌로 만들었다\./);
 assert.match(text,/\[질문\]\n금관은 무엇으로 만들었어\?$/);
});
test('requests are trimmed to safe sizes and bad values are rejected',()=>{
 assert.throws(()=>cleanRequest({mode:'chat',robot:'x',facts}),/요청 종류/);
 assert.throws(()=>cleanRequest({mode:'check',robot:'',facts}),/로봇 이름/);
 assert.throws(()=>cleanRequest({mode:'check',robot:'x',facts:[{sentence:'   '}]}),/배운 문장이 없어요/);
 assert.throws(()=>cleanRequest({mode:'ask',robot:'x',facts,question:' '}),/물어볼 말/);
 const big=cleanRequest({mode:'check',robot:'r'.repeat(99),facts:Array.from({length:50},(_,i)=>({status:'??',sentence:`문장 ${i} `+'가'.repeat(400)}))});
 assert.equal(big.robot.length,limits.name);assert.equal(big.facts.length,limits.facts);
 assert.equal(big.facts[0].status,'사실 확인');assert.equal(big.facts[0].sentence.length,limits.sentence);
 assert.deepEqual(tidyRequest({mode:'check',robot:'x',facts:[{sentence:' '},{sentence:'a'}]}).facts.map(f=>f.sentence),['a']);
});
test('Gemini check replies are matched to sentence numbers and cleaned',()=>{
 const r=readCheck({results:[{no:2,verdict:'고쳐야 해요',reason:'이유',fix:'바른 문장'},{no:1,verdict:'맞아요',reason:'좋아요',fix:'남김'},{no:1,verdict:'고쳐야 해요'},{no:9,verdict:'맞아요'},{no:3,verdict:'몰라'}],tip:'더 가르쳐요'},3);
 assert.deepEqual(r.results.map(x=>[x.no,x.verdict,x.fix]),[[1,'맞아요',''],[2,'고쳐야 해요','바른 문장'],[3,'자료로는 알 수 없어요','']]);
 assert.equal(r.tip,'더 가르쳐요');
 assert.deepEqual(readCheck(null,2),{results:[],tip:''});
 assert.deepEqual(readAsk({answer:'맞아요',say:'네'}),{answer:'맞아요',say:'네'});
 assert.equal(readAsk({answer:'그럼요'}).answer,'몰라요');
 assert.equal(expectedVerdict['고친 문장'],'맞아요');assert.equal(expectedVerdict['판단 보류'],'자료로는 알 수 없어요');
});

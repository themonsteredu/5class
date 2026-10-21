import test from 'node:test';
import assert from 'node:assert/strict';
import {questionPool,initialQuestions,worksheetPages} from '../lesson-five-worksheet.js';
test('worksheet only uses confirmed facts and corrected false originals, with no invented false claims',()=>{
 const facts=[{artifact:'house',status:'사실 확인',sentence:'흙으로 만들었어요.'},{artifact:'armor',status:'고친 문장',sentence:'철로 만들었어요.',original:'나무로 만들었어요.'},{artifact:'glass',status:'판단 보류',sentence:'확인하지 않은 문장'}];
 const pool=questionPool(facts);assert.equal(pool.length,3);assert.equal(pool.filter(q=>q.answer==='X')[0].text,'나무로 만들었어요.');assert.ok(!pool.some(q=>q.text.includes('확인하지')));
 const chosen=initialQuestions(pool);assert.equal(chosen.length,6);assert.equal(chosen.filter(q=>q.text).length,2);assert.equal(chosen.find(q=>q.answer==='X').reason,'철로 만들었어요.');
 const student=worksheetPages({questions:chosen});assert.equal((student.match(/class="leap-page"/g)||[]).length,2);assert.ok(!student.includes('확인한 내용:'));assert.ok(student.includes('O　X'));
 const key=worksheetPages({questions:chosen,key:true});assert.ok(key.includes('확인한 내용:'));assert.ok(key.includes('철로 만들었어요.'));
});
test('worksheet never marks a confirmed true sentence as false and escapes input',()=>{
 const pool=questionPool([{artifact:'house',status:'사실 확인',sentence:'같은 문장'},{artifact:'house',status:'고친 문장',sentence:'새로운 문장',original:'같은 문장'}]);assert.ok(pool.every(q=>q.answer==='O'));
 assert.ok(!worksheetPages({questions:[{text:'<script>x</script>',answer:'O'}]}).includes('<script>'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {questionPool,initialQuestions,worksheetPages} from '../lesson-five-worksheet.js';
test('worksheet only uses confirmed facts and corrected false originals, with no invented false claims',()=>{
 const facts=[{artifact:'house',status:'사실 확인',sentence:'흙으로 만들었어요.'},{artifact:'armor',status:'고친 문장',sentence:'철로 만들었어요.',original:'나무로 만들었어요.'},{artifact:'glass',status:'판단 보류',sentence:'확인하지 않은 문장'}];
 const pool=questionPool(facts);assert.equal(pool.length,3);assert.equal(pool.filter(q=>q.answer==='X')[0].text,'나무로 만들었어요.');assert.ok(!pool.some(q=>q.text.includes('확인하지')));
 const chosen=initialQuestions(pool);assert.equal(chosen.length,20);assert.equal(chosen.filter(q=>q.text).length,2);assert.equal(chosen.find(q=>q.answer==='X').reason,'철로 만들었어요.');
 const student=worksheetPages({questions:chosen,lesson:6});assert.equal((student.match(/class="leap-page"/g)||[]).length,1);assert.ok(!student.includes('확인한 내용:'));assert.ok(student.includes('O　X'));
 const key=worksheetPages({questions:chosen,key:true});assert.ok(key.includes('확인한 내용:'));assert.ok(key.includes('철로 만들었어요.'));
});
test('worksheet never marks a confirmed true sentence as false and escapes input',()=>{
 const pool=questionPool([{artifact:'house',status:'사실 확인',sentence:'같은 문장'},{artifact:'house',status:'고친 문장',sentence:'새로운 문장',original:'같은 문장'}]);assert.ok(pool.every(q=>q.answer==='O'));
 assert.ok(!worksheetPages({questions:[{text:'<script>x</script>',answer:'O'}]}).includes('<script>'));
});

test('twenty questions print with continuous numbering and one reflection section',()=>{
 const questions=Array.from({length:20},(_,i)=>({text:`확인한 문장 ${i+1}`,answer:'O',reason:`확인 근거 ${i+1}`}));
 assert.equal(initialQuestions(questions).filter(q=>q.text).length,20);
 const html=worksheetPages({lesson:6,questions});
 assert.equal((html.match(/class="leap-page"/g)||[]).length,4);
 assert.ok(html.includes('<th>20</th>'));
 assert.equal((html.match(/X라고 생각한 문장/g)||[]).length,1);
 const key=worksheetPages({lesson:6,questions,key:true});assert.ok(key.includes('start="19"'));
});

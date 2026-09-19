import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const p of ['index.html','app.js','lesson-one.js','lesson-two.js','data.js','model.js','style.css','assets'])await cp(p,`dist/${p}`,{recursive:true});
console.log('Built 5class → dist');

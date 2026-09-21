import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const p of ['index.html','app.js','lesson-one.js','lesson-two.js','lesson-two-data.js','data.js','model.js','style.css','assets'])await cp(p,`dist/${p}`,{recursive:true});
console.log('Built 5class → dist');

for(const font of ['5Medium','7ExtraBold'])await rm(`dist/assets/fonts/S-CoreDream-${font}.woff`,{force:true});

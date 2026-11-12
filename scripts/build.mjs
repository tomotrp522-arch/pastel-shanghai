import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
const files=['index.html','manifest.webmanifest','sw.js'];
await mkdir('dist',{recursive:true});for(const f of files)await copyFile(f,'dist/'+f);for(const dir of ['src','icons'])await cp(dir,'dist/'+dir,{recursive:true});
await writeFile('dist/.nojekyll','');
for(const f of files)if(!(await readFile('dist/'+f)).length)throw Error('Empty output: '+f);
console.log('ビルド完了: dist/（依存パッケージ不要）');

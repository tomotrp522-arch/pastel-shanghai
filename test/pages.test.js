import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
const base='https://tomotrp522-arch.github.io/pastel-shanghai/';

test('GitHub Pagesのサブパス内にHTML・モジュール・PWAのURLが解決する',async()=>{
 const html=await readFile('index.html','utf8');
 for(const [,reference]of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const url=new URL(reference,base);assert.ok(url.href.startsWith(base),url.href);await access(url.pathname.slice('/pastel-shanghai/'.length));
 }
 const modules=['app.js','engine.js','storage.js','tiles.js','audio.js','shuffle-animation.js'];
 for(const file of modules){const source=await readFile('src/'+file,'utf8');for(const [,reference]of source.matchAll(/from\s+['"]([^'"]+)['"]/g)){const url=new URL(reference,base+'src/'+file);assert.ok(url.href.startsWith(base),url.href);await access(url.pathname.slice('/pastel-shanghai/'.length));}}
 const manifest=JSON.parse(await readFile('manifest.webmanifest','utf8'));
 for(const field of ['id','start_url','scope'])assert.equal(new URL(manifest[field],base).href,base);
 for(const icon of manifest.icons)assert.ok(new URL(icon.src,base).href.startsWith(base+'icons/'));
 assert.match(await readFile('src/app.js','utf8'),/register\('\.\/sw\.js'\)/);
});

test('公開先サブパスの全アセットをオフライン取得し、他ゲームのキャッシュを変更しない',async()=>{
 const events={},cachesByName=new Map(),deleted=[],requests=[];let activeName;
 const prefix='pastel-shanghai:/pastel-shanghai/:';
 cachesByName.set(prefix+'old',new Map());
 cachesByName.set('pastel-shanghai:/existing-game/:old',new Map([['keep','safe']]));
 cachesByName.set('another-game-cache',new Map([['keep','safe']]));
 const cacheAPI={
  keys:async()=>[...cachesByName.keys()],
  delete:async name=>{deleted.push(name);return cachesByName.delete(name);},
  open:async name=>{activeName=name;if(!cachesByName.has(name))cachesByName.set(name,new Map());const entries=cachesByName.get(name);return {
   addAll:async urls=>{for(const ref of urls){const url=new URL(ref,base);assert.ok(url.href.startsWith(base));const file=ref==='./'?'index.html':ref.slice(2);await access(file);entries.set(url.href,{file});requests.push(url.href);}},
   match:async req=>entries.get(req.url)
  };}
 };
 const context={URL,caches:cacheAPI,fetch:async()=>{throw Error('offline');},self:{location:{href:base+'sw.js'},addEventListener:(name,handler)=>events[name]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 vm.runInNewContext(await readFile('sw.js','utf8'),context);let pending;
 events.install({waitUntil:p=>pending=p});await pending;
 assert.ok(activeName.startsWith(prefix));assert.equal(requests.length,14);
 events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,[prefix+'old']);
 assert.equal(cachesByName.get('pastel-shanghai:/existing-game/:old').get('keep'),'safe');
 for(const url of requests){events.fetch({request:{url,method:'GET'},respondWith:p=>pending=p});assert.ok((await pending).file);}
 for(const url of ['https://tomotrp522-arch.github.io/another-game/src/app.js','https://tomotrp522-arch.github.io/pastel-shanghai-other/','https://other.test/pastel-shanghai/']){
  let intercepted=false;events.fetch({request:{url,method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false,url);
 }
 let intercepted=false;events.fetch({request:{url:base,method:'POST'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});

test('Pagesは専用リポジトリのmainへのpushだけで自動公開する設定',async()=>{
 const workflow=await readFile('.github/workflows/pages.yml','utf8');
 assert.match(workflow,/push:\s*\n\s*branches: \[main\]/);
 assert.match(workflow,/github.repository == 'tomotrp522-arch\/pastel-shanghai'/);
 assert.match(workflow,/github.ref == 'refs\/heads\/main'/);
 assert.ok(workflow.indexOf('run: node --test')<workflow.indexOf('run: node scripts/build.mjs'));
 assert.match(workflow,/needs: build/);assert.match(workflow,/path: dist/);
 assert.match(workflow,/pages: write/);assert.match(workflow,/id-token: write/);
 assert.doesNotMatch(workflow,/personal.access.token|secrets\.(GH_TOKEN|PAT)/i);
});

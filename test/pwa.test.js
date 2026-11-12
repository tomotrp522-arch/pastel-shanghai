import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
test('PWAの全アセットが存在し、オフラインではキャッシュから返す',async()=>{
  const events={},stored=new Map(),deleted=[];let claimed=false,skipped=false;
  const cache={match:async req=>stored.get(req.url),addAll:async urls=>{for(const url of urls){const file=url==='./'?'index.html':url.slice(2);await access(file);stored.set(new URL(url,'https://example.test/game/').href,{cached:true,file});}}};
  const context={URL,fetch:async()=>{throw Error('offline');},caches:{open:async()=>cache,keys:async()=>['pastel-shanghai:/game/:old','pastel-shanghai:/another-game/:old','another-app'],delete:async key=>{deleted.push(key);}},self:{location:{href:'https://example.test/game/sw.js'},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{skipped=true;},clients:{claim:async()=>{claimed=true;}}}};
  vm.runInNewContext(await readFile('sw.js','utf8'),context);let pending;
  events.install({waitUntil:p=>pending=p});await pending;assert.ok(skipped);assert.equal(stored.size,14);
  events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['pastel-shanghai:/game/:old']);assert.ok(claimed);
  events.fetch({request:{method:'GET',url:'https://example.test/game/src/app.js'},respondWith:p=>pending=p});assert.equal((await pending).file,'src/app.js');
  let intercepted=false;events.fetch({request:{method:'GET',url:'https://other.test/'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
  const manifest=JSON.parse(await readFile('manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');for(const icon of manifest.icons){const b=await readFile(icon.src);assert.equal(b.readUInt32BE(16),parseInt(icon.sizes));}
});

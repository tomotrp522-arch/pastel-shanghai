import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,remainingSupport,useHint,commitShuffle,reshuffle,undo,snapshot,removePair,restartGame,retireGame,stuckOptions,status,isFree,stars} from '../src/engine.js';
import {defaults,save,load,KEY} from '../src/storage.js';
const memory=()=>{const entries=new Map();return {getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};};
const left=g=>['hints','shuffles','undos'].map(k=>remainingSupport(g,k));
const tile=(id,x,face='wan1',z=0)=>({id,x,y:0,z,face,removed:false});

test('ヒントは選択できるペアにだけ消費し、3回で停止する',()=>{
 const g=createGame('stage',1,42);assert.deepEqual(left(g),[3,2,3]);
 for(let i=0;i<3;i++){const pair=useHint(g);assert.equal(pair.length,2);assert.ok(pair.every(id=>isFree(g.tiles.find(t=>t.id===id),g.tiles)));}
 assert.equal(useHint(g),null);assert.equal(g.hints,3);
 g.hints=0;g.tiles=[tile(0,0),tile(1,1,'wan2')];assert.equal(useHint(g),null);assert.equal(g.hints,0);
});
test('シャッフルは2回まで。失敗は回数も盤面も変えない',()=>{
 const g=createGame('stage',75,42);
 for(let i=0;i<2;i++){const next=reshuffle(g,i);assert.ok(commitShuffle(g,next));assert.equal(status(g.tiles),'playing');}
 const before=structuredClone(g);assert.equal(commitShuffle(g,reshuffle(g,99)),false);assert.deepEqual(g,before);
 const bad=createGame();const original=structuredClone(bad);
 assert.equal(commitShuffle(bad,{tiles:[tile(0,0),tile(1,1,'wan2')]}),false);
 assert.equal(commitShuffle(bad,{tiles:[tile(0,0),tile(1,1)],solution:[[0,1]]}),false);
 assert.deepEqual(bad,original);
});
test('1手戻すは3回までで、ヒントやシャッフルの使用回数を復活させない',()=>{
 const g=createGame('stage',70,22);useHint(g);assert.ok(commitShuffle(g,reshuffle(g,77)));
 assert.ok(undo(g));assert.equal(g.shuffles,1);assert.equal(g.hints,1);
 for(let i=0;i<2;i++){g.history.push(snapshot(g));g.tiles=removePair(g.tiles,...g.solution[0]);assert.ok(undo(g));}
 g.history.push(snapshot(g));const before=structuredClone(g);assert.equal(undo(g),false);assert.deepEqual(g,before);assert.deepEqual(left(g),[2,1,0]);
 const empty=createGame();assert.equal(undo(empty),false);assert.equal(empty.undos,0);
});
test('保存・再読み込みで使用回数と既存の星・ベスト・解放状況を正確に維持',()=>{
 const storage=memory(),d=defaults();d.progress={unlocked:76,stars:{1:3,25:2,75:1},best:{0:91.5,1:123.75,2:240}};
 d.game=createGame('stage',75,10);for(let i=0;i<3;i++)useHint(d.game);
 for(let i=0;i<2;i++)assert.ok(commitShuffle(d.game,reshuffle(d.game,i)));
 assert.ok(undo(d.game));assert.ok(save(d,storage));const reloaded=load(storage).data;
 assert.deepEqual(reloaded,d);assert.deepEqual(left(reloaded.game),[0,0,2]);
 assert.equal(useHint(reloaded.game),null);assert.equal(commitShuffle(reloaded.game,reshuffle(reloaded.game)),false);
 assert.deepEqual(reloaded.progress,d.progress);
});
test('旧保存形式・上限を超える旧使用回数を拒否せず、データを消去しない',()=>{
 const storage=memory(),d=defaults();d.progress={unlocked:100,stars:{1:3,100:2},best:{2:181}};d.game=createGame('free',2,50);
 d.game.hints=8;d.game.shuffles=6;d.game.undos=10;
 const raw=JSON.stringify(d);storage.setItem(KEY,raw);const loaded=load(storage);
 assert.equal(loaded.recovered,false);assert.deepEqual(loaded.data,d);assert.deepEqual(left(loaded.data.game),[0,0,0]);assert.equal(storage.getItem(KEY),raw);
 assert.ok(save(loaded.data,storage));assert.deepEqual(load(storage).data,d);
});
test('やり直しは同じ盤面で回数をリセットし、過去の成績には触れない',()=>{
 const d=defaults();d.progress={unlocked:10,stars:{1:3,9:2},best:{0:75}};d.game=createGame('stage',10,44);
 const initial=structuredClone(d.game.initial),progress=structuredClone(d.progress);
 useHint(d.game);commitShuffle(d.game,reshuffle(d.game));d.game.elapsed=100;
 restartGame(d.game);assert.deepEqual(d.game.tiles,initial);assert.deepEqual(left(d.game),[3,2,3]);assert.equal(d.game.history.length,0);assert.equal(d.game.elapsed,0);assert.deepEqual(d.progress,progress);
 assert.deepEqual(left(createGame('free',0,44)),[3,2,3]);
});
test('リタイアは進行中ゲームだけを終了し、星・解放・ベストを保持して保存',()=>{
 for(const mode of ['stage','free']){const storage=memory(),d=defaults();d.progress={unlocked:80,stars:{1:3,79:2},best:{0:88,2:180}};const before=structuredClone(d.progress);d.game=createGame(mode,mode==='stage'?80:2,42);
 retireGame(d);assert.equal(d.game,null);assert.deepEqual(d.progress,before);assert.ok(save(d,storage));assert.deepEqual(load(storage).data.progress,before);assert.equal(load(storage).data.game,null);}
});
test('手詰まり案内は残りシャッフル・戻す回数と正確な自由牌判定に従う',()=>{
 const g=createGame();g.tiles=[tile(0,0),tile(1,1,'wan2')];
 assert.equal(status(g.tiles),'stuck');assert.deepEqual(stuckOptions(g),['shuffle','restart','retire']);
 g.history.push(snapshot(g));assert.deepEqual(stuckOptions(g),['shuffle','undo','restart','retire']);
 g.shuffles=2;g.undos=3;assert.deepEqual(stuckOptions(g),['restart','retire']);
 g.tiles=[tile(0,0),tile(1,0,'wan1',1)];assert.equal(status(g.tiles),'stuck');
 g.tiles=[tile(0,0),tile(1,1)];assert.equal(status(g.tiles),'playing');assert.deepEqual(stuckOptions(g),[]);
 g.tiles=g.tiles.map(t=>({...t,removed:true}));assert.equal(status(g.tiles),'clear');assert.deepEqual(stuckOptions(g),[]);
});
test('手詰まりからのシャッフルを再判定し、成功した場合だけ回数を減らす',()=>{
 const g=createGame();g.tiles=[tile(0,0),tile(1,0,'wan1',1)];assert.equal(status(g.tiles),'stuck');
 const next=reshuffle(g,12);assert.ok(next.rearranged);assert.ok(commitShuffle(g,next));assert.equal(status(g.tiles),'playing');assert.deepEqual(stuckOptions(g),[]);assert.equal(g.shuffles,1);
});
test('新制限でも星の評価を変更しない',()=>{
 const g=createGame();assert.equal(stars(g),3);useHint(g);assert.equal(stars(g),2);
 commitShuffle(g,reshuffle(g,1));assert.equal(stars(g),2);commitShuffle(g,reshuffle(g,2));assert.equal(stars(g),1);
});

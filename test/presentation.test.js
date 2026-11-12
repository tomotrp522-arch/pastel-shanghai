import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playShuffle,SHUFFLE_DURATION} from '../src/shuffle-animation.js';
import {faceSVG} from '../src/tiles.js';
import {Audio} from '../src/audio.js';

function scene({reject=false,throwAt=0}={}){
 const effects=[],classes=new Set();let calls=0;
 const make=()=>({style:{},children:[],setAttribute(){},append(x){this.children.push(x);},remove(){this.removed=true;},animate(frames,options){if(++calls===throwAt)throw Error('Animation unavailable');const a={frames,options,cancelled:false,finished:reject?Promise.reject(Error('cancelled')):Promise.resolve(),cancel(){this.cancelled=true;}};effects.push(a);return a;}});
 const tiles=Array.from({length:24},()=>({...make(),logical:{x:1,y:2,z:1,face:'wan3'}}));
 const shell={...make(),classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},ownerDocument:{createElement:make}};
 return {tiles,effects,classes,shell,board:{querySelectorAll:()=>tiles}};
}
test('シャッフルは1.5秒以内で座標を変えず、粒子と一時アニメーションを片付ける',async()=>{
 const s=scene(),before=s.tiles.map(t=>structuredClone(t.logical));await playShuffle(s.board,s.shell);
 assert.equal(SHUFFLE_DURATION,1500);assert.equal(s.effects.length,36);
 assert.ok(s.effects.every(e=>e.options.duration+e.options.delay<=1500));
 assert.deepEqual(s.tiles.map(t=>t.logical),before);assert.equal(s.classes.size,0);
 assert.ok(s.effects.every(e=>e.cancelled));assert.ok(s.shell.children[0].removed);
 const frames=s.effects.at(-1).frames;assert.match(frames[2].transform,/rotate/);assert.equal(frames.at(-1).transform,'translate(0,0) rotate(0deg)');
});
test('動きを減らす設定では移動・回転・粒子を使わず220msで完了',async()=>{
 const s=scene();await playShuffle(s.board,s.shell,{reducedMotion:true});assert.equal(s.effects.length,24);assert.equal(s.shell.children.length,0);
 for(const e of s.effects){assert.equal(e.options.duration,220);assert.ok(e.frames.every(f=>!('transform'in f)));}
});
test('アニメーションのキャンセルやAPI失敗でも後処理を行う',async()=>{
 const s=scene({reject:true});await playShuffle(s.board,s.shell);assert.equal(s.classes.size,0);assert.ok(s.effects.every(e=>e.cancelled));
 const broken=scene({throwAt:15});await assert.rejects(playShuffle(broken.board,broken.shell));assert.equal(broken.classes.size,0);assert.ok(broken.effects.every(e=>e.cancelled));assert.ok(broken.shell.children[0].removed);
});
test('シャッフル音は効果音OFFに従い、簡易演出では混ぜる音を省く',()=>{
 const a=new Audio({bgm:false,sfx:false}),calls=[];a.tone=(...args)=>calls.push(args);
 a.shuffle();a.effect('shuffleDone');assert.equal(calls.length,0);
 a.settings.sfx=true;a.shuffle(true);assert.equal(calls.length,2);calls.length=0;
 a.shuffle();assert.equal(calls.length,20);assert.ok(calls.every(c=>c[1]<1.3));calls.length=0;
 a.effect('shuffleDone');assert.equal(calls.length,2);
});
test('42種のSVGは識別用ラベルと固有の絵柄を保持',()=>{
 const faces=['wan','dot','bamboo'].flatMap(s=>Array.from({length:9},(_,i)=>s+(i+1))).concat(['east','south','west','north','red','green','white'],['flower','season'].flatMap(s=>[1,2,3,4].map(i=>s+i)));
 const rendered=faces.map(faceSVG);assert.equal(rendered.length,42);assert.equal(new Set(rendered.map(x=>x.svg)).size,42);
 rendered.forEach(f=>{assert.ok(f.label);assert.match(f.svg,/viewBox="0 0 56 72"/);assert.doesNotMatch(f.svg,/undefined|NaN/);});
});
const luminance=hex=>{const v=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('UIと牌の基本色は明るい背景に対し4.5:1以上のコントラスト',()=>{
 for(const text of ['#65445a','#73576b','#75415e'])assert.ok(contrast(text,'#f8edf0')>=4.5,text);
 for(const ink of ['#a51f38','#15569b','#146545','#332a68','#ae315d','#6e3c91','#986315','#176e50'])assert.ok(contrast(ink,'#fff9e9')>=4.5,ink);
 assert.ok(contrast('#ffffff','#98536f')>=4.5);
});

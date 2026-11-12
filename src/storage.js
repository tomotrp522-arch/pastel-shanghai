import {VERSION} from './engine.js';
export const KEY='pastel-shanghai-v1';
export const defaults=()=>({version:VERSION,progress:{unlocked:1,stars:{},best:{}},settings:{bgm:true,sfx:true},game:null});
const validTiles=a=>Array.isArray(a)&&a.length>0&&a.length<=400&&new Set(a.map(t=>t.id)).size===a.length&&a.every(t=>Number.isInteger(t.id)&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isInteger(t.z)&&t.z>=0&&typeof t.face==='string'&&/^(wan[1-9]|dot[1-9]|bamboo[1-9]|east|south|west|north|red|green|white|flower[1-4]|season[1-4])$/.test(t.face)&&typeof t.removed==='boolean');
export function validate(data){
  if(!data||data.version!==VERSION)throw Error('Unsupported save');
  const p=data.progress;if(!p||!Number.isInteger(p.unlocked)||p.unlocked<1||p.unlocked>100||!p.stars||!p.best)throw Error('Invalid progress');
  for(const [k,v]of Object.entries(p.stars))if(!/^\d+$/.test(k)||+k<1||+k>100||![1,2,3].includes(v))throw Error('Invalid stars');
  for(const [k,v]of Object.entries(p.best))if(!['0','1','2'].includes(k)||!Number.isFinite(v)||v<0)throw Error('Invalid best');
  if(!data.settings||typeof data.settings.bgm!=='boolean'||typeof data.settings.sfx!=='boolean')throw Error('Invalid settings');
  const g=data.game;if(g){if(!['stage','free'].includes(g.mode)||!Number.isInteger(g.level)||(g.mode==='stage'?(g.level<1||g.level>p.unlocked):(g.level<0||g.level>2))||!validTiles(g.tiles)||!validTiles(g.initial)||!Array.isArray(g.solution)||!Array.isArray(g.history)||g.history.length>200||!g.history.every(h=>validTiles(h.tiles)&&Array.isArray(h.solution))||!['elapsed','hints','shuffles','undos'].every(k=>Number.isFinite(g[k])&&g[k]>=0)||typeof g.completed!=='boolean')throw Error('Invalid game');}
  return data;
}
export function load(storage){try{storage??=globalThis.localStorage;const raw=storage.getItem(KEY);if(raw){try{return {data:validate(JSON.parse(raw)),recovered:false};}catch{const backup=storage.getItem(KEY+'-backup');if(backup)return {data:validate(JSON.parse(backup)),recovered:true};throw Error('Invalid save');}}return {data:defaults(),recovered:false};}catch{return {data:defaults(),recovered:true};}}
export function save(data,storage){try{storage??=globalThis.localStorage;const value=JSON.stringify(validate(data));const old=storage.getItem(KEY);if(old){try{validate(JSON.parse(old));storage.setItem(KEY+'-backup',old);}catch{/* Preserve last valid backup. */}}storage.setItem(KEY,value);return true;}catch{return false;}}

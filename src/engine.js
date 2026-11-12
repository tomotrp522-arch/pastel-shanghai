// Tiles occupy [x,x+1] × [y,y+1] at level z. Touching edges do not overlap.
export const VERSION = 1;
export function rng(seed) { let a=seed>>>0; return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
const overlap=(a,b)=>a<b+1-1e-6&&b<a+1-1e-6;
export function isFree(tile,tiles) {
  if (!tile || tile.removed) return false;
  const live=tiles.filter(t=>!t.removed&&t.id!==tile.id);
  if(live.some(t=>t.z>tile.z&&overlap(t.x,tile.x)&&overlap(t.y,tile.y)))return false;
  const side=d=>live.some(t=>t.z===tile.z&&Math.abs(t.x-tile.x-d)<1e-6&&overlap(t.y,tile.y));
  return !side(-1)||!side(1);
}
export function matchKey(face) { return face.startsWith('flower')?'flower':face.startsWith('season')?'season':face; }
export function matches(a,b) { return a.id!==b.id && matchKey(a.face)===matchKey(b.face); }
export function availablePairs(tiles) { const free=tiles.filter(t=>isFree(t,tiles)),pairs=[]; for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(matches(free[i],free[j]))pairs.push([free[i].id,free[j].id]); return pairs; }
export function status(tiles) { return tiles.every(t=>t.removed)?'clear':availablePairs(tiles).length?'playing':'stuck'; }
export function removePair(tiles,a,b) { const x=tiles.find(t=>t.id===a),y=tiles.find(t=>t.id===b); if(!x||!y||!isFree(x,tiles)||!isFree(y,tiles)||!matches(x,y))return null; return tiles.map(t=>t.id===a||t.id===b?{...t,removed:true}:{...t}); }
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function layout(seed,tier) {
  const r=rng(seed), rows=4+Math.min(4,tier), max=6+Math.min(3,tier)*2;
  const out=[];let id=0;
  for(let y=0;y<rows;y++) {
    const w=2*(1+Math.floor(r()*(max/2)));
    for(let x=0;x<w;x++)out.push({id:id++,x:(max-w)/2+x,y,z:0,removed:false});
    if(tier>0&&y>0&&y<rows-1&&r()<.35+tier*.12){const upper=Math.max(2,w-2);for(let x=0;x<upper;x++)out.push({id:id++,x:(max-upper)/2+x,y,z:1,removed:false});
      if(tier>=3&&upper>=6&&r()<.6)for(let x=0;x<upper-2;x++)out.push({id:id++,x:(max-upper+2)/2+x,y,z:2,removed:false});}
  }
  return out;
}
export const STAGES=(()=>{const result=[],seen=new Set();for(let i=1;i<=100;i++){const tier=Math.min(4,Math.floor((i-1)/20));let seed=i*7919,tiles,key;do{tiles=layout(seed++,tier);key=tiles.map(t=>`${t.x},${t.y},${t.z}`).join(';');}while(seen.has(key));seen.add(key);result.push({number:i,tier,seed:seed-1,tiles});}return result;})();
function removalOrder(tiles,r,symmetric=false) {
  const work=tiles.filter(t=>!t.removed).map(t=>({...t})),order=[];
  while(work.some(t=>!t.removed)) {
    const free=work.filter(t=>isFree(t,work)); if(free.length<2)return null;
    let a,b;
    if(symmetric){const candidates=free.filter(t=>free.some(u=>u.id!==t.id&&u.y===t.y&&u.z===t.z)); if(!candidates.length)return null; a=candidates[Math.floor(r()*candidates.length)];const row=free.filter(t=>t.y===a.y&&t.z===a.z).sort((x,y)=>x.x-y.x);a=row[0];b=row.at(-1);}
    else {shuffle(free,r);[a,b]=free;}
    a.removed=b.removed=true;order.push([a.id,b.id]);
  }return order;
}
const faces=Array.from({length:27},(_,i)=>['wan','dot','bamboo'][Math.floor(i/9)]+(i%9+1)).concat(['east','south','west','north','red','green','white']);
function assign(tiles,order,r,existing=null) {
  let bag;
  if(existing){const groups=new Map();for(const t of existing.filter(t=>!t.removed)){const key=matchKey(t.face);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t.face);}bag=[];for(const group of groups.values()){if(group.length%2)throw Error('Unpaired tile inventory');for(let i=0;i<group.length;i+=2)bag.push([group[i],group[i+1]]);}shuffle(bag,r);}
  else bag=shuffle([...faces.flatMap(f=>[[f,f],[f,f]]),['flower1','flower2'],['flower3','flower4'],['season1','season2'],['season3','season4']],r);
  // Layouts may exceed a traditional set; each additional set is independently paired.
  const map=new Map();order.forEach(([a,b],i)=>{const pair=bag[i%bag.length];map.set(a,pair[0]);map.set(b,pair[1]);});
  return {tiles:tiles.map(t=>({...t,face:map.get(t.id)??t.face})),solution:order};
}
export function createGame(mode='stage',level=1,seed=Date.now()) {
  const r=rng(seed),geometry=mode==='stage'?STAGES[level-1].tiles:layout(seed,[0,2,4][level]);
  let order=null;for(let i=0;i<8&&!order;i++)order=removalOrder(geometry,r);order??=removalOrder(geometry,r,true);
  const assigned=assign(geometry,order,r);
  return {mode,level,seed,...assigned,initial:structuredClone(assigned.tiles),history:[],elapsed:0,hints:0,shuffles:0,undos:0,completed:false};
}
export function reshuffle(game,seed=Date.now()) {
  const r=rng(seed);let order=null,geometry=game.tiles;
  for(let i=0;i<64&&!order;i++)order=removalOrder(geometry,r);
  let rearranged=false;
  if(!order){let id=0;const count=geometry.filter(t=>!t.removed).length;geometry=[];for(let i=0;i<count;i+=2){const row=Math.floor(i/8),col=i%8;geometry.push({id:id++,x:col,y:row,z:0,removed:false},{id:id++,x:col+1,y:row,z:0,removed:false});}order=removalOrder(geometry,r,true);rearranged=true;}
  return {...assign(geometry,order,r,game.tiles),rearranged};
}
export function snapshot(game){return structuredClone({tiles:game.tiles,solution:game.solution});}
export function undo(game){const prev=game.history.pop();if(!prev)return false;game.tiles=prev.tiles;game.solution=prev.solution;game.undos++;return true;}
export function stars(game){return game.hints+game.shuffles+game.undos===0&&game.elapsed<=game.initial.length*12?3:game.shuffles<=1&&game.hints<=3?2:1;}
export function recordClear(progress,game){const p=structuredClone(progress);if(game.mode==='stage'){p.stars[game.level]=Math.max(p.stars[game.level]||0,stars(game));p.unlocked=Math.min(100,Math.max(p.unlocked,game.level+1));}else{const old=p.best[game.level];p.best[game.level]=old==null?game.elapsed:Math.min(old,game.elapsed);}return p;}

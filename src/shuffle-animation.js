export const SHUFFLE_DURATION=1500;
// Visual transforms never change logical coordinates or tile state.
export async function playShuffle(board,shell,{reducedMotion=false,duration=SHUFFLE_DURATION}={}){
 const animations=[];let particles;
 try{
  const tiles=[...board.querySelectorAll('.tile')];shell.classList.add('shuffle-running');
  if(!reducedMotion){particles=shell.ownerDocument.createElement('div');particles.className='shuffle-particles';particles.setAttribute('aria-hidden','true');
   for(let i=0;i<12;i++){const p=shell.ownerDocument.createElement('span');p.textContent=i%2?'✦':'✧';p.style.left=`${10+(i*23)%80}%`;p.style.top=`${15+(i*17)%65}%`;particles.append(p);animations.push(p.animate([{opacity:0,transform:'translateY(8px) scale(.5)'},{opacity:.85,offset:.4,transform:'translateY(-8px) scale(1)'},{opacity:0,transform:'translateY(-24px) scale(.6)'}],{duration:duration*.65,delay:i*23+200,fill:'both'}));}shell.append(particles);}
  tiles.forEach((tile,i)=>{
   const direction=i%2?1:-1,dx=direction*(17+i%4*7),dy=-12-i%3*5;
   const frames=reducedMotion?[{opacity:1},{opacity:.5},{opacity:1}]:[
    {transform:'translate(0,0) rotate(0deg)',offset:0},
    {transform:`translate(0,-10px) rotate(${direction*3}deg)`,offset:.18},
    {transform:`translate(${dx}px,${dy}px) rotate(${direction*13}deg)`,offset:.43},
    {transform:`translate(${-dx*.7}px,${dy-6}px) rotate(${-direction*11}deg)`,offset:.70},
    {transform:`translate(${dx*.2}px,-5px) rotate(${direction*3}deg)`,offset:.86},
    {transform:'translate(0,0) rotate(0deg)',offset:1}];
   animations.push(tile.animate(frames,{duration:reducedMotion?220:duration-80,delay:reducedMotion?0:i%5*20,easing:'ease-in-out',fill:'none'}));
  });
  await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
 }finally{animations.forEach(a=>a.cancel());particles?.remove();shell.classList.remove('shuffle-running');}
}

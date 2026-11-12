// Original pentatonic music-box phrase, synthesized locally without audio assets.
export class Audio {
 constructor(settings){this.settings=settings;this.ctx=null;this.timer=null;this.step=0;this.active=false;this.voices=new Set();}
 unlock(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});this.active=true;this.sync();}catch{}}
 tone(freq,time=0,duration=.7,volume=.045){if(!this.ctx)return;const t=this.ctx.currentTime+time,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.ctx.destination);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration);}
 effect(kind){if(!this.settings.sfx)return;const notes={select:[880],match:[659,880,1108],error:[294,262],clear:[523,659,784,1046,1318],shuffleDone:[784,1046]};(notes[kind]||[]).forEach((f,i)=>this.tone(f,i*.10,.55,.06));}
 shuffle(reducedMotion=false){if(!this.settings.sfx)return;[659,988].forEach((f,i)=>this.tone(f,i*.06,.28,.045));if(reducedMotion)return;for(let i=0;i<9;i++){this.tone([1568,2093,1760,2349][i%4],.25+i*.115,.12,.022);this.tone([3136,2637,3520][i%3],.27+i*.115,.085,.01);}}
 sync(){clearInterval(this.timer);this.timer=null;if(this.settings.bgm&&this.active&&this.ctx){const phrase=[72,76,79,83,79,76,74,71,69,72,76,79,76,72,67,71,72,79,76,84,83,79,76,74,72,69,67,71,74,76,72,67];this.timer=setInterval(()=>{const s=this.step++;this.tone(440*2**((phrase[s%phrase.length]-69)/12),0,1.5,.027);if(s%4===0)this.tone(440*2**(([48,53,57,55][Math.floor(s/8)%4]-69)/12),0,2.2,.018);},420);}}
 pause(){this.active=false;clearInterval(this.timer);this.timer=null;for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();this.ctx?.suspend().catch(()=>{});}
}

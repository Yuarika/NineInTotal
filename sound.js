'use strict';
(() => {
  let context, muted=false;
  try{muted=localStorage.getItem('nine-in-total-muted')==='1';}catch{}
  const toggle=document.getElementById('sound-toggle');
  function update(){
    toggle.setAttribute('aria-pressed',String(muted));
    toggle.setAttribute('aria-label',muted?'効果音をオンにする':'効果音をオフにする');
    toggle.classList.toggle('muted',muted);
  }
  function unlock(){
    if(muted)return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      context??=new Audio();
      if(context.state==='suspended')context.resume().catch(()=>{});
    }catch{}
  }
  const patterns={
    place:[[600,0,.07,'sine'],[900,.045,.1,'sine']],
    rotate:[[920,0,.055,'triangle'],[1320,.04,.09,'sine']],
    error:[[230,0,.15,'triangle'],[165,.13,.22,'triangle']],
    clear:[[523.25,0,.2,'sine'],[659.25,.12,.2,'sine'],[783.99,.24,.2,'sine'],[1046.5,.38,.65,'sine'],[659.25,.38,.65,'sine'],[783.99,.38,.65,'sine']]
  };
  const voices=new Set();
  function play(kind){
    if(muted)return;unlock();if(!context||context.state!=='running')return;
    try{
      const start=context.currentTime+.008;
      for(const [frequency,delay,duration,type] of patterns[kind]||[]){
        const oscillator=context.createOscillator(),gain=context.createGain(),time=start+delay;
        oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);
        gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(kind==='clear'?.055:.09,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
        oscillator.connect(gain);gain.connect(context.destination);voices.add(oscillator);
        oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
        oscillator.start(time);oscillator.stop(time+duration+.02);
      }
    }catch{}
  }
  toggle.addEventListener('click',()=>{
    muted=!muted;try{localStorage.setItem('nine-in-total-muted',muted?'1':'0');}catch{}
    if(muted){for(const voice of voices){try{voice.stop();}catch{}}}else unlock();update();
  });
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  window.PuzzleSound={play};update();
})();

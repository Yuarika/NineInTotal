'use strict';
(() => {
  const definitions = [
    {id:'north',kind:'arrow',name:'上向き矢印',base:0,letter:'n'},
    {id:'south',kind:'arrow',name:'下向き矢印',base:180,letter:'s'},
    {id:'west',kind:'arrow',name:'左向き矢印',base:270,letter:'w'},
    {id:'east',kind:'arrow',name:'右向き矢印',base:90,letter:'e'},
    {id:'circle-a',kind:'circle',name:'○ 1'},
    {id:'circle-b',kind:'circle',name:'○ 2'},
    {id:'cross-a',kind:'cross',name:'× 1'},
    {id:'cross-b',kind:'cross',name:'× 2'},
    {id:'bang',kind:'bang',name:'!'}
  ];
  const $=id=>document.getElementById(id);
  let state={slots:Array(9).fill(null),angles:Array(9).fill(0)}, selected=null, solved=false;
  // Clear legacy board data. Each visit starts a fresh puzzle.
  try{localStorage.removeItem('nine-in-total-v1');}catch{}
  const pieceAt=i=>state.slots.indexOf(i);
  const play=kind=>window.PuzzleSound?.play(kind);
  const clearFeedback=()=>{message('');document.querySelector('.puzzle').classList.remove('incorrect');};
  function svg(i,fixedAngle=null){
    const d=definitions[i],angle=fixedAngle??((d.base||0)+state.angles[i]);
    const shapes={arrow:'<path d="M30 49V11M16 25L30 11L44 25"/>',circle:'<circle cx="30" cy="30" r="18"/>',cross:'<path d="M16 16L44 44M44 16L16 44"/>',bang:'<path class="bang-stem" d="M30 12V35"/><circle class="bang-dot" cx="30" cy="46" r="3.3"/>'};
    return `<svg class="symbol" viewBox="0 0 60 60" aria-hidden="true"><g transform="rotate(${angle} 30 30)">${shapes[d.kind]}</g></svg>`;
  }
  function describe(i){const d=definitions[i];return d.name+(d.kind==='arrow'?'':`、${state.angles[i]}度`);}
  function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  function select(i){if(solved)return;selected=selected===i?null:i;render();}
  function put(index){
    if(solved)return;
    if(selected===null){if(state.slots[index]!==null)select(state.slots[index]);else message('下の記号を選んでから、□を押してください。');return;}
    if(state.slots[index]===selected){select(selected);return;}
    const old=pieceAt(selected),displaced=state.slots[index];
    if(old!==-1)state.slots[old]=displaced;
    state.slots[index]=selected;
    selected=null;
    clearFeedback();render();play('place');
  }
  function rotate(){if(solved||selected===null||definitions[selected].kind==='arrow')return;state.angles[selected]=(state.angles[selected]+45)%360;clearFeedback();render();play('rotate');}
  function makeDraggable(button,i){
    button.draggable=!solved;
    button.addEventListener('dragstart',event=>{if(solved){event.preventDefault();return;}selected=i;event.dataTransfer.setData('text/plain',definitions[i].id);event.dataTransfer.effectAllowed='move';});
    button.addEventListener('dragend',()=>{document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));render();});
  }
  function render(){
    const active=document.activeElement?.id;
    $('equation').replaceChildren();
    for(let group=0;group<3;group++){
      const ranks=['最小','中間','最大'];
      const word=document.createElement('div');word.className=`word order-${group}`;word.setAttribute('role','group');word.setAttribute('aria-label',`${group+1}番目の3マス（${ranks[group]}の数）`);
      for(let pos=0;pos<3;pos++){
        const index=group*3+pos,i=state.slots[index],button=document.createElement('button');button.type='button';button.id=`slot-${index}`;button.className='slot';button.setAttribute('aria-label',`${group+1}組目 ${pos+1}マス目：${i===null?'空欄':describe(i)}`);button.setAttribute('aria-pressed',String(i!==null&&selected===i));button.disabled=solved;
        if(i!==null){button.innerHTML=svg(i);button.classList.add('filled');if(selected===i)button.classList.add('selected');makeDraggable(button,i);}
        button.addEventListener('click',()=>put(index));
        button.addEventListener('dragover',event=>{if(!solved){event.preventDefault();event.dataTransfer.dropEffect='move';button.classList.add('drop-target');}});
        button.addEventListener('dragleave',()=>button.classList.remove('drop-target'));
        button.addEventListener('drop',event=>{event.preventDefault();if(solved)return;const dragged=definitions.findIndex(d=>d.id===event.dataTransfer.getData('text/plain'));if(dragged<0)return;selected=dragged;put(index);});
        word.append(button);
      }
      $('equation').append(word);
      if(group<2){const operator=document.createElement('span');operator.className='operator';operator.textContent='+';operator.setAttribute('aria-hidden','true');$('equation').append(operator);}
    }
    const result=document.createElement('span');result.className='equation-result';
    const equals=document.createElement('span');equals.className='operator';equals.textContent='=';equals.setAttribute('aria-hidden','true');
    const total=document.createElement('span');total.className='total rhs-symbols';total.setAttribute('role','img');total.setAttribute('aria-label','上矢印、逆さのびっくりマーク、上矢印、右矢印');
    for(const [piece,angle] of [[0,0],[8,180],[0,0],[3,90]]){const symbol=document.createElement('span');symbol.className=`rhs-symbol ${piece===8?'rhs-i':'rhs-arrow'}`;symbol.innerHTML=svg(piece,angle);total.append(symbol);}
    result.append(equals,total);$('equation').append(result);
    $('tray').replaceChildren();
    const compass=document.createElement('div');compass.className='compass';compass.setAttribute('role','group');compass.setAttribute('aria-label','上下左右に並んだ4つの矢印');
    const symbols=document.createElement('div');symbols.className='other-symbols';symbols.setAttribute('role','group');symbols.setAttribute('aria-label','回転できる5つの記号');
    $('tray').append(compass,symbols);
    definitions.forEach((d,i)=>{
      const used=pieceAt(i)!==-1,button=document.createElement('button');button.type='button';button.id=`piece-${i}`;button.className='piece';button.disabled=used||solved;button.setAttribute('aria-label',describe(i)+(used?'、配置済み':''));button.setAttribute('aria-pressed',String(selected===i));
      if(!used){button.innerHTML=svg(i);if(selected===i)button.classList.add('selected');makeDraggable(button,i);}
      button.addEventListener('click',()=>select(i));(d.kind==='arrow'?compass:symbols).append(button);
    });
    const rotatable=selected!==null&&definitions[selected].kind!=='arrow'&&!solved;
    $('rotate').disabled=!rotatable;
    $('check').disabled=solved;
    $('counter').textContent=`${state.slots.filter(i=>i!==null).length} / 9`;
    if(active)document.getElementById(active)?.focus({preventScroll:true});
  }
  function letter(i){
    if(i===null)return '';
    const d=definitions[i],angle=state.angles[i];
    if(d.kind==='arrow')return d.letter;
    if(d.kind==='circle')return 'o';
    if(d.kind==='cross')return angle%90===45?'t':'x';
    return angle===180?'i':'';
  }
  function check(){
    if(solved)return;
    if(state.slots.includes(null)){reject('まだ空欄があります。');return;}
    const words=[0,3,6].map(start=>state.slots.slice(start,start+3).map(letter).join(''));
    if(words.join(' ')==='one two six'){
      solved=true;selected=null;render();document.body.classList.add('solved');$('success').hidden=false;$('game-main').inert=true;message('正解！ 1 ＋ 2 ＋ 6 ＝ 9');$('clear-title').focus();play('clear');
    }else reject('不正解');
  }
  function reject(text){
    message(text,true);const panel=document.querySelector('.puzzle');panel.classList.remove('incorrect');void panel.offsetWidth;panel.classList.add('incorrect');play('error');
  }
  $('rotate').addEventListener('click',rotate);$('check').addEventListener('click',check);
  function reset(){
    if(state.slots.some(i=>i!==null)&&!solved&&!confirm('配置と回転をリセットしますか？'))return;
    startNewGame();
  }
  function startNewGame(){
    state={slots:Array(9).fill(null),angles:Array(9).fill(0)};selected=null;solved=false;document.body.classList.remove('solved');$('success').hidden=true;$('game-main').inert=false;clearFeedback();render();$('slot-0').focus();
  }
  $('reset').addEventListener('click',reset);$('retry').addEventListener('click',reset);
  $('success').addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...$('success').querySelectorAll('a[href],button')],first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('clear-title'))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)startNewGame();});
  render();
})();

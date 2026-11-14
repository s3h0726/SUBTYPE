/* The country/region directory is a view over the existing game selector.
 * Nested special administrative regions retain their original hk/mo buttons,
 * native click handlers, stable IDs, saved selection and route catalogues. */
(() => {
  'use strict';
  const root=document.querySelector('#screen-home');
  const board=root?.querySelector('.country-card-grid');
  if(!board)return;
  const search=root.querySelector('#country-search-input');
  const filters=[...root.querySelectorAll('[data-region-filter]')];
  const counts=[...root.querySelectorAll('[data-region-count]')];
  const total=root.querySelector('#country-total-count');
  const selectedName=root.querySelector('#country-selected-name');
  const empty=root.querySelector('#country-search-empty');
  const continueButton=root.querySelector('.country-continue');
  const groupButton=board.querySelector('[data-country-group="sar"]');
  const subgroup=board.querySelector('[data-country-subgroup="sar"]');
  const special=new Set(['hk','mo']);
  // A native dialog avoids fragile hidden nested layouts and traps focus on
  // the two actual country choices. The game still owns hk/mo selection.
  const picker=document.createElement('dialog');
  picker.className='hk-mo-country-picker';
  picker.id='hk-mo-country-picker';
  picker.setAttribute('aria-labelledby','hk-mo-picker-title');
  picker.innerHTML=`
    <div class="hk-mo-picker-content">
      <header class="hk-mo-picker-heading">
        <div><small>국가·지역 선택</small><h2 id="hk-mo-picker-title">홍콩·마카오</h2></div>
        <button type="button" class="hk-mo-picker-close" data-picker-close aria-label="닫기">×</button>
      </header>
      <p class="hk-mo-picker-hint">플레이할 지역을 선택하세요.</p>
      <div class="hk-mo-picker-options" role="group" aria-label="홍콩 또는 마카오 선택">
        <button type="button" data-hk-mo-choice="hk"><strong>홍콩</strong><small>도시철도 · 트램</small><span aria-hidden="true">↗</span></button>
        <button type="button" data-hk-mo-choice="mo"><strong>마카오</strong><small>경전철 · 타이파선 · 섹파이완선 · 헝친선</small><span aria-hidden="true">↗</span></button>
      </div>
    </div>`;
  document.body.append(picker);
  function closePicker(){
    if(picker.open){
      if(typeof picker.close==='function')picker.close();
      else picker.removeAttribute('open');
    }
    groupButton?.setAttribute('aria-expanded','false');
  }
  function openPicker(){
    if(!groupButton||groupButton.hidden||groupButton.disabled)return;
    try{
      if(!picker.open){
        if(typeof picker.showModal==='function')picker.showModal();
        else picker.setAttribute('open','');
      }
      groupButton.setAttribute('aria-expanded','true');
      picker.querySelector('[data-hk-mo-choice]:not([disabled])')?.focus();
    }catch(error){
      console.error('Could not open the regional selector:',error);
    }
  }
  picker.addEventListener('close',()=>groupButton?.setAttribute('aria-expanded','false'));
  picker.addEventListener('click',event=>{
    const choice=event.target.closest('[data-hk-mo-choice]');
    if(choice){
      const card=board.querySelector('button[data-country="'+choice.dataset.hkMoChoice+'"]');
      if(card&&!card.hidden&&!card.disabled){
        closePicker();
        // Delegate to app.bundle: saves trt-country, switches the loaded
        // railway network, and highlights the actual selected region.
        card.click();
        queueMicrotask(refresh);
      }
      return;
    }
    if(event.target.closest('[data-picker-close]'))closePicker();
    else if(event.target===picker)closePicker();
  });
  const knownEurope=new Set(['uk','gb','fr','de','es','it','ch','nl','at','be','pt','cz','pl','ie','no','se','dk','fi']);
  let selectedRegion='all',query='';

  function cards(){return [...board.querySelectorAll('button[data-country]')];}
  function region(card){return card.dataset.region||(knownEurope.has(card.dataset.country)?'europe':'asia');}
  function name(card){
    return card.querySelector('.country-card-content strong')?.textContent?.trim()
      ||card.textContent?.trim()||card.dataset.country||'국가·지역';
  }
  function searchableText(card){
    const extra=card.dataset.country==='hk'?'hong kong hongkong 香港'
      :card.dataset.country==='mo'?'macau 澳門':'';
    return (name(card)+' '+card.textContent+' '+card.dataset.country+' '+extra).toLocaleLowerCase('ko');
  }
  function refresh(){
    const list=cards(),availability={all:0,asia:0,europe:0};
    const needle=query.trim().toLocaleLowerCase('ko');
    const labelMatch=!!needle&&(needle.includes('홍콩')&&needle.includes('마카오'));
    let visible=0;

    for(const card of list){
      const current=region(card),available=!card.hidden&&!card.disabled;
      if(available){
        availability.all++;
        if(current in availability)availability[current]++;
      }
      const matches=(!needle||searchableText(card).includes(needle)
        ||(labelMatch&&special.has(card.dataset.country)))
        &&(selectedRegion==='all'||current===selectedRegion);
      const filteredOut=!matches;
      if(card.classList.contains('is-filtered-out')!==filteredOut)
        card.classList.toggle('is-filtered-out',filteredOut);
      if(available&&matches)visible++;
      const isSelected=card.classList.contains('active')&&available;
      card.setAttribute('aria-pressed',String(isSelected));
      card.setAttribute('aria-label',name(card)+(isSelected?' 선택됨':' 선택'));
    }

    const specialCards=list.filter(card=>special.has(card.dataset.country));
    const groupVisible=specialCards.some(card=>!card.hidden&&!card.disabled&&!card.classList.contains('is-filtered-out'));
    if(!groupVisible&&picker.open)closePicker();
    const selected=list.find(card=>card.classList.contains('active')&&!card.hidden&&!card.disabled);
    if(groupButton){
      const groupSelected=!!selected&&special.has(selected.dataset.country);
      if(groupButton.hidden===groupVisible)groupButton.hidden=!groupVisible;
      if(groupButton.classList.contains('active')!==groupSelected)
        groupButton.classList.toggle('active',groupSelected);
      groupButton.setAttribute('aria-pressed',String(groupSelected));
      groupButton.setAttribute('aria-expanded',String(picker.open));
    }
    // The source hk/mo buttons stay in the DOM for the game engine. They are
    // not a second visible navigation system: the picker above is authoritative.
    if(subgroup&&!subgroup.hidden)subgroup.hidden=true;
    if(board.classList.contains('subgroup-open'))board.classList.remove('subgroup-open');

    for(const filter of filters){
      const active=filter.dataset.regionFilter===selectedRegion;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    }
    const groupIsAvailable=specialCards.every(card=>!card.hidden&&!card.disabled);
    const adjustment=groupIsAvailable?1:0;
    const displayedCounts={...availability,all:availability.all-adjustment,asia:availability.asia-adjustment};
    for(const count of counts)
      count.textContent=String(displayedCounts[count.dataset.regionCount]??0);
    if(total)total.textContent=displayedCounts.all+'개 국가·지역 분류';
    if(empty)empty.hidden=visible!==0;
    const selectedVisible=selected&&!selected.classList.contains('is-filtered-out');
    if(selectedName)selectedName.textContent=selectedVisible?name(selected):'국가·지역을 선택하세요';
    if(continueButton)continueButton.disabled=!selectedVisible;
  }

  groupButton?.addEventListener('click',openPicker);
  for(const filter of filters){
    filter.addEventListener('click',()=>{
      selectedRegion=filter.dataset.regionFilter||'all';
      refresh();
    });
  }
  search?.addEventListener('input',()=>{query=search.value;refresh();});
  search?.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&search.value){search.value='';query='';refresh();}
    if(event.key==='Enter'){
      const visible=cards().filter(card=>!card.hidden&&!card.disabled&&!card.classList.contains('is-filtered-out'));
      if(visible.length===1){
        event.preventDefault();
        refresh();
        visible[0].click();
      }
    }
  });
  document.addEventListener('keydown',event=>{
    const target=event.target;
    if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey
      &&root.classList.contains('active')
      &&!(target instanceof HTMLElement&&target.closest('input,textarea,[contenteditable="true"]'))){
      event.preventDefault();
      search?.focus();
    }
  });
  // Observe only game-owned selection state and region availability.
  const observer=new MutationObserver(refresh);
  observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  board.addEventListener('click',()=>queueMicrotask(refresh));
  window.addEventListener('pageshow',refresh);
  refresh();
})();

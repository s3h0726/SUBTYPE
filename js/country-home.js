/* Country directory interactions, layered over the existing country/route engine.
 * Never replace the native [data-country] click handlers or stored selection. */
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
  const knownEurope=new Set(['uk','gb','fr','de','es','it','ch','nl','at','be','pt','cz','pl','ie','no','se','dk','fi']);
  let selectedRegion='all';
  let query='';
  function cards(){return [...board.querySelectorAll('button[data-country]')];}
  function region(card){
    return card.dataset.region||(knownEurope.has(card.dataset.country)?'europe':'asia');
  }
  function name(card){
    return card.querySelector('.country-card-content strong')?.textContent?.trim()
      ||card.textContent?.trim()||card.dataset.country||'국가';
  }
  function refresh(){
    const list=cards();
    const availability={all:0,asia:0,europe:0};
    let visible=0;
    const needle=query.trim().toLocaleLowerCase('ko');
    for(const card of list){
      const current=region(card);
      const available=!card.hidden&&!card.disabled;
      if(available){
        availability.all++;
        if(current in availability)availability[current]++;
      }
      const matches=(!needle||(name(card)+' '+card.textContent+' '+card.dataset.country).toLocaleLowerCase('ko').includes(needle))
        &&(selectedRegion==='all'||current===selectedRegion);
      const filteredOut=!matches;
      if(card.classList.contains('is-filtered-out')!==filteredOut)
        card.classList.toggle('is-filtered-out',filteredOut);
      if(available&&matches)visible++;
      const isSelected=card.classList.contains('active')&&available;
      card.setAttribute('aria-pressed',String(isSelected));
      card.setAttribute('aria-label',name(card)+(isSelected?' 선택됨':' 선택'));
    }
    for(const filter of filters){
      const active=filter.dataset.regionFilter===selectedRegion;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    }
    for(const count of counts){
      count.textContent=String(availability[count.dataset.regionCount]??0);
    }
    if(total)total.textContent=availability.all+'개 국가';
    if(empty)empty.hidden=visible!==0;
    const selected=list.find(card=>card.classList.contains('active')&&!card.hidden&&!card.disabled);
    const selectedVisible=selected&&!selected.classList.contains('is-filtered-out');
    if(selectedName)selectedName.textContent=selectedVisible?name(selected):'국가를 선택하세요';
    if(continueButton)continueButton.disabled=!selectedVisible;
  }
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
      if(visible.length===1){event.preventDefault();visible[0].click();}
    }
  });
  document.addEventListener('keydown',event=>{
    const target=event.target;
    if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey
      &&root.classList.contains('active')
      &&!(target instanceof HTMLElement&&target.closest('input,textarea,[contenteditable="true"]'))){
      event.preventDefault();search?.focus();
    }
  });
  // The gameplay engine toggles .active after initial storage restore and country clicks.
  // Observe only game-owned state attributes to avoid reacting to aria updates.
  const observer=new MutationObserver(refresh);
  observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  board.addEventListener('click',()=>queueMicrotask(refresh));
  window.addEventListener('pageshow',refresh);
  refresh();
})();

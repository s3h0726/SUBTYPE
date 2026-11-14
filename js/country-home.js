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
  const backButton=board.querySelector('[data-country-group-back="sar"]');
  const special=new Set(['hk','mo']);
  const knownEurope=new Set(['uk','gb','fr','de','es','it','ch','nl','at','be','pt','cz','pl','ie','no','se','dk','fi']);
  let selectedRegion='all',query='',subgroupOpen=false;

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
    const labelMatch=!!needle&&'중국 특별행정구 특별행정구'.includes(needle);
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
    if(!groupVisible)subgroupOpen=false;
    const selected=list.find(card=>card.classList.contains('active')&&!card.hidden&&!card.disabled);
    if(groupButton){
      groupButton.hidden=!groupVisible||subgroupOpen;
      groupButton.classList.toggle('active',!!selected&&special.has(selected.dataset.country));
      groupButton.setAttribute('aria-pressed',String(!!selected&&special.has(selected.dataset.country)));
      groupButton.setAttribute('aria-expanded',String(subgroupOpen));
    }
    if(subgroup)subgroup.hidden=!subgroupOpen;
    board.classList.toggle('subgroup-open',subgroupOpen);

    for(const filter of filters){
      const active=filter.dataset.regionFilter===selectedRegion;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    }
    for(const count of counts)
      count.textContent=String(availability[count.dataset.regionCount]??0);
    if(total)total.textContent=availability.all+'개 국가·지역';
    if(empty)empty.hidden=visible!==0;
    const selectedVisible=selected&&!selected.classList.contains('is-filtered-out');
    if(selectedName)selectedName.textContent=selectedVisible?name(selected):'국가·지역을 선택하세요';
    if(continueButton)continueButton.disabled=!selectedVisible;
  }

  groupButton?.addEventListener('click',()=>{
    subgroupOpen=true;
    refresh();
    subgroup?.querySelector('button[data-country]:not([hidden]):not(.is-filtered-out)')?.focus();
  });
  backButton?.addEventListener('click',()=>{
    subgroupOpen=false;
    refresh();
    if(groupButton&&!groupButton.hidden)groupButton.focus();
  });
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
        if(special.has(visible[0].dataset.country))subgroupOpen=true;
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

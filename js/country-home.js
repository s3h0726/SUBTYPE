/* Keep the native country switcher and its persisted selection accessible.
   app.bundle.js owns loading, filtering, and route selection. */
(() => {
  'use strict';
  const board=document.querySelector('#screen-home .country-card-grid');
  if(!board)return;
  const cards=[...board.querySelectorAll('button[data-country]')];
  function syncSelection(){
    for(const card of cards){
      const selected=card.classList.contains('active')&&!card.hidden&&!card.disabled;
      card.setAttribute('aria-pressed',String(selected));
      const name=card.querySelector('.country-card-content strong')?.textContent?.trim()||'국가';
      card.setAttribute('aria-label',selected?`${name} 선택됨`:`${name} 선택`);
    }
  }
  syncSelection();
  // Existing game code changes .active after reading localStorage and when countries switch.
  const observer=new MutationObserver(syncSelection);
  observer.observe(board,{subtree:true,attributes:true,attributeFilter:['class','hidden','disabled']});
  window.addEventListener('pageshow',syncSelection);
})();

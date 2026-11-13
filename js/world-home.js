/* World atlas pins are a view of the existing country selector, not a new
 * selection store. The game remains the single authority for country state. */
(() => {
  'use strict';
  const home=document.querySelector('#screen-home.world-home');
  const board=home?.querySelector('.country-card-grid');
  const markers=home?.querySelector('#world-map-markers');
  if(!home||!board||!markers)return;

  /* Approximate geographic centres of available transit networks (longitude,latitude).
   * Non-existent/unsupported countries are never added to the selector by this map. */
  const centres={
    kr:[127.5,36.5],jp:[139.3,36.2],hk:[114.17,22.3],mo:[113.55,22.16],
    tw:[121,23.7],th:[101,15.4],uk:[-2.5,54],
    gb:[-2.5,54],fr:[2.3,46.6],de:[10.5,51],es:[-4,40],
    it:[12.5,42.7],ch:[8.2,46.8],nl:[5.2,52.2],at:[14.5,47.6],
    be:[4.6,50.7],pt:[-8,39.7],cz:[15,49.8],pl:[19,52],
    ie:[-8,53],se:[15,63],no:[9,62],dk:[10,56],fi:[26,64]
  };
  const availablePins=new Map();

  function selectorCards(){
    return [...board.querySelectorAll('button[data-country]')];
  }
  function countryName(card){
    return card.querySelector('.country-card-content strong')?.textContent?.trim()
      ||card.dataset.country||'국가';
  }
  function createPin(card){
    const country=card.dataset.country;
    const coordinate=centres[country];
    if(!coordinate||availablePins.has(country))return;
    const button=document.createElement('button');
    const core=document.createElement('span');
    const label=document.createElement('span');
    button.type='button';
    button.className='world-map-marker';
    button.dataset.mapCountry=country;
    if(country==='mo')button.style.marginTop='18px';
    button.style.left=((coordinate[0]+180)/360*100).toFixed(3)+'%';
    button.style.top=((90-coordinate[1])/180*100).toFixed(3)+'%';
    core.className='world-pin-core';
    core.setAttribute('aria-hidden','true');
    label.className='world-pin-label';
    label.setAttribute('aria-hidden','true');
    label.textContent=countryName(card);
    button.append(core,label);
    button.setAttribute('aria-label',countryName(card)+' 국가 선택');
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{
      const current=selectorCards().find(item=>item.dataset.country===country);
      if(!current||current.hidden||current.disabled||
        current.classList.contains('is-filtered-out'))return;
      // Delegate to the existing game handler so storage, route loading and
      // the line-selector country switch stay synchronized.
      current.click();
    });
    markers.append(button);
    availablePins.set(country,button);
  }
  function synchronize(){
    const cards=selectorCards();
    const countries=new Set(cards.map(card=>card.dataset.country));
    for(const card of cards)createPin(card);
    for(const [country,pin] of availablePins){
      if(!countries.has(country)){pin.remove();availablePins.delete(country);continue;}
      const card=cards.find(item=>item.dataset.country===country);
      if(!card)continue;
      const filtered=card.classList.contains('is-filtered-out');
      const unavailable=card.hidden||card.disabled;
      const selected=card.classList.contains('active')&&!unavailable;
      pin.classList.toggle('is-filtered-out',filtered);
      pin.classList.toggle('active',selected);
      pin.disabled=unavailable||filtered;
      pin.tabIndex=(unavailable||filtered)?-1:0;
      pin.setAttribute('aria-pressed',String(selected));
      pin.setAttribute('aria-label',countryName(card)+(selected?' 선택됨':' 국가 선택'));
      const label=pin.querySelector('.world-pin-label');
      if(label&&label.textContent!==countryName(card))label.textContent=countryName(card);
    }
  }
  // The directory applies .is-filtered-out and the game owns .active/.hidden.
  // Observe only the source buttons, never the pins, to avoid mutation loops.
  const observer=new MutationObserver(synchronize);
  observer.observe(board,{
    attributes:true,subtree:true,childList:true,
    attributeFilter:['class','hidden','disabled','data-country']
  });
  home.querySelector('#country-search-input')?.addEventListener('input',()=>queueMicrotask(synchronize));
  home.querySelectorAll('[data-region-filter]').forEach(button=>{
    button.addEventListener('click',()=>queueMicrotask(synchronize));
  });
  board.addEventListener('click',()=>queueMicrotask(synchronize));
  window.addEventListener('pageshow',synchronize);
  synchronize();
})();

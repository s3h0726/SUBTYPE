/* World-map markers delegate to the existing country directory and game engine.
 * Hong Kong and Macau are grouped visually but keep distinct playable data. */
(() => {
  'use strict';
  const home=document.querySelector('#screen-home.world-home');
  const board=home?.querySelector('.country-card-grid');
  const markers=home?.querySelector('#world-map-markers');
  if(!home||!board||!markers)return;

  const centres={
    kr:[127.5,36.5],jp:[139.3,36.2],sar:[113.86,22.25],
    tw:[121,23.7],th:[101,15.4],uk:[-2.5,54],
    gb:[-2.5,54],fr:[2.3,46.6],de:[10.5,51],es:[-4,40],
    it:[12.5,42.7],ch:[8.2,46.8],nl:[5.2,52.2],at:[14.5,47.6],
    be:[4.6,50.7],pt:[-8,39.7],cz:[15,49.8],pl:[19,52],
    ie:[-8,53],se:[15,63],no:[9,62],dk:[10,56],fi:[26,64]
  };
  const grouped=new Set(['hk','mo']);
  const availablePins=new Map();
  function selectorCards(){return [...board.querySelectorAll('button[data-country]')];}
  function countryName(card){
    return card.querySelector('.country-card-content strong')?.textContent?.trim()
      ||card.dataset.country||'국가·지역';
  }
  function createPin(key,label){
    const coordinate=centres[key];
    if(!coordinate||availablePins.has(key))return;
    const button=document.createElement('button');
    const core=document.createElement('span');
    const text=document.createElement('span');
    button.type='button';
    button.className='world-map-marker';
    button.dataset.mapCountry=key;
    button.style.left=((coordinate[0]+180)/360*100).toFixed(3)+'%';
    button.style.top=((90-coordinate[1])/180*100).toFixed(3)+'%';
    core.className='world-pin-core';
    core.setAttribute('aria-hidden','true');
    text.className='world-pin-label';
    text.setAttribute('aria-hidden','true');
    text.textContent=label;
    button.append(core,text);
    button.setAttribute('aria-label',label+' 선택');
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{
      if(key==='sar'){
        // Open the submenu. The country is not changed until hk/mo is chosen.
        const group=board.querySelector('[data-country-group="sar"]');
        if(group&&!button.disabled)group.click();
        return;
      }
      const card=selectorCards().find(item=>item.dataset.country===key);
      if(!card||card.hidden||card.disabled||card.classList.contains('is-filtered-out'))return;
      card.click();
    });
    markers.append(button);
    availablePins.set(key,button);
  }
  function synchronize(){
    const cards=selectorCards();
    const keys=new Set(cards.filter(card=>!grouped.has(card.dataset.country)).map(card=>card.dataset.country));
    if(cards.some(card=>grouped.has(card.dataset.country)))keys.add('sar');
    for(const card of cards)
      if(!grouped.has(card.dataset.country))createPin(card.dataset.country,countryName(card));
    if(keys.has('sar'))createPin('sar','홍콩 · 마카오');

    for(const [key,pin] of availablePins){
      if(!keys.has(key)){pin.remove();availablePins.delete(key);continue;}
      const members=key==='sar'
        ?cards.filter(card=>grouped.has(card.dataset.country))
        :cards.filter(card=>card.dataset.country===key);
      const available=members.filter(card=>!card.hidden&&!card.disabled);
      const filtered=!available.some(card=>!card.classList.contains('is-filtered-out'));
      const unavailable=available.length===0;
      const selected=available.some(card=>card.classList.contains('active'));
      const label=key==='sar'?'홍콩 · 마카오':countryName(members[0]);
      pin.classList.toggle('is-filtered-out',filtered);
      pin.classList.toggle('active',selected);
      pin.disabled=unavailable||filtered;
      pin.tabIndex=pin.disabled?-1:0;
      pin.setAttribute('aria-pressed',String(selected));
      pin.setAttribute('aria-label',label+(selected?' 선택됨':' 선택'));
      const text=pin.querySelector('.world-pin-label');
      if(text&&text.textContent!==label)text.textContent=label;
    }
  }
  // Changes to directory visibility, filtering or selected country update the map.
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

/* Reclassify historical miscellaneous Japanese routes without altering service/geometry. */
(()=>{
  const categories={"line-99331":"monorail","line-99332":"monorail","line-99340":"third-sector","line-99908":"monorail","line-99648":"automated-guideway","line-99649":"automated-guideway","line-99309":"third-sector","line-99523":"automated-guideway","line-99927":"monorail","line-99627":"monorail","line-99626":"monorail","line-99307":"third-sector","line-99326":"monorail","line-99334":"monorail","line-99342":"automated-guideway","line-99305":"tram","line-99336":"monorail","line-99337":"third-sector","line-99311":"automated-guideway"};
  window.TRT_JAPAN_CATEGORY_OVERRIDES=Object.freeze(categories);
  const index=window.TRT_JAPAN_LITE_INDEX;
  if(Array.isArray(index?.routes))for(const route of index.routes){
    if(categories[route.id])route.category=categories[route.id];
  }
})();

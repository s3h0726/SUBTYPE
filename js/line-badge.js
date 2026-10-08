import{escapeHtml}from'./utils.js';
import{railDataRepository}from'./rail-data-repository.js';
const cfg=()=>globalThis.TRT_LINE_BADGES||{operatorStyles:{},routeCodes:{}};

// Source: original SM-N.svg / SM-T.svg referenced by Sendai subway line pages.
// Do not replace these with hand-drawn local SVGs or an operator logo.
const SENDAI_LINE_ORIGINALS={
  'line-99214':{url:'https://file.namu.moe/file/8c81f83872fe27c5970eb03f6b5fa49b',source:'https://m.namu.moe/w/센다이시%20지하철%20난보쿠선',file:'SM-N.svg'},
  'line-99218':{url:'https://file.namu.moe/file/c11887e17d6fea3da406ba49cb01bb74',source:'https://namu.moe/w/센다이시%20지하철%20토자이선',file:'SM-T.svg'}
};
const JR_OPERATOR_IDS=new Set(['jr-east','jr-central','jr-west','jr-hokkaido','jr-shikoku','jr-kyushu']);
const WM={
  keisei:'https://upload.wikimedia.org/wikipedia/commons/b/bc/Number_prefix_Keisei.svg',
  hanshin:'https://upload.wikimedia.org/wikipedia/commons/1/16/Number_prefix_Hanshin_line.svg',
  hankyuKobe:'https://upload.wikimedia.org/wikipedia/commons/b/b4/Number_prefix_Hankyu_K%C5%8Dbe_line.svg',
  kobeRailway:'https://upload.wikimedia.org/wikipedia/commons/5/59/Number_prefix_Kobe_Railway.svg',
  shinkansenJre:'https://upload.wikimedia.org/wikipedia/commons/c/cd/Shinkansen_jre.svg',
  shinkansenJrc:'https://upload.wikimedia.org/wikipedia/commons/2/25/Shinkansen_jrc.svg',
  shinkansenJrw:'https://upload.wikimedia.org/wikipedia/commons/a/a0/Shinkansen_jrw.svg',
  shinkansenJrh:'https://upload.wikimedia.org/wikipedia/commons/b/b7/Shinkansen_jrh.svg',
  shinkansenJrk:'https://upload.wikimedia.org/wikipedia/commons/e/e8/Shinkansen_jrk.svg',
  'JR-JA':'https://upload.wikimedia.org/wikipedia/commons/1/1c/JR_JA_line_symbol.svg',
  'JR-JB':'https://upload.wikimedia.org/wikipedia/commons/0/03/JR_JB_line_symbol.svg',
  'JR-JC':'https://upload.wikimedia.org/wikipedia/commons/7/79/JR_JC_line_symbol.svg',
  'JR-JE':'https://upload.wikimedia.org/wikipedia/commons/c/c3/JR_JE_line_symbol.svg',
  'JR-JH':'https://upload.wikimedia.org/wikipedia/commons/5/51/JR_JH_line_symbol.svg',
  'JR-JJ':'https://upload.wikimedia.org/wikipedia/commons/7/7c/JR_JJ_line_symbol.svg',
  'JR-JK':'https://upload.wikimedia.org/wikipedia/commons/1/16/JR_JK_line_symbol.svg',
  'JR-JM':'https://upload.wikimedia.org/wikipedia/commons/d/d1/JR_JM_line_symbol.svg',
  'JR-JN':'https://upload.wikimedia.org/wikipedia/commons/6/6a/JR_JN_line_symbol.svg',
  'JR-JO':'https://upload.wikimedia.org/wikipedia/commons/1/1b/JR_JO_line_symbol.svg',
  'JR-JS':'https://upload.wikimedia.org/wikipedia/commons/0/04/JR_JS_line_symbol.svg',
  'JR-JT':'https://upload.wikimedia.org/wikipedia/commons/9/92/JR_JT_line_symbol.svg',
  'JR-JU':'https://upload.wikimedia.org/wikipedia/commons/f/fc/JR_JU_line_symbol.svg',
  'JR-JY':'https://upload.wikimedia.org/wikipedia/commons/0/04/JR_JY_line_symbol.svg',
  'JRW-A':'https://upload.wikimedia.org/wikipedia/commons/d/dd/JRW_kinki-A.svg',
  'JRW-B':'https://upload.wikimedia.org/wikipedia/commons/9/9e/JRW_kinki-B.svg',
  'JRW-C':'https://upload.wikimedia.org/wikipedia/commons/b/b4/JRW_kinki-C.svg',
  'JRW-D':'https://upload.wikimedia.org/wikipedia/commons/0/06/JRW_kinki-D.svg',
  'JRW-E':'https://upload.wikimedia.org/wikipedia/commons/3/39/JRW_kinki-E.svg',
  'JRW-F':'https://upload.wikimedia.org/wikipedia/commons/a/a5/JRW_kinki-F.svg',
  'JRW-G':'https://upload.wikimedia.org/wikipedia/commons/3/3a/JRW_kinki-G.svg',
  'JRW-H':'https://upload.wikimedia.org/wikipedia/commons/4/46/JRW_kinki-H.svg',
  'JRW-I':'https://upload.wikimedia.org/wikipedia/commons/6/63/JRW_kinki-I.svg',
  'JRW-J':'https://upload.wikimedia.org/wikipedia/commons/d/d8/JRW_kinki-J.svg',
  'JRW-K':'https://upload.wikimedia.org/wikipedia/commons/0/0c/JRW_kinki-K.svg',
  'JRW-L':'https://upload.wikimedia.org/wikipedia/commons/6/64/JRW_kinki-L.svg',
  'JRW-O':'https://upload.wikimedia.org/wikipedia/commons/6/66/JRW_kinki-O.svg',
  'JRW-P':'https://upload.wikimedia.org/wikipedia/commons/a/a3/JRW_kinki-P.svg',
  'JRW-Q':'https://upload.wikimedia.org/wikipedia/commons/f/f5/JRW_kinki-Q.svg',
  'JRW-R':'https://upload.wikimedia.org/wikipedia/commons/e/e5/JRW_kinki-R.svg',
  'JRW-S':'https://upload.wikimedia.org/wikipedia/commons/b/b9/JRW_kinki-S.svg',
  'JRW-T':'https://upload.wikimedia.org/wikipedia/commons/a/a7/JRW_kinki-T.svg',
  'JRW-U':'https://upload.wikimedia.org/wikipedia/commons/c/cb/JRW_kinki-U.svg',
  'JRW-V':'https://upload.wikimedia.org/wikipedia/commons/a/a3/JRW_kinki-V.svg',
  'JRW-W':'https://upload.wikimedia.org/wikipedia/commons/4/44/JRW_kinki-W.svg',
  tokaido:'https://upload.wikimedia.org/wikipedia/commons/4/4c/JR_Central_Tokaido_Line.svg',
  chuo:'https://upload.wikimedia.org/wikipedia/commons/b/be/JR_Central_Chuo_Line.svg',
  gotemba:'https://upload.wikimedia.org/wikipedia/commons/3/3b/JR_Central_Gotemba_Line.svg',
  minobu:'https://upload.wikimedia.org/wikipedia/commons/b/b0/JR_Central_Minobu_Line.svg',
  iida:'https://upload.wikimedia.org/wikipedia/commons/8/8b/JR_Central_Iida_Line.svg',
  taketoyo:'https://upload.wikimedia.org/wikipedia/commons/9/94/JR_Central_Taketoyo_Line.svg',
  takayama:'https://upload.wikimedia.org/wikipedia/commons/f/f1/JR_Central_Takayama_Line.svg',
  taita:'https://upload.wikimedia.org/wikipedia/commons/7/7f/JR_Central_Taita_Line.svg',
  kansai:'https://upload.wikimedia.org/wikipedia/commons/2/29/JR_Central_Kansai_Line.svg',
  dosan:'https://upload.wikimedia.org/wikipedia/commons/8/87/JR_shikoku_dosan_line.svg',
  kotoku:'https://upload.wikimedia.org/wikipedia/commons/9/95/JR_shikoku_kotoku_line.svg',
  tokushima:'https://upload.wikimedia.org/wikipedia/commons/b/bf/JR_shikoku_tokushima_line.svg',
  mugi:'https://upload.wikimedia.org/wikipedia/commons/7/7b/JR_shikoku_mugi_line.svg',
  naruto:'https://upload.wikimedia.org/wikipedia/commons/f/f4/JR_shikoku_naruto_line.svg',
  yosan:'https://upload.wikimedia.org/wikipedia/commons/d/d9/JR_shikoku_yosan_line.svg',
  uchiko:'https://upload.wikimedia.org/wikipedia/commons/6/63/JR_shikoku_uchiko_line.svg',
  yodo:'https://upload.wikimedia.org/wikipedia/commons/d/d2/JR_shikoku_yodo_line.svg',
  'JRK-JA':'https://upload.wikimedia.org/wikipedia/commons/1/17/JRK_number_JA.svg',
  'JRK-JB':'https://upload.wikimedia.org/wikipedia/commons/2/28/JRK_number_JB.svg',
  'JRK-JC':'https://upload.wikimedia.org/wikipedia/commons/2/22/JRK_number_JC.svg',
  'JRK-JD':'https://upload.wikimedia.org/wikipedia/commons/d/d2/JRK_number_JD.svg',
  'JRK-JE':'https://upload.wikimedia.org/wikipedia/commons/b/b4/JRK_number_JE.svg',
  'JRK-JF':'https://upload.wikimedia.org/wikipedia/commons/2/2c/JRK_number_JF.svg',
  'JRK-JH':'https://upload.wikimedia.org/wikipedia/commons/3/30/JRK_number_JH.svg',
  'JRK-JI':'https://upload.wikimedia.org/wikipedia/commons/d/da/JRK_number_JI.svg',
  'JRK-JJ':'https://upload.wikimedia.org/wikipedia/commons/9/9d/JRK_number_JJ.svg',
  'JRK-JK':'https://upload.wikimedia.org/wikipedia/commons/6/62/JRK_number_JK.svg'
};
const verifiedAsset=(url,source)=>url?{url,asset:url,file:url,officialExists:true,exists:true,verified:true,source,assetSource:'wikimedia-commons',assetSourceUrl:source}:null;
function wikimediaLineAsset(route,code,lineName){
  const op=String(route?.operatorId||''),id=String(route?.id||''),c=String(code||''),name=String(lineName||'');

  // Both Sanyo Main and Aboshi lines use the official shared SY number prefix.
  if(['sanyodenkitetsudo','sanyo-electric-railway','sanyo'].includes(op))return verifiedAsset('https://commons.wikimedia.org/wiki/Special:FilePath/Number_prefix_San-yo_Railway_line.svg','https://commons.wikimedia.org/wiki/File:Number_prefix_San-yo_Railway_line.svg');
  // Kobe Municipal Subway uses distinct official U-line and Kaigan (Yumekamome) marks.
  if(op==='kobeshikotsukyoku'){
    if(id==='line-99647')return verifiedAsset('https://commons.wikimedia.org/wiki/Special:FilePath/Subway_KobeKaigan.svg','https://commons.wikimedia.org/wiki/File:Subway_KobeKaigan.svg');
    if(['line-99645','line-99646','line-99636'].includes(id))return verifiedAsset('https://commons.wikimedia.org/wiki/Special:FilePath/Subway_KobeSeishin.svg','https://commons.wikimedia.org/wiki/File:Subway_KobeSeishin.svg');
  }
  if(id==='line-23006')return verifiedAsset('https://upload.wikimedia.org/wikipedia/commons/4/40/Number_prefix_SkyAccess.svg','https://commons.wikimedia.org/wiki/File:Number_prefix_SkyAccess.svg');
  if(op==='keisei')return verifiedAsset(WM.keisei,'https://commons.wikimedia.org/wiki/File:Number_prefix_Keisei.svg');

  if(id==='line-hanshin-kobe-kosoku')return verifiedAsset(WM.hanshin,'https://commons.wikimedia.org/wiki/File:Number_prefix_Hanshin_line.svg');
  if(op==='kobekosokutetsudo')return null;

  if(route?.category==='shinkansen'||/新幹線|신칸센|Shinkansen/i.test(name)){
    const key={ 'jr-east':'shinkansenJre','jr-central':'shinkansenJrc','jr-west':'shinkansenJrw','jr-hokkaido':'shinkansenJrh','jr-kyushu':'shinkansenJrk'}[op];
    return key?verifiedAsset(WM[key],`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(WM[key].split('/').pop())}`):null;
  }

  if(op==='jr-east'&&WM['JR-'+c])return verifiedAsset(WM['JR-'+c],`https://commons.wikimedia.org/wiki/File:JR_${c}_line_symbol.svg`);
  if(op==='jr-west'&&WM['JRW-'+c])return verifiedAsset(WM['JRW-'+c],`https://commons.wikimedia.org/wiki/File:JRW_kinki-${c}.svg`);

  if(op==='jr-central'){
    const ids={
      'line-11402':'minobu','line-11411':'chuo','line-11413':'iida','line-11414':'iida','line-11416':'takayama',
      'line-11501':'tokaido','line-11502':'tokaido','line-11503':'tokaido','line-11505':'gotemba','line-11506':'taketoyo',
      'line-11507':'taita','line-11508':'kansai'
    };
    const key=ids[id];return key?verifiedAsset(WM[key],`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(WM[key].split('/').pop())}`):null;
  }

  if(op==='jr-shikoku'){
    const ids={'line-11801':'dosan','line-11802':'kotoku','line-11803':'tokushima','line-11804':'mugi','line-11805':'naruto','line-11806':'yosan','line-11807':'uchiko','line-11808':'yodo'};
    const key=ids[id];return key?verifiedAsset(WM[key],`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(WM[key].split('/').pop())}`):null;
  }

  if(op==='jr-kyushu'){
    const ids={
      'line-11902':'JRK-JA','line-11903':'JRK-JB','line-11905':'JRK-JH','line-11906':'JRK-JF','line-11907':'JRK-JF',
      'line-11908':'JRK-JC','line-11909':'JRK-JK','line-11910':'JRK-JE','line-11911':'JRK-JC','line-11914':'JRK-JI',
      'line-11915':'JRK-JJ','line-11917':'JRK-JD','line-11920':'JRK-JK'
    };
    const key=ids[id];return key?verifiedAsset(WM[key],`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(WM[key].split('/').pop())}`):null;
  }

  return null
}
export function lineBadgeMeta(route){
  const source=cfg(),operator=source.operatorStyles?.[route?.operatorId]||{},theme=globalThis.TRT_LINE_THEMES?.[route?.id]||{},code=source.routeCodes?.[route?.id]||theme.code||route?.code||'';
  const lineName=[route?.line?.ko,route?.line?.ja,route?.line?.en,route?.line?.names?.ko,route?.line?.names?.ja,route?.line?.names?.en].filter(Boolean).join(' ');
  const targetOps=JR_OPERATOR_IDS.has(String(route?.operatorId||''))||route?.operatorId==='keisei'||route?.operatorId==='kobekosokutetsudo'||route?.id==='line-hanshin-kobe-kosoku';
  let asset=wikimediaLineAsset(route,code,lineName);
  const sendaiOriginal=SENDAI_LINE_ORIGINALS[route?.id];
  // Prefer versioned canonical Sendai SVGs; the former Namu CDN link may expire.
  if(sendaiOriginal&&!asset)asset=railDataRepository.getLineSymbolAsset(route?.id)||route?.symbolAsset||{url:sendaiOriginal.url,asset:sendaiOriginal.url,source:sendaiOriginal.source,officialExists:true,exists:true,verified:false,originalFile:sendaiOriginal.file};
  // Canonical symbols are the fallback for every operator, including JR, Keisei and Kobe.
  // Previously targetOps blocked these real assets when the external URL mapping was absent.
  if(!asset)asset=railDataRepository.getLineSymbolAsset(route?.id)||route?.symbolAsset||null;
  const officialSymbolExists=Boolean(asset?.officialExists||asset?.exists);
  const officialCodeExists=/^[A-Za-z]{1,4}$/.test(code)&&Boolean(source.routeCodes?.[route?.id]||theme.code);
  return{code,asset,officialSymbolExists,officialCodeExists,targetOps,style:operator.style||theme.style||route?.lineTheme?.style||route?.category||'other',source:asset?.source||operator.source||theme.colorSource||route?.lineTheme?.colorSource||'',color:route?.lineColor||theme.color||'#60736a'}
}
export function lineBadgeMarkup(route,className='line-badge'){
  const badge=lineBadgeMeta(route),url=badge.asset?.url||badge.asset?.asset;
  if(badge.officialSymbolExists&&url)return`<span class="${className} line-symbol-asset" data-line-symbol="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${escapeHtml(url)}" alt="${escapeHtml(badge.code||route?.line?.ko||'노선')} 노선 심볼" onerror="this.closest('.line-symbol-asset')?.remove()"></span>`;
  if(!badge.targetOps&&badge.officialCodeExists)return`<span class="${className} line-code-label badge-${escapeHtml(badge.style)}" style="--badge-color:${escapeHtml(badge.color)}">${escapeHtml(badge.code)}</span>`;
  return''
}

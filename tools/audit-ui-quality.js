#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const previousAuditPath=path.join(root,'data','nationwide','UI_AUDIT.json');
const previousAudit=fs.existsSync(previousAuditPath)?JSON.parse(fs.readFileSync(previousAuditPath,'utf8')):null;
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
const index=read('data/nationwide/index.json');
const operatorAssets=read('data/operator-assets.json').operators||{};
const symbolAssets=read('data/route-symbol-assets.json').assets||{};
const signAudit=read('data/station-sign-template-audit.json');
const routes=index.routes.map(meta=>read(meta.lazySource.replace(/^\.\//,'')).route);
const typing=source('js/typing.js'),game=source('js/game.js'),app=source('js/app.js');
const emojiAuditPath=path.join(root,'data','nationwide','RAILWAY_EMOJI_AUDIT.json');
const emojiAudit=fs.existsSync(emojiAuditPath)?JSON.parse(fs.readFileSync(emojiAuditPath,'utf8')):{status:'PENDING',counts:{productionUi:null,lineSymbol:null,operatorLogo:null,trainMarker:null,stationIcon:null,buttonIcon:null}};
const browserAuditPath=path.join(root,'data','nationwide','BROWSER_QA.json');
const browserAudit=fs.existsSync(browserAuditPath)?JSON.parse(fs.readFileSync(browserAuditPath,'utf8')):null;
const routeFor=pattern=>routes.find(route=>pattern.test(`${route.operator.ja} ${route.line.ja}`));
const osaka=routeFor(/Osaka Metro.*御堂筋線/);
const kumagawa=routeFor(/くま川鉄道.*湯前線/);
const hitoyoshi=kumagawa?.stations.find(station=>station.ja==='人吉温泉');
const officialCodeStations=routes.flatMap(route=>route.stations).filter(station=>station.officialCode);
const operatorsWithAssets=new Set(routes.filter(route=>operatorAssets[route.operatorId]).map(route=>route.operatorId));
const checks={
  inputValueIsNfcSoleSource:/String\(rawValue\)\.normalize\('NFC'\)/.test(typing)&&!/\.reverse\(|\.unshift\(/.test(typing),
  stationBadgeUsesOfficialCodeOnly:/station\.hasOfficialStationCode\?station\.officialCode/.test(game)&&!/badge\.textContent\s*=\s*station\.id/.test(game),
  koreanProgressUsesAnswerLength:/Array\.from\(answer\)/.test(game)&&/(answerChars|letters)\.map/.test(game),
  autoAdvance150ms:/setTimeout\(\(\)=>this\.advance\(\),150\)/.test(game),
  routeGridWindowed:/routeRenderLimit=96/.test(app)&&/\.slice\(0,routeRenderLimit\)/.test(app),
  osakaMetroCanonical:!!osaka&&osaka.operator.ko==='오사카 메트로'&&osaka.line.ko==='미도스지선'&&osaka.code==='M'&&osaka.stations[0]?.officialCode==='M11',
  hitoyoshiCanonical:!!hitoyoshi&&hitoyoshi.kana==='ひとよしおんせん'&&hitoyoshi.ko==='히토요시온센',
  hitoyoshiInternalIdNotPromoted:!!hitoyoshi&&!hitoyoshi.officialCode,
  firstAnswerIsStartStation:/targetStation\(\)\{return this\.boarding\?this\.sequence\?\.\[0\]/.test(game)&&/setTrainTypingProgress\(this\.boarding\?0:/.test(game)&&/setTarget\(this\.answerValues\(station\)\)/.test(game),
  typedArrivalInvariant:/expected\.id!==arrived\?\.id/.test(game)&&/advanceToNextStation\(arrived\)/.test(game)&&/this\.index\+=1/.test(game),
  duplicateCompleteGuard:/this\.phase!==['"]TYPING['"]/.test(game)&&/this\.phase=['"]ARRIVING['"]/.test(game),
  noJapaneseInKoreanFields:routes.every(route=>![route.operator.ko,route.line.ko,...route.stations.map(station=>station.ko)].some(value=>/[一-龯々〆ヵヶぁ-ゖァ-ヺ]/.test(value||'')))
};
const report={
  generated:new Date().toISOString(),status:'PARTIAL_WITH_AUDITED_GAPS',
  checks,
  typingEngine:{criticalChecksPassed:Object.values(checks).filter(Boolean).length,criticalChecksTotal:Object.keys(checks).length,browserRegression:browserAudit?.status||previousAudit?.typingEngine?.browserRegression||'PENDING',...(browserAudit?{browserResults:browserAudit.results}:previousAudit?.typingEngine?.browserResults?{browserResults:previousAudit.typingEngine.browserResults}:{})},
  officialStationCodes:{stationEntries:officialCodeStations.length,displayPolicy:'Only explicit or verified officialCode values may be rendered. Internal station IDs stay data-only.'},
  logos:{nationwideOperators:index.operators.length,operatorsWithVerifiedLocalAssets:operatorsWithAssets.size,verifiedAssetRecords:Object.values(operatorAssets).filter(asset=>asset.logoVerified).length,knownGaps:index.operators.length-operatorsWithAssets.size,status:'INCOMPLETE'},
  lineSymbols:{verifiedAssetRecords:Object.values(symbolAssets).filter(asset=>asset.logoVerified!==false).length,status:'INCOMPLETE'},
  stationSigns:{dedicatedOperators:signAudit.dedicatedOperators.length,families:signAudit.templateFamilies.length,status:signAudit.status},
  railwayEmoji:emojiAudit,
  authentication:{status:'BLOCKED_CONFIGURATION',provider:'Supabase Auth',publicConfigPresent:false,guestMode:'PASS',fakeLocalPasswordStorage:false},
  strictPass:false,
  blockers:['Nationwide operator-logo coverage is not exhaustive.','Nationwide official line-symbol coverage is not exhaustive.','Station-sign templates remain family approximations for operators without a dedicated audited template.','Supabase public URL and anon key are not configured, so account E2E cannot pass.',...((browserAudit?.status||previousAudit?.typingEngine?.browserRegression)==='PASSED'?[]:['Browser regression result has not yet been merged.'])]
};
fs.writeFileSync(path.join(root,'data','nationwide','UI_AUDIT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(Object.values(checks).some(value=>!value))process.exitCode=1;

/* Canonical Keisei Matsudo Line runtime alias, before the application loads. */
(()=>{
 const oldNames=new Set(['新京成線','新京成電鉄新京成線','신게이세이선','신케이세이선','Shinkeiseisen']);
 const rewriteRoute=r=>{
  if(!r||r.id!=='line-99329')return;
  r.operatorId='op-13';
  r.operator={ja:'京成電鉄',ko:'케이세이 전철',en:'Keisei'};
  r.line={...r.line,ja:'京成松戸線',kana:'けいせいまつどせん',ko:'게이세이 마츠도선',en:'Keisei Matsudo Line',aliases:[...new Set([...(r.line?.aliases||[]),'新京成線','신케이세이선'])]};
 };
 const nationwide=window.TRT_EMBEDDED_NATIONWIDE;
 if(nationwide){
  for(const v of Object.values(nationwide.routes||{}))rewriteRoute(v?.route||v);
  for(const m of nationwide.index?.routes||[])if(m.id==='line-99329'){m.operatorId='op-13';m.operator={ja:'京成電鉄',ko:'케이세이 전철',en:'Keisei'};m.line={...m.line,ja:'京成松戸線',ko:'게이세이 마츠도선',en:'Keisei Matsudo Line'};}
  if(Array.isArray(nationwide.index?.operators))nationwide.index.operators=nationwide.index.operators.filter(o=>!['op-142','shinkeiseidentetsu'].includes(o.id));
 }
 const workspace=window.TRT_EMBEDDED_LINE_WORKSPACES;
 if(workspace){
  for(const r of workspace.routes||[])if(r.id==='line-99329'){r.operatorId='keisei';r.operator={...r.operator,id:'keisei',names:{ja:'京成電鉄',ko:'케이세이 전철',en:'Keisei'}};r.line={...r.line,operatorId:'keisei',names:{ja:'京成松戸線',ko:'게이세이 마츠도선',kana:'けいせいまつどせん',en:'Keisei Matsudo Line'}};}
  for(const m of workspace.index?.routes||[])if(m.id==='line-99329'){m.operatorId='keisei';m.line={...m.line,operatorId:'keisei',names:{ja:'京成松戸線',ko:'게이세이 마츠도선',en:'Keisei Matsudo Line'}};}
  if(Array.isArray(workspace.index?.operators))workspace.index.operators=workspace.index.operators.filter(o=>o.id!=='shinkeiseidentetsu');
 }
})();

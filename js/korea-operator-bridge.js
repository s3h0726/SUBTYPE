/* v0.8.3 — Korean railway operator metadata bridge.
 * The station/track data is generated separately; this only normalizes operator
 * attribution for the Korean index and lazily fetched route payloads.
 */
(()=>{
  'use strict';
  const index=window.TRT_KOREA_INDEX;
  const definitions=[
    {id:'kr-namseoul-light-rail',countryId:'kr',names:{ko:'남서울경전철㈜',en:'Nam Seoul Light Rail Co.'},modes:['subway']},
    {id:'kr-ui-sinseol',countryId:'kr',names:{ko:'우이신설경전철㈜',en:'Ui-Sinseol Light Rail Co.'},modes:['subway']},
    {id:'kr-yongin-everline',countryId:'kr',names:{ko:'용인경량전철㈜',en:'Yongin Light Rail Transit Co.'},modes:['subway']},
    {id:'kr-uijeongbu-lrt',countryId:'kr',names:{ko:'의정부경전철㈜',en:'Uijeongbu Light Rail Transit Co.'},modes:['subway']}
  ];
  if(index){
    index.operators=index.operators||[];
    for(const definition of definitions){
      const at=index.operators.findIndex(item=>item.id===definition.id);
      if(at<0)index.operators.push(definition);
      else index.operators[at]={...index.operators[at],...definition};
    }
  }
  const operators=new Map((index?.operators||[]).map(item=>[item.id,item]));
  for(const definition of definitions)operators.set(definition.id,definition);
  const mapping={
    'kr-metro-1':{primary:'kr-korail',ids:['kr-korail','kr-seoul-metro']},
    'kr-metro-1-section-2':{primary:'kr-seoul-metro',ids:['kr-seoul-metro','kr-korail']},
    'kr-metro-1-section-3':{primary:'kr-korail',ids:['kr-korail','kr-seoul-metro']},
    'kr-metro-1-section-4':{primary:'kr-seoul-metro',ids:['kr-seoul-metro','kr-korail']},
    'kr-metro-1-section-5':{primary:'kr-korail',ids:['kr-korail','kr-seoul-metro']},
    'kr-metro-3':{primary:'kr-seoul-metro',ids:['kr-seoul-metro','kr-korail']},
    'kr-metro-4':{primary:'kr-seoul-metro',ids:['kr-seoul-metro','kr-korail']},
    'kr-metro-4-section-2':{primary:'kr-seoul-metro',ids:['kr-seoul-metro','kr-korail']},
    'kr-metro-19':{primary:'kr-namseoul-light-rail',ids:['kr-namseoul-light-rail']},
    'kr-metro-20':{primary:'kr-ui-sinseol',ids:['kr-ui-sinseol']},
    'kr-metro-22':{primary:'kr-yongin-everline',ids:['kr-yongin-everline']},
    'kr-metro-23':{primary:'kr-uijeongbu-lrt',ids:['kr-uijeongbu-lrt']},
    'kr-metro-24':{primary:'kr-gtx-a-operations',ids:['kr-gtx-a-operations']},
    'kr-gtx-a-north':{primary:'kr-gtx-a-operations',ids:['kr-gtx-a-operations']}
  };
  function apply(payload){
    const route=payload?.route||payload;
    if(!route||!mapping[route.id])return payload;
    const entry=mapping[route.id];
    const primary=operators.get(entry.primary);
    if(!primary)return payload;
    const format=item=>({id:item.id,ko:item.names?.ko||item.ko||item.id,en:item.names?.en||item.en||item.id});
    route.operatorId=entry.primary;
    route.operator=format(primary);
    route.operators=entry.ids.map(id=>operators.get(id)).filter(Boolean).map(format);
    route.operatorIds=entry.ids.slice();
    return payload;
  }
  if(index?.routes)index.routes.forEach(apply);
  if(typeof window.fetch==='function'&&!window.__TRT_KR_OPERATOR_FETCH_PATCHED){
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await originalFetch(input,init);
      let url='';
      try{url=new URL(typeof input==='string'?input:input.url,document.baseURI).pathname}catch{}
      if(!response.ok||!/\/data\/kr\/generated\/routes\/[^/]+\.json$/.test(url))return response;
      try{
        const payload=apply(await response.clone().json());
        const headers=new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        return new Response(JSON.stringify(payload),{status:response.status,statusText:response.statusText,headers});
      }catch(error){
        console.warn('[SUBTYPE] Korean operator metadata bridge skipped a route payload.',error);
        return response;
      }
    };
    window.__TRT_KR_OPERATOR_FETCH_PATCHED=true;
  }
})();

const fs=require('fs'),crypto=require('crypto');
const logos={
 trtc:'https://www-ws.gov.taipei/001/Upload/405/sites/defaulticon/debef253-ae35-4c5c-b7ab-38bdd44e3a8b.png',
 thsr:'https://www.thsrc.com.tw/Common/assets/img/logo/logo.svg',
 ntmc:'https://www.ntmetro.com.tw/archive/image/system/logo@2x.png',
 tymc:'https://www.tymetro.com.tw/tymetro-new/_images/all/logo.png',
 tmrt:'https://www.tmrt.com.tw/static/img/sidebar/main-logo-tw2.png',
 krtc:'https://www.krtc.com.tw/Content/eng/images/favicon.ico',
 tra:'https://www.railway.gov.tw/tra-tip-web/static/images/TRC_logo_1.png',
 afr:'https://afrch.forest.gov.tw/common/013/Logo/TW/Logo.jpg'};
(async()=>{const result={};for(const [id,url]of Object.entries(logos)){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const body=Buffer.from(await r.arrayBuffer()),ext=new URL(url).pathname.split('.').at(-1).toLowerCase();if(body.length<100||body.toString('utf8',0,50).includes('<!DOCTYPE'))throw Error('not an image');const asset='assets/operators/tw-'+id+'.'+ext;fs.writeFileSync(asset,body);result['tw-'+id]={asset,exists:true,verified:true,officialExists:true,source:url,license:'Official operator identity; trademark retained; used for identification',sha256:crypto.createHash('sha256').update(body).digest('hex')};console.log(id,body.length)}catch(e){console.error(id,e.message)}}fs.writeFileSync('data/tw/branding.json',JSON.stringify(result,null,2)+'\n')})();

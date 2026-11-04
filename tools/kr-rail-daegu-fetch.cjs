'use strict';
// 로그인 없이 공개된 대구교통공사 역사 CSV를 포털의 다운로드 절차로 수집한다.
const fs=require('node:fs'),crypto=require('node:crypto'),base='data/kr/canonical/national-source/';
(async()=>{const page=fs.readFileSync(base+'rail-daegu-stations-20261104.html','utf8'),args=page.match(/fn_fileDataDown\('([^']+)', '([^']+)', '([^']*)','?\s*'?([^']*)', '([^']+)'\)/);
 if(!args)throw Error('공식 파일 다운로드 식별자 미확인');
 const metaUrl='https://www.data.go.kr/tcs/dss/selectFileDataDownload.do',body=new URLSearchParams({publicDataPk:args[1],publicDataDetailPk:args[2],atchFileId:args[3],fileDetailSn:args[4],publicDataTyCode:'PR0051'});
 const response=await fetch(metaUrl,{method:'POST',body,signal:AbortSignal.timeout(20000)}),meta=await response.json();if(!response.ok||!meta.status)throw Error('공개 다운로드 제한 또는 실패');
 const url='https://www.data.go.kr/cmm/cmm/fileDownload.do?'+new URLSearchParams({atchFileId:meta.atchFileId,fileDetailSn:meta.fileDetailSn,dataNm:meta.dataSetFileDetailInfo.dataNm||''});
 const file=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!file.ok)throw Error('CSV HTTP '+file.status);const bytes=Buffer.from(await file.arrayBuffer());if(/text\/html/.test(file.headers.get('content-type')||''))throw Error('CSV 대신 접근 안내 화면 수신');
 fs.writeFileSync(base+'rail-daegu-stations-20261104.csv',bytes);fs.writeFileSync(base+'rail-daegu-csv-source.json',JSON.stringify({url,reference:'https://www.data.go.kr/data/15149895/fileData.do',sourceDate:'2026-06-30',retrievedAt:new Date().toISOString(),license:'이용허락범위 제한 없음',publisher:'대구교통공사',sha256:crypto.createHash('sha256').update(bytes).digest('hex')},null,2)+'\n');console.log('공식 대구 역사 CSV 저장: '+bytes.length+'바이트');
})().catch(e=>{console.error(e.message);process.exitCode=1});

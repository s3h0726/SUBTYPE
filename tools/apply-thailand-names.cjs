'use strict';
// 편집표의 내보내기를 영구 소스에 반영한다. 원명과 식별자는 수정하지 않는다.
const fs=require('node:fs'),path=require('node:path');process.chdir(path.resolve(__dirname,'..'));
const input=process.argv[2];if(!input)throw Error('사용법: node tools/apply-thailand-names.cjs 내보낸파일.json');
const data=JSON.parse(fs.readFileSync(input,'utf8')),catalog=JSON.parse(fs.readFileSync('data/th/generated/names.json','utf8'));
if(data.countryId!=='th'||data.schemaVersion!==1)throw Error('태국 편집표 형식이 아닙니다.');
const outputFile='data/th/korean-overrides.json',out=fs.existsSync(outputFile)?JSON.parse(fs.readFileSync(outputFile,'utf8')):{};
for(const kind of ['operators','lines','stations','services'])for(const[id,value]of Object.entries(data[kind]||{})){if(!catalog[kind].some(row=>row.id===id))throw Error('알 수 없는 식별자: '+id);const ko=typeof value==='string'?value:value?.ko;if(typeof ko!=='string'||!/[가-힣]/.test(ko)||ko.length>100)throw Error('유효한 한국어 이름 필요: '+id);(out[kind]??={})[id]=ko.normalize('NFC').trim()}
fs.writeFileSync(outputFile,JSON.stringify(out,null,2)+'\n');console.log('태국 이름 원본에 반영했습니다. npm run build:thailand로 재생성하세요.');

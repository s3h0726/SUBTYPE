const fs=require('node:fs');
function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}
 if(field||row.length){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row)}
 return rows;
}
const readCsv=file=>{const [header,...rows]=parseCsv(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));return rows.map(row=>Object.fromEntries(header.map((key,i)=>[key,row[i]||''])))};
module.exports={parseCsv,readCsv};

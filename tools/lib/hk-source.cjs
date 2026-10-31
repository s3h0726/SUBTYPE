const fs=require('node:fs');
function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}
 if(field||row.length){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row)}
 return rows;
}
const readCsv=file=>{const [header,...rows]=parseCsv(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));return rows.map(row=>Object.fromEntries(header.map((key,i)=>[key,row[i]||''])))};
function lightRailStopSequences(rows,{loop=false}={}){
 const clean=value=>String(value).replace(/\s*\(Platform\s+\d+\)\s*$/i,'').trim();
 const collapse=list=>list.filter((name,i)=>i===0||name!==list[i-1]);
 if(!rows.length)return[];
 if(loop){const list=collapse(rows.map(r=>clean(r[0])));return[[...list,list[0]]]}
 const first=clean(rows[0][0]),last=clean(rows.at(-1)[0]);
 // Terminal dashes mean no departure, not an omitted arriving stop.
 // Interior dashes still distinguish direction-specific calling patterns.
 return[1,2].map(column=>{
  const list=collapse(rows.filter(r=>clean(r[0])===first||clean(r[0])===last||r[column]&&r[column]!=='-').map(r=>clean(r[0])));
  return column===2?list.reverse():list;
 });
}
function lightRailCsvSequences(rows,{loop=false}={}){
 const collapse=list=>list.filter((row,i)=>!i||row['Stop ID']!==list[i-1]['Stop ID']);
 const directions=[...new Set(rows.map(r=>r.Direction))],ordered=d=>rows.filter(r=>r.Direction===d).sort((a,b)=>Number(a.Sequence)-Number(b.Sequence));
 // The operator publishes circular routes as two consecutive sections meeting
 // at Tin Wing. These are not opposite passenger directions.
 if(loop){const sections=directions.map(ordered);return[{direction:'circular',rows:collapse(sections.flat())}]}
 return directions.map(direction=>({direction,rows:collapse(ordered(direction))}));
}
module.exports={parseCsv,readCsv,lightRailStopSequences,lightRailCsvSequences};

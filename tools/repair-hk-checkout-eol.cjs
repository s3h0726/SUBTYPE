const fs=require('node:fs'),crypto=require('node:crypto');let count=0;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [name,pin]of Object.entries(JSON.parse(fs.readFileSync('data/hk/sources/manifest.json','utf8')))){
 if(pin.status!=='retrieved')continue;const file='data/hk/sources/'+name,actual=fs.readFileSync(file);if(sha(actual)===pin.sha256)continue;
 const lf=Buffer.from(actual.toString('utf8').replace(/\r\n/g,'\n')),crlf=Buffer.from(lf.toString('utf8').replace(/\n/g,'\r\n')),original=[lf,crlf].find(b=>sha(b)===pin.sha256);
 if(!original)throw Error('Not a proven line-ending-only difference: '+file);fs.writeFileSync(file,original);count++;
}console.log('Restored exact pinned source bytes: '+count);

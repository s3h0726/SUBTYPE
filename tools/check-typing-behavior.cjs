const {inspect}=require('./lib/ui-behavior.cjs');
inspect().then(checks=>{console.log(JSON.stringify({checkedAt:new Date().toISOString(),source:'Actual TypingController and Game prototype execution in a small DOM fixture; no browser or OS IME claim',checks},null,2));if(Object.values(checks).some(c=>c.status!=='PASS'))process.exitCode=1}).catch(error=>{console.error(error);process.exitCode=1});

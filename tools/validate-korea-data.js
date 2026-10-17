#!/usr/bin/env node
'use strict';
const path=require('node:path'),{load,compile}=require('./lib/kr-network');
const base=path.resolve(__dirname,'../data/kr/v2'),result=compile(load(base),{base});
console.log(JSON.stringify({status:result.status,counts:result.counts,errors:result.errors,blockedServices:result.blocked.length},null,2));
if(result.errors.length||process.argv.includes('--require-complete')&&result.status!=='COMPLETE')process.exitCode=1;

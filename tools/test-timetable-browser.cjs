'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const hook = 'globalThis.timetableQA={game,go,chooseRoute,openSetup,actualOperatingChoices,operatingPatternKey,journeyStationKey,routes:()=>routes};\n';
const server = http.createServer(async (req, res) => {
 const name = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).slice(1) || 'index.html';
 const file = path.resolve(root, name);
 if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
 try {
  let body = await fs.readFile(file);
  if (name === 'js/app.bundle.js') {
   const marker = '\n})().catch(error=>';
   assert(body.includes(marker));
   body = body.toString().replace(marker, '\n' + hook + marker);
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(body);
 } catch (error) {
  res.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
 }
});

const samples = [
 ['jp', 'jp-disney-resort-line'],
 ['jp', 'line-toyama-city-2', 'journey:journey-jp-toyama-3008-forward', 8, 'journey-jp-toyama-3008-forward'],
 ['jp', 'line-toyama-city-2', 'journey:journey-jp-toyama-3008-reverse', 8, 'journey-jp-toyama-3008-reverse'],
 ['kr', 'kr-rail-national-airport', 'kr-arex-seoul-geomam-local', 8],
 ['kr', 'kr-rail-national-airport', 'kr-arex-t2-dmc-local', 11],
 ['kr', 'kr-bus-seoul-100100012'],
 ['kr', 'kr-hangang-west'],
 ['hk', 'hk-island-dt'],
 ['tw', 'tw-tymc-airport', 'tw-service-c2d1199d0860', 13],
 ['th', 'th-srtet-lightred'],
 ['uk', 'uk-bakerloo']
];

async function main() {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const url = 'http://127.0.0.1:' + server.address().port;
 const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
 try {
  for (const [country, routeId, choiceId, stops, serviceId = choiceId] of samples) {
   const page = await browser.newPage();
   try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(countryId => {
     localStorage.setItem('trt-country', countryId);
     localStorage.setItem('trt:settings', JSON.stringify({ motion: false, sound: false }));
    }, country);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(id => window.timetableQA?.routes().some(route => route.id === id), routeId, { timeout: 60000 });
    await page.evaluate(async routeId => {
     const qa = window.timetableQA;
     qa.go('rail-map');
     if (!await qa.chooseRoute(routeId)) throw Error('Cannot choose ' + routeId);
     qa.openSetup(qa.routes().find(item => item.id === routeId));
    }, routeId);
    await page.waitForFunction(() => !document.querySelector('#setup-form button[type="submit"]').disabled
      && document.querySelector('#journey-destination').value);
    const selection = await page.evaluate(({ routeId, choiceId }) => {
     const qa = window.timetableQA;
     const select = (id, value) => {
      const input = document.querySelector(id);
      if (![...input.options].some(option => option.value === value)) throw Error(id + ' missing ' + value);
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
     };
     const route = qa.routes().find(item => item.id === routeId);
     const choices = qa.actualOperatingChoices(route);
     const destination = document.querySelector('#journey-destination');
     if (choiceId) {
      const choice = choices.find(item => item.id === choiceId);
      if (!choice) throw Error('Missing runtime choice ' + choiceId);
      const base = choices.find(item => item.id === destination.value);
      const baseName = base?.patternName?.ko || '';
      if (routeId === 'line-toyama-city-2' && base?.kind !== 'legacy') {
       throw Error('Toyama default should be the full-length ordinary service');
      }
      if (routeId === 'kr-rail-national-airport' && !/^(서울역 → 인천공항2터미널|인천공항2터미널 → 서울역) 일반$/.test(baseName)) {
       throw Error('AREX default should be a full-length ordinary service');
      }
      select('#journey-pattern', qa.operatingPatternKey(choice));
      select('#journey-direction', choice.direction);
      select('#journey-origin', qa.journeyStationKey(choice.originNames, choice.originId));
      select('#journey-destination', choice.id);
     }
     const selected = destination.value;
     document.querySelector('#setup-form').requestSubmit();
     return selected;
    }, { routeId, choiceId });
    assert(selection, routeId + ' empty selection');
    await page.waitForFunction(() => document.body.dataset.currentScreen === 'game');
    const result = await page.evaluate(() => {
     const game = window.timetableQA.game;
     return { calls: game.sequence.length, serviceId: game.options.serviceJourneyId || game.service.id,
      destination: game.sequence.at(-1)?.ko, geometryPoints: game.mapRoute.geometry.length };
    });
    if (choiceId) assert.equal(result.serviceId, serviceId);
    if (stops) assert.equal(result.calls, stops);
    assert(result.destination && result.geometryPoints > 1);
    assert.deepEqual(errors, [], routeId);
    console.log(JSON.stringify({ country, routeId, ...result }));
   } finally {
    await page.close();
   }
  }
 } finally {
  await browser.close();
 }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const publicBase = process.env.FRANCE_PUBLIC_URL;
const marker = '\n})().catch(error=>';
const hook = '\nglobalThis.__FRANCE_QA__={game,go,chooseRoute,openSetup,actualOperatingChoices,resolveOperatingChoice,operatingPatternKey,startFreeDrive,freeDrive,franceFreeDriveRoutes,buildTypingModel,routes:()=>routes};\n';
const mime = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.svg':'image/svg+xml'};
const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try {
    let body = fs.readFileSync(file);
    if (name === 'js/app.bundle.js') body = body.toString().replace(marker, hook + marker);
    response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

async function openRoute(page, id) {
  await page.evaluate(async id => {
    const qa = globalThis.__FRANCE_QA__;
    qa.game.stop(false);
    qa.go('rail-map');
    if (!await qa.chooseRoute(id)) throw new Error('Line selection failed: ' + id);
    qa.openSetup(qa.routes().find(route => route.id === id));
  }, id);
}

async function testDirection(page, {id, key, stations}) {
  return page.evaluate(async ({id, key, stations}) => {
    const qa = globalThis.__FRANCE_QA__;
    const select = (selector, value) => {
      const element = document.querySelector(selector);
      if (![...element.options].some(option => option.value === value)) {
        throw new Error('Unavailable selector option: ' + selector + ' ' + value);
      }
      element.value = value;
      element.dispatchEvent(new Event('change', {bubbles:true}));
    };
    select('#journey-pattern', key);
    select('#journey-direction', id);
    select('#journey-destination', id);
    if (![...document.querySelectorAll('.setup-stations li b')].every(row => /[가-힣]/.test(row.textContent))) {
      throw new Error('Setup station name missing Korean');
    }
    document.querySelector('#setup-form').requestSubmit();
    const game = qa.game;
    if (document.body.dataset.currentScreen !== 'game' || game.serviceJourney?.id !== id) {
      throw new Error('Wrong gameplay route: ' + id);
    }
    game.options.motion = false;
    game.options.stationAdvance = 'auto';
    let result;
    const finish = game.onFinish;
    game.onFinish = value => {result = value; finish(value);};
    try {
      for (const station of stations) {
        if (game.targetStation()?.id !== station.id || game.phase !== 'TYPING') {
          throw new Error('Unexpected station progression: ' + id + ' / ' + station.id);
        }
        const input = document.querySelector('#typing-input');
        const sign = document.querySelector('#station-sign');
        const prompt = document.querySelector('#prompt-main');
        const inputRect = input.getBoundingClientRect();
        const coversInput = [...sign.querySelectorAll('#prompt-main,#prompt-sub,.station-sign-brand')].some(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.left < inputRect.right &&
            rect.right > inputRect.left && rect.top < inputRect.bottom && rect.bottom > inputRect.top;
        });
        if (prompt.textContent !== station.ko || coversInput ||
            prompt.scrollWidth > prompt.clientWidth + 2) {
          throw new Error('Korean sign or typing layout mismatch: ' + JSON.stringify({
            id, expected:station.ko, text:prompt.textContent, coversInput,
            scrollWidth:prompt.scrollWidth, clientWidth:prompt.clientWidth,
          }));
        }
        const answer = qa.buildTypingModel(station.ko).inputText;
        input.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true}));
        input.value = answer;
        input.dispatchEvent(new InputEvent('input', {bubbles:true, isComposing:true}));
        input.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:answer}));
        await new Promise(resolve => setTimeout(resolve, 0));
        if (game.phase === 'ARRIVING') {
          await game.arrivalPromise;
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      if (!game.finished || !result?.routeIntegrity || result.completed !== stations.length) {
        throw new Error('Incomplete direction: ' + id);
      }
      return {id, stationCount: result.completed, origin: stations[0].ko,
        destination: stations.at(-1).ko, sign: document.querySelector('#station-sign').dataset.signStyle};
    } finally {
      game.onFinish = finish;
    }
  }, {id, key, stations});
}

async function run() {
  if (!publicBase) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = publicBase || 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH});
  const report = {status:'FAIL', testedDirections:[], mobileDirections:[], freeDrive:[], countries:[], errors:[]};
  try {
    const page = await browser.newPage({viewport:{width:1440, height:1000}, reducedMotion:'reduce'});
    page.on('pageerror', error => report.errors.push(error.message));
    if (publicBase) {
      await page.route('**/js/app.bundle.js*', async route => {
        const response = await route.fetch();
        await route.fulfill({response, body:(await response.text()).replace(marker, hook + marker)});
      });
    }
    await page.addInitScript(() => localStorage.setItem('trt-country', 'fr'));
    await page.goto(base);
    await page.waitForFunction(() => globalThis.__FRANCE_QA__?.routes().some(route => route.countryId === 'fr'));
    const index = require('../data/fr/generated/index.json');
    const lines = publicBase ? index.routes.filter(route =>
      ['fr-paris-metro-13', 'fr-tgv-paris-besancon', 'fr-tgv-strasbourg-brussels'].includes(route.id))
      : index.routes;
    for (const line of lines) {
      await openRoute(page, line.id);
      const choices = await page.evaluate(id => {
        const qa = globalThis.__FRANCE_QA__;
        const route = qa.routes().find(route => route.id === id);
        return qa.actualOperatingChoices(route).map(choice => ({
          id: choice.id, key: qa.operatingPatternKey(choice),
          stations: qa.resolveOperatingChoice(choice, route).route.stations.map(({id, ko}) => ({id, ko})),
        }));
      }, line.id);
      assert.equal(choices.length, line.serviceCount);
      for (const choice of choices) {
        await openRoute(page, line.id);
        report.testedDirections.push(await testDirection(page, choice));
        await page.setViewportSize({width:390,height:844});
        await openRoute(page, line.id);
        report.mobileDirections.push(await testDirection(page, choice));
        await page.setViewportSize({width:1440,height:1000});
      }
      await page.evaluate(async id => {
        const qa = globalThis.__FRANCE_QA__;
        qa.go('rail-map');
        await qa.chooseRoute(id);
        await qa.startFreeDrive(qa.routes().find(route => route.id === id));
      }, line.id);
      report.freeDrive.push(...await page.evaluate(id => {
        const drive = globalThis.__FRANCE_QA__.freeDrive;
        const render = drive.render, emit = drive.emit;
        const verified = [];
        try {
          drive.render = () => {};
          drive.emit = () => {};
          for (const route of drive.routes.filter(route => route.physicalLineId === id)) {
            if (!drive.start(route)) throw new Error('Cannot start free drive ' + route.id);
            for (let index = 1; index < route.stations.length; index++) {
              const edge = drive.edges().find(edge => edge.routeId === route.id && edge.direction === 1 && edge.index === index);
              if (!edge || !drive.moveTo(edge.to, edge.routeId, drive.currentKey) ||
                  drive.snapshot().station.id !== route.stations[index].id) throw new Error('Free drive mismatch ' + route.id);
            }
            verified.push({id:route.selectedServiceId, transitions:route.stations.length - 1});
          }
          return verified;
        } finally {
          drive.render = render;
          drive.emit = emit;
        }
      }, line.id));
    }
    if (!publicBase) {
      report.interchange = await page.evaluate(async () => {
        const qa = globalThis.__FRANCE_QA__;
        qa.game.stop(false);
        qa.go('rail-map');
        await qa.chooseRoute('fr-paris-metro-1');
        await qa.startFreeDrive(qa.routes().find(route => route.id === 'fr-paris-metro-1'));
        const drive = qa.freeDrive;
        const line = drive.routes.find(route => route.id === 'fr-paris-metro-1');
        const gare = line.stations.findIndex(station => station.physicalStationId === 'fr-gare-de-lyon');
        if (gare < 0 || !drive.start(line, gare)) throw new Error('Cannot board at Gare de Lyon');
        const state = drive.snapshot();
        const connection = state.edges.find(edge => edge.route.physicalLineId === 'fr-tgv-paris-besancon');
        if (!connection || !drive.moveTo(connection.to, connection.routeId, drive.currentKey)) {
          throw new Error('Gare de Lyon metro-to-TGV transfer unavailable');
        }
        if (drive.snapshot().station.ko !== '몽바르') throw new Error('Transfer selected the wrong train path');
        return {station:'리옹역', destination:'몽바르', status:'PASS'};
      });
      for (const country of ['jp', 'kr', 'hk', 'tw', 'th', 'uk', 'fr']) {
        await page.evaluate(() => {const qa = globalThis.__FRANCE_QA__; qa.game.stop(false); qa.go('home');});
        await page.locator('button[data-country="' + country + '"]').click();
        await page.waitForFunction(country => {
          const lines = globalThis.__FRANCE_QA__?.routes();
          return lines?.length && lines.every(line => line.countryId === country);
        }, country, {timeout:60000});
        report.countries.push(country);
      }
      await page.goto(new URL('reports/korean-names/editor.html?country=fr', base).href);
      await page.locator('[data-file="stations-by-line"]').click();
      await page.locator('#route-filter').selectOption('fr-paris-metro-3bis');
      await page.waitForFunction(() => [...document.querySelectorAll('#table input')].some(input => input.value === '강베타'));
      report.editor = 'PASS';
    }
    assert.deepEqual(report.errors, []);
    report.status = 'PASS';
  } catch (error) {
    report.error = error.stack;
    process.exitCode = 1;
  } finally {
    const name = publicBase ? 'production-gameplay.json' : 'browser-gameplay.json';
    fs.writeFileSync(path.join(root, 'reports/fr', name), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({status:report.status, desktop:report.testedDirections.length,
      mobile:report.mobileDirections.length, freeDrive:report.freeDrive.length, error:report.error}));
    await browser.close();
    server.close();
  }
}

run().catch(error => {console.error(error); server.close(); process.exitCode = 1;});

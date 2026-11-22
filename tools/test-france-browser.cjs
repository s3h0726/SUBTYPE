'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const publicBase = process.env.FRANCE_PUBLIC_URL;
const uiOnly = process.env.FRANCE_UI_ONLY === '1';
const nameOverrideTest = process.env.FRANCE_NAME_OVERRIDE_TEST === '1';
const requestedLines = (process.env.FRANCE_ROUTE_IDS || '').split(',').filter(Boolean);
const marker = '\n})().catch(error=>';
const hook = '\nglobalThis.__FRANCE_QA__={game,go,chooseRoute,openSetup,actualOperatingChoices,resolveOperatingChoice,operatingPatternKey,startFreeDrive,freeDrive,franceFreeDriveRoutes,buildTypingModel,filteredRoutes,routes:()=>routes};\n';
const mime = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.svg':'image/svg+xml'};
const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html';
  const file = path.resolve(root, name.endsWith('/') ? name + 'index.html' : name);
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

async function openNameEditor(page, base) {
  // This stable table URL also works while hosted by the former iframe shell.
  await page.goto(new URL('reports/korean-names/editor.html?country=fr&embedded=1', base).href, {waitUntil:'domcontentloaded'});
  await page.locator('[data-file="stations-by-line"]').waitFor({state:'visible'});
  return page;
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
    if (!publicBase) {
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
        ? route.continue() : route.abort());
    }
    if (publicBase) {
      await page.route('**/js/app.bundle.js*', async route => {
        const response = await route.fetch();
        await route.fulfill({response, body:(await response.text()).replace(marker, hook + marker)});
      });
    }
    const expectedIndex = require('../data/fr/generated/index.json');
    const classic = expectedIndex.routes.find(route => route.operatorId === 'fr-oslo');
    const editedName = '마시 한국어 연동 검사';
    if (nameOverrideTest) {
      assert.ok(classic, 'A verified OUIGO Train Classique route is required');
      const detail = JSON.parse(fs.readFileSync(path.join(root, classic.lazySource), 'utf8'));
      const massy = detail.stationCatalog.find(station => station.fr === 'Massy-Palaiseau');
      assert.ok(massy, 'Missing SNCF Massy-Palaiseau identity');
      await page.route('**/data/editor-overrides.json*', route => route.fulfill({
        json:{stations:{[classic.id]:{[massy.id]:editedName}}},
      }));
    }
    await page.addInitScript(() => localStorage.setItem('trt-country', 'fr'));
    await page.goto(base, {waitUntil:'domcontentloaded', timeout:60000});
    await page.waitForFunction(() => globalThis.__FRANCE_QA__?.routes().some(route => route.countryId === 'fr'));
    const index = require('../data/fr/generated/index.json');
    if (nameOverrideTest) {
      await page.evaluate(() => globalThis.__FRANCE_QA__.go('rail-map'));
      await page.locator('#category-tabs [data-category="international"]').click();
      const borderIds = await page.evaluate(() => globalThis.__FRANCE_QA__.filteredRoutes().map(route=>route.id));
      const expectedBorders = index.routes.filter(route=>route.international||route.category==='international').map(route=>route.id);
      assert.deepEqual(borderIds.sort(),expectedBorders.sort(),'International selection must include cross-border regional trains');
      await page.locator('#category-tabs [data-category="all"]').click();
      await openRoute(page, 'fr-transilien-v');
      const choice = await page.evaluate(editedName => {
        const qa = globalThis.__FRANCE_QA__, owner = qa.routes().find(route => route.id === 'fr-transilien-v');
        const selected = qa.actualOperatingChoices(owner).find(choice => choice.originNames.ko === editedName);
        if (!selected) throw Error('Shared Korean edit did not reach Transilien origin/destination names');
        const route = qa.resolveOperatingChoice(selected, owner).route;
        if (route.stations[0].fr !== 'Massy - Palaiseau') throw Error('Original French name changed');
        return {id:selected.id,key:qa.operatingPatternKey(selected),stations:route.stations.map(({id,ko})=>({id,ko}))};
      }, editedName);
      report.testedDirections.push(await testDirection(page, choice));
      await page.setViewportSize({width:390,height:844});
      await openRoute(page, 'fr-transilien-v');
      report.mobileDirections.push(await testDirection(page, choice));
      report.nameOverrides = await page.evaluate(async ({editedName,classicId}) => {
        const qa = globalThis.__FRANCE_QA__;
        qa.game.stop(false);qa.go('rail-map');
        await qa.chooseRoute('fr-transilien-v');
        qa.openSetup(qa.routes().find(route => route.id === 'fr-transilien-v'));
        if (![...document.querySelector('#journey-destination').options].some(option=>option.textContent.includes(editedName))) {
          throw Error('Edited Korean name is absent from destinations');
        }
        await qa.startFreeDrive(qa.routes().find(route => route.id === 'fr-transilien-v'));
        const drive = qa.freeDrive;
        const service = drive.routes.find(route => route.physicalLineId === 'fr-transilien-v' && route.stations[0].ko === editedName);
        if (!service || !drive.start(service) || drive.snapshot().station.ko !== editedName) throw Error('Free-drive name edit missing');
        const classic = drive.snapshot().edges.find(edge => edge.route.physicalLineId === classicId);
        if (!classic || !drive.moveTo(classic.to,classic.routeId,drive.currentKey)) throw Error('Transilien-to-OUIGO interchange missing');
        return {answers:'PASS',signs:'PASS',destinations:'PASS',freeDrive:'PASS',classicTransfer:'PASS',originalFrench:'PASS'};
      }, {editedName,classicId:classic.id});
      const editor = await openNameEditor(page, base);
      report.editorEntry = 'korean-name-table';
      await editor.locator('[data-file="stations-by-line"]').click();
      for (const id of ['fr-transilien-v',classic.id]) {
        await editor.locator('#route-filter').selectOption(id);
        await editor.waitForFunction(name=>[...document.querySelectorAll('#table input')].some(input=>input.value===name), editedName);
      }
      report.nameOverrides.editor = 'PASS';
      report.nameOverrides.internationalFilter = 'PASS';
      assert.deepEqual(report.errors, []);
      report.status = 'PASS';
      return;
    }
    const lines = uiOnly ? [] : requestedLines.length ? index.routes.filter(route => requestedLines.includes(route.id))
      : publicBase ? index.routes.filter(route => route.category === 'commuter_rail' ||
      ['fr-paris-metro-13', 'fr-tgv-paris-besancon', 'fr-tgv-strasbourg-brussels',
        'fr-intercites-bordeaux-marseille', 'fr-lyon-metro-b', 'fr-rennes-metro-b',
        'fr-toulouse-metro-b', 'fr-lille-metro-2', 'fr-marseille-metro-2',
        'fr-ter-grenoble-rives', 'fr-ter-lyon-brignais', 'fr-ter-macon-valence',
        'fr-ter-nantes-pornic', 'fr-ter-nantes-saint-gilles', 'fr-lyria-paris-lausanne',
        'fr-tgv-strasbourg-nice', 'fr-ter-saint-marcellin-grenoble', 'fr-ter-lyon-part-dieu-avignon',
        'fr-ter-lyon-perrache-avignon', 'fr-ter-lyon-besancon',
        'fr-intercites-night-paris-toulouse', 'fr-rer-a', 'fr-rer-b', 'fr-rer-c', 'fr-rer-d', 'fr-rer-e'].includes(route.id))
      : index.routes;
    if (requestedLines.length) assert.equal(lines.length, new Set(requestedLines).size, 'Unknown requested France line');
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
      console.log(JSON.stringify({line:line.id, desktop:report.testedDirections.length,
        mobile:report.mobileDirections.length, freeDrive:report.freeDrive.length}));
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
        const rer = drive.routes.find(route => route.physicalLineId === 'fr-rer-a');
        const rerGare = rer?.stations.findIndex(station => station.physicalStationId === 'fr-gare-de-lyon');
        if (!(rerGare >= 0) || !drive.start(rer, rerGare)) throw new Error('Cannot board RER at Gare de Lyon');
        const metro = drive.snapshot().edges.find(edge => edge.route.physicalLineId === 'fr-paris-metro-1');
        if (!metro || !drive.moveTo(metro.to, metro.routeId, drive.currentKey)) {
          throw new Error('Gare de Lyon RER-to-metro transfer unavailable');
        }
        qa.game.stop(false);
        qa.go('rail-map');
        await qa.chooseRoute('fr-rer-c');
        await qa.startFreeDrive(qa.routes().find(route => route.id === 'fr-rer-c'));
        const rerC = drive.routes.find(route => route.physicalLineId === 'fr-rer-c');
        const austerlitz = rerC?.stations.findIndex(station => station.physicalStationId === 'fr-gare-dausterlitz');
        if (!(austerlitz >= 0) || !drive.start(rerC, austerlitz)) throw new Error('Cannot board RER C at Austerlitz');
        const intercity = drive.snapshot().edges.find(edge => edge.route.physicalLineId === 'fr-intercites-night-paris-toulouse');
        if (!intercity || !drive.moveTo(intercity.to, intercity.routeId, drive.currentKey)) {
          throw new Error('Austerlitz RER-to-Intercites transfer unavailable');
        }
        const massyService = drive.routes.find(route => route.physicalLineId === 'fr-rer-c' &&
          route.stations[0]?.fr === 'Massy - Palaiseau' &&
          route.stations.at(-1)?.fr === 'Pontoise');
        if (!massyService || !drive.start(massyService)) throw new Error('Cannot board Massy–Pontoise');
        const rerB = drive.snapshot().edges.find(edge => edge.route.physicalLineId === 'fr-rer-b');
        if (!rerB || !drive.moveTo(rerB.to, rerB.routeId, drive.currentKey)) {
          throw new Error('Massy RER C-to-B transfer unavailable');
        }
        qa.game.stop(false);
        qa.go('rail-map');
        await qa.chooseRoute('fr-transilien-v');
        await qa.startFreeDrive(qa.routes().find(route => route.id === 'fr-transilien-v'));
        const suburban = drive.routes.find(route => route.physicalLineId === 'fr-transilien-v');
        const massy = suburban?.stations.findIndex(station => station.fr === 'Massy - Palaiseau');
        if (!(massy >= 0) || !drive.start(suburban, massy)) throw new Error('Cannot board Transilien V at Massy');
        const rerCTransfer = drive.snapshot().edges.find(edge => edge.route.physicalLineId === 'fr-rer-c');
        if (!rerCTransfer || !drive.moveTo(rerCTransfer.to, rerCTransfer.routeId, drive.currentKey)) {
          throw new Error('Massy Transilien V-to-RER C transfer unavailable');
        }
        return {station:'리옹역', destination:'몽바르', rerToMetro:'PASS', rerToIntercity:'PASS', massyRerTransfer:'PASS', transilienTransfer:'PASS', status:'PASS'};
      });
      for (const country of ['jp', 'kr', 'hk', 'mo', 'tw', 'th', 'uk', 'fr']) {
        await page.evaluate(() => {const qa = globalThis.__FRANCE_QA__; qa.game.stop(false); qa.go('home');});
        if (country === 'hk' || country === 'mo') {
          await page.locator('button[data-country-group="sar"]').click();
          await page.locator('#hk-mo-country-picker [data-hk-mo-choice="' + country + '"]').click();
        } else {
          await page.locator('button[data-country="' + country + '"]').click();
        }
        await page.waitForFunction(country => {
          const lines = globalThis.__FRANCE_QA__?.routes();
          return lines?.length && lines.every(line => line.countryId === country);
        }, country, {timeout:60000});
        report.countries.push(country);
      }
      const editor = await openNameEditor(page, base);
      report.editorEntry = 'korean-name-table';
      await editor.locator('[data-file="stations-by-line"]').click();
      await editor.locator('#route-filter').selectOption('fr-paris-metro-3bis');
      await editor.waitForFunction(() => [...document.querySelectorAll('#table input')].some(input => input.value === '강베타'));
      await editor.locator('#route-filter').selectOption('fr-rer-c');
      await editor.waitForFunction(() => [...document.querySelectorAll('#table input')].some(input => input.value === '퐁투아즈'));
      report.transilienEditor = [];
      report.franceEditor = [];
      for (const line of index.routes) {
        const detail = JSON.parse(fs.readFileSync(path.join(root, line.lazySource), 'utf8'));
        await editor.locator('#route-filter').selectOption(line.id);
        await editor.waitForFunction(names => {
          const values = new Set([...document.querySelectorAll('#table input')].map(input => input.value));
          return names.every(name => values.has(name));
        }, detail.stationCatalog.map(station => station.ko));
        const result = {id:line.id, stations:detail.stationCatalog.length, status:'PASS'};
        report.franceEditor.push(result);
        if (line.category === 'commuter_rail') report.transilienEditor.push(result);
      }
      report.editor = 'PASS';
    }
    assert.deepEqual(report.errors, []);
    report.status = 'PASS';
  } catch (error) {
    report.error = error.stack;
    process.exitCode = 1;
  } finally {
    const name = nameOverrideTest ? (publicBase ? 'production-name-overrides.json' : 'name-overrides-gameplay.json') : uiOnly ? 'ui-gameplay.json' : requestedLines.length
      ? (publicBase ? 'production-focused-gameplay.json' : 'browser-focused-gameplay.json')
      : publicBase ? 'production-gameplay.json' : 'browser-gameplay.json';
    fs.writeFileSync(path.join(root, 'reports/fr', name), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({status:report.status, desktop:report.testedDirections.length,
      mobile:report.mobileDirections.length, freeDrive:report.freeDrive.length, error:report.error}));
    await browser.close();
    server.close();
  }
}

run().catch(error => {console.error(error); server.close(); process.exitCode = 1;});

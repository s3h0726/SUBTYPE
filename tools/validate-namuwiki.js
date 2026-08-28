#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  projectRoot,
  discoverLineFolders,
  loadStations,
  loadOperators,
  read,
  writeAtomic
} = require('./lib/line-workspaces');

const auditRoot = path.join(projectRoot, 'data', 'source-audit');
const baselineFile = path.join(auditRoot, 'NAMUWIKI_GATE_BASELINE.json');
const jsonReportFile = path.join(auditRoot, 'NAMUWIKI_MIGRATION_FINAL_REPORT.json');
const markdownReportFile = path.join(projectRoot, 'NAMUWIKI_MIGRATION_FINAL_REPORT.md');
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const japanesePattern = /[\u3040-\u30ff\u3400-\u9fff]/u;
const romajiPattern = /(?:eki|sen|line|railway|metro|[a-z]{3,})/iu;
const machinePattern = /(?:오오|우우|큐우|코우|토우|도우|테츠도우|센(?:$|\s))/u;

const folders = discoverLineFolders();
const stations = loadStations();
const operators = loadOperators();
const current = {
  operators: operators.size,
  lines: folders.length,
  stations: stations.map.size,
  relations: 0,
  routeOrder: {},
  geometry: {}
};

const operatorProblems = [];
const lineProblems = [];
const stationProblems = [];
const stationCodeProblems = [];
const companyLogoProblems = [];
const lineSymbolProblems = [];
const suspiciousKorean = [];

function isVerifiedNamuwiki(meta) {
  const method = meta?.method || meta?.verificationMethod;
  const methodEvidenceIsSufficient = method === 'direct'
    || method === 'manual'
    || method === 'namuwiki-manual'
    || ((method === 'search' || method === 'namuwiki-search-crosschecked')
      && meta?.crossVerified === true
      && !!meta?.identityEvidence?.url);
  return meta?.family === 'namuwiki'
    && methodEvidenceIsSufficient
    && meta?.verified === true
    && typeof meta?.url === 'string'
    && meta.url.length > 0;
}

function checkKorean(kind, id, value) {
  const text = String(value || '').trim();
  const reasons = [];
  if (!text) reasons.push('EMPTY');
  if (japanesePattern.test(text)) reasons.push('JAPANESE_CHARACTERS');
  if (romajiPattern.test(text)) reasons.push('ROMAJI_FRAGMENT');
  if (machinePattern.test(text)) reasons.push('SUSPICIOUS_MACHINE_TRANSLITERATION');
  if (reasons.length) suspiciousKorean.push({ kind, id, value: text, reasons });
}

for (const operator of operators.values()) {
  const source = operator.sources?.koreanName || {};
  if (!isVerifiedNamuwiki(source)) {
    operatorProblems.push({ id: operator.id, name: operator.names?.ko || '', reason: 'KOREAN_NAME_UNVERIFIED' });
  }
  checkKorean('operator', operator.id, operator.names?.ko);
  const logo = operator.logo || {};
  const asset = logo.asset && fs.existsSync(path.resolve(operator._folder, logo.asset));
  const identified = logo.identificationFamily === 'namuwiki'
    && ['direct', 'search'].includes(logo.identificationMethod)
    && logo.identificationVerified === true
    && !!logo.identificationUrl;
  const noOfficialLogo = logo.officialLogoExists === false && logo.existenceVerified === true;
  if (!(identified && ((asset && logo.licenseVerified === true) || noOfficialLogo))) {
    companyLogoProblems.push({ id: operator.id, reason: !identified ? 'IDENTIFICATION_UNVERIFIED' : 'ASSET_OR_LICENSE_UNVERIFIED' });
  }
}

for (const folder of folders) {
  const line = read(path.join(folder, 'line.json'));
  const relations = read(path.join(folder, 'stations.json'));
  const geometry = read(path.join(folder, 'geometry.json'));
  current.relations += relations.length;
  current.routeOrder[line.id] = hash(relations.map(item => [item.stationId, Number(item.order)]));
  current.geometry[line.id] = hash(geometry);

  const source = line.sources?.koreanName || {};
  if (!isVerifiedNamuwiki(source)) {
    lineProblems.push({ id: line.id, name: line.names?.ko || '', reason: 'KOREAN_NAME_UNVERIFIED' });
  }
  checkKorean('line', line.id, line.names?.ko);

  const symbol = line.symbol || {};
  const symbolAsset = symbol.asset && fs.existsSync(path.resolve(folder, symbol.asset));
  const symbolIdentified = symbol.identificationFamily === 'namuwiki'
    && ['direct', 'search'].includes(symbol.identificationMethod)
    && symbol.identificationVerified === true
    && !!symbol.identificationUrl;
  const verifiedAbsent = symbol.officialSymbolExists === false && symbol.existenceVerified === true;
  if (!(symbolIdentified && ((symbolAsset && symbol.licenseVerified === true) || verifiedAbsent))) {
    lineSymbolProblems.push({ id: line.id, reason: !symbolIdentified ? 'IDENTIFICATION_UNVERIFIED' : 'ASSET_OR_LICENSE_UNVERIFIED' });
  }

  for (const relation of relations) {
    const codeSource = relation.stationCodeSource || {};
    const verifiedCode = relation.hasOfficialStationCode === true
      && !!relation.stationCode
      && codeSource.verified === true
      && !!codeSource.url;
    const verifiedNoCode = relation.hasOfficialStationCode === false
      && codeSource.status === 'NO_OFFICIAL_CODE'
      && codeSource.verified === true
      && !!codeSource.url;
    if (!(verifiedCode || verifiedNoCode)) {
      stationCodeProblems.push({ lineId: line.id, stationId: relation.stationId, reason: 'STATION_CODE_STATUS_UNVERIFIED' });
    }
  }
}

for (const station of stations.map.values()) {
  const meta = {
    family: station.koSourceFamily,
    method: station.koSourceMethod,
    verified: station.koVerified,
    url: station.koSourceUrl
  };
  if (!isVerifiedNamuwiki(meta) || station.koReviewStatus !== 'VERIFIED') {
    stationProblems.push({ id: station.id, name: station.names?.ko || '', reason: 'KOREAN_NAME_UNVERIFIED' });
  }
  checkKorean('station', station.id, station.names?.ko);
}

if (!fs.existsSync(baselineFile)) {
  writeAtomic(baselineFile, {
    schemaVersion: 1,
    created: new Date().toISOString(),
    purpose: 'Immutable route/geometry preservation baseline for Namuwiki-only migration',
    counts: {
      operators: current.operators,
      lines: current.lines,
      stations: current.stations,
      relations: current.relations
    },
    routeOrder: current.routeOrder,
    geometry: current.geometry
  });
}

const baseline = read(baselineFile);
const countChanges = Object.entries(baseline.counts).filter(([key, value]) => current[key] !== value)
  .map(([key, value]) => ({ key, before: value, after: current[key] }));
const routeOrderChanges = Object.keys(baseline.routeOrder).filter(id => baseline.routeOrder[id] !== current.routeOrder[id]);
const geometryChanges = Object.keys(baseline.geometry).filter(id => baseline.geometry[id] !== current.geometry[id]);

const totals = {
  operators: current.operators,
  lines: current.lines,
  stations: current.stations,
  stationCodes: current.relations
};
const verified = {
  operators: totals.operators - operatorProblems.length,
  lines: totals.lines - lineProblems.length,
  stations: totals.stations - stationProblems.length,
  stationCodes: totals.stationCodes - stationCodeProblems.length
};
const reviewRequired = operatorProblems.length + lineProblems.length + stationProblems.length;
const pass = reviewRequired === 0
  && companyLogoProblems.length === 0
  && lineSymbolProblems.length === 0
  && stationCodeProblems.length === 0
  && suspiciousKorean.length === 0
  && countChanges.length === 0
  && routeOrderChanges.length === 0
  && geometryChanges.length === 0;

const report = {
  schemaVersion: 1,
  generated: new Date().toISOString(),
  status: pass ? 'PASS' : 'DEVELOPMENT_BLOCKED',
  canonicalKoreanSource: 'namuwiki',
  totals,
  verified,
  unresolved: {
    operators: operatorProblems.length,
    lines: lineProblems.length,
    stations: stationProblems.length,
    stationCodes: stationCodeProblems.length,
    companyLogos: companyLogoProblems.length,
    lineSymbols: lineSymbolProblems.length,
    suspiciousKoreanNames: suspiciousKorean.length
  },
  preservation: {
    countChanges,
    routeOrderChanges,
    geometryChanges,
    unexplainedDataLoss: countChanges.filter(item => item.after < item.before).length
  },
  reviewRequired,
  problems: {
    operators: operatorProblems,
    lines: lineProblems,
    stations: stationProblems,
    stationCodes: stationCodeProblems,
    companyLogos: companyLogoProblems,
    lineSymbols: lineSymbolProblems,
    suspiciousKorean
  }
};
writeAtomic(jsonReportFile, report);

const markdown = `# NAMUWIKI MIGRATION FINAL REPORT

Status: **${report.status}**

| Item | Verified | Total | Unresolved |
|---|---:|---:|---:|
| Operators | ${verified.operators} | ${totals.operators} | ${operatorProblems.length} |
| Lines | ${verified.lines} | ${totals.lines} | ${lineProblems.length} |
| Stations | ${verified.stations} | ${totals.stations} | ${stationProblems.length} |
| Station codes | ${verified.stationCodes} | ${totals.stationCodes} | ${stationCodeProblems.length} |

- Company logos unresolved: ${companyLogoProblems.length}
- Line symbols unresolved: ${lineSymbolProblems.length}
- Suspicious Korean names: ${suspiciousKorean.length}
- Review required: ${reviewRequired}
- Count changes: ${countChanges.length}
- Route order changes: ${routeOrderChanges.length}
- Geometry changes: ${geometryChanges.length}
- Unexplained data loss: ${report.preservation.unexplainedDataLoss}

${pass ? 'NAMUWIKI DATA GATE PASS.' : 'NAMUWIKI DATA MIGRATION IS NOT COMPLETE.\n\nDEVELOPMENT REMAINS BLOCKED.'}
`;
fs.writeFileSync(markdownReportFile, markdown, 'utf8');

console.log(`NAMUWIKI DATA GATE ${pass ? 'PASS' : 'FAILED'}`);
console.log(`Operators: ${verified.operators}/${totals.operators}`);
console.log(`Lines: ${verified.lines}/${totals.lines}`);
console.log(`Stations: ${verified.stations}/${totals.stations}`);
console.log(`Station codes: ${verified.stationCodes}/${totals.stationCodes}`);
console.log(`Company logos unresolved: ${companyLogoProblems.length}`);
console.log(`Line symbols unresolved: ${lineSymbolProblems.length}`);
console.log(`Review required: ${reviewRequired}`);
if (!pass) {
  console.error('DEVELOPMENT BLOCKED');
  process.exit(1);
}

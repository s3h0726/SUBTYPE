#!/usr/bin/env node
'use strict';
// Route and service blurbs were intentionally removed. Prevent their accidental return.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('js/app.js'),bundle=read('js/app.bundle.js'),css=read('css/service-picker-rebuild.css'),builder=read('tools/build-app-bundle.js');
const generatedBlurbs=[
 'describeRoute(', 'describeOperatingPattern(', 'describeOperatingJourney(',
 'line-card-description', 'selected-line-description', 'line-branch-description',
 'setup-line-description', 'operating-pattern-description', 'journey-card-description',
 'operating-selected-description'
];
for(const file of [['source',app],['bundle',bundle],['CSS',css]]){
 for(const blurb of generatedBlurbs)assert(!file[1].includes(blurb),file[0]+': obsolete blurb still shown: '+blurb);
}
assert(!builder.includes('"route-service-descriptions.js"'),'Description generator still bundled');
assert(!fs.existsSync(path.join(root,'js/route-service-descriptions.js')),'Unneeded description generator not removed');
for(const required of [
 'function routeCard(r)', 'function renderSelected()', 'function openSetup(route)',
 'function configureJourneyPicker(', 'function hongKongRouteCards(', 'function renderRoutes()',
 "countryId==='hk'?hongKongRouteCards(visible)",
 "const hkLine=e.target.closest('[data-hk-line-family]')",
 "const hkTram=e.target.closest('[data-hk-tram-family]')"
])assert(app.includes(required),'Preserve route selection/setup functionality: '+required);
assert(bundle.includes("countryId==='hk'?hongKongRouteCards(visible)"),'Hong Kong cards missing from actual browser bundle');
assert(app.includes('operatingPatternLabel(choice)'),'Operating service type names must remain');
assert(app.includes('operatingDirectionLabel(choice)'),'Direction labels must remain');
assert(app.includes('display(choice.originNames)'),'Origin station search must remain');
assert(app.includes('display(choice.destinationNames)'),'Destination station search must remain');
console.log('PASS: route and operating-service blurbs removed in source, bundle and styles; country pickers and journeys retained.');

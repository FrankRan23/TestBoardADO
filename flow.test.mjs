import assert from 'node:assert/strict';
import {flowMetrics,percentile,forecast,category} from './src/flow.js';
const now=Date.parse('2026-09-28T12:00:00Z');
const item={id:1,historyComplete:true,history:[{at:'2026-09-01',state:'New'},{at:'2026-09-03',state:'Active'},{at:'2026-09-05',state:'Active',blocked:true},{at:'2026-09-06',state:'Closed'}]};
let m=flowMetrics([item, {id:2,state:'Closed'}],now,30);
assert.equal(m.coverage,1);assert.equal(m.cycles[0].days,3);assert.equal(m.p85,3);assert.equal(m.blockedDays,1);assert.equal(m.efficiency,2/3);assert.equal(m.daily.reduce((s,r)=>s+r.Entregados,0),1);
assert.equal(category('Removed'),'removed');assert.equal(percentile([1,2,3,4],.85),3.55);assert.equal(forecast(m.daily,0,now),null);assert.equal(forecast(m.daily.map(r=>({...r,Entregados:0})),1,now),null);
const reopened={...item,history:[...item.history,{at:'2026-09-20',state:'Active'}]};m=flowMetrics([reopened],now,30);assert.equal(m.cycles.length,0);assert.equal(m.aging[0].days,25.5);
const daily=m.daily.map(r=>({...r,Entregados:1}));const prediction=forecast(daily,14,now,100,()=>.5);assert.equal(prediction.percentiles[1].weeks,2);
console.log('Flow metrics: history, missing data, reopen, percentiles, zero weeks and forecast passed.');

const {readFileSync}=await import('node:fs');
const demo=JSON.parse(readFileSync(new URL('./public/data/demo.json',import.meta.url),'utf8'));
const dm=flowMetrics(demo.items,Date.parse(demo.generatedAt),90);
assert.equal(dm.coverage,72);assert.ok(dm.cycles.length>0);assert.ok(dm.aging.length>0);assert.ok(dm.blockedDays>0);assert.ok(forecast(dm.daily,30,Date.parse(demo.generatedAt)));
console.log('Demo fixture: all 72 histories and chart/forecast data verified.');

const editedClosed={...item,history:[...item.history,{at:'2026-09-25',state:'Closed'}]};
const edited=flowMetrics([editedClosed],now,30);
assert.equal(edited.cycles[0].days,3);
assert.equal(edited.cycles[0].date,'2026-09-06');
assert.equal(forecast([],10,now),null);
assert.equal(forecast(daily,100001,now),null);
console.log('Regression: edits after closure preserve cycle and delivery date; invalid forecast inputs rejected.');

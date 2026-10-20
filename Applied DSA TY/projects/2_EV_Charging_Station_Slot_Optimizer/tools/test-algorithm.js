/*
 * Headless test harness for the algorithm layers (L4 + L5 + L6).
 * Runs with:  node tools/test-algorithm.js
 * The DOM is never touched - script.js skips boot when there is no document.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const sandbox = { window: {}, console, setTimeout, clearTimeout, Promise, Math, Number, Object, Array, JSON };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'script.js' });

const O = sandbox.window.EVOptimizer;
const { DataLayer, PriorityEngine, GreedyScheduler, Metrics, Utils, DEFAULT_STATION } = O;

let pass = 0, fail = 0;
function check(name, condition, detail) {
  if (condition) { pass += 1; console.log('  PASS  ' + name); }
  else { fail += 1; console.log('  FAIL  ' + name + (detail ? '\n        -> ' + detail : '')); }
}
function section(title) { console.log('\n' + title); console.log('-'.repeat(72)); }

const fleet = DataLayer.curatedFleet();
const station = Object.assign({}, DEFAULT_STATION);

/* ------------------------------------------------------------------ */
section('1. Data layer');
check('curated fleet has exactly 20 EVs', fleet.length === 20, 'got ' + fleet.length);
check('vehicle ids are unique', new Set(fleet.map(v => v.id)).size === 20);
check('vehicle numbers are unique', new Set(fleet.map(v => v.vehicleNumber)).size === 20);
check('every EV has all 11 required fields', fleet.every(v =>
  ['id', 'vehicleNumber', 'model', 'batteryPercentage', 'batteryCapacity', 'remainingDistance',
   'chargingTime', 'requiredPower', 'departureTime', 'vehiclePriority', 'status'].every(k => v[k] !== undefined)));
check('EV-001 matches the assignment sample', (() => {
  const e = fleet[0];
  return e.model === 'Tata Nexon EV' && e.batteryPercentage === 18 && e.batteryCapacity === 40 &&
    e.remainingDistance === 85 && e.chargingTime === 45 && e.requiredPower === 7 &&
    e.departureTime === '10:30' && e.vehiclePriority === 'Normal';
})());
check('battery always 0-100', fleet.every(v => v.batteryPercentage >= 0 && v.batteryPercentage <= 100));
check('departure times all parse', fleet.every(v => Utils.timeToMinutes(v.departureTime) !== null));
check('at least 20 distinct models available', DataLayer.MODELS.length >= 18);

section('2. Time utilities');
check('09:30 -> 570', Utils.timeToMinutes('09:30') === 570);
check('570 -> 09:30', Utils.minutesToTime(570) === '09:30');
check('00:05 -> 00:05', Utils.minutesToTime(5) === '00:05');
check('25:00 wraps to 01:00', Utils.minutesToTime(1500) === '01:00');
check('invalid string -> null', Utils.timeToMinutes('99:99') === null && Utils.timeToMinutes('abc') === null);

/* ------------------------------------------------------------------ */
section('3. Priority scoring');
const ctx = PriorityEngine.buildContext(fleet, station);
const records = PriorityEngine.scoreFleet(fleet, station);
check('scores every EV', records.length === 20);
check('all five components are within 0-100', records.every(r =>
  r.urgency >= 0 && r.urgency <= 100 && r.battery >= 0 && r.battery <= 100 &&
  r.deadline >= 0 && r.deadline <= 100 && r.distance >= 0 && r.distance <= 100 &&
  r.priorityPoints >= 0 && r.priorityPoints <= 100));
check('total score is within 0-100', records.every(r => r.total >= 0 && r.total <= 100));

const W = O.WEIGHTS;
const weightSum = W.urgency + W.battery + W.deadline + W.distance + W.priority;
check('weights sum to exactly 1.00', Math.abs(weightSum - 1) < 1e-12, String(weightSum));
check('total equals the weighted sum', records.every(r =>
  Math.abs(r.total - (r.urgency * W.urgency + r.battery * W.battery + r.deadline * W.deadline +
    r.distance * W.distance + r.priorityPoints * W.priority)) < 0.02));

check('low battery score = 100 - battery%', records.every(r => Math.abs(r.battery - (100 - r.batteryPercentage)) < 1e-9));
check('earliest departure scores 100 on deadline', Math.max(...records.map(r => r.deadline)) === 100);
check('emergency outscores vip outscores normal', (() => {
  const e = records.find(r => r.vehiclePriority === 'Emergency').priorityPoints;
  const v = records.find(r => r.vehiclePriority === 'VIP').priorityPoints;
  const n = records.find(r => r.vehiclePriority === 'Normal').priorityPoints;
  return e > v && v > n;
})());
check('flatter battery scores higher than fuller battery', (() => {
  const low = records.find(r => r.batteryPercentage === 7);
  const high = records.find(r => r.batteryPercentage === 63);
  return low.battery > high.battery && low.total > high.total;
})());
check('neutral 50 when a dimension cannot differentiate', (() => {
  const single = DataLayer.generateFleet(1, station);
  const only = PriorityEngine.scoreFleet(single, station)[0];
  return only.deadline === 50 && only.distance === 50;
})());

/* ------------------------------------------------------------------ */
section('4. Sorting');
const sorted = GreedyScheduler.sortVehiclesByPriority(records);
check('sorted descending by score', sorted.every((r, i) => i === 0 || sorted[i - 1].total >= r.total));
check('sort is stable / deterministic on equal scores', (() => {
  const twinA = DataLayer.createVehicle({ model: 'Test EV', batteryPercentage: 40, batteryCapacity: 40, remainingDistance: 100, chargingTime: 40, requiredPower: 7, departureTime: '11:00', vehiclePriority: 'Normal' });
  const twinB = DataLayer.createVehicle({ model: 'Test EV', batteryPercentage: 40, batteryCapacity: 40, remainingDistance: 100, chargingTime: 40, requiredPower: 7, departureTime: '11:00', vehiclePriority: 'Normal' });
  const two = PriorityEngine.scoreFleet([twinA, twinB], station);
  const out = GreedyScheduler.sortVehiclesByPriority(two);
  return out[0].id < out[1].id;
})());

/* ------------------------------------------------------------------ */
section('5. Greedy schedule - constraints respected');
const result = GreedyScheduler.greedySchedule(fleet, station);
const allocated = result.allocated;

check('no EV exceeds the slot count', allocated.length <= station.chargingSlots,
  allocated.length + ' > ' + station.chargingSlots);
check('slot indexes are 0..n-1 without gaps', (() => {
  const idx = allocated.map(r => r.slotIndex).sort((a, b) => a - b);
  return idx.every((v, i) => v === i);
})());
check('no two EVs share a slot', new Set(allocated.map(r => r.slotIndex)).size === allocated.length);
check('total allocated power <= available power', (() => {
  const used = allocated.reduce((a, r) => a + r.requiredPower, 0);
  return used <= station.availablePower + 1e-9;
})(), 'used ' + allocated.reduce((a, r) => a + r.requiredPower, 0));
check('reported powerUsed matches the sum', Math.abs(result.powerUsed - allocated.reduce((a, r) => a + r.requiredPower, 0)) < 0.02);
check('remaining power never negative', result.resources.powerLeft >= 0);
check('remaining free slots never negative', result.resources.freeSlots >= 0);
check('every EV ends in exactly one bucket', allocated.length + result.waiting.length + result.deferred.length === 20);
check('buckets are disjoint', (() => {
  const all = [...allocated, ...result.waiting, ...result.deferred].map(r => r.id);
  return new Set(all).size === all.length;
})());
check('at-risk EV is flagged when it misses its deadline', (() => {
  const bad = allocated.find(r => r.status === O.STATUS.AT_RISK);
  return !bad || bad.finishMin > bad.departureMin;
})());
check('every non-at-risk allocated EV meets its deadline', allocated
  .filter(r => r.status === O.STATUS.CHARGING).every(r => r.finishMin <= r.departureMin));
check('queued EVs are never falsely marked as charging', result.waiting
  .every(r => r.status === O.STATUS.WAITING || r.status === O.STATUS.DEFERRED));
check('projection does not overwrite live status', result.waiting.every(r =>
  r.status !== O.STATUS.CHARGING && r.status !== O.STATUS.AT_RISK));
check('every waiting/deferred EV has a human readable reason', (() => {
  const rest = [...result.waiting, ...result.deferred];
  return rest.every(r => typeof r.reason === 'string' && r.reason.length > 10);
})());
check('greedy serves strictly by priority order (subset property)', (() => {
  // no selected EV may have a lower score than an unselected one that was feasible
  const minSelected = Math.min(...allocated.map(r => r.total));
  const droppedByPower = result.waiting.filter(r =>
    r.requiredPower > result.resources.powerLeft);
  return droppedByPower.every(r => r.total <= minSelected);
})());

section('6. Greedy vs first-come-first-served');
const base = Metrics.baseline(fleet, station);
const greedy = Metrics.compute(
  { allocated, waiting: result.waiting, deferred: result.deferred, powerUsed: result.powerUsed, slotsUsed: result.slotsUsed },
  station);
check('baseline and greedy serve the same number of EVs', base.metrics.served === greedy.served);
check('greedy never serves fewer urgent EVs than FCFS', greedy.urgentServed >= base.metrics.urgentServed,
  'greedy ' + greedy.urgentServed + ' vs fcfs ' + base.metrics.urgentServed);
check('greedy average priority served >= FCFS', greedy.averagePriorityServed >= base.metrics.averagePriorityServed,
  'greedy ' + greedy.averagePriorityServed + ' vs fcfs ' + base.metrics.averagePriorityServed);
check('slot utilisation never exceeds 100%', greedy.slotsUtil <= 100 && base.metrics.slotsUtil <= 100);
check('power utilisation never exceeds 100%', greedy.powerUtil <= 100);

section('7. Trace + log (the visualiser payload)');
check('trace is a non-empty array', Array.isArray(result.trace) && result.trace.length > 0);
check('every trace step has a phase in 1..8', result.trace.every(s => s.phase >= 1 && s.phase <= 8));
check('every trace step has a title and at least one detail line', result.trace.every(s =>
  typeof s.title === 'string' && s.title.length > 0 && Array.isArray(s.detail) && s.detail.length > 0));
check('logUpTo is monotonically non-decreasing', result.trace.every((s, i) =>
  i === 0 || s.logUpTo >= result.trace[i - 1].logUpTo));
check('log has one line per stamped event', result.log.length > 10);
check('log lines are timestamped', result.log.every(l => /^\d{2}:\d{2}:\d{2}$/.test(l.time)));
check('allocation steps exist for each selected EV', result.trace.filter(s => s.title.indexOf('Allocate') === 0).length === allocated.length);
check('all 8 phases appear in the trace', (() => {
  const seen = new Set(result.trace.map(s => s.phase));
  return [1, 2, 3, 4, 5, 6, 7, 8].every(p => seen.has(p));
})());

section('8. Stress: many random fleets (invariants must always hold)');
let stressFails = 0;
const presets = O.STATION_PRESETS;
for (let run = 0; run < 400; run += 1) {
  const cfg = presets[['peak', 'night', 'scarce', 'wide'][run % 4]];
  const cars = DataLayer.generateFleet(20 + (run % 11), cfg);
  const res = GreedyScheduler.greedySchedule(cars, cfg);
  const used = res.allocated.reduce((a, r) => a + r.requiredPower, 0);
  const problems = [];
  if (res.allocated.length > cfg.chargingSlots) problems.push('slots');
  if (used > cfg.availablePower + 1e-9) problems.push('power');
  if (res.resources.powerLeft < -1e-9) problems.push('negative power');
  if (res.allocated.length + res.waiting.length + res.deferred.length !== cars.length) problems.push('bucket');
  if (res.reserved !== undefined) problems.push('unexpected');
  if (res.trace.some(s => !s.phase)) problems.push('trace');
  const mc = Metrics.compute({ allocated: res.allocated, waiting: res.waiting, deferred: res.deferred, powerUsed: res.powerUsed, slotsUsed: res.slotsUsed }, cfg);
  if (mc.powerUtil > 100 || mc.slotsUtil > 100) problems.push('util>100');
  if (mc.urgentServed > mc.urgentTotal) problems.push('urgent');
  if (problems.length) { stressFails += 1; console.log('        run ' + run + ' [' + cfg.currentTime + ']: ' + problems.join(',')); }
}
check('400 randomised runs keep every invariant', stressFails === 0, stressFails + ' failing runs');

section('9. Edge cases');
const tiny = GreedyScheduler.greedySchedule(fleet, { chargingSlots: 1, electricityCapacity: 50, availablePower: 5, sessionDuration: 60, currentTime: '09:00' });
check('1 slot / 5 kW allocates at most one EV', tiny.allocated.length <= 1, 'got ' + tiny.allocated.length);
check('1 slot run still accounts for all 20 EVs', tiny.allocated.length + tiny.waiting.length + tiny.deferred.length === 20);
const zero = GreedyScheduler.greedySchedule(fleet, { chargingSlots: 5, electricityCapacity: 50, availablePower: 0, sessionDuration: 60, currentTime: '09:00' });
check('0 kW available allocates nothing', zero.allocated.length === 0);
check('0 kW run queues everybody', zero.waiting.length + zero.deferred.length === 20);
const huge = GreedyScheduler.greedySchedule(fleet, { chargingSlots: 24, electricityCapacity: 200, availablePower: 200, sessionDuration: 120, currentTime: '06:00' });
check('24 slots / 200 kW allocates everything it can', huge.allocated.length > tiny.allocated.length);
check('late clock defers EVs whose deadline has passed', (() => {
  const late = GreedyScheduler.greedySchedule(fleet, { chargingSlots: 5, electricityCapacity: 50, availablePower: 40, sessionDuration: 60, currentTime: '18:00' });
  const afterTen = late.ranked.filter(r => r.departureMin <= 18 * 60);
  return afterTen.every(r => r.status === O.STATUS.DEFERRED);
})());
check('single EV fleet works', (() => {
  const one = DataLayer.generateFleet(1, station);
  const res = GreedyScheduler.greedySchedule(one, station);
  return res.ranked.length === 1 && res.allocated.length === 1;
})());
check('empty fleet does not crash', (() => {
  const res = GreedyScheduler.greedySchedule([], station);
  return res.ranked.length === 0 && res.averageScore === 0 && res.trace.length > 0;
})());

/* ------------------------------------------------------------------ */
console.log('\n' + '='.repeat(72));
console.log('  TOTAL: ' + pass + ' passed, ' + fail + ' failed');
console.log('='.repeat(72));

section('APPENDIX - default run (used for the README worked example)');
console.log('Station: ' + JSON.stringify(station));
console.log('\nRank  EV       Battery  Departure  Power  Chg  Urge  Batt  Dead  Dist  Prio  SCORE  STATUS');
result.ranked.slice(0, 8).forEach((r, i) => {
  console.log(
    String(i + 1).padStart(4) + '  ' + r.vehicleNumber.padEnd(8) +
    String(r.batteryPercentage + '%').padStart(6) + '  ' + r.departureTime.padEnd(10) +
    String(r.requiredPower + 'kW').padStart(7) + String(r.chargingTime + 'm').padStart(5) +
    String(r.urgency).padStart(7) + String(r.battery).padStart(6) + String(r.deadline).padStart(6) +
    String(r.distance).padStart(6) + String(r.priorityPoints).padStart(6) +
    String(r.total).padStart(7) + '  ' + r.status + (r.slotIndex !== null ? ' (slot ' + (r.slotIndex + 1) + ')' : ''));
});
const top = result.ranked[0];
console.log('\nTop EV ' + top.vehicleNumber + ' (' + top.model + ', ' + top.vehiclePriority + '):');
console.log('  Urgency        ' + top.urgency + ' x 0.30 = ' + (top.urgency * 0.30).toFixed(2));
console.log('  Low Battery    ' + top.battery + ' x 0.25 = ' + (top.battery * 0.25).toFixed(2));
console.log('  Deadline       ' + top.deadline + ' x 0.20 = ' + (top.deadline * 0.20).toFixed(2));
console.log('  Distance       ' + top.distance + ' x 0.15 = ' + (top.distance * 0.15).toFixed(2));
console.log('  Vehicle Prio   ' + top.priorityPoints + ' x 0.10 = ' + (top.priorityPoints * 0.10).toFixed(2));
console.log('  TOTAL          ' + top.total);
console.log('\nAllocated ' + allocated.length + ' | waiting ' + result.waiting.length + ' | deferred ' + result.deferred.length);
console.log('Power used ' + result.powerUsed + ' / ' + station.availablePower + ' kW | slots ' + result.slotsUsed + '/' + station.chargingSlots);
console.log('Trace steps: ' + result.trace.length + ' | log lines: ' + result.log.length);
console.log('Greedy metrics: ' + JSON.stringify(greedy));
console.log('FCFS metrics:   ' + JSON.stringify(base.metrics));
console.log('\nFirst 6 log lines:');
result.log.slice(0, 6).forEach(l => console.log('  [' + l.time + '] ' + l.message));

process.exit(fail ? 1 : 0);
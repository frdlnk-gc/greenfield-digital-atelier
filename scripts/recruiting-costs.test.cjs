const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../assets/js/recruiting-costs.js');
const costs = { agency: '2000', media: '1000', production: '0', hours: '10', rate: '50', qualified: '10', interviews: '5', hires: '1' };
test('combines external spend and internal time, then divides by actual outcomes', () => {
  const r = calculate(costs);
  assert.equal(r.external, 3000); assert.equal(r.internal, 500); assert.equal(r.total, 3500);
  assert.deepEqual(r.unit, { qualified: 350, interviews: 700, hires: 3500 });
});
test('missing and zero outcomes never become free conversions or Infinity', () => {
  const r = calculate({ ...costs, qualified: '', interviews: '0', hires: '0' });
  assert.equal(r.values.qualified, null); assert.deepEqual(r.unit, { qualified: null, interviews: null, hires: null });
});
test('missing spend is not silently treated as zero', () => {
  assert.ok(calculate({ ...costs, agency: '' }).errors.includes('agency'));
  assert.equal(calculate({ ...costs, agency: '0' }).external, 1000);
});
test('rejects negative, nonfinite, excessive and fractional outcome entries', () => {
  for (const value of ['-1', 'Infinity', 'NaN', '1e20']) assert.ok(calculate({ ...costs, media: value }).errors.includes('media'));
  assert.ok(calculate({ ...costs, hires: '0.5' }).errors.includes('hires'));
});
test('rejects impossible funnel counts even when intermediate stages are blank', () => {
  assert.ok(calculate({ ...costs, qualified: '2', interviews: '', hires: '3' }).errors.includes('hires'));
  assert.ok(calculate({ ...costs, interviews: '11' }).errors.includes('interviews'));
  assert.ok(calculate({ ...costs, qualified: '0', interviews: '0', hires: '1' }).errors.includes('hires'));
});
test('handles all-zero spend and fractional hours without inventing results', () => {
  const r = calculate({ ...costs, agency: '0', media: '0', production: '0', hours: '0', rate: '0' });
  assert.equal(r.total, 0); assert.equal(r.unit.hires, 0);
  assert.equal(calculate({ ...costs, hours: '0.25' }).internal, 12.5);
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateEnergyIntensity,
  calculateRenewableShare,
  calculateWaterRecycleRate,
  calculateWasteDiversionRate,
  calculateEmissionAmount,
  calculateEmissionIntensity,
  calculateTrendPercent
} = require('../services/calculationService');

describe('Calculation Engine & Boundary Safeguards', () => {
  it('calculates emission intensity correctly with normal values', () => {
    const res = calculateEmissionIntensity(958.0, 16200);
    assert.equal(res.isAvailable, true);
    assert.equal(res.value, 0.0591);
  });

  it('safely handles zero or missing production denominator (PR-11, FR-034)', () => {
    const resZero = calculateEmissionIntensity(958.0, 0);
    assert.equal(resZero.isAvailable, false);
    assert.equal(resZero.value, null);
    assert.match(resZero.reason, /Zero or missing production denominator/);

    const resNull = calculateEmissionIntensity(958.0, null);
    assert.equal(resNull.isAvailable, false);
    assert.equal(resNull.value, null);
  });

  it('calculates renewable power share correctly with zero total guard', () => {
    const normal = calculateRenewableShare(1800, 2400);
    assert.equal(normal.isAvailable, true);
    assert.equal(normal.value, 75.0);

    const zero = calculateRenewableShare(100, 0);
    assert.equal(zero.isAvailable, false);
    assert.equal(zero.value, 0);
  });

  it('calculates water recycle rate with boundary guards', () => {
    const normal = calculateWaterRecycleRate(19500, 28000);
    assert.equal(normal.isAvailable, true);
    assert.equal(normal.value, 69.6);

    const zero = calculateWaterRecycleRate(500, 0);
    assert.equal(zero.isAvailable, false);
    assert.equal(zero.value, 0);
  });

  it('calculates waste diversion rate with zero generation guard', () => {
    const normal = calculateWasteDiversionRate(165, 180);
    assert.equal(normal.isAvailable, true);
    assert.equal(normal.value, 91.7);

    const zero = calculateWasteDiversionRate(0, 0);
    assert.equal(zero.isAvailable, false);
    assert.equal(zero.value, 0);
  });

  it('calculates emissions from activity data and emission factors (PR-10)', () => {
    const electricityMWh = 2850; // MWh
    const factorKgPerKWh = 0.385; // kg CO2e / kWh
    // 2850 MWh = 2,850,000 kWh * 0.385 kg = 1,097,250 kg = 1097.25 metric tons
    const emissionsKg = calculateEmissionAmount(electricityMWh * 1000, factorKgPerKWh);
    const emissionsTons = +(emissionsKg / 1000).toFixed(2);
    assert.equal(emissionsTons, 1097.25);
  });

  it('calculates trend percentages and surfaces unavailable baseline explicitly (PR-11)', () => {
    const upTrend = calculateTrendPercent(110, 100);
    assert.equal(upTrend.isAvailable, true);
    assert.equal(upTrend.percent, 10.0);

    const downTrend = calculateTrendPercent(80, 100);
    assert.equal(downTrend.isAvailable, true);
    assert.equal(downTrend.percent, -20.0);

    const zeroBaseline = calculateTrendPercent(50, 0);
    assert.equal(zeroBaseline.isAvailable, false);
    assert.equal(zeroBaseline.percent, null);

    const missingBaseline = calculateTrendPercent(50, null);
    assert.equal(missingBaseline.isAvailable, false);
    assert.equal(missingBaseline.percent, null);
  });
});

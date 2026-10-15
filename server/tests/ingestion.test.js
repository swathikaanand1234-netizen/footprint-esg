const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateFreshness, validateReadingPayload } = require('../services/ingestionService');

describe('Telemetry Ingestion & Freshness Engine', () => {
  it('evaluates freshness boundaries accurately (PR-04, FR-015)', () => {
    const now = 1700000000000;

    // 2 minutes old -> LIVE (<5 min)
    const twoMinOld = new Date(now - 2 * 60 * 1000).toISOString();
    assert.equal(evaluateFreshness(twoMinOld, now), 'LIVE');

    // Exactly 5 minutes -> DELAYED
    const fiveMinOld = new Date(now - 5 * 60 * 1000).toISOString();
    assert.equal(evaluateFreshness(fiveMinOld, now), 'DELAYED');

    // 10 minutes old -> DELAYED (5-15 min)
    const tenMinOld = new Date(now - 10 * 60 * 1000).toISOString();
    assert.equal(evaluateFreshness(tenMinOld, now), 'DELAYED');

    // 15 minutes 1 sec old -> STALE (>15 min)
    const staleTime = new Date(now - (15 * 60 * 1000 + 1000)).toISOString();
    assert.equal(evaluateFreshness(staleTime, now), 'STALE');

    // Malformed timestamp -> STALE
    assert.equal(evaluateFreshness('invalid-date', now), 'STALE');
  });

  it('accepts valid telemetry reading payload', () => {
    const validReading = {
      sourceId: 'SRC-ATX-POWER-01',
      facilityId: 'FAC-ATX-01',
      metric: 'ELECTRICITY_KW',
      value: 3840.5,
      unit: 'kW',
      timestamp: new Date().toISOString(),
      quality: 'GOOD'
    };
    const res = validateReadingPayload(validReading);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  it('rejects invalid reading payloads and bad quality (FR-011)', () => {
    // Negative value
    const negativeReading = {
      sourceId: 'SRC-ATX-POWER-01',
      facilityId: 'FAC-ATX-01',
      metric: 'ELECTRICITY_KW',
      value: -50,
      unit: 'kW',
      timestamp: new Date().toISOString()
    };
    const resNeg = validateReadingPayload(negativeReading);
    assert.equal(resNeg.valid, false);
    assert.match(resNeg.errors.join(','), /cannot be negative/);

    // BAD quality reading
    const badQuality = {
      sourceId: 'SRC-ATX-POWER-01',
      facilityId: 'FAC-ATX-01',
      metric: 'ELECTRICITY_KW',
      value: 1200,
      unit: 'kW',
      timestamp: new Date().toISOString(),
      quality: 'BAD'
    };
    const resBad = validateReadingPayload(badQuality);
    assert.equal(resBad.valid, false);
    assert.match(resBad.errors.join(','), /quality is flagged as BAD/);

    // Missing metric and unit
    const incomplete = {
      sourceId: 'SRC-01',
      facilityId: 'FAC-01',
      value: 100,
      timestamp: new Date().toISOString()
    };
    const resInc = validateReadingPayload(incomplete);
    assert.equal(resInc.valid, false);
    assert.ok(resInc.errors.length >= 2);
  });
});

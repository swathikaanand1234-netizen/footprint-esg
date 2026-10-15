const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv, processBatchImport } = require('../services/csvImportService');

describe('CSV Batch Import & Row Validation', () => {
  const validCsv = `facilityId,reportingPeriod,productionOutputTons,scope1EmissionsTons,scope2EmissionsTons,electricityConsumptionMWh,renewableElectricityMWh,naturalGasMMBtu,waterWithdrawalM3,waterRecycledM3,wasteGeneratedTons,wasteDivertedTons
FAC-ATX-01,2026-09,15000,210.0,650.0,2400.0,1800.0,4100,28000,19500,180.0,165.0
FAC-STR-02,2026-09,11500,105.0,320.0,1800.0,1600.0,2100,17000,13500,130.0,125.0`;

  it('parses valid CSV correctly into records', () => {
    const res = processBatchImport(validCsv, 'ALL_OR_NOTHING');
    assert.equal(res.success, true);
    assert.equal(res.committed, true);
    assert.equal(res.totalRows, 2);
    assert.equal(res.validRecords.length, 2);
    assert.equal(res.errors.length, 0);
    assert.equal(res.validRecords[0].facilityId, 'FAC-ATX-01');
    assert.equal(res.validRecords[0].totalEmissionsTons, 860.0);
  });

  it('rejects CSV missing required columns', () => {
    const badHeaderCsv = `facilityId,reportingPeriod,productionOutputTons\nFAC-ATX-01,2026-09,15000`;
    assert.throws(() => {
      parseCsv(badHeaderCsv);
    }, /missing required header columns/);
  });

  it('detects row-level semantic errors and enforces ALL_OR_NOTHING policy (PR-09)', () => {
    // Row 2 has renewable (2000) > total electricity (1500)
    const invalidRowCsv = `facilityId,reportingPeriod,productionOutputTons,scope1EmissionsTons,scope2EmissionsTons,electricityConsumptionMWh,renewableElectricityMWh,naturalGasMMBtu,waterWithdrawalM3,waterRecycledM3,wasteGeneratedTons,wasteDivertedTons
FAC-ATX-01,2026-09,15000,210.0,650.0,2400.0,1800.0,4100,28000,19500,180.0,165.0
FAC-STR-02,2026-09,11500,105.0,320.0,1500.0,2000.0,2100,17000,13500,130.0,125.0`;

    const res = processBatchImport(invalidRowCsv, 'ALL_OR_NOTHING');
    assert.equal(res.success, false);
    assert.equal(res.committed, false);
    assert.equal(res.invalidCount, 1);
    assert.equal(res.errors[0].lineNumber, 3);
    assert.match(res.errors[0].errors.join(','), /renewableElectricityMWh cannot exceed/);
  });
});

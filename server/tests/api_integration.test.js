const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const seedDatabase = require('../seed/seedData');

let testServer;
let baseUrl;

describe('FootprintESG API Integration End-to-End Test Suite', () => {
  before(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/footprint_esg';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    await seedDatabase();

    await new Promise((resolve) => {
      testServer = http.createServer(app);
      testServer.listen(0, () => {
        const port = testServer.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (testServer) {
      await new Promise(resolve => testServer.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  let authToken;

  it('1. Authenticates user and returns signed JWT-style token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sarah.lin',
        password: 'FootprintESG2026!'
      })
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.data.token);
    assert.equal(data.data.user.role, 'SUSTAINABILITY_MANAGER');
    authToken = data.data.token;
  });

  it('2. Rejects invalid login credentials with safe error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sarah.lin',
        password: 'WrongPassword123'
      })
    });
    const data = await res.json();
    assert.equal(res.status, 401);
    assert.equal(data.success, false);
    assert.equal(data.message, 'Invalid credentials');
  });

  it('3. Fetches overview KPIs strictly from official approved metrics (PR-08)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/overview`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(json.data.totalEmissions > 0);
    assert.ok(json.data.officialRecordsCount >= 2);
    assert.equal(json.data.metadata.isSynthetic, true);
  });

  it('4. Ingests valid automated telemetry and updates snapshot deterministically (PR-03, FR-012)', async () => {
    const testReading = {
      sourceId: 'SRC-ATX-MAIN-PWR',
      facilityId: 'FAC-ATX-01',
      metric: 'ELECTRICITY_KW',
      value: 4120.5,
      unit: 'kW',
      timestamp: new Date().toISOString(),
      quality: 'GOOD'
    };

    const res = await fetch(`${baseUrl}/api/v1/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testReading)
    });
    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.snapshot.value, 4120.5);
    assert.equal(json.data.snapshot.freshnessStatus, 'LIVE');
  });

  it('5. Rejects invalid telemetry without updating current state snapshot (FR-011)', async () => {
    const badReading = {
      sourceId: 'SRC-ATX-MAIN-PWR',
      facilityId: 'FAC-ATX-01',
      metric: 'ELECTRICITY_KW',
      value: -100, // Negative value prohibited
      unit: 'kW',
      timestamp: new Date().toISOString()
    };

    const res = await fetch(`${baseUrl}/api/v1/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badReading)
    });
    const json = await res.json();
    assert.equal(res.status, 400);
    assert.equal(json.success, false);

    // Verify snapshot was NOT updated with the negative value
    const curRes = await fetch(`${baseUrl}/api/v1/telemetry/current?facilityId=FAC-ATX-01`);
    const curJson = await curRes.json();
    const snap = curJson.data.find(s => s.sourceId === 'SRC-ATX-MAIN-PWR');
    assert.notEqual(snap.value, -100);
  });

  it('6. Handles workflow transitions and records audit trail (PR-07, PR-13)', async () => {
    // 1. Submit a new metric record
    const postRes = await fetch(`${baseUrl}/api/v1/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        facilityId: 'FAC-ATX-01',
        reportingPeriod: '2026-09',
        productionOutputTons: 15000,
        scope1EmissionsTons: 210,
        scope2EmissionsTons: 650,
        electricityConsumptionMWh: 2400,
        renewableElectricityMWh: 1800,
        naturalGasMMBtu: 4100,
        waterWithdrawalM3: 28000,
        waterRecycledM3: 19500,
        wasteGeneratedTons: 180,
        wasteDivertedTons: 165
      })
    });
    const postData = await postRes.json();
    assert.equal(postRes.status, 201);
    const metricId = postData.data.metricId;
    assert.equal(postData.data.status, 'SUBMITTED');

    // 2. Approve record with manager token
    const approveRes = await fetch(`${baseUrl}/api/v1/metrics/${metricId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    const approveData = await approveRes.json();
    assert.equal(approveRes.status, 200);
    assert.equal(approveData.data.status, 'APPROVED');

    // 3. Verify audit log was recorded
    const auditRes = await fetch(`${baseUrl}/api/v1/audit/logs`);
    const auditData = await auditRes.json();
    assert.equal(auditRes.status, 200);
    const entry = auditData.data.find(l => l.entityId === metricId);
    assert.ok(entry);
    assert.equal(entry.action, 'RECORD_APPROVE');
  });

  it('7. Exports official sustainability disclosure statement (PR-14)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports/export?format=json`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.ok(json.data.consolidatedKpis.totalEmissionsTons > 0);
    assert.ok(json.data.emissionFactorProvenance.length > 0);
    assert.ok(json.data.caveats.length > 0);
  });

  it('8. Serves /health healthcheck endpoint for Render zero-downtime monitoring', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.status, 'ONLINE');
    assert.ok(json.version);
    assert.ok(json.timestamp);
  });

  it('9. Responds properly to unknown API routes with 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-route`);
    assert.equal(res.status, 404);
  });
});

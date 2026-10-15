const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Facility = require('../models/Facility');
const MonthlyMetric = require('../models/MonthlyMetric');
const EmissionTarget = require('../models/EmissionTarget');
const AuditRecord = require('../models/AuditRecord');
const AuditLog = require('../models/AuditLog');
const DataSource = require('../models/DataSource');
const Measurement = require('../models/Measurement');
const CurrentMeasurement = require('../models/CurrentMeasurement');
const EmissionFactor = require('../models/EmissionFactor');

const { optionalAuthenticate, authenticate, checkFacilityAccess } = require('../middleware/auth');
const { validateTransition, isRecordImmutable } = require('../services/workflowService');
const {
  calculateEmissionIntensity,
  calculateRenewableShare,
  calculateWaterRecycleRate,
  calculateWasteDiversionRate,
  calculateTrendPercent
} = require('../services/calculationService');
const {
  evaluateFreshness,
  validateReadingPayload
} = require('../services/ingestionService');
const { processBatchImport } = require('../services/csvImportService');

// Metric Aggregator for Official Reporting (PR-08, PR-14)
function aggregateApprovedMetrics(records) {
  let totalScope1 = 0;
  let totalScope2 = 0;
  let totalProduction = 0;
  let totalElectricity = 0;
  let totalRenewable = 0;
  let totalWaterWithdrawal = 0;
  let totalWaterRecycled = 0;
  let totalWaste = 0;
  let totalWasteDiverted = 0;

  records.forEach(m => {
    totalScope1 += m.scope1EmissionsTons || 0;
    totalScope2 += m.scope2EmissionsTons || 0;
    totalProduction += m.productionOutputTons || 0;
    totalElectricity += m.electricityConsumptionMWh || 0;
    totalRenewable += m.renewableElectricityMWh || 0;
    totalWaterWithdrawal += m.waterWithdrawalM3 || 0;
    totalWaterRecycled += m.waterRecycledM3 || 0;
    totalWaste += m.wasteGeneratedTons || 0;
    totalWasteDiverted += m.wasteDivertedTons || 0;
  });

  const totalEmissions = +(totalScope1 + totalScope2).toFixed(1);
  const intensityResult = calculateEmissionIntensity(totalEmissions, totalProduction);
  const renewableResult = calculateRenewableShare(totalRenewable, totalElectricity);
  const waterRecycleResult = calculateWaterRecycleRate(totalWaterRecycled, totalWaterWithdrawal);
  const wasteDivResult = calculateWasteDiversionRate(totalWasteDiverted, totalWaste);

  return {
    totalScope1: +totalScope1.toFixed(1),
    totalScope2: +totalScope2.toFixed(1),
    totalEmissions,
    totalProduction,
    totalElectricity: +totalElectricity.toFixed(1),
    totalRenewable: +totalRenewable.toFixed(1),
    totalWaterWithdrawal: Math.round(totalWaterWithdrawal),
    totalWaterRecycled: Math.round(totalWaterRecycled),
    totalWaste: +totalWaste.toFixed(1),
    totalWasteDiverted: +totalWasteDiverted.toFixed(1),
    avgIntensity: intensityResult.value ?? 0,
    renewableShare: renewableResult.value,
    waterRecycleRate: waterRecycleResult.value,
    wasteDiversionRate: wasteDivResult.value
  };
}

// 1. Overview KPIs (PR-08: Exclude unapproved records from official totals)
router.get('/overview', optionalAuthenticate, async (req, res) => {
  try {
    const facilities = await Facility.find({ facilityId: { $exists: true, $ne: null } });
    const officialMetrics = await MonthlyMetric.find({
      status: { $in: ['APPROVED', 'AUDIT_LOCKED'] }
    });
    const targets = await EmissionTarget.find();
    const pendingApprovals = await MonthlyMetric.countDocuments({ status: 'SUBMITTED' });

    const agg = aggregateApprovedMetrics(officialMetrics);

    res.json({
      success: true,
      data: {
        facilitiesCount: facilities.length,
        officialRecordsCount: officialMetrics.length,
        totalScope1: agg.totalScope1,
        totalScope2: agg.totalScope2,
        totalEmissions: agg.totalEmissions,
        avgIntensity: agg.avgIntensity,
        renewableShare: agg.renewableShare,
        waterRecycleRate: agg.waterRecycleRate,
        totalWaterWithdrawal: agg.totalWaterWithdrawal,
        totalWaterRecycled: agg.totalWaterRecycled,
        wasteDiversionRate: agg.wasteDiversionRate,
        totalWaste: agg.totalWaste,
        totalWasteDiverted: agg.totalWasteDiverted,
        pendingApprovals,
        primaryTarget: targets[0] || null,
        metadata: {
          standard: 'GHG Protocol Corporate Standard (Scope 1 & 2)',
          assuranceLevel: 'Reasonable Assurance Ready',
          isSynthetic: true // PR-16 Demo label
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Facilities
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ facilityId: 1 });
    res.json({ success: true, data: facilities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Monthly Metrics
router.get('/metrics', async (req, res) => {
  try {
    const { facilityId, period, status } = req.query;
    const query = {};
    if (facilityId) query.facilityId = facilityId;
    if (period) query.reportingPeriod = period;
    if (status) query.status = status;

    const metrics = await MonthlyMetric.find(query).sort({ reportingPeriod: -1, createdAt: -1 });
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/metrics', authenticate, async (req, res) => {
  try {
    const data = req.body;
    if (!data.reportingPeriod || !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.reportingPeriod)) {
      return res.status(400).json({ success: false, message: 'Invalid reportingPeriod format, expected YYYY-MM' });
    }

    const facility = await Facility.findOne({ facilityId: data.facilityId });
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    if (!checkFacilityAccess(req.user, facility.facilityId)) {
      return res.status(403).json({ success: false, message: `Forbidden: not authorized for facility ${facility.facilityId}` });
    }

    const scope1 = Number(data.scope1EmissionsTons) || 0;
    const scope2 = Number(data.scope2EmissionsTons) || 0;
    const prod = Number(data.productionOutputTons) || 0;
    const totalEmissions = +(scope1 + scope2).toFixed(1);
    const intensityRes = calculateEmissionIntensity(totalEmissions, prod);
    const intensity = intensityRes.isAvailable ? intensityRes.value : 0;

    const wasteGen = Number(data.wasteGeneratedTons) || 0;
    const wasteDiv = Number(data.wasteDivertedTons) || 0;
    const wasteDivRes = calculateWasteDiversionRate(wasteDiv, wasteGen);
    const wasteDivPct = wasteDivRes.isAvailable ? wasteDivRes.value : 0;

    const actor = req.user;
    const initialStatus = data.status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

    const metric = new MonthlyMetric({
      metricId: `MET-${data.reportingPeriod}-${facility.facilityId}-${Date.now().toString().slice(-4)}`,
      organizationId: facility.organizationId || 'ORG-GLOBAL-01',
      facilityId: facility.facilityId,
      facilityName: facility.name,
      reportingPeriod: data.reportingPeriod,
      productionOutputTons: prod,
      scope1EmissionsTons: scope1,
      scope2EmissionsTons: scope2,
      totalEmissionsTons: totalEmissions,
      emissionIntensity: intensity,
      electricityConsumptionMWh: Number(data.electricityConsumptionMWh) || 0,
      renewableElectricityMWh: Number(data.renewableElectricityMWh) || 0,
      naturalGasMMBtu: Number(data.naturalGasMMBtu) || 0,
      waterWithdrawalM3: Number(data.waterWithdrawalM3) || 0,
      waterRecycledM3: Number(data.waterRecycledM3) || 0,
      wasteGeneratedTons: wasteGen,
      wasteDivertedTons: wasteDiv,
      wasteDiversionRatePercent: wasteDivPct,
      status: initialStatus,
      submittedBy: actor.username,
      submissionDate: initialStatus === 'SUBMITTED' ? new Date() : null,
      isSynthetic: true
    });

    await metric.save();

    // Internal audit log entry (PR-13)
    await AuditLog.create({
      logId: `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role
      },
      action: initialStatus === 'DRAFT' ? 'RECORD_CREATE' : 'RECORD_SUBMIT',
      entityType: 'MonthlyMetric',
      entityId: metric.metricId,
      facilityId: facility.facilityId,
      changes: { initialStatus, reportingPeriod: metric.reportingPeriod }
    });

    res.status(201).json({ success: true, data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// State Transitions & Approvals (PR-07, FR-023-FR-029)
router.patch('/metrics/:id/status', authenticate, async (req, res) => {
  try {
    const { status: targetStatus, reason } = req.body;
    const metric = await MonthlyMetric.findOne({ metricId: req.params.id });
    if (!metric) {
      return res.status(404).json({ success: false, message: 'Metric record not found' });
    }

    if (!checkFacilityAccess(req.user, metric.facilityId)) {
      return res.status(403).json({ success: false, message: `Forbidden: not authorized for facility ${metric.facilityId}` });
    }

    // Immutable check
    if (metric.status === 'AUDIT_LOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Record is audit-locked and immutable; cannot be modified'
      });
    }

    const actor = req.user;

    // Transition validation
    const transitionCheck = validateTransition(metric.status, targetStatus, actor);
    if (!transitionCheck.valid) {
      return res.status(400).json({ success: false, message: transitionCheck.error });
    }

    if (targetStatus === 'REJECTED' && (!reason || reason.trim() === '')) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required' });
    }

    const previousStatus = metric.status;
    metric.status = targetStatus;

    if (targetStatus === 'APPROVED') {
      metric.approvedBy = actor.username;
      metric.approvalDate = new Date();
    } else if (targetStatus === 'REJECTED') {
      metric.rejectedBy = actor.username;
      metric.rejectionReason = reason;
      metric.rejectionDate = new Date();
    }

    await metric.save();

    // Audit log
    await AuditLog.create({
      logId: `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role
      },
      action: targetStatus === 'APPROVED' ? 'RECORD_APPROVE' : targetStatus === 'REJECTED' ? 'RECORD_REJECT' : 'RECORD_LOCK',
      entityType: 'MonthlyMetric',
      entityId: metric.metricId,
      facilityId: metric.facilityId,
      changes: { from: previousStatus, to: targetStatus, reason: reason || null }
    });

    res.json({ success: true, data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Targets
router.get('/targets', async (req, res) => {
  try {
    const targets = await EmissionTarget.find();
    res.json({ success: true, data: targets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Audits (Third-Party Assurance Statements)
router.get('/audits', async (req, res) => {
  try {
    const audits = await AuditRecord.find().sort({ auditDate: -1 });
    res.json({ success: true, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Multi-facility Benchmarks (Strictly from approved records)
router.get('/benchmarks', async (req, res) => {
  try {
    const facilities = await Facility.find();
    const approvedMetrics = await MonthlyMetric.find({
      status: { $in: ['APPROVED', 'AUDIT_LOCKED'] }
    });

    const benchmarks = facilities.map(f => {
      const fMetrics = approvedMetrics.filter(m => m.facilityId === f.facilityId);
      const totalS1 = fMetrics.reduce((a, m) => a + (m.scope1EmissionsTons || 0), 0);
      const totalS2 = fMetrics.reduce((a, m) => a + (m.scope2EmissionsTons || 0), 0);
      const totalProd = fMetrics.reduce((a, m) => a + (m.productionOutputTons || 0), 0);
      const totalElec = fMetrics.reduce((a, m) => a + (m.electricityConsumptionMWh || 0), 0);
      const totalRen = fMetrics.reduce((a, m) => a + (m.renewableElectricityMWh || 0), 0);

      const intensity = totalProd > 0 ? +((totalS1 + totalS2) / totalProd).toFixed(4) : 0;
      const renPct = totalElec > 0 ? +((totalRen / totalElec) * 100).toFixed(1) : f.renewableEnergySharePercent;

      return {
        facilityId: f.facilityId,
        name: f.name,
        location: f.location,
        facilityType: f.facilityType,
        totalScope1: +totalS1.toFixed(1),
        totalScope2: +totalS2.toFixed(1),
        totalEmissions: +(totalS1 + totalS2).toFixed(1),
        emissionIntensity: intensity,
        renewableEnergyPercent: renPct,
        iso14001: f.iso14001Certified
      };
    });

    res.json({ success: true, data: benchmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Telemetry & Live Data (PR-03, PR-04, FR-009-FR-017)
router.get('/telemetry/sources', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const query = facilityId ? { facilityId } : {};
    const sources = await DataSource.find(query);
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/telemetry/current', async (req, res) => {
  try {
    const { facilityId } = req.query;
    const query = facilityId ? { facilityId } : {};
    const snapshots = await CurrentMeasurement.find(query);

    // Re-evaluate freshness dynamically on query
    const now = Date.now();
    const evaluated = snapshots.map(s => {
      const freshnessStatus = evaluateFreshness(s.sourceTimestamp, now);
      return {
        ...s.toObject(),
        freshnessStatus
      };
    });

    res.json({ success: true, data: evaluated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Automated Ingestion Endpoint (PR-03, FR-009, FR-011, FR-012, FR-016)
router.post('/telemetry/ingest', async (req, res) => {
  try {
    const reading = req.body;
    const validation = validateReadingPayload(reading);

    // FR-011: Invalid readings must NOT update official current state
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Telemetry reading rejected',
        errors: validation.errors
      });
    }

    // 1. Persist to historical measurement collection
    const measurement = new Measurement({
      measurementId: `MEA-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      sourceId: reading.sourceId,
      facilityId: reading.facilityId,
      organizationId: reading.organizationId || 'ORG-GLOBAL-01',
      metric: reading.metric,
      value: reading.value,
      unit: reading.unit,
      quality: reading.quality || 'GOOD',
      timestamp: new Date(reading.timestamp)
    });
    await measurement.save();

    // 2. Deterministic update of live current snapshot
    const freshnessStatus = evaluateFreshness(reading.timestamp);
    const snapshot = await CurrentMeasurement.findOneAndUpdate(
      { sourceId: reading.sourceId },
      {
        $set: {
          facilityId: reading.facilityId,
          metric: reading.metric,
          value: reading.value,
          unit: reading.unit,
          quality: reading.quality || 'GOOD',
          sourceTimestamp: new Date(reading.timestamp),
          freshnessStatus,
          lastSeenAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // 3. Update DataSource lastSeenAt
    await DataSource.updateOne(
      { sourceId: reading.sourceId },
      { $set: { lastSeenAt: new Date(), status: 'ONLINE' } }
    );

    // 4. Emit to authorized facility socket room (FR-016)
    const io = req.app.get('io');
    if (io) {
      io.to(`facility:${reading.facilityId}`).emit('telemetry:update', snapshot);
    }

    res.status(201).json({
      success: true,
      data: {
        measurementId: measurement.measurementId,
        snapshot
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const TELEMETRY_BOUNDS = {
  ELECTRICITY_KW: { default: 3950, min: 3400, max: 4500, maxStep: 12.0, decimals: 1 },
  SOLAR_POWER_KW: { default: 2650, min: 2100, max: 3200, maxStep: 10.0, decimals: 1 },
  NATURAL_GAS_FLOW: { default: 6.2, min: 4.5, max: 8.5, maxStep: 0.08, decimals: 2 },
  WATER_WITHDRAWAL_RATE: { default: 42.0, min: 30.0, max: 55.0, maxStep: 0.35, decimals: 1 }
};

function getAdjacentTelemetryValue(metric, prevVal) {
  const cfg = TELEMETRY_BOUNDS[metric] || { default: 100, min: 50, max: 200, maxStep: 1.0, decimals: 1 };
  const current = typeof prevVal === 'number' && !isNaN(prevVal) && prevVal >= cfg.min && prevVal <= cfg.max
    ? prevVal
    : cfg.default;

  const center = (cfg.min + cfg.max) / 2;
  const bias = (center - current) / (cfg.max - cfg.min) * 0.12;
  const step = (Math.random() - 0.5 + bias) * (cfg.maxStep * 2);
  const nextVal = Math.max(cfg.min, Math.min(cfg.max, current + step));
  return +nextVal.toFixed(cfg.decimals);
}

// Telemetry Simulation Tick for Demo (Continuous Adjacent Drift)
router.post('/telemetry/simulate-tick', authenticate, async (req, res) => {
  try {
    const { facilityId = 'FAC-ATX-01' } = req.body;
    if (!checkFacilityAccess(req.user, facilityId)) {
      return res.status(403).json({ success: false, message: `Forbidden: not authorized for facility ${facilityId}` });
    }
    const sources = await DataSource.find({ facilityId });

    const updatedSnapshots = [];
    const io = req.app.get('io');

    for (const src of sources) {
      const existing = await CurrentMeasurement.findOne({ sourceId: src.sourceId });
      const newVal = getAdjacentTelemetryValue(src.metric, existing ? existing.value : null);

      const snap = await CurrentMeasurement.findOneAndUpdate(
        { sourceId: src.sourceId },
        {
          $set: {
            facilityId,
            metric: src.metric,
            value: newVal,
            unit: src.unit,
            quality: 'GOOD',
            sourceTimestamp: new Date(),
            freshnessStatus: 'LIVE',
            lastSeenAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      // Persist to time-series history (PR-03)
      await Measurement.create({
        measurementId: `MSR-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        sourceId: src.sourceId,
        facilityId,
        metric: src.metric,
        value: newVal,
        unit: src.unit,
        quality: 'GOOD',
        sourceTimestamp: new Date(),
        receivedAt: new Date()
      });

      updatedSnapshots.push(snap);

      if (io) {
        io.to(`facility:${facilityId}`).emit('telemetry:update', snap);
      }
    }

    res.json({ success: true, count: updatedSnapshots.length, data: updatedSnapshots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Batch CSV Import (PR-09, FR-030-FR-032)
router.post('/import/metrics', authenticate, async (req, res) => {
  try {
    const csvContent = typeof req.body === 'string' ? req.body : req.body.csv;
    const policy = (req.body.policy || 'ALL_OR_NOTHING').toUpperCase();

    if (!csvContent) {
      return res.status(400).json({ success: false, message: 'CSV payload is required' });
    }

    const importResult = processBatchImport(csvContent, policy);

    if (!importResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Import rejected due to validation errors (ALL_OR_NOTHING policy)',
        result: importResult
      });
    }

    // Enforce facility access authorization on every imported row (ALL_OR_NOTHING)
    for (const item of importResult.validRecords) {
      if (!checkFacilityAccess(req.user, item.facilityId)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: not authorized to import records for facility ${item.facilityId}`
        });
      }
    }

    // Commit valid records
    const insertedRecords = [];
    for (const item of importResult.validRecords) {
      const facility = await Facility.findOne({ facilityId: item.facilityId });
      const record = new MonthlyMetric({
        ...item,
        metricId: `MET-${item.reportingPeriod}-${item.facilityId}-${crypto.randomBytes(3).toString('hex')}`,
        facilityName: facility ? facility.name : item.facilityId,
        organizationId: facility ? facility.organizationId : 'ORG-GLOBAL-01',
        submittedBy: req.user ? req.user.username : 'CSV Batch Ingestion',
        submissionDate: new Date(),
        isSynthetic: true
      });
      await record.save();
      insertedRecords.push(record);
    }

    // Audit trail
    const actor = req.user || {
      userId: 'USR-BATCH-01',
      username: 'CSV Ingestion Service',
      role: 'PLANT_COORDINATOR'
    };

    await AuditLog.create({
      logId: `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role
      },
      action: 'BATCH_IMPORT',
      entityType: 'BatchImport',
      entityId: `BATCH-${Date.now()}`,
      changes: {
        totalRows: importResult.totalRows,
        importedCount: insertedRecords.length,
        policy
      }
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedRecords.length} records into approval queue`,
      data: insertedRecords
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Emission Factors Catalog (PR-10)
router.get('/factors', async (req, res) => {
  try {
    const factors = await EmissionFactor.find();
    res.json({ success: true, data: factors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Audit Logs Query (PR-13, FR-044-FR-046)
router.get('/audit/logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Reports & Official Export (PR-14, FR-041-FR-043)
router.get('/reports/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const facilities = await Facility.find();
    const approvedMetrics = await MonthlyMetric.find({
      status: { $in: ['APPROVED', 'AUDIT_LOCKED'] }
    });
    const factors = await EmissionFactor.find();

    const agg = aggregateApprovedMetrics(approvedMetrics);

    const reportData = {
      reportingEntity: 'Global Industrial Manufacturing Corp (ORG-GLOBAL-01)',
      statementStandard: 'GHG Protocol Corporate Accounting and Reporting Standard',
      assuranceStandard: 'ISO 14064-3 / Limited and Reasonable Assurance Scope',
      generatedAt: new Date().toISOString(),
      reportingBoundary: 'Operational Control across 4 Global Sites',
      consolidatedKpis: {
        scope1EmissionsTons: agg.totalScope1,
        scope2EmissionsTons: agg.totalScope2,
        totalEmissionsTons: agg.totalEmissions,
        productionOutputTons: agg.totalProduction,
        emissionIntensityRatio: agg.avgIntensity,
        renewableElectricityPercent: agg.renewableShare,
        waterWithdrawalM3: agg.totalWaterWithdrawal,
        waterRecycledM3: agg.totalWaterRecycled,
        wasteGeneratedTons: agg.totalWaste,
        wasteDivertedTons: agg.totalWasteDiverted
      },
      emissionFactorProvenance: factors.map(f => ({
        factorId: f.factorId,
        name: f.name,
        source: f.source,
        version: f.version,
        value: f.factorValue,
        unit: `${f.emissionUnit} / ${f.activityUnit}`
      })),
      caveats: [
        'All figures are aggregated exclusively from approved and locked fiscal records.',
        'Draft or submitted records under review are excluded per PR-08 governance policies.',
        'Synthetic academic demonstration markers are labeled in compliance with PR-16.'
      ]
    };

    if (format === 'csv') {
      const csvLines = [
        'Metric,Consolidated Value,Unit',
        `Scope 1 Direct Combustion,${reportData.consolidatedKpis.scope1EmissionsTons},Metric Tons CO2e`,
        `Scope 2 Purchased Electricity,${reportData.consolidatedKpis.scope2EmissionsTons},Metric Tons CO2e`,
        `Total GHG Footprint,${reportData.consolidatedKpis.totalEmissionsTons},Metric Tons CO2e`,
        `Production Output,${reportData.consolidatedKpis.productionOutputTons},Metric Tons`,
        `Carbon Intensity,${reportData.consolidatedKpis.emissionIntensityRatio},tCO2e / Ton Output`,
        `Clean Renewable Electricity Share,${reportData.consolidatedKpis.renewableElectricityPercent},%`,
        `Water Withdrawal Volume,${reportData.consolidatedKpis.waterWithdrawalM3},Cubic Meters`,
        `Water Recycle Fraction,${agg.waterRecycleRate},%`,
        `Zero-Waste Diversion Rate,${agg.wasteDiversionRate},%`
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="FootprintESG-Corporate-Assertion.csv"');
      return res.send(csvLines.join('\n'));
    }

    res.json({ success: true, data: reportData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.getAdjacentTelemetryValue = getAdjacentTelemetryValue;
module.exports = router;

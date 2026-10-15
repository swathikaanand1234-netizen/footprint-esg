const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const Facility = require('../models/Facility');
const MonthlyMetric = require('../models/MonthlyMetric');
const EmissionTarget = require('../models/EmissionTarget');
const AuditRecord = require('../models/AuditRecord');
const User = require('../models/User');
const EmissionFactor = require('../models/EmissionFactor');
const DataSource = require('../models/DataSource');
const CurrentMeasurement = require('../models/CurrentMeasurement');
const AuditLog = require('../models/AuditLog');
const { hashPassword } = require('../utils/auth');

const seedDatabase = async () => {
  try {
    const metricCount = await MonthlyMetric.countDocuments();
    if (metricCount > 0) {
      console.log('FootprintESG database already seeded.');
      return;
    }

    console.log('Seeding FootprintESG enterprise environmental datasets...');

    // 0. Organization
    await Organization.findOneAndUpdate(
      { organizationId: 'ORG-GLOBAL-01' },
      {
        organizationId: 'ORG-GLOBAL-01',
        name: 'Global Industrial Manufacturing Corp',
        reportingCurrency: 'USD',
        country: 'USA',
        status: 'ACTIVE'
      },
      { upsert: true, new: true }
    );

    // 1. Users (6 distinct RBAC roles per requirements)
    const defaultPassword = 'FootprintESG2026!';
    const { salt: s1, hash: h1 } = hashPassword(defaultPassword);
    const { salt: s2, hash: h2 } = hashPassword(defaultPassword);
    const { salt: s3, hash: h3 } = hashPassword(defaultPassword);
    const { salt: s4, hash: h4 } = hashPassword(defaultPassword);
    const { salt: s5, hash: h5 } = hashPassword(defaultPassword);
    const { salt: s6, hash: h6 } = hashPassword(defaultPassword);

    const users = [
      {
        userId: 'USR-MGR-01',
        username: 'sarah.lin',
        name: 'Dr. Sarah Lin (VP ESG & Decarbonization)',
        email: 'sarah.lin@globalcorp.com',
        role: 'SUSTAINABILITY_MANAGER',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: ['FAC-ATX-01', 'FAC-STR-02', 'FAC-YOK-03', 'FAC-MTY-04'],
        salt: s1,
        passwordHash: h1
      },
      {
        userId: 'USR-COORD-02',
        username: 'elena.rostova',
        name: 'Elena Rostova (Plant Sustainability Lead)',
        email: 'elena.rostova@globalcorp.com',
        role: 'PLANT_COORDINATOR',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: ['FAC-ATX-01', 'FAC-STR-02'],
        salt: s2,
        passwordHash: h2
      },
      {
        userId: 'USR-PLANT-03',
        username: 'marcus.vance',
        name: 'Marcus Vance (Austin Plant Director)',
        email: 'marcus.vance@globalcorp.com',
        role: 'PLANT_MANAGER',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: ['FAC-ATX-01'],
        salt: s3,
        passwordHash: h3
      },
      {
        userId: 'USR-EXEC-04',
        username: 'david.chen',
        name: 'David Chen (Chief Executive Officer)',
        email: 'david.chen@globalcorp.com',
        role: 'EXECUTIVE',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: [],
        salt: s4,
        passwordHash: h4
      },
      {
        userId: 'USR-AUDIT-05',
        username: 'jennifer.auditor',
        name: 'Jennifer Vance (Bureau Veritas Senior Lead Auditor)',
        email: 'jennifer.vance@bureauveritas.com',
        role: 'AUDITOR',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: [],
        salt: s5,
        passwordHash: h5
      },
      {
        userId: 'USR-ADMIN-06',
        username: 'alex.sysadmin',
        name: 'Alex Ramos (System & Infrastructure Administrator)',
        email: 'alex.sysadmin@globalcorp.com',
        role: 'SYSTEM_ADMIN',
        organizationId: 'ORG-GLOBAL-01',
        assignedFacilities: [],
        salt: s6,
        passwordHash: h6
      }
    ];
    await User.insertMany(users);

    // 2. Facilities
    const facilities = [
      {
        facilityId: 'FAC-ATX-01',
        organizationId: 'ORG-GLOBAL-01',
        name: 'Austin Advanced Gigafactory',
        location: 'Austin, Texas, USA',
        region: 'NORTH_AMERICA',
        facilityType: 'BATTERY_GIGAFACTORY',
        gridEmissionFactor: 0.385,
        renewableEnergySharePercent: 74.2,
        annualProductionUnits: 450000,
        headcount: 5200,
        iso14001Certified: true,
        targetNetZeroYear: 2030
      },
      {
        facilityId: 'FAC-STR-02',
        organizationId: 'ORG-GLOBAL-01',
        name: 'Stuttgart Precision Powertrain & EV Plant',
        location: 'Stuttgart, Baden-Württemberg, Germany',
        region: 'EUROPE',
        facilityType: 'AUTOMOTIVE_ASSEMBLY',
        gridEmissionFactor: 0.240,
        renewableEnergySharePercent: 88.5,
        annualProductionUnits: 280000,
        headcount: 3800,
        iso14001Certified: true,
        targetNetZeroYear: 2028
      },
      {
        facilityId: 'FAC-YOK-03',
        organizationId: 'ORG-GLOBAL-01',
        name: 'Yokohama High-Efficiency Stamping Complex',
        location: 'Yokohama, Kanagawa, Japan',
        region: 'ASIA_PACIFIC',
        facilityType: 'ALUMINUM_CASTING',
        gridEmissionFactor: 0.440,
        renewableEnergySharePercent: 62.0,
        annualProductionUnits: 195000,
        headcount: 2400,
        iso14001Certified: true,
        targetNetZeroYear: 2032
      },
      {
        facilityId: 'FAC-MTY-04',
        organizationId: 'ORG-GLOBAL-01',
        name: 'Monterrey Lightweight Foundry & Machining',
        location: 'Monterrey, Nuevo León, Mexico',
        region: 'NORTH_AMERICA',
        facilityType: 'ALUMINUM_CASTING',
        gridEmissionFactor: 0.415,
        renewableEnergySharePercent: 54.8,
        annualProductionUnits: 160000,
        headcount: 1900,
        iso14001Certified: true,
        targetNetZeroYear: 2035
      }
    ];
    await Facility.insertMany(facilities);

    // 3. Emission Factors (PR-10, PR-16 synthetic label)
    const factors = [
      {
        factorId: 'EF-GRID-US-2026',
        name: 'US ERCOT Grid Average Electricity Factor',
        activityType: 'ELECTRICITY_GRID',
        region: 'NORTH_AMERICA',
        scope: 'SCOPE_2_MARKET',
        factorValue: 0.385,
        activityUnit: 'kWh',
        emissionUnit: 'kg CO2e',
        source: 'US EPA eGRID 2024 / ERCOT Regional Model',
        version: 'v2024.2',
        isSynthetic: true
      },
      {
        factorId: 'EF-GRID-EU-2026',
        name: 'Germany Grid Electricity Factor',
        activityType: 'ELECTRICITY_GRID',
        region: 'EUROPE',
        scope: 'SCOPE_2_MARKET',
        factorValue: 0.240,
        activityUnit: 'kWh',
        emissionUnit: 'kg CO2e',
        source: 'European Environment Agency (EEA) / UBA Germany',
        version: 'v2024.1',
        isSynthetic: true
      },
      {
        factorId: 'EF-NATGAS-2026',
        name: 'Industrial Natural Gas Combustion',
        activityType: 'NATURAL_GAS',
        region: 'GLOBAL',
        scope: 'SCOPE_1',
        factorValue: 53.06,
        activityUnit: 'MMBtu',
        emissionUnit: 'kg CO2e',
        source: 'IPCC Guidelines for National GHG Inventories',
        version: 'v2023.AR6',
        isSynthetic: true
      },
      {
        factorId: 'EF-DIESEL-2026',
        name: 'Heavy Fleet Diesel Combustion',
        activityType: 'DIESEL_FUEL',
        region: 'GLOBAL',
        scope: 'SCOPE_1',
        factorValue: 2.68,
        activityUnit: 'Liter',
        emissionUnit: 'kg CO2e',
        source: 'UK DEFRA / BEIS Greenhouse Gas Reporting Conversion Factors',
        version: 'v2024.0',
        isSynthetic: true
      }
    ];
    await EmissionFactor.insertMany(factors);

    // 4. Monthly Metrics
    const metrics = [
      {
        metricId: 'MET-2026-08-FAC-ATX-01',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        facilityName: 'Austin Advanced Gigafactory',
        reportingPeriod: '2026-08',
        productionOutputTons: 16200,
        scope1EmissionsTons: 245.2,
        scope2EmissionsTons: 712.8,
        totalEmissionsTons: 958.0,
        emissionIntensity: 0.0591,
        electricityConsumptionMWh: 2850.0,
        renewableElectricityMWh: 2114.7,
        naturalGasMMBtu: 4620,
        waterWithdrawalM3: 31200,
        waterRecycledM3: 21800,
        wasteGeneratedTons: 210.4,
        wasteDivertedTons: 196.2,
        wasteDiversionRatePercent: 93.3,
        status: 'APPROVED',
        submittedBy: 'M. Sterling (EHS Lead)',
        approvedBy: 'Dr. Sarah Lin (VP ESG & Decarbonization)',
        approvalDate: new Date(Date.now() - 15 * 86400000),
        isSynthetic: true
      },
      {
        metricId: 'MET-2026-08-FAC-STR-02',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-STR-02',
        facilityName: 'Stuttgart Precision Powertrain & EV Plant',
        reportingPeriod: '2026-08',
        productionOutputTons: 12400,
        scope1EmissionsTons: 118.0,
        scope2EmissionsTons: 382.4,
        totalEmissionsTons: 500.4,
        emissionIntensity: 0.0404,
        electricityConsumptionMWh: 1940.0,
        renewableElectricityMWh: 1716.9,
        naturalGasMMBtu: 2210,
        waterWithdrawalM3: 18400,
        waterRecycledM3: 14900,
        wasteGeneratedTons: 142.0,
        wasteDivertedTons: 135.6,
        wasteDiversionRatePercent: 95.5,
        status: 'APPROVED',
        submittedBy: 'H. Richter (Environmental Compliance)',
        approvedBy: 'Dr. Sarah Lin (VP ESG & Decarbonization)',
        approvalDate: new Date(Date.now() - 12 * 86400000),
        isSynthetic: true
      },
      {
        metricId: 'MET-2026-08-FAC-YOK-03',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-YOK-03',
        facilityName: 'Yokohama High-Efficiency Stamping Complex',
        reportingPeriod: '2026-08',
        productionOutputTons: 9800,
        scope1EmissionsTons: 188.5,
        scope2EmissionsTons: 520.1,
        totalEmissionsTons: 708.6,
        emissionIntensity: 0.0723,
        electricityConsumptionMWh: 1620.0,
        renewableElectricityMWh: 1004.4,
        naturalGasMMBtu: 3540,
        waterWithdrawalM3: 15200,
        waterRecycledM3: 9800,
        wasteGeneratedTons: 118.5,
        wasteDivertedTons: 104.2,
        wasteDiversionRatePercent: 87.9,
        status: 'SUBMITTED',
        submittedBy: 'K. Takahashi (Plant Sustainability Officer)',
        isSynthetic: true
      },
      {
        metricId: 'MET-2026-08-FAC-MTY-04',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-MTY-04',
        facilityName: 'Monterrey Lightweight Foundry & Machining',
        reportingPeriod: '2026-08',
        productionOutputTons: 8200,
        scope1EmissionsTons: 194.2,
        scope2EmissionsTons: 442.8,
        totalEmissionsTons: 637.0,
        emissionIntensity: 0.0777,
        electricityConsumptionMWh: 1480.0,
        renewableElectricityMWh: 811.0,
        naturalGasMMBtu: 3680,
        waterWithdrawalM3: 22100,
        waterRecycledM3: 11400,
        wasteGeneratedTons: 165.0,
        wasteDivertedTons: 138.6,
        wasteDiversionRatePercent: 84.0,
        status: 'SUBMITTED',
        submittedBy: 'R. Morales (Foundry EHS)',
        isSynthetic: true
      }
    ];
    await MonthlyMetric.insertMany(metrics);

    // 5. Data Sources & Current Telemetry Snapshots
    const sources = [
      {
        sourceId: 'SRC-ATX-MAIN-PWR',
        name: 'Main Substation Smart Meter 01',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'ELECTRICITY_KW',
        unit: 'kW',
        status: 'ONLINE',
        lastSeenAt: new Date(),
        isSynthetic: true
      },
      {
        sourceId: 'SRC-ATX-SOLAR-PV',
        name: 'Rooftop Solar Array Inverter 04',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'SOLAR_POWER_KW',
        unit: 'kW',
        status: 'ONLINE',
        lastSeenAt: new Date(),
        isSynthetic: true
      },
      {
        sourceId: 'SRC-ATX-GAS-BOILER',
        name: 'Thermal Boiler Natural Gas Flow Meter',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'NATURAL_GAS_FLOW',
        unit: 'MMBtu/h',
        status: 'ONLINE',
        lastSeenAt: new Date(),
        isSynthetic: true
      },
      {
        sourceId: 'SRC-ATX-WATER-MAIN',
        name: 'Municipal Water Intake Ultrasonic Flow Meter',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'WATER_WITHDRAWAL_RATE',
        unit: 'm3/h',
        status: 'ONLINE',
        lastSeenAt: new Date(),
        isSynthetic: true
      }
    ];
    await DataSource.insertMany(sources);

    const snapshots = [
      {
        sourceId: 'SRC-ATX-MAIN-PWR',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'ELECTRICITY_KW',
        value: 3950.4,
        unit: 'kW',
        quality: 'GOOD',
        sourceTimestamp: new Date(),
        freshnessStatus: 'LIVE',
        lastSeenAt: new Date()
      },
      {
        sourceId: 'SRC-ATX-SOLAR-PV',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'SOLAR_POWER_KW',
        value: 2930.0,
        unit: 'kW',
        quality: 'GOOD',
        sourceTimestamp: new Date(),
        freshnessStatus: 'LIVE',
        lastSeenAt: new Date()
      },
      {
        sourceId: 'SRC-ATX-GAS-BOILER',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'NATURAL_GAS_FLOW',
        value: 6.4,
        unit: 'MMBtu/h',
        quality: 'GOOD',
        sourceTimestamp: new Date(Date.now() - 3 * 60000), // 3 min ago -> LIVE
        freshnessStatus: 'LIVE',
        lastSeenAt: new Date()
      },
      {
        sourceId: 'SRC-ATX-WATER-MAIN',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        metric: 'WATER_WITHDRAWAL_RATE',
        value: 43.2,
        unit: 'm3/h',
        quality: 'GOOD',
        sourceTimestamp: new Date(Date.now() - 7 * 60000), // 7 min ago -> DELAYED
        freshnessStatus: 'DELAYED',
        lastSeenAt: new Date()
      }
    ];
    await CurrentMeasurement.insertMany(snapshots);

    // 6. Targets
    const targets = [
      {
        targetId: 'TGT-SBTi-2030',
        title: 'Science-Based Targets initiative (SBTi) 1.5°C Pathway',
        scopeCoverage: 'Scope 1 & Scope 2 Market-Based Emissions',
        baselineYear: 2020,
        baselineEmissionsTons: 54000,
        targetYear: 2030,
        targetEmissionsTons: 27000,
        currentEmissionsTons: 33650,
        progressPercent: 75.4,
        trajectoryStatus: 'ON_TRACK',
        initiatives: [
          { name: 'On-site Rooftop Solar Photovoltaic 12 MWp Deployment', reductionTons: 5800, completionStatus: 'COMPLETED' },
          { name: 'Electrification of Aluminum Reverberatory Furnaces', reductionTons: 7400, completionStatus: 'IN_PROGRESS' },
          { name: 'Closed-Loop Wastewater Membrane Bioreactor Recycling', reductionTons: 1200, completionStatus: 'COMPLETED' },
          { name: 'Virtual Power Purchase Agreement (VPPA) Wind Off-take', reductionTons: 8900, completionStatus: 'IN_PROGRESS' }
        ]
      }
    ];
    await EmissionTarget.insertMany(targets);

    // 7. Audits (Third party assurance assertions)
    const audits = [
      {
        auditId: 'AUD-VERITAS-2025',
        facilityId: 'FAC-ATX-01',
        facilityName: 'Austin Advanced Gigafactory',
        standard: 'ISO 14064-3: GHG Assertion Verification',
        auditorOrg: 'Bureau Veritas Assurance Services',
        leadAuditor: 'Jennifer Vance (Lead GHG Verifier)',
        assuranceLevel: 'REASONABLE_ASSURANCE',
        status: 'VERIFIED_COMPLIANT',
        auditPeriod: 'FY 2025 Calendar Year',
        auditDate: new Date('2026-03-15'),
        findingsCount: 0,
        statementSummary: 'Clean unqualified verification statement issued. Scope 1 and Scope 2 activity data reconciled within 0.8% variance threshold.'
      },
      {
        auditId: 'AUD-DNV-2026',
        facilityId: 'FAC-STR-02',
        facilityName: 'Stuttgart Precision Powertrain & EV Plant',
        standard: 'GHG Protocol Corporate Standard & CSRD Alignment',
        auditorOrg: 'DNV Business Assurance GmbH',
        leadAuditor: 'Markus Weber',
        assuranceLevel: 'LIMITED_ASSURANCE',
        status: 'VERIFIED_COMPLIANT',
        auditPeriod: 'Q1-Q2 2026 Interim Review',
        auditDate: new Date('2026-07-20'),
        findingsCount: 0,
        statementSummary: 'Full traceability confirmed for Guarantees of Origin (GOs) and European green electricity tariff certifications.'
      }
    ];
    await AuditRecord.insertMany(audits);

    // 8. Internal Mutation Audit Log Initial Events (PR-13)
    const auditLogs = [
      {
        logId: 'LOG-INIT-01',
        timestamp: new Date(Date.now() - 15 * 86400000),
        actor: {
          userId: 'USR-MGR-01',
          username: 'sarah.lin',
          role: 'SUSTAINABILITY_MANAGER'
        },
        action: 'RECORD_APPROVE',
        entityType: 'MonthlyMetric',
        entityId: 'MET-2026-08-FAC-ATX-01',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-ATX-01',
        changes: { status: { from: 'SUBMITTED', to: 'APPROVED' } },
        notes: 'Corporate ESG Officer sign-off after utility invoice reconciliation.'
      },
      {
        logId: 'LOG-INIT-02',
        timestamp: new Date(Date.now() - 12 * 86400000),
        actor: {
          userId: 'USR-MGR-01',
          username: 'sarah.lin',
          role: 'SUSTAINABILITY_MANAGER'
        },
        action: 'RECORD_APPROVE',
        entityType: 'MonthlyMetric',
        entityId: 'MET-2026-08-FAC-STR-02',
        organizationId: 'ORG-GLOBAL-01',
        facilityId: 'FAC-STR-02',
        changes: { status: { from: 'SUBMITTED', to: 'APPROVED' } },
        notes: 'European green tariff certs and production records reconciled.'
      }
    ];
    await AuditLog.insertMany(auditLogs);

    console.log('FootprintESG database seeded successfully with all enterprise models!');
  } catch (err) {
    console.error('Error seeding FootprintESG:', err);
  }
};

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/footprint_esg';
  mongoose.connect(MONGO_URI)
    .then(() => seedDatabase())
    .then(() => mongoose.disconnect())
    .catch(err => {
      console.error('Seed execution error:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;

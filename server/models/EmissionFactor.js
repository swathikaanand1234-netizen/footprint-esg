const mongoose = require('mongoose');

const emissionFactorSchema = new mongoose.Schema({
  factorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  activityType: { 
    type: String, 
    required: true,
    enum: ['ELECTRICITY_GRID', 'NATURAL_GAS', 'DIESEL_FUEL', 'REFRIGERANT_R134A']
  },
  region: { 
    type: String, 
    required: true,
    enum: ['NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC', 'GLOBAL']
  },
  scope: { 
    type: String, 
    required: true,
    enum: ['SCOPE_1', 'SCOPE_2_LOCATION', 'SCOPE_2_MARKET']
  },
  factorValue: { type: Number, required: true },
  activityUnit: { type: String, required: true },
  emissionUnit: { type: String, default: 'kg CO2e' },
  source: { type: String, required: true }, // e.g. 'US EPA eGRID 2024'
  version: { type: String, required: true },
  effectiveStartDate: { type: Date, default: () => new Date('2024-01-01') },
  effectiveEndDate: { type: Date, default: null },
  isSynthetic: { type: Boolean, default: true }, // Labelled synthetic per PR-16
  notes: { type: String, default: '' }
}, { timestamps: true });

emissionFactorSchema.index({ activityType: 1, region: 1, version: 1 });

module.exports = mongoose.model('EmissionFactor', emissionFactorSchema);

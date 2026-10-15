const mongoose = require('mongoose');

const dataSourceSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  facilityId: { type: String, required: true, index: true },
  metric: { 
    type: String, 
    required: true,
    enum: ['ELECTRICITY_KW', 'NATURAL_GAS_FLOW', 'WATER_WITHDRAWAL_RATE', 'WATER_RECYCLED_RATE', 'SOLAR_POWER_KW'] 
  },
  unit: { type: String, required: true },
  status: { type: String, enum: ['ONLINE', 'DEGRADED', 'OFFLINE'], default: 'ONLINE' },
  lastSeenAt: { type: Date, default: null },
  isSynthetic: { type: Boolean, default: true } // PR-16 Demo label
}, { timestamps: true });

module.exports = mongoose.model('DataSource', dataSourceSchema);

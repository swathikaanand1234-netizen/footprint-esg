const mongoose = require('mongoose');

const currentMeasurementSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  facilityId: { type: String, required: true, index: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  quality: { type: String, enum: ['GOOD', 'SUSPECT', 'BAD'], default: 'GOOD' },
  sourceTimestamp: { type: Date, required: true },
  freshnessStatus: { type: String, enum: ['LIVE', 'DELAYED', 'STALE'], default: 'LIVE' },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

currentMeasurementSchema.index({ facilityId: 1, metric: 1 });

module.exports = mongoose.model('CurrentMeasurement', currentMeasurementSchema);

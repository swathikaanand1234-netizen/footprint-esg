const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  measurementId: { type: String, required: true, unique: true },
  sourceId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  facilityId: { type: String, required: true, index: true },
  metric: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  quality: { type: String, enum: ['GOOD', 'SUSPECT', 'BAD'], default: 'GOOD' },
  timestamp: { type: Date, required: true, index: true }
}, { timestamps: true });

measurementSchema.index({ facilityId: 1, metric: 1, timestamp: -1 });

module.exports = mongoose.model('Measurement', measurementSchema);

const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  reductionTons: { type: Number, required: true },
  completionStatus: { 
    type: String, 
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'IN_PROGRESS' 
  }
});

const emissionTargetSchema = new mongoose.Schema({
  targetId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  scopeCoverage: { type: String, default: 'Scope 1 & Scope 2 (Market-Based)' },
  baselineYear: { type: Number, required: true },
  baselineEmissionsTons: { type: Number, required: true },
  targetYear: { type: Number, required: true },
  targetEmissionsTons: { type: Number, required: true },
  currentEmissionsTons: { type: Number, required: true },
  progressPercent: { type: Number, required: true },
  trajectoryStatus: { 
    type: String, 
    enum: ['ON_TRACK', 'REQUIRES_ATTENTION', 'OFF_TRACK'],
    default: 'ON_TRACK' 
  },
  initiatives: [initiativeSchema]
}, { timestamps: true });

module.exports = mongoose.model('EmissionTarget', emissionTargetSchema);

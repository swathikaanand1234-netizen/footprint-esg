const mongoose = require('mongoose');

const monthlyMetricSchema = new mongoose.Schema({
  metricId: { type: String, required: true, unique: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  facilityId: { type: String, required: true, index: true },
  facilityName: { type: String, required: true },
  reportingPeriod: { type: String, required: true }, // YYYY-MM
  productionOutputTons: { type: Number, required: true },
  scope1EmissionsTons: { type: Number, required: true },
  scope2EmissionsTons: { type: Number, required: true },
  totalEmissionsTons: { type: Number, required: true },
  emissionIntensity: { type: Number, required: true }, // tCO2e / ton
  electricityConsumptionMWh: { type: Number, required: true },
  renewableElectricityMWh: { type: Number, required: true },
  naturalGasMMBtu: { type: Number, required: true },
  waterWithdrawalM3: { type: Number, required: true },
  waterRecycledM3: { type: Number, required: true },
  wasteGeneratedTons: { type: Number, required: true },
  wasteDivertedTons: { type: Number, required: true },
  wasteDiversionRatePercent: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'AUDIT_LOCKED'],
    default: 'DRAFT' 
  },
  submittedBy: { type: String, default: null },
  submissionDate: { type: Date, default: null },
  approvedBy: { type: String, default: null },
  approvalDate: { type: Date, default: null },
  rejectedBy: { type: String, default: null },
  rejectionReason: { type: String, default: null },
  rejectionDate: { type: Date, default: null },
  isSynthetic: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { timestamps: true });

monthlyMetricSchema.index({ facilityId: 1, reportingPeriod: 1 });

module.exports = mongoose.model('MonthlyMetric', monthlyMetricSchema);

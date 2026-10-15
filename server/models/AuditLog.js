const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now, index: true },
  actor: {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, required: true }
  },
  action: {
    type: String,
    required: true,
    enum: [
      'RECORD_CREATE',
      'RECORD_UPDATE',
      'RECORD_SUBMIT',
      'RECORD_APPROVE',
      'RECORD_REJECT',
      'RECORD_LOCK',
      'TELEMETRY_INGEST',
      'BATCH_IMPORT',
      'REPORT_EXPORT'
    ]
  },
  entityType: { type: String, required: true }, // e.g. 'MonthlyMetric', 'Measurement', 'BatchImport'
  entityId: { type: String, required: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  facilityId: { type: String, default: null },
  changes: { type: mongoose.Schema.Types.Mixed, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

auditLogSchema.index({ entityId: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

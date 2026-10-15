const mongoose = require('mongoose');

const auditRecordSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  facilityId: { type: String, required: true },
  facilityName: { type: String, required: true },
  standard: { type: String, required: true },
  auditorOrg: { type: String, required: true },
  leadAuditor: { type: String, required: true },
  assuranceLevel: { type: String, enum: ['LIMITED_ASSURANCE', 'REASONABLE_ASSURANCE'], default: 'LIMITED_ASSURANCE' },
  status: { type: String, enum: ['VERIFIED_COMPLIANT', 'QUALIFIED_OPINION', 'AUDIT_IN_PROGRESS'], default: 'VERIFIED_COMPLIANT' },
  auditPeriod: { type: String, required: true },
  auditDate: { type: Date, required: true },
  findingsCount: { type: Number, default: 0 },
  statementSummary: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AuditRecord', auditRecordSchema);

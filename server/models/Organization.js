const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  reportingCurrency: { type: String, default: 'USD' },
  country: { type: String, default: 'USA' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);

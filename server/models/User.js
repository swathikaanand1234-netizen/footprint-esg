const mongoose = require('mongoose');

const ROLES = [
  'SUSTAINABILITY_MANAGER',
  'PLANT_COORDINATOR',
  'PLANT_MANAGER',
  'EXECUTIVE',
  'AUDITOR',
  'SYSTEM_ADMIN'
];

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { 
    type: String, 
    required: true, 
    enum: ROLES 
  },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  assignedFacilities: [{ type: String }], // Scoped facility IDs (for coordinator / plant manager)
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);

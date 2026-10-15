const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  facilityId: { type: String, required: true, unique: true },
  organizationId: { type: String, required: true, default: 'ORG-GLOBAL-01', index: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  region: { type: String, enum: ['NORTH_AMERICA', 'EUROPE', 'ASIA_PACIFIC'], default: 'NORTH_AMERICA' },
  facilityType: { 
    type: String, 
    enum: ['AUTOMOTIVE_ASSEMBLY', 'BATTERY_GIGAFACTORY', 'ALUMINUM_CASTING', 'POWERTRAIN_PLANT'],
    default: 'AUTOMOTIVE_ASSEMBLY' 
  },
  gridEmissionFactor: { type: Number, required: true }, // kg CO2e / kWh
  renewableEnergySharePercent: { type: Number, default: 50.0 },
  annualProductionUnits: { type: Number, required: true },
  headcount: { type: Number, default: 1200 },
  iso14001Certified: { type: Boolean, default: true },
  targetNetZeroYear: { type: Number, default: 2030 }
}, { timestamps: true });

module.exports = mongoose.model('Facility', facilitySchema);

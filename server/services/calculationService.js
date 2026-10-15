/**
 * Calculation Engine for FootprintESG
 * Enforces PR-10, PR-11, FR-033, FR-034, FR-035, FR-036
 */

const KPI_CATALOG = {
  CARBON_INTENSITY: {
    name: 'Carbon Intensity',
    formula: 'total_emissions_tCO2e / production_tons',
    unit: 'tCO2e / ton',
    direction: 'LOWER_IS_BETTER'
  },
  RENEWABLE_POWER_SHARE: {
    name: 'Renewable Power Share',
    formula: '(renewable_MWh / total_electricity_MWh) * 100',
    unit: '%',
    direction: 'HIGHER_IS_BETTER'
  },
  WATER_RECYCLE_RATE: {
    name: 'Water Recycle Rate',
    formula: '(recycled_m3 / withdrawal_m3) * 100',
    unit: '%',
    direction: 'HIGHER_IS_BETTER'
  },
  WASTE_DIVERSION_RATE: {
    name: 'Zero-Waste Diversion Rate',
    formula: '(diverted_tons / generated_tons) * 100',
    unit: '%',
    direction: 'HIGHER_IS_BETTER'
  },
  ENERGY_INTENSITY: {
    name: 'Energy Intensity',
    formula: 'electricity_MWh / production_tons',
    unit: 'MWh / ton',
    direction: 'LOWER_IS_BETTER'
  }
};

/**
 * Total energy calculation and intensity
 */
function calculateEnergyIntensity(electricityMWh, productionTons) {
  if (!productionTons || Number(productionTons) <= 0) {
    return { value: null, isAvailable: false, reason: 'Zero or missing production denominator' };
  }
  const intensity = +(Number(electricityMWh) / Number(productionTons)).toFixed(4);
  return { value: intensity, isAvailable: true };
}

/**
 * Renewable electricity percentage
 */
function calculateRenewableShare(renewableMWh, totalMWh) {
  if (!totalMWh || Number(totalMWh) <= 0) {
    return { value: 0, isAvailable: false, reason: 'Zero total electricity consumption' };
  }
  const share = +((Number(renewableMWh) / Number(totalMWh)) * 100).toFixed(1);
  return { value: Math.min(100, Math.max(0, share)), isAvailable: true };
}

/**
 * Water recycling rate
 */
function calculateWaterRecycleRate(recycledM3, withdrawalM3) {
  if (!withdrawalM3 || Number(withdrawalM3) <= 0) {
    return { value: 0, isAvailable: false, reason: 'Zero water withdrawal' };
  }
  const rate = +((Number(recycledM3) / Number(withdrawalM3)) * 100).toFixed(1);
  return { value: Math.min(100, Math.max(0, rate)), isAvailable: true };
}

/**
 * Waste diversion rate
 */
function calculateWasteDiversionRate(divertedTons, generatedTons) {
  if (!generatedTons || Number(generatedTons) <= 0) {
    return { value: 0, isAvailable: false, reason: 'Zero waste generated' };
  }
  const rate = +((Number(divertedTons) / Number(generatedTons)) * 100).toFixed(1);
  return { value: Math.min(100, Math.max(0, rate)), isAvailable: true };
}

/**
 * Emissions calculation = Activity Data * Factor
 */
function calculateEmissionAmount(activityAmount, factorValue) {
  const amount = Number(activityAmount) || 0;
  const factor = Number(factorValue) || 0;
  return +(amount * factor).toFixed(4);
}

/**
 * Emission Intensity per production unit
 */
function calculateEmissionIntensity(totalEmissionsTons, productionTons) {
  if (!productionTons || Number(productionTons) <= 0) {
    return { value: null, isAvailable: false, reason: 'Zero or missing production denominator' };
  }
  const intensity = +(Number(totalEmissionsTons) / Number(productionTons)).toFixed(4);
  return { value: intensity, isAvailable: true };
}

/**
 * Trend % calculation: (current - previous) / previous * 100
 * Handles zero/missing previous values explicitly (PR-11, FR-034)
 */
function calculateTrendPercent(currentVal, previousVal) {
  if (previousVal === null || previousVal === undefined || Number(previousVal) === 0) {
    return { percent: null, isAvailable: false, reason: 'Previous period baseline unavailable or zero' };
  }
  const curr = Number(currentVal);
  const prev = Number(previousVal);
  const pct = +(((curr - prev) / prev) * 100).toFixed(1);
  return { percent: pct, isAvailable: true };
}

module.exports = {
  KPI_CATALOG,
  calculateEnergyIntensity,
  calculateRenewableShare,
  calculateWaterRecycleRate,
  calculateWasteDiversionRate,
  calculateEmissionAmount,
  calculateEmissionIntensity,
  calculateTrendPercent
};

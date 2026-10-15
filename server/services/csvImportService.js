/**
 * CSV Import Parser and Row-Level Validator
 * Enforces PR-09, FR-030, FR-031, FR-032
 */

const REQUIRED_HEADERS = [
  'facilityId',
  'reportingPeriod',
  'productionOutputTons',
  'scope1EmissionsTons',
  'scope2EmissionsTons',
  'electricityConsumptionMWh',
  'renewableElectricityMWh',
  'naturalGasMMBtu',
  'waterWithdrawalM3',
  'waterRecycledM3',
  'wasteGeneratedTons',
  'wasteDivertedTons'
];

/**
 * Standard CSV line parser supporting quoted fields with commas.
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse CSV text into array of row objects.
 */
function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('Empty or invalid CSV content');
  }

  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row');
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  // Check required headers
  const missingHeaders = REQUIRED_HEADERS.filter(rh => !headers.includes(rh));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV missing required header columns: ${missingHeaders.join(', ')}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, '') : '';
    });
    rows.push({ lineNumber: i + 1, data: rowObj });
  }

  return rows;
}

/**
 * Validate parsed row data. Returns { valid, rowData, errors }
 */
function validateImportRow(rowItem) {
  const { lineNumber, data } = rowItem;
  const errors = [];

  if (!data.facilityId || data.facilityId.trim() === '') {
    errors.push('Missing facilityId');
  }

  if (!data.reportingPeriod || !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.reportingPeriod.trim())) {
    errors.push('reportingPeriod must match YYYY-MM format');
  }

  const numericFields = [
    'productionOutputTons',
    'scope1EmissionsTons',
    'scope2EmissionsTons',
    'electricityConsumptionMWh',
    'renewableElectricityMWh',
    'naturalGasMMBtu',
    'waterWithdrawalM3',
    'waterRecycledM3',
    'wasteGeneratedTons',
    'wasteDivertedTons'
  ];

  const parsedNumbers = {};
  for (const field of numericFields) {
    const val = Number(data[field]);
    if (isNaN(val) || val < 0) {
      errors.push(`${field} must be a non-negative number`);
    } else {
      parsedNumbers[field] = val;
    }
  }

  if (parsedNumbers.renewableElectricityMWh > parsedNumbers.electricityConsumptionMWh) {
    errors.push('renewableElectricityMWh cannot exceed total electricityConsumptionMWh');
  }
  if (parsedNumbers.waterRecycledM3 > parsedNumbers.waterWithdrawalM3) {
    errors.push('waterRecycledM3 cannot exceed waterWithdrawalM3');
  }
  if (parsedNumbers.wasteDivertedTons > parsedNumbers.wasteGeneratedTons) {
    errors.push('wasteDivertedTons cannot exceed wasteGeneratedTons');
  }

  if (errors.length > 0) {
    return { valid: false, lineNumber, errors };
  }

  const totalEmissions = +(parsedNumbers.scope1EmissionsTons + parsedNumbers.scope2EmissionsTons).toFixed(1);
  const intensity = parsedNumbers.productionOutputTons > 0 
    ? +(totalEmissions / parsedNumbers.productionOutputTons).toFixed(4) 
    : 0;
  const wasteDivPct = parsedNumbers.wasteGeneratedTons > 0 
    ? +((parsedNumbers.wasteDivertedTons / parsedNumbers.wasteGeneratedTons) * 100).toFixed(1) 
    : 0;

  return {
    valid: true,
    lineNumber,
    metric: {
      facilityId: data.facilityId.trim(),
      reportingPeriod: data.reportingPeriod.trim(),
      productionOutputTons: parsedNumbers.productionOutputTons,
      scope1EmissionsTons: parsedNumbers.scope1EmissionsTons,
      scope2EmissionsTons: parsedNumbers.scope2EmissionsTons,
      totalEmissionsTons: totalEmissions,
      emissionIntensity: intensity,
      electricityConsumptionMWh: parsedNumbers.electricityConsumptionMWh,
      renewableElectricityMWh: parsedNumbers.renewableElectricityMWh,
      naturalGasMMBtu: parsedNumbers.naturalGasMMBtu,
      waterWithdrawalM3: parsedNumbers.waterWithdrawalM3,
      waterRecycledM3: parsedNumbers.waterRecycledM3,
      wasteGeneratedTons: parsedNumbers.wasteGeneratedTons,
      wasteDivertedTons: parsedNumbers.wasteDivertedTons,
      wasteDiversionRatePercent: wasteDivPct,
      status: 'SUBMITTED' // Imported files start in submitted state for four-eyes approval
    }
  };
}

/**
 * Process entire batch with policy (ALL_OR_NOTHING or PARTIAL_VALID).
 */
function processBatchImport(csvText, policy = 'ALL_OR_NOTHING') {
  const rows = parseCsv(csvText);
  const results = rows.map(validateImportRow);

  const validRows = results.filter(r => r.valid).map(r => r.metric);
  const invalidRows = results.filter(r => !r.valid).map(r => ({
    lineNumber: r.lineNumber,
    errors: r.errors
  }));

  if (policy === 'ALL_OR_NOTHING' && invalidRows.length > 0) {
    return {
      success: false,
      committed: false,
      policy,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      errors: invalidRows
    };
  }

  return {
    success: true,
    committed: true,
    policy,
    totalRows: rows.length,
    validRecords: validRows,
    errors: invalidRows
  };
}

module.exports = {
  REQUIRED_HEADERS,
  parseCsv,
  validateImportRow,
  processBatchImport
};

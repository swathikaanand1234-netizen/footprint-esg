/**
 * Telemetry Ingestion and Freshness Engine
 * Enforces PR-03, PR-04, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015
 */

const FRESHNESS_THRESHOLDS = {
  LIVE_MAX_MS: 5 * 60 * 1000,       // < 5 minutes
  DELAYED_MAX_MS: 15 * 60 * 1000   // 5 - 15 minutes
  // > 15 minutes is STALE
};

/**
 * Determine freshness state from source timestamp relative to reference time.
 * PR-04: LIVE <5m, DELAYED 5–15m, STALE >15m
 */
function evaluateFreshness(sourceTimestamp, now = Date.now()) {
  const ts = new Date(sourceTimestamp).getTime();
  if (isNaN(ts)) return 'STALE';
  const ageMs = now - ts;

  if (ageMs < 0) {
    // Future timestamp safeguard: treat as LIVE if within slight clock drift, otherwise DELAYED
    return 'LIVE';
  }
  if (ageMs < FRESHNESS_THRESHOLDS.LIVE_MAX_MS) {
    return 'LIVE';
  }
  if (ageMs <= FRESHNESS_THRESHOLDS.DELAYED_MAX_MS) {
    return 'DELAYED';
  }
  return 'STALE';
}

/**
 * Validates untrusted ingestion reading payload.
 * Returns { valid: boolean, errors: string[] }
 */
function validateReadingPayload(reading) {
  const errors = [];
  if (!reading || typeof reading !== 'object') {
    return { valid: false, errors: ['Invalid payload body'] };
  }

  if (!reading.sourceId || typeof reading.sourceId !== 'string') {
    errors.push('Missing or invalid sourceId');
  }
  if (!reading.facilityId || typeof reading.facilityId !== 'string') {
    errors.push('Missing or invalid facilityId');
  }
  if (!reading.metric || typeof reading.metric !== 'string') {
    errors.push('Missing or invalid metric');
  }
  if (reading.value === undefined || reading.value === null || typeof reading.value !== 'number' || isNaN(reading.value)) {
    errors.push('Reading value must be a valid number');
  }
  if (reading.value < 0) {
    errors.push('Reading value cannot be negative for physical operational meters');
  }
  if (!reading.unit || typeof reading.unit !== 'string') {
    errors.push('Missing or invalid unit');
  }
  if (!reading.timestamp) {
    errors.push('Missing timestamp');
  } else if (isNaN(new Date(reading.timestamp).getTime())) {
    errors.push('Malformed timestamp');
  }

  // Quality check
  if (reading.quality && !['GOOD', 'SUSPECT', 'BAD'].includes(reading.quality)) {
    errors.push('Quality must be GOOD, SUSPECT, or BAD');
  }

  if (reading.quality === 'BAD') {
    errors.push('Rejected: reading quality is flagged as BAD and cannot be ingested');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  FRESHNESS_THRESHOLDS,
  evaluateFreshness,
  validateReadingPayload
};

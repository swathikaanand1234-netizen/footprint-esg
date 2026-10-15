/**
 * Workflow and State Transition Engine for Environmental Records
 * Enforces PR-07, PR-08, FR-023-FR-029, and FR-004
 */

const ALLOWED_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  REJECTED: ['DRAFT', 'SUBMITTED'],
  APPROVED: ['AUDIT_LOCKED'],
  AUDIT_LOCKED: [] // Immutable
};

const APPROVAL_ROLES = ['SUSTAINABILITY_MANAGER', 'AUDITOR'];
const SUBMISSION_ROLES = ['SUSTAINABILITY_MANAGER', 'PLANT_COORDINATOR'];

/**
 * Validates whether a status transition is permitted given current status and actor role.
 */
function validateTransition(currentStatus, targetStatus, actor) {
  if (!actor || !actor.role) {
    return { valid: false, error: 'Unauthorized: actor identity required' };
  }

  // FR-004: System admin cannot edit or approve sustainability records
  if (actor.role === 'SYSTEM_ADMIN') {
    return { valid: false, error: 'System Administrator role does not grant sustainability-record edit or approval privileges' };
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition: cannot move record from '${currentStatus}' to '${targetStatus}'`
    };
  }

  // Check role authorization for target status
  if (['APPROVED', 'AUDIT_LOCKED'].includes(targetStatus)) {
    if (!APPROVAL_ROLES.includes(actor.role)) {
      return {
        valid: false,
        error: `Role '${actor.role}' is not authorized to approve or lock records`
      };
    }
  }

  if (targetStatus === 'REJECTED') {
    if (!APPROVAL_ROLES.includes(actor.role)) {
      return {
        valid: false,
        error: `Role '${actor.role}' is not authorized to reject records`
      };
    }
  }

  if (targetStatus === 'SUBMITTED') {
    if (!SUBMISSION_ROLES.includes(actor.role)) {
      return {
        valid: false,
        error: `Role '${actor.role}' is not authorized to submit records for review`
      };
    }
  }

  return { valid: true };
}

/**
 * Check if a record is immutable
 */
function isRecordImmutable(record) {
  return record && (record.status === 'AUDIT_LOCKED' || record.status === 'APPROVED');
}

module.exports = {
  ALLOWED_TRANSITIONS,
  APPROVAL_ROLES,
  SUBMISSION_ROLES,
  validateTransition,
  isRecordImmutable
};

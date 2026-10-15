const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateTransition, isRecordImmutable } = require('../services/workflowService');

describe('Workflow & Approval State Machine', () => {
  const manager = { role: 'SUSTAINABILITY_MANAGER', username: 'sarah.lin' };
  const coordinator = { role: 'PLANT_COORDINATOR', username: 'elena.rostova' };
  const admin = { role: 'SYSTEM_ADMIN', username: 'sysadmin' };
  const executive = { role: 'EXECUTIVE', username: 'ceo' };

  it('allows coordinator to submit a draft', () => {
    const res = validateTransition('DRAFT', 'SUBMITTED', coordinator);
    assert.equal(res.valid, true);
  });

  it('allows sustainability manager to approve a submitted record', () => {
    const res = validateTransition('SUBMITTED', 'APPROVED', manager);
    assert.equal(res.valid, true);
  });

  it('allows sustainability manager to lock an approved record', () => {
    const res = validateTransition('APPROVED', 'AUDIT_LOCKED', manager);
    assert.equal(res.valid, true);
  });

  it('prohibits system admin from approving sustainability records (FR-004)', () => {
    const res = validateTransition('SUBMITTED', 'APPROVED', admin);
    assert.equal(res.valid, false);
    assert.match(res.error, /System Administrator role does not grant/i);
  });

  it('prohibits executive or coordinator from approving records', () => {
    const res1 = validateTransition('SUBMITTED', 'APPROVED', coordinator);
    assert.equal(res1.valid, false);

    const res2 = validateTransition('SUBMITTED', 'APPROVED', executive);
    assert.equal(res2.valid, false);
  });

  it('rejects invalid state jumps', () => {
    // Cannot jump DRAFT directly to APPROVED
    const res1 = validateTransition('DRAFT', 'APPROVED', manager);
    assert.equal(res1.valid, false);
    assert.match(res1.error, /Invalid transition/i);

    // Cannot modify AUDIT_LOCKED
    const res2 = validateTransition('AUDIT_LOCKED', 'DRAFT', manager);
    assert.equal(res2.valid, false);
  });

  it('identifies immutable states accurately', () => {
    assert.equal(isRecordImmutable({ status: 'AUDIT_LOCKED' }), true);
    assert.equal(isRecordImmutable({ status: 'APPROVED' }), true);
    assert.equal(isRecordImmutable({ status: 'DRAFT' }), false);
    assert.equal(isRecordImmutable({ status: 'SUBMITTED' }), false);
  });
});

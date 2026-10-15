const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, generateToken, verifyToken } = require('../utils/auth');
const { checkFacilityAccess } = require('../middleware/auth');

describe('Auth Utilities & RBAC', () => {
  it('hashes password and verifies correctly', () => {
    const pwd = 'CorrectHorseBatteryStaple123!';
    const { salt, hash } = hashPassword(pwd);
    assert.ok(salt);
    assert.ok(hash);
    assert.equal(verifyPassword(pwd, salt, hash), true);
    assert.equal(verifyPassword('WrongPassword', salt, hash), false);
  });

  it('generates signed token and verifies payload', () => {
    const payload = {
      userId: 'USR-01',
      username: 'sarah.lin',
      role: 'SUSTAINABILITY_MANAGER',
      organizationId: 'ORG-GLOBAL-01'
    };
    const token = generateToken(payload);
    assert.ok(token);

    const verified = verifyToken(token);
    assert.equal(verified.userId, 'USR-01');
    assert.equal(verified.role, 'SUSTAINABILITY_MANAGER');
    assert.equal(verified.organizationId, 'ORG-GLOBAL-01');
    assert.ok(verified.exp);
  });

  it('rejects tampered or malformed tokens', () => {
    const token = generateToken({ userId: 'USR-01' });
    const tampered = token.slice(0, -4) + 'abcd';
    assert.equal(verifyToken(tampered), null);
    assert.equal(verifyToken('not.a.valid.token'), null);
    assert.equal(verifyToken(''), null);
    assert.equal(verifyToken(null), null);
  });

  it('evaluates facility scoping correctly for org-wide vs plant-scoped roles', () => {
    const manager = { role: 'SUSTAINABILITY_MANAGER', organizationId: 'ORG-GLOBAL-01' };
    const coordinator = { 
      role: 'PLANT_COORDINATOR', 
      organizationId: 'ORG-GLOBAL-01', 
      assignedFacilities: ['FAC-ATX-01'] 
    };

    // Manager can access all facilities in org
    assert.equal(checkFacilityAccess(manager, 'FAC-ATX-01'), true);
    assert.equal(checkFacilityAccess(manager, 'FAC-STR-02'), true);

    // Coordinator can only access assigned facilities
    assert.equal(checkFacilityAccess(coordinator, 'FAC-ATX-01'), true);
    assert.equal(checkFacilityAccess(coordinator, 'FAC-STR-02'), false);
  });
});

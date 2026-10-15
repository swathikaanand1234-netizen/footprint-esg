const { verifyToken } = require('../utils/auth');

/**
 * Express middleware to authenticate requests via Bearer token.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication middleware for backward-compatible/demo routes
 * (attaches req.user if valid token provided, does not fail if omitted).
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

/**
 * Restrict access to specific roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks permission for this operation`
      });
    }
    next();
  };
}

/**
 * Enforce facility-level access control.
 * Organization-wide roles (SUSTAINABILITY_MANAGER, EXECUTIVE, AUDITOR) can access all org facilities.
 * Facility-scoped roles (PLANT_COORDINATOR, PLANT_MANAGER) can only access assigned facilities.
 */
function checkFacilityAccess(user, facilityId) {
  if (!user || !facilityId) return false;
  const orgWideRoles = ['SUSTAINABILITY_MANAGER', 'EXECUTIVE', 'AUDITOR'];
  if (orgWideRoles.includes(user.role)) return true;
  if (Array.isArray(user.assignedFacilities) && user.assignedFacilities.includes(facilityId)) {
    return true;
  }
  return false;
}

function requireFacilityScope(getFacilityId = (req) => req.params.facilityId || req.body.facilityId || req.query.facilityId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const facilityId = getFacilityId(req);
    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'Facility ID is required' });
    }

    if (!checkFacilityAccess(req.user, facilityId)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: not authorized for facility ${facilityId}`
      });
    }
    next();
  };
}

/**
 * Safe error handler that prevents stack trace or credential leakage.
 */
function safeErrorHandler(err, req, res, next) {
  console.error('[API Error]:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'An unexpected server error occurred' : err.message
  });
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole,
  requireFacilityScope,
  checkFacilityAccess,
  safeErrorHandler
};

const crypto = require('crypto');

let resolvedTokenSecret = process.env.TOKEN_SECRET;
if (!resolvedTokenSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TOKEN_SECRET must be configured in production environment');
  }
  resolvedTokenSecret = 'footprint-esg-insecure-default-secret-key-change-in-prod';
}
const TOKEN_SECRET = resolvedTokenSecret;
const TOKEN_TTL_HOURS = 24;

/**
 * Hash a plain text password with a unique cryptographic salt using scrypt.
 */
function hashPassword(password, salt = null) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, generatedSalt, 64);
  return {
    salt: generatedSalt,
    hash: derivedKey.toString('hex')
  };
}

/**
 * Verify a password against stored salt and hash using timing-safe comparison.
 */
function verifyPassword(password, salt, storedHash) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const hashBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (hashBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
}

/**
 * Generate a signed stateless token (header.payload.signature) using HMAC SHA-256.
 */
function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (TOKEN_TTL_HOURS * 3600);
  const fullPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a signed token and return the payload, or null if invalid/expired.
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature.length !== expectedSignature.length) return null;
  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);
  if (!crypto.timingSafeEqual(sigBuf, expSigBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};

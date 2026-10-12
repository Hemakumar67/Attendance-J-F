const jwt = require('jsonwebtoken');
const { query } = require('../db/database');
const { getUserPermissions } = require('../domain/accessControl');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance-gaps-secret-key-2026';

function generateTestToken(email, issuerUrl, expiresIn = '1h') {
  return jwt.sign(
    {
      sub: email,
      email,
      iss: issuerUrl,
      aud: 'attendance-gaps-app'
    },
    JWT_SECRET,
    { expiresIn }
  );
}

async function verifyTokenAndGetUser(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired token');
  }

  if (decoded.aud !== 'attendance-gaps-app') {
    throw new Error('Token audience mismatch');
  }

  const email = decoded.email;
  if (!email) {
    throw new Error('Token missing email claim');
  }

  // Lookup employee in DB
  const empRes = await query(
    `SELECT e.id, e.company_id as "companyId", e.name, e.email, e.role_id as "roleId", 
            to_char(e.left_on, 'YYYY-MM-DD') as "leftOn", c.issuer_url as "issuerUrl", c.email_domain as "emailDomain"
     FROM employees e
     JOIN companies c ON e.company_id = c.id
     WHERE e.email = $1`,
    [email]
  );

  if (empRes.rows.length === 0) {
    throw new Error('Unknown email address');
  }

  const emp = empRes.rows[0];

  // Verify Issuer matches company configuration
  if (decoded.iss !== emp.issuerUrl) {
    throw new Error('Issuer mismatch for caller company');
  }

  // Verify Email domain matches company email_domain
  const domain = email.split('@')[1];
  if (domain !== emp.emailDomain) {
    throw new Error('Email domain mismatch for company');
  }

  // Verify employee left_on date hasn't passed
  if (emp.leftOn) {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    if (emp.leftOn < todayStr) {
      throw new Error('Employee has left the company');
    }
  }

  // Fetch permissions for role
  const permissions = await getUserPermissions(emp.roleId);

  return {
    id: emp.id,
    email: emp.email,
    companyId: emp.companyId,
    roleId: emp.roleId,
    permissions
  };
}

module.exports = {
  generateTestToken,
  verifyTokenAndGetUser
};

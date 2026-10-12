const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { query, getDbPool } = require('./db/database');
const { seedDatabase } = require('./db/seed');
const { generateTestToken, verifyTokenAndGetUser } = require('./auth/jwtVerifier');
const { handleGetMe } = require('./handlers/getMe');
const { handleGetSummary } = require('./handlers/getSummary');
const { handlePostAttendance } = require('./handlers/postAttendance');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

async function ensureSeeded() {
  await getDbPool();
  const res = await query('SELECT count(*)::int as cnt FROM companies');
  if (res.rows[0].cnt === 0) {
    await seedDatabase();
  }
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const userContext = await verifyTokenAndGetUser(token);
    req.user = userContext;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }
}

// Simulated OIDC login flow
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const domain = email.split('@')[1];
  if (!domain) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const compRes = await query(
    `SELECT id, name, issuer_url as "issuerUrl" FROM companies WHERE email_domain = $1`,
    [domain]
  );

  if (compRes.rows.length === 0) {
    return res.status(404).json({ error: `No company found for email domain '@${domain}'` });
  }

  const company = compRes.rows[0];

  const empRes = await query(
    `SELECT id, name, role_id as "roleId", to_char(left_on, 'YYYY-MM-DD') as "leftOn" FROM employees WHERE email = $1`,
    [email]
  );

  if (empRes.rows.length === 0) {
    return res.status(404).json({ error: 'Employee not found in company system' });
  }

  const emp = empRes.rows[0];
  if (emp.leftOn) {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    if (emp.leftOn < todayStr) {
      return res.status(403).json({ error: 'Employee has left the company' });
    }
  }

  const token = generateTestToken(email, company.issuerUrl);
  return res.json({
    token,
    user: {
      id: emp.id,
      name: emp.name,
      email,
      role: emp.roleId,
      companyId: company.id,
      companyName: company.name
    }
  });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await handleGetMe(req.user);
    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/summary', authMiddleware, async (req, res) => {
  try {
    const result = await handleGetSummary(req.user, req.query);
    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', authMiddleware, async (req, res) => {
  try {
    const result = await handlePostAttendance(req.user, req.body);
    return res.status(result.statusCode).json(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  ensureSeeded().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;

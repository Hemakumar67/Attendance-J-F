const { query } = require('../db/database');

async function handleGetMe(user) {
  const compRes = await query(
    `SELECT id, name, email_domain as "emailDomain", deduct_unaccounted as "deductUnaccounted"
     FROM companies WHERE id = $1`,
    [user.companyId]
  );

  const empRes = await query(
    `SELECT id, name, email, region, role_id as "roleId" FROM employees WHERE id = $1`,
    [user.id]
  );

  return {
    statusCode: 200,
    body: {
      user: empRes.rows[0],
      company: compRes.rows[0],
      permissions: user.permissions
    }
  };
}

module.exports = { handleGetMe };

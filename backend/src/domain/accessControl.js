const { query } = require('../db/database');

async function getUserPermissions(roleId) {
  const res = await query(
    `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
    [roleId]
  );
  return res.rows.map(r => r.permission_id);
}

async function getVisibleEmployees(user) {
  const permissions = user.permissions;
  const isCompanyRead = permissions.includes('summary:read:company');
  const isReportsRead = permissions.includes('summary:read:reports');
  const isSelfRead = permissions.includes('summary:read:self');

  if (isCompanyRead) {
    const res = await query(
      `SELECT id, company_id as "companyId", name, email, region, roster, 
              to_char(joined_on, 'YYYY-MM-DD') as "joinedOn", 
              to_char(left_on, 'YYYY-MM-DD') as "leftOn", 
              manager_id as "managerId", role_id as "roleId"
       FROM employees 
       WHERE company_id = $1
       ORDER BY id ASC`,
      [user.companyId]
    );
    return res.rows;
  }

  const employeeIds = new Set();

  if (isSelfRead) {
    employeeIds.add(user.id);
  }

  if (isReportsRead) {
    const reportsRes = await query(
      `SELECT id FROM employees WHERE manager_id = $1 AND company_id = $2`,
      [user.id, user.companyId]
    );
    reportsRes.rows.forEach(r => employeeIds.add(r.id));
  }

  if (employeeIds.size === 0) {
    return [];
  }

  const idsArray = Array.from(employeeIds);
  const placeholders = idsArray.map((_, i) => `$${i + 1}`).join(', ');
  
  const res = await query(
    `SELECT id, company_id as "companyId", name, email, region, roster, 
            to_char(joined_on, 'YYYY-MM-DD') as "joinedOn", 
            to_char(left_on, 'YYYY-MM-DD') as "leftOn", 
            manager_id as "managerId", role_id as "roleId"
     FROM employees 
     WHERE id IN (${placeholders}) AND company_id = $${idsArray.length + 1}
     ORDER BY id ASC`,
    [...idsArray, user.companyId]
  );

  return res.rows;
}

function canRecordAttendance(user, targetEmployee) {
  if (targetEmployee.companyId !== user.companyId) {
    return false;
  }

  const permissions = user.permissions;

  if (permissions.includes('attendance:write:company')) {
    return true;
  }

  if (permissions.includes('attendance:write:reports') && targetEmployee.managerId === user.id) {
    return true;
  }

  return false;
}

module.exports = {
  getUserPermissions,
  getVisibleEmployees,
  canRecordAttendance
};

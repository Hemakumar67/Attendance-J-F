const { query } = require('../db/database');
const { getVisibleEmployees, canRecordAttendance } = require('../domain/accessControl');

async function handlePostAttendance(user, body = {}) {
  const { employeeId, date, status } = body || {};

  if (!employeeId || !date || !status) {
    return {
      statusCode: 400,
      body: { error: 'Missing required fields: employeeId, date, status' }
    };
  }

  // Validate status
  const validStatuses = ['P', 'A', 'L', 'U', 'H'];
  if (!validStatuses.includes(status)) {
    return {
      statusCode: 400,
      body: { error: `Invalid status '${status}'. Must be one of: P, A, L, U, H.` }
    };
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      statusCode: 400,
      body: { error: 'Invalid date format. Expected YYYY-MM-DD.' }
    };
  }

  // Validate future date
  const todayKolkata = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
  if (date > todayKolkata) {
    return {
      statusCode: 400,
      body: { error: 'Cannot record attendance for a future date.' }
    };
  }

  // Check employee existence and visibility
  const visibleEmployees = await getVisibleEmployees(user);
  const targetEmp = visibleEmployees.find(e => e.id === employeeId);

  if (!targetEmp) {
    const empExistsRes = await query(
      `SELECT id FROM employees WHERE id = $1`,
      [employeeId]
    );

    if (empExistsRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: { error: 'Employee not found.' }
      };
    } else {
      // Outside caller's read set -> 404 as per section 4.2
      return {
        statusCode: 404,
        body: { error: 'Employee not found.' }
      };
    }
  }

  // Check write permission
  if (!canRecordAttendance(user, targetEmp)) {
    return {
      statusCode: 403,
      body: { error: 'Forbidden: You do not have permission to record attendance for this employee.' }
    };
  }

  // Check date inside employee window
  const windowStart = targetEmp.joinedOn;
  const windowEnd = targetEmp.leftOn || todayKolkata;

  if (date < windowStart || date > windowEnd) {
    return {
      statusCode: 400,
      body: { error: `Date ${date} is outside employee active window (${windowStart} to ${windowEnd}).` }
    };
  }

  try {
    await query(
      `INSERT INTO attendance (employee_id, attendance_date, status) VALUES ($1, $2, $3)`,
      [employeeId, date, status]
    );

    return {
      statusCode: 201,
      body: { message: 'Attendance recorded successfully.', employeeId, date, status }
    };
  } catch (err) {
    if (err.code === '23505' || err.message?.includes('duplicate key') || err.message?.includes('unique constraint') || err.message?.includes('violates unique constraint')) {
      return {
        statusCode: 409,
        body: { error: `Attendance record already exists for employee ${employeeId} on date ${date}.` }
      };
    }

    throw err;
  }
}

module.exports = { handlePostAttendance };

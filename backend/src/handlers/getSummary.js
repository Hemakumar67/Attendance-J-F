const { query } = require('../db/database');
const { getVisibleEmployees } = require('../domain/accessControl');
const { calculateEmployeeSummary } = require('../domain/attendanceCalculator');

async function handleGetSummary(user, queryParams = {}) {
  const monthStr = queryParams.month;
  const onlyGaps = queryParams.onlyGaps === 'true';

  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    return {
      statusCode: 400,
      body: { error: 'Malformed month parameter. Expected format YYYY-MM.' }
    };
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  if (month < 1 || month > 12) {
    return {
      statusCode: 400,
      body: { error: 'Invalid month value.' }
    };
  }

  // Check if month is after current month in Asia/Kolkata timezone
  const todayKolkata = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const [curYearStr, curMonthStr] = todayKolkata.split('-');
  const curYear = parseInt(curYearStr, 10);
  const curMonth = parseInt(curMonthStr, 10);

  if (year > curYear || (year === curYear && month > curMonth)) {
    return {
      statusCode: 400,
      body: { error: 'Summary for future months is not allowed.' }
    };
  }

  // Fetch company details
  const compRes = await query(
    `SELECT deduct_unaccounted FROM companies WHERE id = $1`,
    [user.companyId]
  );
  const deductUnaccounted = compRes.rows[0]?.deduct_unaccounted ?? false;

  // Fetch visible employees
  const visibleEmployees = await getVisibleEmployees(user);
  if (visibleEmployees.length === 0) {
    return {
      statusCode: 200,
      body: []
    };
  }

  const empIds = visibleEmployees.map(e => e.id);

  // Fetch regional holidays for company
  const holidaysRes = await query(
    `SELECT region, to_char(holiday_date, 'YYYY-MM-DD') as hdate 
     FROM regional_holidays 
     WHERE company_id = $1 AND to_char(holiday_date, 'YYYY-MM') = $2`,
    [user.companyId, monthStr]
  );

  const holidaysByRegion = new Map();
  holidaysRes.rows.forEach(r => {
    const arr = holidaysByRegion.get(r.region) || [];
    arr.push(r.hdate);
    holidaysByRegion.set(r.region, arr);
  });

  // Fetch attendance records for all visible employees in month
  const startDateStr = `${monthStr}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDateStr = `${monthStr}-${daysInMonth.toString().padStart(2, '0')}`;

  const placeholders = empIds.map((_, i) => `$${i + 1}`).join(', ');
  const attRes = await query(
    `SELECT employee_id, to_char(attendance_date, 'YYYY-MM-DD') as adate, status
     FROM attendance
     WHERE employee_id IN (${placeholders})
       AND attendance_date >= $${empIds.length + 1}::date 
       AND attendance_date <= $${empIds.length + 2}::date`,
    [...empIds, startDateStr, endDateStr]
  );

  const attMapByEmp = new Map();
  attRes.rows.forEach(r => {
    let empMap = attMapByEmp.get(r.employee_id);
    if (!empMap) {
      empMap = new Map();
      attMapByEmp.set(r.employee_id, empMap);
    }
    empMap.set(r.adate, r.status);
  });

  const summaries = [];

  for (const emp of visibleEmployees) {
    const empHolidays = holidaysByRegion.get(emp.region) || [];
    const empAttMap = attMapByEmp.get(emp.id) || new Map();

    const summary = calculateEmployeeSummary(
      emp,
      monthStr,
      deductUnaccounted,
      empHolidays,
      empAttMap,
      todayKolkata
    );

    if (summary) {
      if (!onlyGaps || summary.unaccountedDays > 0) {
        summaries.push(summary);
      }
    }
  }

  return {
    statusCode: 200,
    body: summaries
  };
}

module.exports = { handleGetSummary };

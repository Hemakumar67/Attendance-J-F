/**
 * Calculate monthly attendance summary for an employee.
 */
function calculateEmployeeSummary(
  employee,
  monthStr,
  deductUnaccounted,
  regionalHolidays,
  attendanceMap,
  referenceToday
) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error('Malformed month string');
  }

  const monthStart = `${yearStr}-${monthNumStr.padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${yearStr}-${monthNumStr.padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

  const todayStr = referenceToday || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });

  const windowStart = employee.joinedOn > monthStart ? employee.joinedOn : monthStart;

  let windowEnd = monthEnd;
  if (employee.leftOn && employee.leftOn < windowEnd) {
    windowEnd = employee.leftOn;
  }
  if (todayStr < windowEnd) {
    windowEnd = todayStr;
  }

  if (windowStart > windowEnd) {
    return null;
  }

  const holidaySet = new Set(regionalHolidays);
  const unaccountedDates = [];
  
  let calendarDays = 0;
  let scheduledDays = 0;
  let paidLeaveDays = 0;
  let countA = 0;
  let countU = 0;
  let countH = 0;

  const startDay = parseInt(windowStart.split('-')[2], 10);
  const endDay = parseInt(windowEnd.split('-')[2], 10);

  for (let day = startDay; day <= endDay; day++) {
    const dayPad = day < 10 ? '0' + day : '' + day;
    const dateStr = `${yearStr}-${monthNumStr.padStart(2, '0')}-${dayPad}`;
    calendarDays++;

    const dObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dObj.getUTCDay();

    const isRosterWorkDay = employee.roster === 'MON-SAT' 
      ? (dayOfWeek >= 1 && dayOfWeek <= 6)
      : (dayOfWeek >= 1 && dayOfWeek <= 5);

    const isHoliday = holidaySet.has(dateStr);
    const isScheduled = isRosterWorkDay && !isHoliday;

    if (isScheduled) {
      scheduledDays++;
    }

    const status = attendanceMap.get(dateStr);

    if (status) {
      if (status === 'L') paidLeaveDays++;
      else if (status === 'A') countA++;
      else if (status === 'U') countU++;
      else if (status === 'H') countH++;
    } else if (isScheduled) {
      unaccountedDates.push(dateStr);
    }
  }

  const unpaidDays = countA + countU + 0.5 * countH;
  const unaccountedDays = unaccountedDates.length;

  const payableDays = deductUnaccounted
    ? calendarDays - unpaidDays - unaccountedDays
    : calendarDays - unpaidDays;

  return {
    employeeId: employee.id,
    name: employee.name,
    region: employee.region,
    calendarDays,
    scheduledDays,
    paidLeaveDays,
    unpaidDays,
    unaccountedDays,
    unaccountedDates: unaccountedDates.sort(),
    payableDays: Math.max(0, payableDays)
  };
}

module.exports = { calculateEmployeeSummary };

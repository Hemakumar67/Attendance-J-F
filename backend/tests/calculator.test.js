const { calculateEmployeeSummary } = require('../src/domain/attendanceCalculator');

describe('Attendance Calculator Rules Engine', () => {
  const baseEmp = {
    id: 'E01',
    companyId: 'C1',
    name: 'Asha',
    email: 'asha@alder.example',
    region: 'NORTH',
    roster: 'MON-FRI',
    joinedOn: '2024-01-10',
    leftOn: null,
    managerId: 'M01',
    roleId: 'EMPLOYEE'
  };

  test('calculates correct summary for August 2026 without deduct_unaccounted', () => {
    const attMap = new Map();
    const recStr = '..PPLAP..PPPPP..P..PP..PP.PP..P';
    for (let d = 1; d <= 31; d++) {
      const char = recStr[d - 1];
      if (char && char !== '.') {
        const dateStr = `2026-08-${d < 10 ? '0' + d : d}`;
        attMap.set(dateStr, char);
      }
    }

    const regionalHolidays = ['2026-08-15', '2026-08-26'];

    const summary = calculateEmployeeSummary(
      baseEmp,
      '2026-08',
      false,
      regionalHolidays,
      attMap,
      '2026-08-31'
    );

    expect(summary).not.toBeNull();
    expect(summary.calendarDays).toBe(31);
    expect(summary.paidLeaveDays).toBe(1);
    expect(summary.unpaidDays).toBe(1);
    expect(summary.payableDays).toBe(30);
  });

  test('calculates correct summary with deduct_unaccounted = true (Birch Infra policy)', () => {
    const b01Emp = {
      id: 'B01',
      companyId: 'C2',
      name: 'Ivan',
      email: 'ivan@birch.example',
      region: 'COAST',
      roster: 'MON-FRI',
      joinedOn: '2024-03-01',
      leftOn: null,
      managerId: 'B02',
      roleId: 'PAYROLL_VIEWER'
    };

    const attMap = new Map();
    const recStr = '..PAPPP..PP.PP..PPPPP..P.PPP..P';
    for (let d = 1; d <= 31; d++) {
      const char = recStr[d - 1];
      if (char && char !== '.') {
        const dateStr = `2026-08-${d < 10 ? '0' + d : d}`;
        attMap.set(dateStr, char);
      }
    }

    const regionalHolidays = ['2026-08-12'];

    const summary = calculateEmployeeSummary(
      b01Emp,
      '2026-08',
      true,
      regionalHolidays,
      attMap,
      '2026-08-31'
    );

    expect(summary).not.toBeNull();
    expect(summary.calendarDays).toBe(31);
    expect(summary.payableDays).toBe(summary.calendarDays - summary.unpaidDays - summary.unaccountedDays);
  });

  test('handles employee joining mid-month', () => {
    const empMid = {
      ...baseEmp,
      id: 'E03',
      joinedOn: '2026-08-17'
    };

    const summary = calculateEmployeeSummary(
      empMid,
      '2026-08',
      false,
      [],
      new Map(),
      '2026-08-31'
    );

    expect(summary).not.toBeNull();
    expect(summary.calendarDays).toBe(15);
  });

  test('returns null when employee joined after target month', () => {
    const empFuture = {
      ...baseEmp,
      joinedOn: '2026-09-01'
    };

    const summary = calculateEmployeeSummary(
      empFuture,
      '2026-08',
      false,
      [],
      new Map(),
      '2026-08-31'
    );

    expect(summary).toBeNull();
  });
});

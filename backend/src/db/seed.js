const { query } = require('./database');

async function seedDatabase() {
  // Seed Companies
  await query(`
    INSERT INTO companies (id, name, email_domain, deduct_unaccounted, issuer_url)
    VALUES 
      ('C1', 'Alder Works', 'alder.example', false, 'http://localhost:4000/auth/c1'),
      ('C2', 'Birch Infra', 'birch.example', true, 'http://localhost:4000/auth/c2')
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      email_domain = EXCLUDED.email_domain,
      deduct_unaccounted = EXCLUDED.deduct_unaccounted,
      issuer_url = EXCLUDED.issuer_url
  `);

  // Seed Roles
  await query(`
    INSERT INTO roles (id, description)
    VALUES 
      ('EMPLOYEE', 'Standard employee role'),
      ('MANAGER', 'Team manager role'),
      ('HR_ADMIN', 'HR Administrator role'),
      ('PAYROLL_VIEWER', 'Payroll auditor role')
    ON CONFLICT (id) DO NOTHING
  `);

  // Seed Permissions
  await query(`
    INSERT INTO permissions (id, description)
    VALUES 
      ('summary:read:self', 'Seeing your own row'),
      ('summary:read:reports', 'Seeing your direct reports rows'),
      ('summary:read:company', 'Seeing everyone in your company'),
      ('attendance:write:reports', 'Recording attendance for your direct reports'),
      ('attendance:write:company', 'Recording attendance for anyone in your company')
    ON CONFLICT (id) DO NOTHING
  `);

  // Seed Role Permissions
  await query(`
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES 
      ('EMPLOYEE', 'summary:read:self'),
      ('MANAGER', 'summary:read:self'),
      ('MANAGER', 'summary:read:reports'),
      ('MANAGER', 'attendance:write:reports'),
      ('HR_ADMIN', 'summary:read:company'),
      ('HR_ADMIN', 'attendance:write:company'),
      ('PAYROLL_VIEWER', 'summary:read:company')
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `);

  // Seed Regional Holidays for August 2026
  await query(`
    INSERT INTO regional_holidays (region, company_id, holiday_date)
    VALUES 
      ('NORTH', 'C1', '2026-08-15'),
      ('NORTH', 'C1', '2026-08-26'),
      ('SOUTH', 'C1', '2026-08-28'),
      ('COAST', 'C2', '2026-08-12')
    ON CONFLICT (region, company_id, holiday_date) DO NOTHING
  `);

  // Seed Employees (managers first)
  await query(`
    INSERT INTO employees (id, company_id, name, email, region, roster, joined_on, left_on, manager_id, role_id)
    VALUES 
      ('M01', 'C1', 'Maya', 'maya@alder.example', 'NORTH', 'MON-FRI', '2020-01-06', NULL, NULL, 'MANAGER'),
      ('M02', 'C1', 'Omar', 'omar@alder.example', 'SOUTH', 'MON-FRI', '2019-04-01', NULL, NULL, 'MANAGER'),
      ('H01', 'C1', 'Hari', 'hari@alder.example', 'SOUTH', 'MON-FRI', '2018-09-01', NULL, NULL, 'HR_ADMIN'),
      ('B02', 'C2', 'Jaya', 'jaya@birch.example', 'COAST', 'MON-FRI', '2017-01-01', NULL, NULL, 'HR_ADMIN')
    ON CONFLICT (id) DO NOTHING
  `);

  await query(`
    INSERT INTO employees (id, company_id, name, email, region, roster, joined_on, left_on, manager_id, role_id)
    VALUES 
      ('E01', 'C1', 'Asha', 'asha@alder.example', 'NORTH', 'MON-FRI', '2024-01-10', NULL, 'M01', 'EMPLOYEE'),
      ('E02', 'C1', 'Ben', 'ben@alder.example', 'NORTH', 'MON-SAT', '2023-05-01', NULL, 'M01', 'EMPLOYEE'),
      ('E03', 'C1', 'Chitra', 'chitra@alder.example', 'SOUTH', 'MON-FRI', '2026-08-17', NULL, 'M02', 'EMPLOYEE'),
      ('E04', 'C1', 'Dev', 'dev@alder.example', 'SOUTH', 'MON-FRI', '2022-02-01', '2026-08-14', 'M02', 'EMPLOYEE'),
      ('E05', 'C1', 'Esha', 'esha@alder.example', 'NORTH', 'MON-FRI', '2026-08-10', '2026-08-21', 'M01', 'EMPLOYEE'),
      ('E06', 'C1', 'Farid', 'farid@alder.example', 'NORTH', 'MON-FRI', '2025-11-03', NULL, 'M01', 'EMPLOYEE'),
      ('E08', 'C1', 'Kiran', 'kiran@alder.example', 'NORTH', 'MON-FRI', '2021-06-01', '2026-07-20', 'M01', 'EMPLOYEE'),
      ('B01', 'C2', 'Ivan', 'ivan@birch.example', 'COAST', 'MON-FRI', '2024-03-01', NULL, 'B02', 'PAYROLL_VIEWER')
    ON CONFLICT (id) DO NOTHING
  `);

  // Seed August 2026 Attendance
  const attendanceData = {
    E01: '..PPLAP..PPPPP..P..PP..PP.PP..P',
    E02: 'P.PPPPPHPPPPPP..PPPPPP.PP.PPP.P',
    E03: '................PPPPP..PPPP....',
    E04: '..PPPUP..PPPP..................',
    E05: '.........PPUPP..P.PPP..........',
    E06: '...............................',
    E08: '...............................',
    M01: '..PPPPP..PPPPP..PPPPP..PP.PP..P',
    M02: '..PPPPP..PPPPP..PPPPP..PPPP...P',
    H01: '..PPPPP..PPPPP..PPPPP..PPPP...P',
    B01: '..PAPPP..PP.PP..PPPPP..P.PPP..P',
    B02: '..PPPPP..PP.PP..PPPPP..PPPPP..P'
  };

  for (const [empId, recordStr] of Object.entries(attendanceData)) {
    for (let day = 1; day <= 31; day++) {
      const statusChar = recordStr[day - 1];
      if (statusChar && statusChar !== '.') {
        const dateStr = `2026-08-${day < 10 ? '0' + day : day}`;
        await query(
          'INSERT INTO attendance (employee_id, attendance_date, status) VALUES ($1, $2, $3) ON CONFLICT (employee_id, attendance_date) DO NOTHING',
          [empId, dateStr, statusChar]
        );
      }
    }
  }

  console.log('Database seeded successfully.');
}

if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };

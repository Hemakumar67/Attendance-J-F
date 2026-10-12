const { query } = require('./database');
const { seedDatabase } = require('./seed');

async function seed2000Employees() {
  console.log('Seeding 2,000 employees for performance testing...');
  await seedDatabase();

  const batchSize = 250;
  const totalEmps = 2000;
  
  const regions = ['NORTH', 'SOUTH'];

  for (let i = 1; i <= totalEmps; i += batchSize) {
    const empValues = [];
    const params = [];
    let paramIdx = 1;

    for (let j = 0; j < batchSize && (i + j) <= totalEmps; j++) {
      const num = i + j;
      const empId = `BENCH_${num.toString().padStart(4, '0')}`;
      const name = `Test Employee ${num}`;
      const email = `bench_${num}@alder.example`;
      const region = regions[num % 2];
      const roster = num % 5 === 0 ? 'MON-SAT' : 'MON-FRI';
      const joinedOn = '2023-01-01';
      const managerId = num % 20 === 0 ? null : 'M01';
      const roleId = num % 20 === 0 ? 'MANAGER' : 'EMPLOYEE';

      empValues.push(`($${paramIdx}, 'C1', $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, NULL, $${paramIdx+6}, $${paramIdx+7})`);
      params.push(empId, name, email, region, roster, joinedOn, managerId, roleId);
      paramIdx += 8;
    }

    if (empValues.length > 0) {
      await query(
        `INSERT INTO employees (id, company_id, name, email, region, roster, joined_on, left_on, manager_id, role_id) VALUES ${empValues.join(', ')} ON CONFLICT (id) DO NOTHING`,
        params
      );
    }
  }

  console.log('Generating attendance records for 2,000 employees...');
  const statuses = ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'A', 'L', 'H'];

  for (let day = 1; day <= 31; day++) {
    const dateStr = `2026-08-${day < 10 ? '0' + day : day}`;
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const attValues = [];
    const attParams = [];
    let pIdx = 1;

    for (let num = 1; num <= totalEmps; num++) {
      if (num % 5 !== 0) {
        const empId = `BENCH_${num.toString().padStart(4, '0')}`;
        const status = statuses[num % statuses.length];
        attValues.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2})`);
        attParams.push(empId, dateStr, status);
        pIdx += 3;
      }
    }

    if (attValues.length > 0) {
      await query(
        `INSERT INTO attendance (employee_id, attendance_date, status) VALUES ${attValues.join(', ')} ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
        attParams
      );
    }
  }

  console.log('2,000 employees & attendance dataset successfully seeded.');
}

if (require.main === module) {
  seed2000Employees().catch(err => {
    console.error('Failed to seed 2000 employees:', err);
    process.exit(1);
  });
}

module.exports = { seed2000Employees };

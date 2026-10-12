const http = require('http');
const { seed2000Employees } = require('../src/db/seed2000');
const app = require('../src/server');
const { generateTestToken } = require('../src/auth/jwtVerifier');

async function runBenchmark() {
  console.log('--- Starting Performance Benchmark ---');

  await seed2000Employees();

  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  const token = generateTestToken('hari@alder.example', 'http://localhost:4000/auth/c1');

  const makeRequest = (options, postData) => {
    return new Promise((resolve, reject) => {
      const start = process.hrtime.bigint();
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const end = process.hrtime.bigint();
          const latencyMs = Number(end - start) / 1e6;
          resolve(latencyMs);
        });
      });

      req.on('error', reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  };

  const calculatePercentiles = (latencies) => {
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
    return { p50, p95, avg };
  };

  // 1. Benchmark GET /summary?month=2026-08 (20 warm requests)
  console.log('\nWarming up GET /summary...');
  const summaryOptions = {
    hostname: '127.0.0.1',
    port,
    path: '/api/summary?month=2026-08',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  for (let i = 0; i < 2; i++) {
    await makeRequest(summaryOptions);
  }

  console.log('Measuring warm requests for GET /summary (2,000 employees dataset)...');
  const summaryLatencies = [];
  for (let i = 0; i < 20; i++) {
    const lat = await makeRequest(summaryOptions);
    summaryLatencies.push(lat);
  }

  const summaryStats = calculatePercentiles(summaryLatencies);
  console.log(`GET /summary stats:`);
  console.log(`  p50: ${summaryStats.p50.toFixed(2)} ms`);
  console.log(`  p95: ${summaryStats.p95.toFixed(2)} ms (Target: < 500 ms)`);
  console.log(`  Avg: ${summaryStats.avg.toFixed(2)} ms`);

  // 2. Benchmark POST /attendance (50 warm requests)
  console.log('\nMeasuring warm requests for POST /attendance...');
  const attendanceLatencies = [];
  
  for (let i = 1; i <= 50; i++) {
    const empId = `BENCH_${i.toString().padStart(4, '0')}`;
    const postData = JSON.stringify({
      employeeId: empId,
      date: '2026-08-01',
      status: 'P'
    });

    const attOptions = {
      hostname: '127.0.0.1',
      port,
      path: '/api/attendance',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const lat = await makeRequest(attOptions, postData);
    attendanceLatencies.push(lat);
  }

  const attStats = calculatePercentiles(attendanceLatencies);
  console.log(`POST /attendance stats:`);
  console.log(`  p50: ${attStats.p50.toFixed(2)} ms`);
  console.log(`  p95: ${attStats.p95.toFixed(2)} ms (Target: < 100 ms)`);
  console.log(`  Avg: ${attStats.avg.toFixed(2)} ms`);

  server.close();
  console.log('\n--- Benchmark Completed Successfully ---');
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

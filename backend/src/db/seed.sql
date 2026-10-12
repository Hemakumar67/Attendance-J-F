-- 1. COMPANIES
INSERT INTO companies (id, name, email_domain, deduct_unaccounted, issuer_url)
VALUES 
  ('C1', 'Alder Works', 'alder.example', false, 'http://localhost:4000/auth/c1'),
  ('C2', 'Birch Infra', 'birch.example', true, 'http://localhost:4000/auth/c2')
ON CONFLICT (id) DO NOTHING;

-- 2. ROLES
INSERT INTO roles (id, description)
VALUES 
  ('EMPLOYEE', 'Standard employee role'),
  ('MANAGER', 'Team manager role'),
  ('HR_ADMIN', 'HR Administrator role'),
  ('PAYROLL_VIEWER', 'Payroll auditor role')
ON CONFLICT (id) DO NOTHING;

-- 3. PERMISSIONS
INSERT INTO permissions (id, description)
VALUES 
  ('summary:read:self', 'Seeing your own row'),
  ('summary:read:reports', 'Seeing your direct reports rows'),
  ('summary:read:company', 'Seeing everyone in your company'),
  ('attendance:write:reports', 'Recording attendance for your direct reports'),
  ('attendance:write:company', 'Recording attendance for anyone in your company')
ON CONFLICT (id) DO NOTHING;

-- 4. ROLE PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ('EMPLOYEE', 'summary:read:self'),
  ('MANAGER', 'summary:read:self'),
  ('MANAGER', 'summary:read:reports'),
  ('MANAGER', 'attendance:write:reports'),
  ('HR_ADMIN', 'summary:read:company'),
  ('HR_ADMIN', 'attendance:write:company'),
  ('PAYROLL_VIEWER', 'summary:read:company')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. REGIONAL HOLIDAYS (August 2026)
INSERT INTO regional_holidays (region, company_id, holiday_date)
VALUES 
  ('NORTH', 'C1', '2026-08-15'),
  ('NORTH', 'C1', '2026-08-26'),
  ('SOUTH', 'C1', '2026-08-28'),
  ('COAST', 'C2', '2026-08-12')
ON CONFLICT (region, company_id, holiday_date) DO NOTHING;

-- 6. EMPLOYEES (Managers first)
INSERT INTO employees (id, company_id, name, email, region, roster, joined_on, left_on, manager_id, role_id)
VALUES 
  ('M01', 'C1', 'Maya', 'maya@alder.example', 'NORTH', 'MON-FRI', '2020-01-06', NULL, NULL, 'MANAGER'),
  ('M02', 'C1', 'Omar', 'omar@alder.example', 'SOUTH', 'MON-FRI', '2019-04-01', NULL, NULL, 'MANAGER'),
  ('H01', 'C1', 'Hari', 'hari@alder.example', 'SOUTH', 'MON-FRI', '2018-09-01', NULL, NULL, 'HR_ADMIN'),
  ('B02', 'C2', 'Jaya', 'jaya@birch.example', 'COAST', 'MON-FRI', '2017-01-01', NULL, NULL, 'HR_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- EMPLOYEES (Staff)
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
ON CONFLICT (id) DO NOTHING;

-- 7. ATTENDANCE FOR AUGUST 2026
-- E01
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('E01', '2026-08-03', 'P'), ('E01', '2026-08-04', 'P'), ('E01', '2026-08-05', 'L'), ('E01', '2026-08-06', 'A'), ('E01', '2026-08-07', 'P'),
('E01', '2026-08-10', 'P'), ('E01', '2026-08-11', 'P'), ('E01', '2026-08-12', 'P'), ('E01', '2026-08-13', 'P'), ('E01', '2026-08-14', 'P'),
('E01', '2026-08-17', 'P'), ('E01', '2026-08-20', 'P'), ('E01', '2026-08-21', 'P'), ('E01', '2026-08-24', 'P'), ('E01', '2026-08-25', 'P'),
('E01', '2026-08-27', 'P'), ('E01', '2026-08-28', 'P'), ('E01', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- E02
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('E02', '2026-08-01', 'P'), ('E02', '2026-08-03', 'P'), ('E02', '2026-08-04', 'P'), ('E02', '2026-08-05', 'P'), ('E02', '2026-08-06', 'P'), ('E02', '2026-08-07', 'P'),
('E02', '2026-08-08', 'H'), ('E02', '2026-08-10', 'P'), ('E02', '2026-08-11', 'P'), ('E02', '2026-08-12', 'P'), ('E02', '2026-08-13', 'P'), ('E02', '2026-08-14', 'P'), ('E02', '2026-08-15', 'P'),
('E02', '2026-08-17', 'P'), ('E02', '2026-08-18', 'P'), ('E02', '2026-08-19', 'P'), ('E02', '2026-08-20', 'P'), ('E02', '2026-08-21', 'P'), ('E02', '2026-08-22', 'P'),
('E02', '2026-08-24', 'P'), ('E02', '2026-08-25', 'P'), ('E02', '2026-08-27', 'P'), ('E02', '2026-08-28', 'P'), ('E02', '2026-08-29', 'P'), ('E02', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- E03
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('E03', '2026-08-17', 'P'), ('E03', '2026-08-18', 'P'), ('E03', '2026-08-19', 'P'), ('E03', '2026-08-20', 'P'), ('E03', '2026-08-21', 'P'),
('E03', '2026-08-24', 'P'), ('E03', '2026-08-25', 'P'), ('E03', '2026-08-26', 'P'), ('E03', '2026-08-27', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- E04
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('E04', '2026-08-03', 'P'), ('E04', '2026-08-04', 'P'), ('E04', '2026-08-05', 'P'), ('E04', '2026-08-06', 'U'), ('E04', '2026-08-07', 'P'),
('E04', '2026-08-10', 'P'), ('E04', '2026-08-11', 'P'), ('E04', '2026-08-12', 'P'), ('E04', '2026-08-13', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- E05
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('E05', '2026-08-10', 'P'), ('E05', '2026-08-11', 'P'), ('E05', '2026-08-12', 'U'), ('E05', '2026-08-13', 'P'), ('E05', '2026-08-14', 'P'),
('E05', '2026-08-17', 'P'), ('E05', '2026-08-19', 'P'), ('E05', '2026-08-20', 'P'), ('E05', '2026-08-21', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- M01
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('M01', '2026-08-03', 'P'), ('M01', '2026-08-04', 'P'), ('M01', '2026-08-05', 'P'), ('M01', '2026-08-06', 'P'), ('M01', '2026-08-07', 'P'),
('M01', '2026-08-10', 'P'), ('M01', '2026-08-11', 'P'), ('M01', '2026-08-12', 'P'), ('M01', '2026-08-13', 'P'), ('M01', '2026-08-14', 'P'),
('M01', '2026-08-17', 'P'), ('M01', '2026-08-18', 'P'), ('M01', '2026-08-19', 'P'), ('M01', '2026-08-20', 'P'), ('M01', '2026-08-21', 'P'),
('M01', '2026-08-24', 'P'), ('M01', '2026-08-25', 'P'), ('M01', '2026-08-27', 'P'), ('M01', '2026-08-28', 'P'), ('M01', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- M02
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('M02', '2026-08-03', 'P'), ('M02', '2026-08-04', 'P'), ('M02', '2026-08-05', 'P'), ('M02', '2026-08-06', 'P'), ('M02', '2026-08-07', 'P'),
('M02', '2026-08-10', 'P'), ('M02', '2026-08-11', 'P'), ('M02', '2026-08-12', 'P'), ('M02', '2026-08-13', 'P'), ('M02', '2026-08-14', 'P'),
('M02', '2026-08-17', 'P'), ('M02', '2026-08-18', 'P'), ('M02', '2026-08-19', 'P'), ('M02', '2026-08-20', 'P'), ('M02', '2026-08-21', 'P'),
('M02', '2026-08-24', 'P'), ('M02', '2026-08-25', 'P'), ('M02', '2026-08-26', 'P'), ('M02', '2026-08-27', 'P'), ('M02', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- H01
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('H01', '2026-08-03', 'P'), ('H01', '2026-08-04', 'P'), ('H01', '2026-08-05', 'P'), ('H01', '2026-08-06', 'P'), ('H01', '2026-08-07', 'P'),
('H01', '2026-08-10', 'P'), ('H01', '2026-08-11', 'P'), ('H01', '2026-08-12', 'P'), ('H01', '2026-08-13', 'P'), ('H01', '2026-08-14', 'P'),
('H01', '2026-08-17', 'P'), ('H01', '2026-08-18', 'P'), ('H01', '2026-08-19', 'P'), ('H01', '2026-08-20', 'P'), ('H01', '2026-08-21', 'P'),
('H01', '2026-08-24', 'P'), ('H01', '2026-08-25', 'P'), ('H01', '2026-08-26', 'P'), ('H01', '2026-08-27', 'P'), ('H01', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- B01 (Birch Infra)
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('B01', '2026-08-03', 'P'), ('B01', '2026-08-04', 'A'), ('B01', '2026-08-05', 'P'), ('B01', '2026-08-06', 'P'), ('B01', '2026-08-07', 'P'),
('B01', '2026-08-10', 'P'), ('B01', '2026-08-11', 'P'), ('B01', '2026-08-13', 'P'), ('B01', '2026-08-14', 'P'),
('B01', '2026-08-17', 'P'), ('B01', '2026-08-18', 'P'), ('B01', '2026-08-19', 'P'), ('B01', '2026-08-20', 'P'), ('B01', '2026-08-21', 'P'),
('B01', '2026-08-24', 'P'), ('B01', '2026-08-26', 'P'), ('B01', '2026-08-27', 'P'), ('B01', '2026-08-28', 'P'), ('B01', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

-- B02 (Birch Infra)
INSERT INTO attendance (employee_id, attendance_date, status) VALUES
('B02', '2026-08-03', 'P'), ('B02', '2026-08-04', 'P'), ('B02', '2026-08-05', 'P'), ('B02', '2026-08-06', 'P'), ('B02', '2026-08-07', 'P'),
('B02', '2026-08-10', 'P'), ('B02', '2026-08-11', 'P'), ('B02', '2026-08-13', 'P'), ('B02', '2026-08-14', 'P'),
('B02', '2026-08-17', 'P'), ('B02', '2026-08-18', 'P'), ('B02', '2026-08-19', 'P'), ('B02', '2026-08-20', 'P'), ('B02', '2026-08-21', 'P'),
('B02', '2026-08-24', 'P'), ('B02', '2026-08-25', 'P'), ('B02', '2026-08-26', 'P'), ('B02', '2026-08-27', 'P'), ('B02', '2026-08-28', 'P'), ('B02', '2026-08-31', 'P')
ON CONFLICT (employee_id, attendance_date) DO NOTHING;

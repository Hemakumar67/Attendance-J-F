-- Schema for Attendance Gaps application

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email_domain VARCHAR(255) UNIQUE NOT NULL,
    deduct_unaccounted BOOLEAN NOT NULL DEFAULT FALSE,
    issuer_url VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS regional_holidays (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    company_id VARCHAR(10) REFERENCES companies(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    UNIQUE(region, company_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(10) REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(50) NOT NULL,
    roster VARCHAR(20) NOT NULL DEFAULT 'MON-FRI',
    joined_on DATE NOT NULL,
    left_on DATE,
    manager_id VARCHAR(20) REFERENCES employees(id) ON DELETE SET NULL,
    role_id VARCHAR(50) REFERENCES roles(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(20) REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(1) NOT NULL CHECK (status IN ('P', 'A', 'L', 'U', 'H')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, attendance_date);

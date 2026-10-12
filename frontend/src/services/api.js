import { authService } from './auth';

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = authService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    throw new Error('Connection lost. Unable to reach backend server.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status} Error`;
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}

export const api = {
  async login(email) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async getMe() {
    return request('/me');
  },

  async getSummary(month, onlyGaps = false) {
    const query = new URLSearchParams({ month, onlyGaps: onlyGaps.toString() });
    return request(`/summary?${query.toString()}`);
  },

  async recordAttendance(employeeId, date, status) {
    return request('/attendance', {
      method: 'POST',
      body: JSON.stringify({ employeeId, date, status })
    });
  }
};

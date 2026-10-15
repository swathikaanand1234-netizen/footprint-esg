const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiUrl
  ? (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://') ? rawApiUrl : `https://${rawApiUrl}`).replace(/\/$/, '')
  : '';
const BASE_URL = `${API_BASE}/api/v1`;

let currentAuthToken = localStorage.getItem('esg_auth_token') || null;
let currentStoredUser = null;
try {
  currentStoredUser = JSON.parse(localStorage.getItem('esg_auth_user') || 'null');
} catch {
  currentStoredUser = null;
}

const getHeaders = (extra = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
};

export const api = {
  // Authentication & Session
  setToken: (token, user) => {
    currentAuthToken = token;
    currentStoredUser = user;
    if (token) {
      localStorage.setItem('esg_auth_token', token);
      localStorage.setItem('esg_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('esg_auth_token');
      localStorage.removeItem('esg_auth_user');
    }
  },
  getCurrentUser: () => currentStoredUser,
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/auth/users`);
    return res.json();
  },
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      api.setToken(data.data.token, data.data.user);
    }
    return data;
  },

  // Overview & Benchmarks
  getOverview: async () => {
    const res = await fetch(`${BASE_URL}/overview`, { headers: getHeaders() });
    return res.json();
  },
  getFacilities: async () => {
    const res = await fetch(`${BASE_URL}/facilities`, { headers: getHeaders() });
    return res.json();
  },
  getBenchmarks: async () => {
    const res = await fetch(`${BASE_URL}/benchmarks`, { headers: getHeaders() });
    return res.json();
  },

  // Monthly Metrics
  getMetrics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/metrics${query ? '?' + query : ''}`, { headers: getHeaders() });
    return res.json();
  },
  submitMetric: async (data) => {
    const res = await fetch(`${BASE_URL}/metrics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateMetricStatus: async (metricId, status, reason = '') => {
    const res = await fetch(`${BASE_URL}/metrics/${metricId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason })
    });
    return res.json();
  },

  // Targets & Audits
  getTargets: async () => {
    const res = await fetch(`${BASE_URL}/targets`, { headers: getHeaders() });
    return res.json();
  },
  getAudits: async () => {
    const res = await fetch(`${BASE_URL}/audits`, { headers: getHeaders() });
    return res.json();
  },
  getAuditLogs: async () => {
    const res = await fetch(`${BASE_URL}/audit/logs`, { headers: getHeaders() });
    return res.json();
  },
  getFactors: async () => {
    const res = await fetch(`${BASE_URL}/factors`, { headers: getHeaders() });
    return res.json();
  },

  // Telemetry & Live Data
  getCurrentTelemetry: async (facilityId) => {
    const query = facilityId ? `?facilityId=${facilityId}` : '';
    const res = await fetch(`${BASE_URL}/telemetry/current${query}`, { headers: getHeaders() });
    return res.json();
  },
  simulateTelemetryTick: async (facilityId) => {
    const res = await fetch(`${BASE_URL}/telemetry/simulate-tick`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ facilityId })
    });
    return res.json();
  },

  // Batch CSV Import
  importCsv: async (csvText, policy = 'ALL_OR_NOTHING') => {
    const res = await fetch(`${BASE_URL}/import/metrics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ csv: csvText, policy })
    });
    return res.json();
  },

  // Reports
  exportReport: async (format = 'json') => {
    const res = await fetch(`${BASE_URL}/reports/export?format=${format}`, { headers: getHeaders() });
    if (format === 'csv') {
      return res.blob();
    }
    return res.json();
  }
};

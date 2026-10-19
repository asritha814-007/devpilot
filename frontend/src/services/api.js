/**
 * DevPilot Frontend API Client.
 * Connects directly to the FastAPI backend with structured error handling.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.detail || errorData.message || errMsg;
      } catch (e) {
        // fallback to status text
      }
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
    throw err;
  }
}

export const api = {
  // Health and connection check
  getHealth: () => request('/health'),

  // Code Analysis
  analyzeCode: (code, filename = 'script.py', requestAi = true) =>
    request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ code, filename, request_ai: requestAi }),
    }),

  // Repair generation
  generateRepair: (code, findingIds = null) =>
    request('/repair', {
      method: 'POST',
      body: JSON.stringify({ code, finding_ids: findingIds }),
    }),

  // Safe verification
  verifyRepair: (originalCode, proposedCode) =>
    request('/verify', {
      method: 'POST',
      body: JSON.stringify({ original_code: originalCode, proposed_code: proposedCode }),
    }),

  // History
  getHistory: (limit = 50, offset = 0, search = '') => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.append('search', search);
    return request(`/history?${params.toString()}`);
  },

  getAnalysisById: (id) => request(`/history/${id}`),

  deleteAnalysis: (id) =>
    request(`/history/${id}`, {
      method: 'DELETE',
    }),

  // Dashboard metrics
  getDashboardMetrics: () => request('/dashboard'),
};

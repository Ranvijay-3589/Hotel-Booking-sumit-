// Auto-detect base path (handles /sumit/ subpath on deployed site)
const BASE_PATH = (() => {
  const p = window.location.pathname;
  const idx = p.indexOf('/api/');
  if (idx > 0) return p.substring(0, idx);
  // Check if we're under a subpath like /sumit/
  const parts = p.split('/').filter(Boolean);
  if (parts.length > 1) return '/' + parts[0];
  return '';
})();

const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(BASE_PATH + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Build a detailed error message including validation errors
      let msg = data.message || 'Request failed';
      if (data.errors && Array.isArray(data.errors)) {
        msg += ': ' + data.errors.map(e => `${e.field} - ${e.message}`).join(', ');
      }
      if (response.status === 401) {
        msg = 'Session expired. Please login again.';
      }
      const err = new Error(msg);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  }
};

function ensureAuth() {
  if (!localStorage.getItem('token')) {
    window.location.href = './login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = './login.html';
}

window.hotelBooking = { api, ensureAuth, logout };

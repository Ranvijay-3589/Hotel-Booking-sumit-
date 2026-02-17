// Determine the API base URL
// On deployed site (ranvijay.capricorn.online/sumit/), the reverse proxy
// forwards /sumit/api/* requests to the backend. We need to keep the /sumit prefix.
// On localhost, there is no prefix.
const API_BASE = (() => {
  const origin = window.location.origin;
  const p = window.location.pathname;
  // Extract subpath: e.g. /sumit/hotels.html -> /sumit
  const parts = p.split('/').filter(Boolean);
  // If we're under a subpath (more than just the filename), use it
  if (parts.length > 1) {
    return origin + '/' + parts[0];
  }
  return origin;
})();

const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = API_BASE + path;
    console.log('[API]', options.method || 'GET', url);

    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (networkError) {
      // Network error - try without subpath as fallback
      console.warn('[API] Network error, trying without subpath:', networkError.message);
      try {
        response = await fetch(window.location.origin + path, { ...options, headers });
      } catch (fallbackError) {
        throw new Error('Network error: Unable to reach the server. Please check your connection.');
      }
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      // Non-JSON response (likely HTML error page like "Cannot POST /api/hotels")
      const text = await response.text().catch(() => '');
      console.error('[API] Non-JSON response:', text.substring(0, 200));

      if (text.includes('Cannot POST') || text.includes('Cannot GET') || text.includes('Cannot PUT') || text.includes('Cannot DELETE')) {
        throw new Error('API endpoint not found. The server may need to be restarted with the latest code.');
      }

      data = { message: 'Unexpected server response' };
    }

    if (!response.ok) {
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

// Determine the API base URL
// Deployed at: https://ranvijay.capricorn.online/sumit/
// Local dev:   http://localhost:5000/
// The reverse proxy keeps the /sumit prefix, so API calls must include it.
const API_BASE = (() => {
  const origin = window.location.origin;
  const path = window.location.pathname;

  // Check if we're under a subpath like /sumit/hotels.html
  // Extract the first path segment as the subpath prefix
  const match = path.match(/^\/([^/]+)\//);
  if (match) {
    // We're under a subpath (e.g., /sumit/)
    return origin + '/' + match[1];
  }

  // localhost or root deployment — no prefix
  return origin;
})();

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = API_BASE + endpoint;

    const response = await fetch(url, { ...options, headers });

    // Check if we got JSON back
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      if (text.includes('Cannot POST') || text.includes('Cannot GET') || text.includes('Cannot PUT') || text.includes('Cannot DELETE')) {
        throw new Error('API endpoint not found. The server may need to be updated.');
      }
      data = { message: text || 'Unexpected server response' };
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

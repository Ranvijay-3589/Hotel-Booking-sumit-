const api = {
  async request(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
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

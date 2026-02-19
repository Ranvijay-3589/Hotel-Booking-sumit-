// ============================================================
// Hotel Booking - Single Page Application
// ============================================================

const App = {
  // Base path for API calls — matches the nginx proxy subpath
  basePath: '/sumit',
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentPage: 'search',

  // ---- Init ----
  init() {
    this.bindNavigation();
    this.updateNav();
    // Route based on hash
    const hash = window.location.hash.slice(1) || 'search';
    this.navigate(hash);
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1) || 'search';
      this.navigate(h);
    });
  },

  // ---- Auth helpers ----
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.updateNav();
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.updateNav();
    this.navigate('login');
  },

  isLoggedIn() {
    return !!this.token;
  },

  authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  },

  // ---- API helper ----
  async api(url, options = {}) {
    try {
      const fullUrl = this.basePath + url;
      const res = await fetch(fullUrl, options);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  // ---- Navigation ----
  bindNavigation() {
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('[data-page]');
      if (navLink) {
        e.preventDefault();
        const page = navLink.dataset.page;
        if (page === 'logout') {
          this.logout();
          return;
        }
        this.navigate(page);
      }
    });
  },

  navigate(page, params = {}) {
    // Auth guard
    if ((page === 'bookings' || page === 'booking-confirm') && !this.isLoggedIn()) {
      this.navigate('login');
      return;
    }
    // Redirect if already logged in
    if ((page === 'login' || page === 'register') && this.isLoggedIn()) {
      this.navigate('search');
      return;
    }

    this.currentPage = page;
    window.location.hash = page;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Page-specific logic
    switch (page) {
      case 'search':
        this.loadHotels();
        break;
      case 'hotel-detail':
        if (params.id) this.loadHotelDetail(params.id);
        break;
      case 'bookings':
        this.loadMyBookings();
        break;
      case 'booking-confirm':
        if (params.booking) this.showBookingConfirmation(params.booking);
        break;
    }
  },

  updateNav() {
    const guestNav = document.getElementById('nav-guest');
    const userNav = document.getElementById('nav-user');
    const userName = document.getElementById('nav-username');

    if (this.isLoggedIn()) {
      guestNav.classList.add('hidden');
      userNav.classList.remove('hidden');
      if (userName) userName.textContent = this.user.name;
    } else {
      guestNav.classList.remove('hidden');
      userNav.classList.add('hidden');
    }
  },

  // ============================================================
  // Register
  // ============================================================
  async handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('register-error');
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account...';

    try {
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      if (password !== confirm) {
        throw new Error('Passwords do not match.');
      }

      const data = await this.api('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      this.setAuth(data.token, data.user);
      e.target.reset();
      this.navigate('search');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  },

  // ============================================================
  // Login
  // ============================================================
  async handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const data = await this.api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      this.setAuth(data.token, data.user);
      e.target.reset();
      this.navigate('search');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  },

  // ============================================================
  // Hotel Search
  // ============================================================
  async loadHotels() {
    const grid = document.getElementById('hotel-grid');
    grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p style="margin-top:12px">Searching hotels...</p></div>';

    try {
      const location = document.getElementById('search-location').value.trim();
      const minPrice = document.getElementById('search-min-price').value;
      const maxPrice = document.getElementById('search-max-price').value;

      const params = new URLSearchParams();
      if (location) params.append('location', location);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);

      const data = await this.api(`/api/hotels?${params.toString()}`);

      if (data.hotels.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <h3>No hotels found</h3>
            <p>Try adjusting your search filters</p>
          </div>`;
        return;
      }

      grid.innerHTML = data.hotels.map(hotel => `
        <div class="card" onclick="App.navigate('hotel-detail', {id: ${hotel.id}})" style="cursor:pointer">
          <div class="card-img">${hotel.image_url ? `<img src="${this.escapeHtml(hotel.image_url)}" alt="${this.escapeHtml(hotel.name)}" style="width:100%;height:100%;object-fit:cover">` : '&#127976;'}</div>
          <div class="card-body">
            <div class="card-title">${this.escapeHtml(hotel.name)}</div>
            <div class="card-subtitle">${this.escapeHtml(hotel.location)}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
              <div class="rating">${this.renderStars(hotel.rating)} ${parseFloat(hotel.rating).toFixed(1)}</div>
              <div class="card-price">${hotel.min_room_price > 0 ? `$${parseFloat(hotel.min_room_price).toFixed(0)}` : 'N/A'} <span>/night</span></div>
            </div>
            <div style="color:var(--gray-400);font-size:0.8rem;margin-top:6px">${hotel.total_rooms} room type${hotel.total_rooms != 1 ? 's' : ''} available</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Error loading hotels</h3><p>${this.escapeHtml(err.message)}</p></div>`;
    }
  },

  handleSearch(e) {
    e.preventDefault();
    this.loadHotels();
  },

  // ============================================================
  // Hotel Detail
  // ============================================================
  async loadHotelDetail(hotelId) {
    const page = document.getElementById('page-hotel-detail');
    page.classList.add('active');
    page.innerHTML = '<div class="container"><div class="loading-state"><div class="spinner"></div><p style="margin-top:12px">Loading hotel details...</p></div></div>';

    try {
      const data = await this.api(`/api/hotels/${hotelId}`);
      const hotel = data.hotel;
      const rooms = data.rooms;

      // Get today and tomorrow for default dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      page.innerHTML = `
        <div class="container">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('search')" style="margin-bottom:20px">&larr; Back to Search</button>

          <div class="hotel-detail-header">
            <div class="hotel-detail-img">${hotel.image_url ? `<img src="${this.escapeHtml(hotel.image_url)}" alt="${this.escapeHtml(hotel.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg)">` : '&#127976;'}</div>
            <div class="hotel-detail-info">
              <h1>${this.escapeHtml(hotel.name)}</h1>
              <p class="location">${this.escapeHtml(hotel.location)}</p>
              <div class="rating mb-16">${this.renderStars(hotel.rating)} ${parseFloat(hotel.rating).toFixed(1)} / 5.0</div>
              <p class="description">${this.escapeHtml(hotel.description || 'A wonderful place to stay.')}</p>
            </div>
          </div>

          <h2 style="margin-bottom:16px">Check Availability & Book</h2>

          <form class="availability-form" onsubmit="App.checkAvailability(event, ${hotel.id})">
            <div class="form-group">
              <label for="detail-checkin">Check-in</label>
              <input type="date" id="detail-checkin" class="form-control" min="${todayStr}" value="${todayStr}" required>
            </div>
            <div class="form-group">
              <label for="detail-checkout">Check-out</label>
              <input type="date" id="detail-checkout" class="form-control" min="${tomorrowStr}" value="${tomorrowStr}" required>
            </div>
            <div class="form-group">
              <label for="detail-guests">Guests</label>
              <input type="number" id="detail-guests" class="form-control" min="1" max="10" value="2">
            </div>
            <button type="submit" class="btn btn-primary">Check Availability</button>
          </form>

          <div id="rooms-list">
            <h2 style="margin:24px 0 16px">Rooms</h2>
            ${rooms.map(room => this.renderRoomCard(room, hotel.id, false)).join('')}
            ${rooms.length === 0 ? '<p class="empty-state">No rooms listed for this hotel.</p>' : ''}
          </div>
        </div>
      `;
    } catch (err) {
      page.innerHTML = `<div class="container"><div class="empty-state"><h3>Error</h3><p>${this.escapeHtml(err.message)}</p><button class="btn btn-primary mt-16" onclick="App.navigate('search')">Back to Search</button></div></div>`;
    }
  },

  async checkAvailability(e, hotelId) {
    e.preventDefault();
    const checkIn = document.getElementById('detail-checkin').value;
    const checkOut = document.getElementById('detail-checkout').value;

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p style="margin-top:12px">Checking availability...</p></div>';

    try {
      const data = await this.api(`/api/hotels/${hotelId}/availability?check_in=${checkIn}&check_out=${checkOut}`);
      const rooms = data.rooms;

      roomsList.innerHTML = `
        <h2 style="margin:24px 0 16px">Available Rooms</h2>
        ${rooms.map(room => this.renderRoomCard(room, hotelId, true)).join('')}
        ${rooms.length === 0 ? '<p class="empty-state">No rooms available for these dates.</p>' : ''}
      `;
    } catch (err) {
      roomsList.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${this.escapeHtml(err.message)}</p></div>`;
    }
  },

  renderRoomCard(room, hotelId, showAvailability) {
    const available = parseInt(room.available_rooms);
    const isAvailable = !showAvailability || available > 0;

    return `
      <div class="room-card">
        <div class="room-info">
          <h3>${this.escapeHtml(room.room_type)}</h3>
          <p>Capacity: ${room.capacity} guests</p>
          ${room.amenities ? `<p>${this.escapeHtml(room.amenities)}</p>` : ''}
          ${showAvailability ? `<p><span class="badge ${available > 0 ? 'badge-success' : 'badge-danger'}">${available > 0 ? `${available} available` : 'Sold out'}</span></p>` : `<p><span class="badge badge-success">${room.total_rooms} room${room.total_rooms != 1 ? 's' : ''}</span></p>`}
        </div>
        <div class="room-pricing">
          <div class="price">$${parseFloat(room.price).toFixed(0)}</div>
          <div class="per-night">per night</div>
          ${isAvailable ? `<button class="btn btn-primary btn-sm mt-16" onclick="App.bookRoom(${room.id}, ${hotelId})">Book Now</button>` : '<button class="btn btn-secondary btn-sm mt-16" disabled>Unavailable</button>'}
        </div>
      </div>
    `;
  },

  // ============================================================
  // Book Room
  // ============================================================
  async bookRoom(roomId, hotelId) {
    if (!this.isLoggedIn()) {
      this.navigate('login');
      return;
    }

    const checkIn = document.getElementById('detail-checkin')?.value;
    const checkOut = document.getElementById('detail-checkout')?.value;
    const guests = document.getElementById('detail-guests')?.value || 1;

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates first.');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date.');
      return;
    }

    if (!confirm('Confirm this booking?')) return;

    try {
      const data = await this.api('/api/bookings', {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({
          room_id: roomId,
          hotel_id: hotelId,
          check_in: checkIn,
          check_out: checkOut,
          guests: parseInt(guests)
        })
      });

      this.navigate('booking-confirm', { booking: data.booking });
    } catch (err) {
      alert(err.message);
    }
  },

  // ============================================================
  // Booking Confirmation
  // ============================================================
  showBookingConfirmation(booking) {
    const page = document.getElementById('page-booking-confirm');
    page.classList.add('active');

    const checkIn = new Date(booking.check_in).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const checkOut = new Date(booking.check_out).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    page.innerHTML = `
      <div class="container">
        <div class="booking-summary">
          <h2>Booking Confirmed!</h2>
          <p class="text-center" style="color:var(--gray-500);margin-bottom:24px">Your reservation has been successfully made.</p>

          <div class="summary-row">
            <span class="summary-label">Booking ID</span>
            <span class="summary-value">#${booking.id}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Hotel</span>
            <span class="summary-value">${this.escapeHtml(booking.hotel_name)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Location</span>
            <span class="summary-value">${this.escapeHtml(booking.hotel_location)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Room Type</span>
            <span class="summary-value">${this.escapeHtml(booking.room_type)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Check-in</span>
            <span class="summary-value">${checkIn}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Check-out</span>
            <span class="summary-value">${checkOut}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Guests</span>
            <span class="summary-value">${booking.guests}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">${booking.nights} night${booking.nights != 1 ? 's' : ''}</span>
            <span class="summary-value">&nbsp;</span>
          </div>
          <div class="summary-row summary-total">
            <span class="summary-label" style="font-weight:700">Total</span>
            <span class="summary-value" style="font-size:1.3rem;color:var(--primary)">$${parseFloat(booking.total_price).toFixed(2)}</span>
          </div>

          <div style="display:flex;gap:12px;margin-top:24px">
            <button class="btn btn-primary btn-block" onclick="App.navigate('bookings')">View My Bookings</button>
            <button class="btn btn-secondary btn-block" onclick="App.navigate('search')">Search More Hotels</button>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================================
  // My Bookings
  // ============================================================
  async loadMyBookings() {
    const container = document.getElementById('bookings-list');
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p style="margin-top:12px">Loading your bookings...</p></div>';

    try {
      const data = await this.api('/api/bookings', {
        headers: this.authHeaders()
      });

      if (data.bookings.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>No bookings yet</h3>
            <p>Find your perfect hotel and make your first booking!</p>
            <button class="btn btn-primary mt-16" onclick="App.navigate('search')">Search Hotels</button>
          </div>`;
        return;
      }

      container.innerHTML = data.bookings.map(b => {
        const checkIn = new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const checkOut = new Date(b.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isConfirmed = b.status === 'confirmed';
        const isFuture = new Date(b.check_in) >= new Date(new Date().toDateString());

        return `
          <div class="booking-list-item">
            <div class="booking-details">
              <h3>${this.escapeHtml(b.hotel_name)}</h3>
              <p>${this.escapeHtml(b.hotel_location)}</p>
              <p>${this.escapeHtml(b.room_type)}</p>
              <p>${checkIn} &rarr; ${checkOut}</p>
              <p>${b.guests} guest${b.guests != 1 ? 's' : ''}</p>
              <span class="badge ${isConfirmed ? 'badge-success' : 'badge-danger'}" style="margin-top:8px">${b.status}</span>
            </div>
            <div class="booking-actions">
              <div class="total">$${parseFloat(b.total_price).toFixed(2)}</div>
              ${isConfirmed && isFuture ? `<button class="btn btn-danger btn-sm" onclick="App.cancelBooking(${b.id})">Cancel</button>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${this.escapeHtml(err.message)}</p></div>`;
    }
  },

  async cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await this.api(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: this.authHeaders()
      });
      this.loadMyBookings();
    } catch (err) {
      alert(err.message);
    }
  },

  // ============================================================
  // Utilities
  // ============================================================
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  renderStars(rating) {
    const r = parseFloat(rating) || 0;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(r)) stars += '&#9733;';
      else if (i - 0.5 <= r) stars += '&#9733;';
      else stars += '&#9734;';
    }
    return stars;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await api.getMyBookings();
        setBookings(data.bookings);
      } catch (err) {
        console.error('Error fetching bookings:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>View and manage your reservations</p>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings yet</h3>
          <p>Start exploring hotels and make your first booking!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Browse Hotels
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <img
                className="booking-card-image"
                src={b.image_url}
                alt={b.hotel_name}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="booking-card-body">
                <h3>{b.hotel_name}</h3>
                <div className="booking-card-meta">
                  {b.hotel_location} &middot; {b.room_type}
                </div>
                <div className="booking-card-details">
                  <div className="detail">
                    <span className="detail-label">Check-in</span>
                    <span className="detail-value">{formatDate(b.check_in)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Check-out</span>
                    <span className="detail-value">{formatDate(b.check_out)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Guests</span>
                    <span className="detail-value">{b.guests}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Total</span>
                    <span className="detail-value">{formatPrice(b.total_price)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${b.status}`}>{b.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

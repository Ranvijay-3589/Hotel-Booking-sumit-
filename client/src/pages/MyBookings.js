import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings } from '../services/api';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getMyBookings();
        setBookings(res.data.bookings);
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
    <div className="bookings-container">
      <h1>My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <h3>No bookings yet</h3>
          <p>Start exploring hotels and make your first booking!</p>
          <Link to="/" className="browse-btn">Browse Hotels</Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-item">
              <div className="booking-hotel">
                <h3>
                  <Link to={`/hotels/${booking.room?.hotel?.id}`}>
                    {booking.room?.hotel?.name || 'Hotel'}
                  </Link>
                </h3>
                <span className={`booking-status ${getStatusClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-info">
                <div className="info-item">
                  <span className="info-label">Room</span>
                  <span>{booking.room?.room_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Check-in</span>
                  <span>{booking.check_in}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Check-out</span>
                  <span>{booking.check_out}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total</span>
                  <span className="booking-total">${parseFloat(booking.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await getMyBookings();
        setBookings(res.data.bookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [isAuthenticated, navigate]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  if (loading) return <LoadingSpinner message="Loading your bookings..." />;

  return (
    <div className="bookings-page">
      <div className="bookings-container">
        <h1>My Bookings</h1>
        <p className="bookings-subtitle">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </p>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <h3>No bookings yet</h3>
            <p>Start exploring hotels and make your first booking!</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Hotels
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-item">
                <div className="booking-hotel-info">
                  <h3>{booking.hotel?.name || 'Hotel'}</h3>
                  <p className="booking-location">
                    <span>&#128205;</span> {booking.hotel?.location}
                  </p>
                </div>
                <div className="booking-details">
                  <div className="booking-detail">
                    <span className="detail-label">Room</span>
                    <span>{booking.room?.type}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="detail-label">Check-in</span>
                    <span>{new Date(booking.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="detail-label">Check-out</span>
                    <span>{new Date(booking.checkOut).toLocaleDateString()}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="detail-label">Guests</span>
                    <span>{booking.guests}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="detail-label">Total</span>
                    <span className="booking-total">${parseFloat(booking.totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="booking-detail">
                    <span className="detail-label">Status</span>
                    <span className={`booking-status ${getStatusClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BookingConfirmation.css';

const BookingConfirmation = () => {
  const location = useLocation();
  const booking = location.state;

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">&#10003;</div>
        <h1>Booking Confirmed!</h1>
        <p className="confirmation-subtitle">Your reservation has been successfully made</p>

        {booking && (
          <div className="confirmation-details">
            <div className="detail-row">
              <span className="detail-label">Hotel</span>
              <span className="detail-value">{booking.hotel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Room</span>
              <span className="detail-value">{booking.room?.room_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Check-in</span>
              <span className="detail-value">{booking.check_in}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Check-out</span>
              <span className="detail-value">{booking.check_out}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Price/Night</span>
              <span className="detail-value">${parseFloat(booking.room?.price_per_night || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="confirmation-actions">
          <Link to="/my-bookings" className="action-btn primary">View My Bookings</Link>
          <Link to="/" className="action-btn secondary">Browse More Hotels</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

import { Link, useLocation, Navigate } from 'react-router-dom';

export default function BookingConfirmation() {
  const location = useLocation();
  const { booking, hotel_name, hotel_location } = location.state || {};

  if (!booking) {
    return <Navigate to="/" />;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-icon">&#10003;</div>
      <h1>Booking Confirmed!</h1>
      <p>Your reservation has been successfully made.</p>

      <div className="confirmation-details">
        <div className="detail-row">
          <span className="detail-label">Booking ID</span>
          <span className="detail-value">#{booking.id}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Hotel</span>
          <span className="detail-value">{hotel_name || booking.hotel_name}</span>
        </div>
        {hotel_location && (
          <div className="detail-row">
            <span className="detail-label">Location</span>
            <span className="detail-value">{hotel_location}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">Room Type</span>
          <span className="detail-value">{booking.room_type}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Check-in</span>
          <span className="detail-value">{formatDate(booking.check_in)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Check-out</span>
          <span className="detail-value">{formatDate(booking.check_out)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Guests</span>
          <span className="detail-value">{booking.guests}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Nights</span>
          <span className="detail-value">{booking.nights}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Price</span>
          <span className="detail-value" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
            {formatPrice(booking.total_price)}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status</span>
          <span className="status-badge confirmed">{booking.status}</span>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Link to="/my-bookings" className="btn btn-primary">View My Bookings</Link>
        <Link to="/" className="btn btn-secondary">Browse More Hotels</Link>
      </div>
    </div>
  );
}

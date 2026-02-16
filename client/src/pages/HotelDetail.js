import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotelById, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './HotelDetail.css';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await getHotelById(id);
        setHotel(res.data.hotel);
      } catch (err) {
        console.error('Error fetching hotel:', err);
      }
      setLoading(false);
    };
    fetchHotel();
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }

    setBookingLoading(true);
    try {
      await createBooking({
        roomId: selectedRoom.id,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: parseInt(bookingForm.guests),
      });
      setSuccess('Booking confirmed! Redirecting to your bookings...');
      setTimeout(() => navigate('/my-bookings'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
    setBookingLoading(false);
  };

  const calculateNights = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const diff = new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) return <LoadingSpinner message="Loading hotel details..." />;

  if (!hotel) {
    return (
      <div className="no-results" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h3>Hotel not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Search</button>
      </div>
    );
  }

  const nights = calculateNights();

  return (
    <div className="hotel-detail">
      <div className="hotel-detail-header">
        <img
          src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
          alt={hotel.name}
          className="hotel-detail-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/1200x400?text=Hotel';
          }}
        />
        <div className="hotel-detail-overlay">
          <h1>{hotel.name}</h1>
          <p className="hotel-detail-location">
            <span>&#128205;</span> {hotel.location}
            {hotel.address && ` - ${hotel.address}`}
          </p>
          <div className="hotel-detail-rating">
            <span>&#9733;</span> {hotel.rating} / 5
          </div>
        </div>
      </div>

      <div className="hotel-detail-container">
        <div className="hotel-detail-main">
          <section className="detail-section">
            <h2>About</h2>
            <p>{hotel.description}</p>
          </section>

          {hotel.amenities?.length > 0 && (
            <section className="detail-section">
              <h2>Amenities</h2>
              <div className="amenities-list">
                {hotel.amenities.map((a, i) => (
                  <span key={i} className="amenity-badge">{a}</span>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <h2>Available Rooms</h2>
            <div className="rooms-list">
              {hotel.rooms?.map((room) => (
                <div
                  key={room.id}
                  className={`room-card ${selectedRoom?.id === room.id ? 'selected' : ''} ${!room.available ? 'unavailable' : ''}`}
                  onClick={() => room.available && setSelectedRoom(room)}
                >
                  <div className="room-info">
                    <h3>{room.type}</h3>
                    <p>{room.description}</p>
                    <span className="room-capacity">Up to {room.capacity} guests</span>
                  </div>
                  <div className="room-pricing">
                    <span className="room-price">${parseFloat(room.price).toFixed(2)}</span>
                    <span className="per-night">/ night</span>
                    {!room.available && <span className="room-unavailable">Unavailable</span>}
                    {room.available && selectedRoom?.id === room.id && (
                      <span className="room-selected-badge">Selected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="booking-sidebar">
          <div className="booking-card">
            <h3>Book This Hotel</h3>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label>Check-in</label>
                <input
                  type="date"
                  value={bookingForm.checkIn}
                  onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Check-out</label>
                <input
                  type="date"
                  value={bookingForm.checkOut}
                  onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                  min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Guests</label>
                <select
                  value={bookingForm.guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {selectedRoom && nights > 0 && (
                <div className="booking-summary">
                  <div className="summary-row">
                    <span>{selectedRoom.type} Room</span>
                    <span>${parseFloat(selectedRoom.price).toFixed(2)}/night</span>
                  </div>
                  <div className="summary-row">
                    <span>{nights} night{nights > 1 ? 's' : ''}</span>
                    <span></span>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Total</span>
                    <span>${(parseFloat(selectedRoom.price) * nights).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={bookingLoading || !selectedRoom}
              >
                {bookingLoading ? 'Booking...' : isAuthenticated ? 'Confirm Booking' : 'Login to Book'}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HotelDetail;

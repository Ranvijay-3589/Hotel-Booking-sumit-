import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotel, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './HotelDetail.css';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({ room_id: '', check_in: '', check_out: '' });
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await getHotel(id);
        setHotel(res.data.hotel);
      } catch (err) {
        console.error('Failed to fetch hotel:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

  const isRoomAvailable = (room) => {
    if (!room.available) return false;
    if (!bookingData.check_in || !bookingData.check_out) return room.available;

    const checkIn = new Date(bookingData.check_in);
    const checkOut = new Date(bookingData.check_out);

    if (room.bookings) {
      return !room.bookings.some((booking) => {
        const bCheckIn = new Date(booking.check_in);
        const bCheckOut = new Date(booking.check_out);
        return checkIn < bCheckOut && checkOut > bCheckIn;
      });
    }
    return true;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookingData.room_id || !bookingData.check_in || !bookingData.check_out) {
      return setBookingError('Please select a room and dates');
    }

    setBookingLoading(true);
    try {
      await createBooking(bookingData);
      navigate('/booking-confirmation', {
        state: {
          hotel: hotel.name,
          room: hotel.rooms.find(r => r.id === parseInt(bookingData.room_id)),
          check_in: bookingData.check_in,
          check_out: bookingData.check_out
        }
      });
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="loading">Loading hotel details...</div>;
  if (!hotel) return <div className="loading">Hotel not found</div>;

  return (
    <div className="detail-container">
      <div className="detail-hero">
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
          alt={hotel.name}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Hotel'; }}
        />
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="detail-header">
            <div>
              <h1>{hotel.name}</h1>
              <p className="detail-location">{hotel.location}</p>
            </div>
            <div className="detail-rating">{parseFloat(hotel.rating).toFixed(1)}</div>
          </div>

          <p className="detail-description">{hotel.description}</p>

          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="detail-amenities">
              <h3>Amenities</h3>
              <div className="amenity-list">
                {hotel.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-rooms">
            <h3>Available Rooms</h3>
            <div className="room-list">
              {hotel.rooms?.map((room) => (
                <div
                  key={room.id}
                  className={`room-card ${bookingData.room_id === String(room.id) ? 'selected' : ''} ${!isRoomAvailable(room) ? 'unavailable' : ''}`}
                  onClick={() => isRoomAvailable(room) && setBookingData({ ...bookingData, room_id: String(room.id) })}
                >
                  <div className="room-header">
                    <h4>{room.room_type}</h4>
                    <span className={`room-status ${isRoomAvailable(room) ? 'available' : 'booked'}`}>
                      {isRoomAvailable(room) ? 'Available' : 'Booked'}
                    </span>
                  </div>
                  <p className="room-description">{room.description}</p>
                  <div className="room-details">
                    <span>Capacity: {room.capacity} guests</span>
                    <span className="room-price">${parseFloat(room.price_per_night).toFixed(2)}/night</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="booking-card">
            <h3>Book This Hotel</h3>

            {bookingError && <div className="booking-error">{bookingError}</div>}

            <form onSubmit={handleBooking} className="booking-form">
              <div className="form-group">
                <label>Room</label>
                <select
                  value={bookingData.room_id}
                  onChange={(e) => setBookingData({ ...bookingData, room_id: e.target.value })}
                  required
                >
                  <option value="">Select a room</option>
                  {hotel.rooms?.filter(r => isRoomAvailable(r)).map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_type} - ${parseFloat(room.price_per_night).toFixed(2)}/night
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Check-in</label>
                <input
                  type="date"
                  value={bookingData.check_in}
                  min={today}
                  onChange={(e) => setBookingData({ ...bookingData, check_in: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Check-out</label>
                <input
                  type="date"
                  value={bookingData.check_out}
                  min={bookingData.check_in || today}
                  onChange={(e) => setBookingData({ ...bookingData, check_out: e.target.value })}
                  required
                />
              </div>

              {bookingData.room_id && bookingData.check_in && bookingData.check_out && (
                <div className="booking-summary">
                  <p>
                    <strong>Total:</strong> $
                    {(() => {
                      const room = hotel.rooms.find(r => r.id === parseInt(bookingData.room_id));
                      const nights = Math.ceil(
                        (new Date(bookingData.check_out) - new Date(bookingData.check_in)) / (1000 * 60 * 60 * 24)
                      );
                      return (parseFloat(room?.price_per_night || 0) * nights).toFixed(2);
                    })()}
                  </p>
                </div>
              )}

              <button type="submit" className="book-btn" disabled={bookingLoading}>
                {bookingLoading ? 'Booking...' : user ? 'Book Now' : 'Login to Book'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;

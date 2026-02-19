import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const data = await api.getHotel(id);
        setHotel(data.hotel);
        setRooms(data.rooms);
      } catch (err) {
        setError('Hotel not found');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedRoom || !checkIn || !checkOut) {
      setError('Please select a room and dates');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in');
      return;
    }

    setBooking(true);
    setError('');
    try {
      const data = await api.createBooking({
        room_id: selectedRoom.id,
        hotel_id: hotel.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });

      navigate('/booking-confirmation', {
        state: {
          booking: data.booking,
          hotel_name: hotel.name,
          hotel_location: hotel.location,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading">Loading hotel details...</div>;
  if (!hotel) return <div className="empty-state"><h3>Hotel not found</h3></div>;

  const nights = calculateNights();
  const totalPrice = selectedRoom ? parseFloat(selectedRoom.price) * Math.max(1, nights) : 0;

  return (
    <div>
      <div className="hotel-detail">
        <img
          className="hotel-detail-image"
          src={hotel.image_url}
          alt={hotel.name}
          onError={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.minHeight = '400px'; }}
        />
        <div className="hotel-info">
          <h1>{hotel.name}</h1>
          <div className="location">{hotel.location}</div>
          <span className="rating-badge">{hotel.rating} Rating</span>
          <p className="description">{hotel.description}</p>
        </div>
      </div>

      <div className="rooms-section">
        <h2>Available Rooms</h2>
        {rooms.map((room) => (
          <div
            key={room.id}
            className="room-card"
            style={{
              borderColor: selectedRoom?.id === room.id ? 'var(--primary)' : undefined,
              borderWidth: selectedRoom?.id === room.id ? '2px' : undefined,
            }}
          >
            <div className="room-info">
              <h4>{room.room_type}</h4>
              <p>Capacity: {room.capacity} guests</p>
              <div className="room-amenities">{room.amenities}</div>
              <div className={`room-availability-tag ${room.available_rooms > 0 ? 'available' : 'unavailable'}`}>
                {room.available_rooms > 0 ? `${room.available_rooms} rooms available` : 'Sold out'}
              </div>
            </div>
            <div className="room-pricing">
              <div className="price">{formatPrice(room.price)}</div>
              <div className="per-night">per night</div>
              {room.available_rooms > 0 && (
                <button
                  className={`btn ${selectedRoom?.id === room.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setSelectedRoom(room)}
                  style={{ marginTop: '8px' }}
                >
                  {selectedRoom?.id === room.id ? 'Selected' : 'Select'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="booking-form-section">
          <h3>Book: {selectedRoom.room_type}</h3>
          {error && <div className="error-message">{error}</div>}
          <div className="booking-dates">
            <div className="form-group">
              <label>Check-in</label>
              <input
                type="date"
                className="form-control"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Check-out</label>
              <input
                type="date"
                className="form-control"
                min={checkIn || tomorrow}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Guests</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max={selectedRoom.capacity}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {checkIn && checkOut && nights > 0 && (
            <div className="booking-summary">
              <div className="line-item">
                <span>{selectedRoom.room_type}</span>
                <span>{formatPrice(selectedRoom.price)} / night</span>
              </div>
              <div className="line-item">
                <span>Number of nights</span>
                <span>{nights}</span>
              </div>
              <div className="line-item total">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={handleBook}
            disabled={booking || !checkIn || !checkOut}
          >
            {booking ? 'Booking...' : user ? 'Confirm Booking' : 'Login to Book'}
          </button>
        </div>
      )}
    </div>
  );
}

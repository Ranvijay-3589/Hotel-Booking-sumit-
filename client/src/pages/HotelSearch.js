import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHotels, updateHotel, deleteHotel } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './HotelSearch.css';

const HotelSearch = () => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: '', min_price: '', max_price: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    location: '',
    description: '',
    rating: '',
    amenities: '',
    image_url: '',
    rooms: []
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchHotels = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.location) params.location = filters.location;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;

      const res = await getHotels(params);
      setHotels(res.data.hotels);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels(1);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getMinPrice = (rooms) => {
    if (!rooms || rooms.length === 0) return 'N/A';
    const min = Math.min(...rooms.map(r => parseFloat(r.price_per_night)));
    return `$${min.toFixed(2)}`;
  };

  // --- Edit Handlers ---
  const openEditModal = (e, hotel) => {
    e.preventDefault();
    e.stopPropagation();
    setEditData({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      description: hotel.description || '',
      rating: hotel.rating || '',
      amenities: hotel.amenities ? hotel.amenities.join(', ') : '',
      image_url: hotel.image_url || '',
      rooms: hotel.rooms ? hotel.rooms.map(r => ({
        room_type: r.room_type,
        price_per_night: r.price_per_night,
        capacity: r.capacity,
        description: r.description || ''
      })) : []
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditData({ id: '', name: '', location: '', description: '', rating: '', amenities: '', image_url: '', rooms: [] });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleRoomChange = (index, field, value) => {
    const updatedRooms = [...editData.rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setEditData({ ...editData, rooms: updatedRooms });
  };

  const addRoom = () => {
    setEditData({
      ...editData,
      rooms: [...editData.rooms, { room_type: '', price_per_night: '', capacity: 2, description: '' }]
    });
  };

  const removeRoom = (index) => {
    const updatedRooms = editData.rooms.filter((_, i) => i !== index);
    setEditData({ ...editData, rooms: updatedRooms });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const payload = {
        name: editData.name,
        location: editData.location,
        description: editData.description,
        rating: editData.rating ? parseFloat(editData.rating) : 0,
        amenities: editData.amenities ? editData.amenities.split(',').map(a => a.trim()).filter(a => a) : [],
        image_url: editData.image_url,
        rooms: editData.rooms.map(r => ({
          room_type: r.room_type,
          price_per_night: parseFloat(r.price_per_night),
          capacity: parseInt(r.capacity) || 2,
          description: r.description || ''
        }))
      };

      await updateHotel(editData.id, payload);
      closeEditModal();
      fetchHotels(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update hotel');
    } finally {
      setEditLoading(false);
    }
  };

  // --- Delete Handlers ---
  const openDeleteConfirm = (e, hotel) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(hotel);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await deleteHotel(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchHotels(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete hotel');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Find Your Perfect Hotel</h1>
        <p>Search from our collection of hotels worldwide</p>
      </div>

      <form className="search-filters" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="City or location..."
          />
        </div>
        <div className="filter-group">
          <label>Min Price</label>
          <input
            type="number"
            name="min_price"
            value={filters.min_price}
            onChange={handleFilterChange}
            placeholder="$0"
            min="0"
          />
        </div>
        <div className="filter-group">
          <label>Max Price</label>
          <input
            type="number"
            name="max_price"
            value={filters.max_price}
            onChange={handleFilterChange}
            placeholder="$1000"
            min="0"
          />
        </div>
        <button type="submit" className="search-btn">Search</button>
      </form>

      {loading ? (
        <div className="loading">Loading hotels...</div>
      ) : hotels.length === 0 ? (
        <div className="no-results">
          <h3>No hotels found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <p className="results-count">{pagination.total} hotel(s) found</p>
          <div className="hotel-grid">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="hotel-card-wrapper">
                <Link to={`/hotels/${hotel.id}`} className="hotel-card">
                  <div className="hotel-image">
                    <img
                      src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={hotel.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250?text=Hotel'; }}
                    />
                    <span className="hotel-rating">{parseFloat(hotel.rating).toFixed(1)}</span>
                  </div>
                  <div className="hotel-info">
                    <h3>{hotel.name}</h3>
                    <p className="hotel-location">{hotel.location}</p>
                    <p className="hotel-description">{hotel.description?.substring(0, 100)}...</p>
                    <div className="hotel-footer">
                      <span className="hotel-price">From {getMinPrice(hotel.rooms)}/night</span>
                      <span className="hotel-rooms">{hotel.rooms?.length || 0} rooms</span>
                    </div>
                  </div>
                </Link>
                {user && (
                  <div className="hotel-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={(e) => openEditModal(e, hotel)}
                      title="Edit Hotel"
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => openDeleteConfirm(e, hotel)}
                      title="Delete Hotel"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`page-btn ${page === pagination.page ? 'active' : ''}`}
                  onClick={() => fetchHotels(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Hotel Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Hotel</h2>
              <button className="modal-close" onClick={closeEditModal}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Hotel Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={editData.location}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rating (0-5)</label>
                  <input
                    type="number"
                    name="rating"
                    value={editData.rating}
                    onChange={handleEditChange}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={editData.image_url}
                    onChange={handleEditChange}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editData.description}
                  onChange={handleEditChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Amenities (comma-separated)</label>
                <input
                  type="text"
                  name="amenities"
                  value={editData.amenities}
                  onChange={handleEditChange}
                  placeholder="WiFi, Pool, Spa, Gym..."
                />
              </div>

              {/* Rooms Section */}
              <div className="rooms-section">
                <div className="rooms-header">
                  <h3>Rooms</h3>
                  <button type="button" className="add-room-btn" onClick={addRoom}>+ Add Room</button>
                </div>
                {editData.rooms.map((room, index) => (
                  <div key={index} className="room-edit-row">
                    <input
                      type="text"
                      value={room.room_type}
                      onChange={(e) => handleRoomChange(index, 'room_type', e.target.value)}
                      placeholder="Room Type"
                      required
                    />
                    <input
                      type="number"
                      value={room.price_per_night}
                      onChange={(e) => handleRoomChange(index, 'price_per_night', e.target.value)}
                      placeholder="Price/Night"
                      min="0"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      value={room.capacity}
                      onChange={(e) => handleRoomChange(index, 'capacity', e.target.value)}
                      placeholder="Capacity"
                      min="1"
                    />
                    <input
                      type="text"
                      value={room.description}
                      onChange={(e) => handleRoomChange(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    <button type="button" className="remove-room-btn" onClick={() => removeRoom(index)}>&times;</button>
                  </div>
                ))}
                {editData.rooms.length === 0 && (
                  <p className="no-rooms-text">No rooms added. Click "+ Add Room" to add rooms.</p>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="save-btn" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Hotel</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="delete-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
              <p className="delete-warning">This action cannot be undone. All rooms associated with this hotel will also be deleted.</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete Hotel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelSearch;

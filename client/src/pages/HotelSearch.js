import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHotels } from '../services/api';
import './HotelSearch.css';

const HotelSearch = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: '', min_price: '', max_price: '' });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

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
              <Link to={`/hotels/${hotel.id}`} key={hotel.id} className="hotel-card">
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
    </div>
  );
};

export default HotelSearch;

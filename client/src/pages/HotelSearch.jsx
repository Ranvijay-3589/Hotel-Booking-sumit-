import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function HotelSearch() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');

  const fetchHotels = async (params = {}) => {
    setLoading(true);
    try {
      const cleanParams = {};
      if (params.location) cleanParams.location = params.location;
      if (params.min_price) cleanParams.min_price = params.min_price;
      if (params.max_price) cleanParams.max_price = params.max_price;
      if (params.search) cleanParams.search = params.search;

      const data = await api.getHotels(cleanParams);
      setHotels(data.hotels);
    } catch (err) {
      console.error('Error fetching hotels:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels({ location, min_price: minPrice, max_price: maxPrice, search });
  };

  const handleClear = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    fetchHotels();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Find Your Perfect Stay</h1>
        <p>Browse through our curated collection of hotels</p>
      </div>

      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Hotel name or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mumbai, Goa"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Min Price</label>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Max Price</label>
            <input
              type="number"
              className="form-control"
              placeholder="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading hotels...</div>
      ) : hotels.length === 0 ? (
        <div className="empty-state">
          <h3>No hotels found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="hotel-grid">
          {hotels.map((hotel) => (
            <Link key={hotel.id} to={`/hotels/${hotel.id}`} className="hotel-card">
              <img
                className="hotel-card-image"
                src={hotel.image_url}
                alt={hotel.name}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="hotel-card-body">
                <h3>{hotel.name}</h3>
                <div className="hotel-location">{hotel.location}</div>
                <div className="hotel-meta">
                  <span className="hotel-rating">{'*'.repeat(Math.round(hotel.rating))} {hotel.rating}</span>
                  <span className="hotel-price">
                    {formatPrice(hotel.min_room_price)} <span>/ night</span>
                  </span>
                </div>
                {hotel.total_available > 0 && (
                  <div className="hotel-availability">{hotel.total_available} rooms available</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { getHotels } from '../services/api';
import HotelCard from '../components/HotelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './HotelSearch.css';

const HotelSearch = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchHotels = async (params = {}) => {
    setLoading(true);
    try {
      const cleanParams = {};
      Object.keys(params).forEach((k) => {
        if (params[k]) cleanParams[k] = params[k];
      });
      const res = await getHotels(cleanParams);
      setHotels(res.data.hotels);
    } catch (err) {
      console.error('Error fetching hotels:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels(filters);
  };

  const handleClear = () => {
    setFilters({ search: '', location: '', minPrice: '', maxPrice: '' });
    fetchHotels();
  };

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1>Find Your Perfect Stay</h1>
        <p>Search from our curated collection of hotels worldwide</p>
      </div>

      <div className="search-container">
        <form className="search-filters" onSubmit={handleSearch}>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search hotels..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="filter-input"
            />
            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="filter-input filter-input-sm"
              min="0"
            />
            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="filter-input filter-input-sm"
              min="0"
            />
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-outline" onClick={handleClear}>Clear</button>
          </div>
        </form>

        {loading ? (
          <LoadingSpinner message="Finding hotels..." />
        ) : hotels.length === 0 ? (
          <div className="no-results">
            <h3>No hotels found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <p className="results-count">{hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found</p>
            <div className="hotels-grid">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HotelSearch;

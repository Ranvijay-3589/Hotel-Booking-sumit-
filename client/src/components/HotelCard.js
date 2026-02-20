import React from 'react';
import { Link } from 'react-router-dom';
import './HotelCard.css';

const HotelCard = ({ hotel }) => {
  return (
    <div className="hotel-card">
      <div className="hotel-card-image">
        <img
          src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
          alt={hotel.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x250?text=Hotel';
          }}
        />
        <div className="hotel-rating">
          <span>&#9733;</span> {hotel.rating}
        </div>
      </div>
      <div className="hotel-card-body">
        <h3 className="hotel-name">{hotel.name}</h3>
        <p className="hotel-location">
          <span>&#128205;</span> {hotel.location}
        </p>
        <p className="hotel-description">
          {hotel.description?.substring(0, 100)}
          {hotel.description?.length > 100 ? '...' : ''}
        </p>
        <div className="hotel-card-footer">
          <div className="hotel-price">
            {hotel.minPrice ? (
              <>From <strong>${hotel.minPrice}</strong>/night</>
            ) : (
              <span>View rooms for pricing</span>
            )}
          </div>
          <Link to={`/hotels/${hotel.id}`} className="btn btn-primary btn-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;

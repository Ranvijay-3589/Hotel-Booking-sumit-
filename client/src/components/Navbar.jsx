import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Hotel Booking
      </Link>
      <div className="navbar-links">
        <Link to="/">Hotels</Link>
        {user ? (
          <>
            <Link to="/my-bookings">My Bookings</Link>
            <div className="navbar-user">
              <span>{user.name}</span>
              <button className="btn-logout" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

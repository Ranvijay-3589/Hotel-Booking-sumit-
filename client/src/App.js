import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HotelSearch from './pages/HotelSearch';
import HotelDetail from './pages/HotelDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBookings from './pages/MyBookings';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HotelSearch />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

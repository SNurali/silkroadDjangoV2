import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';
import Profile from './pages/Profile';

import Login from './pages/Login';
import Register from './pages/Register';
import ComingSoon from './pages/ComingSoon';
import Visa from './pages/Visa';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Cabs from './pages/Cabs';
import VendorLayout from './pages/vendor/VendorLayout';
import VendorRegistration from './pages/vendor/Registration';
import FlightHome from './pages/flights/FlightHome';
import FlightList from './pages/flights/FlightList';
import FlightBooking from './pages/flights/FlightBooking';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorGalleryPage from './pages/vendor/GalleryPage';
import TourHome from './pages/tours/TourHome';
import TourDetail from './pages/tours/TourDetail';
import ProfileBookings from './pages/profile/ProfileBookings';
import ProfileSettings from './pages/profile/ProfileSettings';
import ProfileTravelers from './pages/profile/ProfileTravelers';
import VendorHotelList from './pages/vendor/VendorHotelList';
import VendorHotelCreate from './pages/vendor/VendorHotelCreate';
import VendorTourList from './pages/vendor/VendorTourList';
import VendorTourCreate from './pages/vendor/VendorTourCreate';

import VendorBookings from './pages/vendor/VendorBookings';
import VendorSettings from './pages/vendor/VendorSettings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-indigo-600">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  // Main Router Setup
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Layout Route (Navbar + Footer) */}
          <Route element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Outlet />
              </main>
              <Footer />
            </div>
          }>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<HotelList />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />

            <Route path="/flights" element={<FlightHome />} />
            <Route path="/flights/results" element={<FlightList />} />
            <Route path="/tours" element={<TourHome />} />
            <Route path="/tours/:id" element={<TourDetail />} />
            <Route path="/cabs" element={<Cabs />} />
            <Route path="/visa" element={<Visa />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />

            {/* Login can be here if we want Navbar on login page, or move outside if we want standalone login */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* User Profile Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <Profile />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile/bookings" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <ProfileBookings />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile/travelers" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <ProfileTravelers />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/flights/book/:id" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <FlightBooking />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile/settings" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <ProfileSettings />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/become-vendor" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <VendorRegistration />
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          {/* Vendor Routes (Dedicated Sidebar Layout) */}
          <Route path="/vendor" element={
            <ProtectedRoute>
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="hotels" element={<VendorHotelList />} />
            <Route path="hotels/create" element={<VendorHotelCreate />} />
            <Route path="hotels/edit/:id" element={<VendorHotelCreate />} />
            <Route path="tours" element={<VendorTourList />} />
            <Route path="tours/create" element={<VendorTourCreate />} />
            <Route path="tours/edit/:id" element={<VendorTourCreate />} />
            <Route path="bookings" element={<VendorBookings />} />
            <Route path="settings" element={<VendorSettings />} />
            <Route path="gallery" element={<VendorGalleryPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
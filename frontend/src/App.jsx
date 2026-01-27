import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';
import Profile from './pages/Profile';

import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
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
import BookingConfirmation from './pages/BookingConfirmation';
import VendorHotelList from './pages/vendor/VendorHotelList';
import VendorHotelCreate from './pages/vendor/VendorHotelCreate';
import VendorTourList from './pages/vendor/VendorTourList';
import VendorTourCreate from './pages/vendor/VendorTourCreate';

import VendorBookings from './pages/vendor/VendorBookings';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorRegistrationPage from './pages/vendor/VendorRegistrationPage';

import ScrollToTop from './components/ScrollToTop';
import ChatWidget from './components/ChatWidget';
import SupportChat from './pages/SupportChat';
import Maintenance from './pages/Maintenance';

// Standalone Unauthorized Page
const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-4">
    <h1 className="text-6xl font-black text-slate-200 dark:text-slate-800 mb-4">403</h1>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
    <p className="text-slate-600 dark:text-slate-400 mb-8">You do not have permission to view this page.</p>
    <a href="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Back to Home</a>
  </div>
);

function App() {
  // CONFIG: Set to true if you want to use the official Open WebUI embed widget (2026 standard)
  // Otherwise, it uses the local SilkRoad custom widget (Option 2)
  const USE_OPEN_WEBUI_EMBED = false;

  React.useEffect(() => {
    if (USE_OPEN_WEBUI_EMBED) {
      // Inject Open WebUI Script
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/open-webui-embed@latest/dist/open-webui-embed-manager.js"; // Standard 2026 CDN
      script.async = true;
      script.onload = () => {
        window.OpenWebUIEmbed?.init({
          url: "http://localhost:3000", // Replace with your Open WebUI URL
          model: "gpt-4o",
        });
      };
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, [USE_OPEN_WEBUI_EMBED]);

  // Main Router Setup
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        {!USE_OPEN_WEBUI_EMBED && <ChatWidget />}
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
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/maintenance" element={<Maintenance />} />
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

          <Route path="/bookings/:id/confirmation" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <BookingConfirmation />
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
                <VendorRegistrationPage />
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/vendor/register" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <VendorRegistrationPage />
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/support-chat/:id" element={
            <ProtectedRoute>
              <SupportChat />
            </ProtectedRoute>
          } />

          {/* Vendor Routes (Dedicated Sidebar Layout) */}
          <Route path="/vendor" element={
            <ProtectedRoute allowedRoles={['admin', 'vendor', 'vendor_op', 'hotel_admin']}>
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
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Garage from './pages/Garage';
import Events from './pages/Events';
import Info from './pages/Info';
import Login from './pages/Login';
import EventDetail from './pages/EventDetail';
import UserProfile from './pages/UserProfile';
import UsersPage from './pages/Users';
import CarDetail from './pages/CarDetail';
import CarsPage from './pages/Cars';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ServiceBook from './pages/ServiceBook';
import Tracker from './pages/Tracker';
import { CookieConsentProvider } from './contexts/CookieConsentContext';

function App() {
  return (
    <AuthProvider>
      <CookieConsentProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/cars" element={<CarsPage />} />
              <Route path="/garage" element={<Garage />} />
              <Route path="/garage/:carId/service" element={<ServiceBook />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/car/:id" element={<CarDetail />} />
              <Route path="/info" element={<Info />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/tracker" element={<Tracker />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CookieConsentProvider>
    </AuthProvider>
  );
}

export default App;

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
import TermsOfService from './pages/TermsOfService';
import ServiceBook from './pages/ServiceBook';
import FuelTracker from './pages/FuelTracker';
import Tracker from './pages/Tracker';
import Chats from './pages/Chats';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <AuthProvider>
      <CookieConsentProvider>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/cars" element={<CarsPage />} />
                <Route path="/garage" element={<Garage />} />
                <Route path="/garage/:carId/service" element={<ServiceBook />} />
                <Route path="/garage/:carId/fuel" element={<FuelTracker />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                <Route path="/car/:id" element={<CarDetail />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/info" element={<Info />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/tos" element={<TermsOfService />} />
                <Route path="/tracker" element={<Tracker />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </CookieConsentProvider>
    </AuthProvider>
  );
}

export default App;

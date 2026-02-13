import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Car, Calendar, Info, LogIn, Users, CarFront, Navigation, MessageSquare, Store } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Footer from './Footer';
import CookieBanner from './CookieBanner';
import ChatDrawer from './ChatDrawer';
import SupportSection from './SupportSection';
import UserAvatar from './UserAvatar';

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { activeChat, closeChat, unreadMap, openChat } = useChat();

  const unreadCount = Object.keys(unreadMap).length;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: CarFront, label: 'Auta', path: '/cars' },
    { icon: Car, label: 'Garáž', path: '/garage' },
    { icon: Navigation, label: 'Mapa', path: '/tracker' },
    { icon: MessageSquare, label: 'Zprávy', path: '/chats', badge: unreadCount > 0 ? unreadCount : undefined },
    { icon: Store, label: 'Bazar', path: '/market' },
    { icon: Users, label: 'Lidé', path: '/users' },
    { icon: Calendar, label: 'Akce', path: '/events' },
    { icon: Info, label: 'Info', path: '/info' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">

      {/* Desktop Sidebar - Black Theme */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111] border-r border-slate-800 fixed h-full z-20 text-slate-200">
        <div className="p-6 flex justify-center">
          <img src="/logo.svg" alt="Bez Komprese" className="h-8" />
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold tracking-wide uppercase text-sm relative",
                  isActive ? "bg-brand text-brand-contrast shadow-[0_0_15px_rgba(255,214,0,0.3)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="relative">
                  <Icon size={20} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop User Section */}
        <div className="p-4 border-t border-slate-800">
          {user ? (
            <div className="flex items-center gap-3 px-4 py-2">
              <Link to={`/profile/${user.uid}`} className="block hover:scale-105 transition-transform">
                <UserAvatar user={user} size={16} className="w-8 h-8 ring-2 ring-brand rounded-full" />
              </Link>
              <div className="flex-1 overflow-hidden">
                <Link to={`/profile/${user.uid}`} className="text-sm font-bold truncate text-white hover:text-brand transition-colors block">{user.displayName || 'Uživatel'}</Link>
                <button onClick={logout} className="text-xs text-brand hover:underline flex items-center gap-1">Odhlásit</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl text-sm font-bold text-white hover:bg-brand hover:text-brand-contrast transition-colors justify-center">
              <LogIn size={18} /> PŘIHLÁSIT SE
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar - Black Theme */}
      <header className="md:hidden sticky top-0 z-30 bg-[#111111] text-white shadow-md pt-safe border-b border-white/10">
        <div className="p-4 flex justify-between items-center w-full">
          <img src="/logo.svg" alt="Bez Komprese" className="h-6" />
          {user ? (
            <Link to={`/profile/${user.uid}`} className="block">
              <UserAvatar user={user} size={16} className="w-8 h-8 ring-1 ring-brand rounded-full" />
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-bold text-brand hover:underline flex items-center gap-1 uppercase tracking-wider">
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 p-4 md:ml-64 w-full max-w-5xl mx-auto flex flex-col min-h-screen">
        <div className="flex-1">
          <Outlet />
        </div>
        <SupportSection />
        <Footer />
      </main>

      {/* Mobile Bottom Navigation - White/Light */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full transition-colors relative",
                  isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {isActive && <div className="absolute top-0 w-12 h-1 bg-brand rounded-b-full shadow-[0_0_10px_rgba(255,214,0,0.5)]" />}
                <div className="relative">
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-bold uppercase tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CookieBanner />

      {/* Global Chat Drawer */}
      {activeChat && (
        <ChatDrawer
          roomId={activeChat.roomId}
          recipientName={activeChat.recipientName}
          onClose={closeChat}
        />
      )}

      {/* Floating Unread Message Indicator (Simple Toast) */}
      {unreadCount > 0 && !activeChat && (
        <button
          onClick={() => {
            // Determine which chat to open. For now, just open the first one in keys
            // Real impl would show a list or open the latest
            const roomId = Object.keys(unreadMap)[0];
            openChat(roomId, "Unknown", "Chat"); // We need recipient details here, handled loosely for now
          }}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-brand text-brand-contrast px-4 py-3 rounded-full shadow-xl z-50 animate-bounce flex items-center gap-3 font-bold"
        >
          <div className="relative">
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          </div>
          <span>Nová zpráva</span>
        </button>
      )}

    </div>
  );
}

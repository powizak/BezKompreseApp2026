import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Car, Calendar, Info, LogIn, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Car, label: 'Garáž', path: '/garage' },
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold tracking-wide uppercase text-sm",
                  isActive ? "bg-brand text-brand-contrast shadow-[0_0_15px_rgba(255,214,0,0.3)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {user ? (
            <div className="flex items-center gap-3 px-4 py-2">
              <Link to={`/profile/${user.uid}`} className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-2 ring-brand block hover:scale-105 transition-transform">
                {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <div className="p-1 text-slate-400 h-full w-full flex items-center justify-center"><Car size={16} /></div>}
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
      <header className="md:hidden sticky top-0 z-10 bg-[#111111] text-white shadow-md p-4 flex justify-between items-center border-b border-white/10">
        <img src="/logo.svg" alt="Bez Komprese" className="h-6" />
        {user ? (
          <Link to={`/profile/${user.uid}`} className="w-8 h-8 rounded-full bg-white/10 overflow-hidden ring-1 ring-brand block">
            {user.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <div className="p-1 h-full w-full flex items-center justify-center"><Car size={16} /></div>}
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-bold text-brand hover:underline flex items-center gap-1 uppercase tracking-wider">
            <LogIn size={16} /> Login
          </Link>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 p-4 md:ml-64 w-full max-w-5xl mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation - White/Light */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-20 pb-safe">
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
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] mt-1 font-bold uppercase tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

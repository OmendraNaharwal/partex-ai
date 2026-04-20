import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navClass = ({ isActive }) =>
  [
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-white text-slate-900 shadow'
      : 'text-slate-100 hover:bg-slate-700/70',
  ].join(' ');

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-30" style={{
        background:
          'radial-gradient(circle at 10% 10%, rgba(56,189,248,0.35), transparent 35%), radial-gradient(circle at 80% 20%, rgba(250,204,21,0.25), transparent 30%), radial-gradient(circle at 50% 100%, rgba(16,185,129,0.25), transparent 35%)',
      }} />

      <header className="sticky top-0 z-20 border-b border-slate-700/40 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            VoiceCare Console
          </Link>
          <nav className="flex items-center gap-2 rounded-full bg-slate-800/80 p-1">
            <NavLink to="/" className={navClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/consultation" className={navClass}>
              Consultation
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 md:inline">{user?.name || user?.email}</span>
            <button
              className="rounded-full border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

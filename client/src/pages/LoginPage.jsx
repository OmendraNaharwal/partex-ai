import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const defaultRegister = {
  name: '',
  email: '',
  password: '',
  specialization: '',
  licenseNumber: '',
};

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(defaultRegister);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(loginForm);
      } else {
        await register(registerForm);
      }
    } catch (submitError) {
      setError(submitError?.response?.data?.error || submitError.message || 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
        <section className="rounded-3xl border border-cyan-400/20 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-4xl font-bold tracking-tight">VoiceCare</h1>
          <p className="mt-3 text-slate-300">Real-time multilingual clinic assistant for doctors.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <p>Live transcription over WebSocket</p>
            <p>Structured medical extraction with LLM</p>
            <p>Patient history Q&A and prescriptions</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl">
          <div className="mb-6 flex rounded-full bg-slate-800 p-1">
            <button
              className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-cyan-300 text-slate-900' : 'text-slate-300'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`w-1/2 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-cyan-300 text-slate-900' : 'text-slate-300'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </>
            ) : (
              <>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Doctor Name"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Password"
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Specialization"
                  value={registerForm.specialization}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, specialization: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="License Number"
                  value={registerForm.licenseNumber}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                />
              </>
            )}

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

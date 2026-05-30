import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { setToken } from '../auth.js';
import { api } from '../api.js';
import { Button, ErrorBanner, inputClass } from '../components/ui.jsx';

/**
 * Operator pastes the ADMIN_TOKEN here. We confirm it works by hitting
 * /api/admin/products — a 401 means wrong token, anything else means good.
 */
export default function Login() {
  const [token, setTok] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    setToken(token.trim());
    try {
      await api.listProducts();
      nav('/');
    } catch (e) {
      setToken('');
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo_1024.png"
            alt="Dream"
            className="w-16 h-16 rounded-2xl shadow-soft mb-3"
          />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Dream Admin
          </h1>
          <p className="text-sm text-slate-500">Sign in to manage your shop</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-soft border border-slate-200/70 p-6 space-y-4"
        >
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Admin token
            </span>
            <div className="relative mt-1.5">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
                value={token}
                onChange={(e) => setTok(e.target.value)}
                placeholder="paste your ADMIN_TOKEN"
                className={`${inputClass} pl-9`}
                required
                autoFocus
              />
            </div>
          </label>

          <ErrorBanner>{err}</ErrorBanner>

          <Button
            type="submit"
            size="lg"
            icon={LogIn}
            loading={busy}
            className="w-full"
          >
            {busy ? 'Verifying…' : 'Sign in'}
          </Button>

          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Stored only on this browser. Clear it via Sign out.
          </p>
        </form>
      </div>
    </div>
  );
}

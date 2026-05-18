import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../auth.js';
import { api } from '../api.js';

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
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center font-extrabold text-xl">
            D
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Dream Admin
            </h1>
            <p className="text-xs text-slate-500">Sign in to manage your shop</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            Admin token
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(e) => setTok(e.target.value)}
            placeholder="paste your ADMIN_TOKEN"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
            required
          />
        </label>

        {err && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-brand text-white py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {busy ? 'Verifying…' : 'Sign in'}
        </button>

        <p className="text-[11px] text-slate-400">
          The token is stored only on this browser. Clear it via the sidebar.
        </p>
      </form>
    </div>
  );
}

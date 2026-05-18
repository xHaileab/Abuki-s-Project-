import { useEffect, useState } from 'react';
import { api } from '../api.js';

const FIELDS = [
  { key: 'adminPhone', label: 'Admin phone' },
  { key: 'paymentInstructions', label: 'Payment instructions', multiline: true },
];

export default function ConfigPage() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c || {});
      setLoading(false);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      await api.updateConfig(config);
      setOk('Saved.');
      setTimeout(() => setOk(''), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <form onSubmit={save} className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold">Storefront config</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {ok && (
        <div className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          {ok}
        </div>
      )}

      {FIELDS.map((f) => (
        <label key={f.key} className="block">
          <span className="text-xs font-semibold text-slate-600">{f.label}</span>
          {f.multiline ? (
            <textarea
              rows={5}
              value={config[f.key] || ''}
              onChange={(e) =>
                setConfig({ ...config, [f.key]: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          ) : (
            <input
              value={config[f.key] || ''}
              onChange={(e) =>
                setConfig({ ...config, [f.key]: e.target.value })
              }
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          )}
        </label>
      ))}

      <button
        disabled={saving}
        className="bg-brand text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

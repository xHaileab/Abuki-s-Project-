import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    tag: '',
    imageUrl: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAds(await api.listAds());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title) {
      setError('Title required.');
      return;
    }
    setError('');
    try {
      await api.createAd({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        tag: form.tag.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
      });
      setForm({ title: '', subtitle: '', tag: '', imageUrl: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(ad) {
    if (!confirm(`Delete ad "${ad.title}"?`)) return;
    try {
      await api.deleteAd(ad.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Ads / Banners</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 gap-3"
      >
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300"
            required
          />
        </Field>
        <Field label="Tag (e.g. Hot Deal)">
          <input
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300"
          />
        </Field>
        <Field label="Subtitle">
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300"
          />
        </Field>
        <Field label="Image URL">
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300"
            placeholder="https://… or /static/images/..."
          />
        </Field>
        <div className="col-span-2 flex justify-end">
          <button className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
            Add ad
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-3 text-center text-slate-400">Loading…</div>
        )}
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="aspect-video bg-slate-100 grid place-items-center">
              {ad.imageUrl ? (
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 text-xs">no image</span>
              )}
            </div>
            <div className="p-3 space-y-1">
              {ad.tag && (
                <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {ad.tag}
                </span>
              )}
              <div className="font-bold">{ad.title}</div>
              <div className="text-xs text-slate-500">{ad.subtitle}</div>
              <button
                onClick={() => remove(ad)}
                className="text-xs text-red-600 hover:underline mt-2"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

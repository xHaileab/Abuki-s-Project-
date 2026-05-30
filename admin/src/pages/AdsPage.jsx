import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Plus, Trash2, ImageOff } from 'lucide-react';
import { api } from '../api.js';
import {
  Button,
  IconButton,
  Card,
  PageHeader,
  EmptyState,
  ErrorBanner,
  Spinner,
  Field,
  inputClass,
} from '../components/ui.jsx';

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
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
    } finally {
      setSaving(false);
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
      <PageHeader
        title="Ads / Banners"
        subtitle="Promotional banners shown in the app carousel"
        icon={Megaphone}
      />

      <ErrorBanner>{error}</ErrorBanner>

      <Card className="p-4">
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Weekend Combo"
              required
            />
          </Field>
          <Field label="Tag (e.g. Hot Deal)">
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className={inputClass}
              placeholder="Hot Deal"
            />
          </Field>
          <Field label="Subtitle">
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className={inputClass}
              placeholder="Order now and save 15%"
            />
          </Field>
          <Field label="Image URL">
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className={inputClass}
              placeholder="https://… or /static/images/..."
            />
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" icon={Plus} loading={saving}>
              Add ad
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <Card className="grid place-items-center py-12">
          <span className="flex items-center gap-2 text-slate-400 text-sm">
            <Spinner className="w-4 h-4" /> Loading…
          </span>
        </Card>
      ) : ads.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No ads yet"
            hint="Create a banner to feature it in the app carousel."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <Card
              key={ad.id}
              className="overflow-hidden group hover:shadow-card-hover transition-shadow"
            >
              <div className="aspect-video bg-slate-100 grid place-items-center overflow-hidden">
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <ImageOff className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="p-4 space-y-1.5">
                {ad.tag && (
                  <span className="inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                    {ad.tag}
                  </span>
                )}
                <div className="font-bold text-slate-900">{ad.title}</div>
                <div className="text-xs text-slate-500">{ad.subtitle}</div>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => remove(ad)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

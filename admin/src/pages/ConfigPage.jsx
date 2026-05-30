import { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../api.js';
import {
  Button,
  Card,
  PageHeader,
  ErrorBanner,
  Spinner,
  Field,
  inputClass,
} from '../components/ui.jsx';
import ImageInput from '../components/ImageInput.jsx';

const FIELDS = [
  { key: 'adminPhone', label: 'Admin phone' },
  { key: 'telebirrMerchantName', label: 'Telebirr merchant name' },
  { key: 'telebirrPhone', label: 'Telebirr phone/account' },
  { key: 'telebirrQrImageUrl', label: 'Telebirr QR image', image: true },
  { key: 'paymentInstructions', label: 'Payment instructions', multiline: true },
];

export default function ConfigPage() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    api
      .getConfig()
      .then((c) => {
        setConfig(c || {});
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
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
      setOk('Changes saved.');
      setTimeout(() => setOk(''), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Storefront config"
        subtitle="Payment details and instructions shown to customers"
        icon={Settings}
      />

      <ErrorBanner>{error}</ErrorBanner>

      {ok && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {ok}
        </div>
      )}

      {loading ? (
        <Card className="grid place-items-center py-12">
          <span className="flex items-center gap-2 text-slate-400 text-sm">
            <Spinner className="w-4 h-4" /> Loading…
          </span>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={save} className="space-y-4">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.image ? (
                  <ImageInput
                    value={config[f.key] || ''}
                    onChange={(v) => setConfig({ ...config, [f.key]: v })}
                  />
                ) : f.multiline ? (
                  <textarea
                    rows={5}
                    value={config[f.key] || ''}
                    onChange={(e) =>
                      setConfig({ ...config, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder || ''}
                    className={`${inputClass} resize-y`}
                  />
                ) : (
                  <input
                    value={config[f.key] || ''}
                    onChange={(e) =>
                      setConfig({ ...config, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder || ''}
                    className={inputClass}
                  />
                )}
              </Field>
            ))}

            <div className="pt-2">
              <Button type="submit" icon={Save} loading={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

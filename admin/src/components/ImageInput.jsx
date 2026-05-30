import { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api, resolveImageUrl } from '../api.js';
import { fileToUploadDataUrl } from '../lib/image.js';
import { inputClass } from './ui.jsx';

/**
 * Combined image field: paste a URL or upload from the device. On upload it
 * compresses client-side, POSTs to the backend, and stores the returned
 * /static/uploads/.. URL as the field value.
 */
export default function ImageInput({ value, onChange, placeholder }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setErr('');
    setBusy(true);
    try {
      const dataUrl = await fileToUploadDataUrl(file);
      const res = await api.uploadImage(dataUrl);
      onChange(res.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const preview = resolveImageUrl(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 grid place-items-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={preview}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-slate-300" />
          )}
        </div>

        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://… or upload a file'}
          className={inputClass}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 shrink-0"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Upload</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear image"
            className="inline-grid place-items-center w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {err && <p className="text-[11px] text-red-600">{err}</p>}
    </div>
  );
}

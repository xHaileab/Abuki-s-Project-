import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ImageOff,
} from 'lucide-react';
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', price: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.listProducts());
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
    const price = Number(form.price);
    if (!form.name || !Number.isFinite(price) || price < 0) {
      setError('Name and a non-negative price required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.createProduct({
        name: form.name.trim(),
        price,
        imageUrl: form.imageUrl.trim() || null,
      });
      setForm({ name: '', price: '', imageUrl: '' });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function update(p, patch) {
    try {
      await api.updateProduct(p.id, patch);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(p) {
    if (!confirm(`Delete ${p.name}?`)) return;
    try {
      await api.deleteProduct(p.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your catalogue and pricing"
        icon={ShoppingBag}
      />

      <ErrorBanner>{error}</ErrorBanner>

      <Card className="p-4">
        <form onSubmit={submit} className="flex items-end gap-3 flex-wrap">
          <div className="w-44">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g. Onion"
                required
              />
            </Field>
          </div>
          <div className="w-32">
            <Field label="Price (ETB)">
              <input
                type="number"
                step="any"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
                placeholder="0"
                required
              />
            </Field>
          </div>
          <div className="flex-1 min-w-[16rem]">
            <Field label="Image URL (optional)">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
          </div>
          <Button type="submit" icon={Plus} loading={saving}>
            Add product
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold text-right">Price (ETB)</th>
                <th className="px-4 py-3 font-semibold">Image URL</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Spinner className="w-4 h-4" /> Loading…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={ShoppingBag}
                      title="No products yet"
                      hint="Add your first product using the form above."
                    />
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onSave={update}
                  onDelete={remove}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Thumb({ url, name }) {
  if (!url) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-300 grid place-items-center shrink-0">
        <ImageOff className="w-4 h-4" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

function ProductRow({ product, onSave, onDelete }) {
  const [draft, setDraft] = useState(product);
  const [editing, setEditing] = useState(false);

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Thumb url={product.imageUrl} name={product.name} />
          {editing ? (
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`${inputClass} py-1.5 max-w-[12rem]`}
            />
          ) : (
            <span className="font-medium text-slate-800">{product.name}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {editing ? (
          <input
            type="number"
            step="any"
            value={draft.price}
            onChange={(e) =>
              setDraft({ ...draft, price: Number(e.target.value) })
            }
            className={`${inputClass} py-1.5 w-28 text-right inline-block`}
          />
        ) : (
          <span className="font-semibold text-slate-900">{product.price}</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
        {editing ? (
          <input
            value={draft.imageUrl || ''}
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
            className={`${inputClass} py-1.5`}
            placeholder="https://…"
          />
        ) : (
          <span className="truncate block">{product.imageUrl || '—'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {editing ? (
            <>
              <IconButton
                icon={Check}
                variant="primary"
                title="Save"
                onClick={() => {
                  onSave(product, {
                    name: draft.name,
                    price: draft.price,
                    imageUrl: draft.imageUrl || null,
                  });
                  setEditing(false);
                }}
              />
              <IconButton
                icon={X}
                variant="subtle"
                title="Cancel"
                onClick={() => {
                  setDraft(product);
                  setEditing(false);
                }}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={Pencil}
                variant="subtle"
                title="Edit"
                onClick={() => setEditing(true)}
              />
              <IconButton
                icon={Trash2}
                variant="danger"
                title="Delete"
                onClick={() => onDelete(product)}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

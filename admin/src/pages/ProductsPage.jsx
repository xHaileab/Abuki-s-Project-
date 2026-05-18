import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', price: '', imageUrl: '' });

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
      <h1 className="text-2xl font-extrabold">Products</h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-xl border border-slate-200 p-4 flex items-end gap-3 flex-wrap"
      >
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 w-44"
            required
          />
        </Field>
        <Field label="Price (ETB)">
          <input
            type="number"
            step="any"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 w-32"
            required
          />
        </Field>
        <Field label="Image URL (optional)">
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 w-72"
            placeholder="https://…"
          />
        </Field>
        <button className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">
          Add product
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Price (ETB)</th>
              <th className="px-4 py-3">Image URL</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading…
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
    </div>
  );
}

function ProductRow({ product, onSave, onDelete }) {
  const [draft, setDraft] = useState(product);
  const [editing, setEditing] = useState(false);

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="px-2 py-1 rounded border border-slate-300"
          />
        ) : (
          <span className="font-medium">{product.name}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <input
            type="number"
            step="any"
            value={draft.price}
            onChange={(e) =>
              setDraft({ ...draft, price: Number(e.target.value) })
            }
            className="px-2 py-1 rounded border border-slate-300 w-28 text-right"
          />
        ) : (
          product.price
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-xs">
        {editing ? (
          <input
            value={draft.imageUrl || ''}
            onChange={(e) =>
              setDraft({ ...draft, imageUrl: e.target.value })
            }
            className="px-2 py-1 rounded border border-slate-300 w-full"
          />
        ) : (
          product.imageUrl || '—'
        )}
      </td>
      <td className="px-4 py-3 text-right space-x-1">
        {editing ? (
          <>
            <button
              onClick={() => {
                onSave(product, {
                  name: draft.name,
                  price: draft.price,
                  imageUrl: draft.imageUrl || null,
                });
                setEditing(false);
              }}
              className="text-xs px-2 py-1 rounded-md bg-brand text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setDraft(product);
                setEditing(false);
              }}
              className="text-xs px-2 py-1 rounded-md bg-slate-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-2 py-1 rounded-md bg-slate-100"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(product)}
              className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
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

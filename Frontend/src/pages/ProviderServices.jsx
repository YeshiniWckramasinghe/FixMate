import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', description: '', category: '', price: '' };

export default function ProviderServices() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get('/api/provider/services');
      setServices(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      price: service.price,
    });
    setFormError('');
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editing) {
        await client.put(`/api/services/${editing.id}`, payload);
      } else {
        await client.post('/api/services', payload);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await client.delete(`/api/services/${id}`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <h1>My Services</h1>
          <p>Manage what you offer and how much you charge.</p>
        </div>

        {!user?.approved && (
          <div className="alert alert-error">
            Your provider account is pending admin approval. You can't add
            services until an admin approves you.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card-actions" style={{ marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add a service
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Loading your services…</p>
        ) : services.length === 0 ? (
          <div className="empty-state">You haven't listed any services yet.</div>
        ) : (
          services.map((s) => (
            <div className="card" key={s.id}>
              <div className="card-row">
                <div>
                  <h3>{s.name}</h3>
                  <p className="card-meta">{s.category}</p>
                  <p className="card-meta">{s.description}</p>
                  {!s.active && <p className="card-meta">Inactive</p>}
                </div>
                <div className="card-price">Rs. {Number(s.price).toLocaleString()}</div>
              </div>
              <div className="card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                  Edit
                </button>
                {s.active && (
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {showForm && (
          <Modal
            title={editing ? 'Edit service' : 'Add a new service'}
            onClose={() => setShowForm(false)}
          >
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label>Service name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Category</label>
                <input
                  required
                  placeholder="e.g. Electrician, Plumber, Cleaning"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Price (Rs.)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="card-actions">
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}

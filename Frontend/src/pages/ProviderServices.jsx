import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { imageUrl, resizeImage } from '../utils/image';
import '../thumbnail.css';

const EMPTY_FORM = { name: '', description: '', category: '', price: '' };

export default function ProviderServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [hasSchedule, setHasSchedule] = useState(true); // false once we know there are no working hours

  // Thumbnail state for the form
  const fileInput = useRef(null);
  const [thumbFile, setThumbFile] = useState(null); // a newly chosen picture, not uploaded yet
  const [preview, setPreview] = useState(''); // what the preview box shows
  const [removeThumb, setRemoveThumb] = useState(false); // delete the saved thumbnail on save

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
    client
      .get('/api/provider/availability')
      .then(({ data }) => setHasSchedule(data.windows.length > 0))
      .catch(() => {}); // the banner is only a hint, so ignore errors
  }, []);

  const releasePreview = () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  };

  const resetThumbnail = (existingUrl = '') => {
    releasePreview();
    setThumbFile(null);
    setPreview(existingUrl ? imageUrl(existingUrl) : '');
    setRemoveThumb(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    resetThumbnail();
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
    resetThumbnail(service.thumbnailUrl);
    setShowForm(true);
  };

  const closeForm = () => {
    releasePreview();
    setShowForm(false);
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    releasePreview();
    setThumbFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveThumb(false);
    setFormError('');
  };

  const onRemoveThumb = () => {
    releasePreview();
    setThumbFile(null);
    setPreview('');
    setRemoveThumb(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    // Step 1: save the service itself
    let saved;
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editing) {
        ({ data: saved } = await client.put(`/api/services/${editing.id}`, payload));
      } else {
        ({ data: saved } = await client.post('/api/services', payload));
        // From here on this form edits the new service, so a retry can't create a duplicate
        setEditing(saved);
      }
    } catch (err) {
      setFormError(apiErrorMessage(err));
      setSubmitting(false);
      return;
    }

    // Step 2: add, replace or remove the thumbnail
    try {
      if (thumbFile) {
        const blob = await resizeImage(thumbFile);
        const body = new FormData();
        body.append('file', blob, 'thumbnail.jpg');
        await client.put(`/api/services/${saved.id}/thumbnail`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (removeThumb && saved.thumbnailUrl) {
        await client.delete(`/api/services/${saved.id}/thumbnail`);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(
        `The service was saved, but the thumbnail could not be uploaded. ${apiErrorMessage(err)}`
      );
      await load();
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
          <p>Manage what you offer, how much you charge, and the picture customers see.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!hasSchedule && (
          <div className="alert alert-error">
            You haven’t set your working hours yet, so customers can’t book you online.{' '}
            <Link to="/provider/availability">Set your availability</Link>
          </div>
        )}

        <div className="card-actions" style={{ marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={openCreate}>
            + Add a service
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Loading your services…</p>
        ) : services.length === 0 ? (
          <div className="empty-state">You haven’t listed any services yet.</div>
        ) : (
          services.map((s) => (
            <div className="card" key={s.id}>
              <div className="card-row">
                <div className="svc-main">
                  {s.thumbnailUrl ? (
                    <img className="svc-thumb" src={imageUrl(s.thumbnailUrl)} alt="" />
                  ) : (
                    <div className="svc-thumb empty">No thumbnail</div>
                  )}
                  <div>
                    <h3>{s.name}</h3>
                    <p className="card-meta">{s.category}</p>
                    <p className="card-meta">{s.description}</p>
                    {!s.active && <p className="card-meta">Inactive</p>}
                  </div>
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
          <Modal title={editing ? 'Edit service' : 'Add a new service'} onClose={closeForm}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="svc-name">Service name</label>
                <input
                  id="svc-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="svc-category">Category</label>
                <input
                  id="svc-category"
                  required
                  placeholder="e.g. Electrician, Plumber, Cleaning"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="svc-description">Description</label>
                <textarea
                  id="svc-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="svc-price">Price (Rs.)</label>
                <input
                  id="svc-price"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Thumbnail (optional)</label>
                <div className="thumb-field">
                  {preview ? (
                    <div className="thumb-preview">
                      <img src={preview} alt="Thumbnail preview" />
                    </div>
                  ) : (
                    <div className="thumb-preview empty">No image</div>
                  )}
                  <div className="thumb-side">
                    <div className="thumb-buttons">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => fileInput.current?.click()}
                      >
                        {preview ? 'Change image' : 'Choose image'}
                      </button>
                      {preview && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={onRemoveThumb}>
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="thumb-hint">
                      JPG, PNG or WebP. It is resized for you, and customers see it next to your
                      service.
                    </p>
                  </div>
                  <input
                    ref={fileInput}
                    className="thumb-hidden-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onPickFile}
                  />
                </div>
              </div>

              <div className="card-actions">
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add service'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
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

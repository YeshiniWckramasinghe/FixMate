import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { apiErrorMessage } from '../api/client';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import ProviderLayout from '../components/ProviderLayout';
import { imageUrl, resizeImage } from '../utils/image';
import '../thumbnail.css';
import '../provider.css';

const EMPTY_FORM = { name: '', description: '', category: '', price: '' };

// Pick an icon for a (free-text) category name when a service has no thumbnail
function categoryIcon(category = '') {
  const text = category.toLowerCase();
  if (/electric/.test(text)) return 'bolt';
  if (/plumb/.test(text)) return 'drop';
  if (/computer|laptop|\bpc\b/.test(text)) return 'monitor';
  if (/appliance/.test(text)) return 'tool';
  if (/\bac\b|a\/c|air\s?con|cooling|hvac/.test(text)) return 'wind';
  if (/clean/.test(text)) return 'sparkle';
  return 'tool';
}

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
  const [slotMinutes, setSlotMinutes] = useState(60); // every booking takes one slot of this length
  const [busyId, setBusyId] = useState(null);

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
      .then(({ data }) => {
        setHasSchedule(data.windows.length > 0);
        if (data.slotMinutes) setSlotMinutes(data.slotMinutes);
      })
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

  // The backend only lets a service be switched off (DELETE = deactivate), not back on
  const deactivate = async (service) => {
    const ok = window.confirm(
      `Deactivate "${service.name}"? Customers will no longer see it, and it can't be switched back on from here.`
    );
    if (!ok) return;
    setBusyId(service.id);
    setError('');
    try {
      await client.delete(`/api/services/${service.id}`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ProviderLayout>
      <div className="fm-dash">
        <div className="fm-page-header">
          <div>
            <h1>My services</h1>
            <p>Manage the services and pricing customers see.</p>
          </div>
          <button type="button" className="fm-btn fm-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={16} /> Add new service
          </button>
        </div>

        {error && (
          <div className="fm-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!hasSchedule && (
          <div className="fm-alert-error" role="alert">
            <span>
              You haven’t set your working hours yet, so customers can’t book you online.
            </span>
            <Link to="/provider/availability">Set your availability</Link>
          </div>
        )}

        <div className="fm-card fm-table-card">
          {!loading && services.length === 0 ? (
            <p className="fm-table-empty">
              You haven’t listed any services yet. Use “Add new service” to create your first one.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Base price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [0, 1, 2].map((i) => (
                      <tr className="fm-skeleton-row" key={i}>
                        <td colSpan={5}>
                          <div className="fm-skeleton-block" style={{ height: 32 }} />
                        </td>
                      </tr>
                    ))
                  : services.map((s) => (
                      <tr key={s.id} className={s.active ? '' : 'fm-row-inactive'}>
                        <td>
                          <div className="fm-table-title">
                            {s.thumbnailUrl ? (
                              <img src={imageUrl(s.thumbnailUrl)} alt="" />
                            ) : (
                              <span className="fm-service-table-icon">
                                <Icon name={categoryIcon(s.category)} />
                              </span>
                            )}
                            <div>
                              <b>{s.name}</b>
                              <small>{s.category}</small>
                            </div>
                          </div>
                        </td>
                        <td>LKR {Number(s.price).toLocaleString()}</td>
                        <td>{slotMinutes} min</td>
                        <td>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={s.active}
                            aria-label={`${s.name} is ${s.active ? 'active' : 'inactive'}`}
                            title={
                              s.active
                                ? 'Active. Switch off to deactivate'
                                : 'Inactive. It can’t be switched back on from here'
                            }
                            className={`fm-switch ${s.active ? 'fm-on' : ''}`}
                            disabled={!s.active || busyId === s.id}
                            onClick={() => deactivate(s)}
                          >
                            <i />
                          </button>
                        </td>
                        <td>
                          <div className="fm-row-actions">
                            <button
                              type="button"
                              aria-label={`Edit ${s.name}`}
                              title="Edit"
                              onClick={() => openEdit(s)}
                            >
                              <Icon name="edit" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
    </ProviderLayout>
  );
}
/**
 * Admin Equipment Management Page
 * Full CRUD for lab equipment
 */

import React, { useState, useEffect } from 'react';
import { equipmentService, labService } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['Electronics', 'Chemistry', 'Biology', 'Physics', 'Computer', 'Mechanical', 'Other'];

const EMPTY_FORM = {
  name: '', description: '', category: 'Electronics',
  quantity: 1, location: 'Main Lab', availability: true, imageUrl: '', lab: ''
};

const AdminEquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [labs, setLabs] = useState([]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await equipmentService.getAll(search ? { search } : {});
      setEquipment(res.data.equipment || []);
    } catch (err) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const res = await labService.getAll();
      setLabs(res.data.labs || []);
    } catch (err) {
      toast.error('Failed to load labs');
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openAddModal = () => {
    setForm({
      ...EMPTY_FORM,
      lab: labs.length > 0 ? labs[0]._id : ''
    });
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (eq) => {
    setForm({
      name: eq.name,
      description: eq.description,
      category: eq.category,
      quantity: eq.quantity,
      location: eq.location || 'Main Lab',
      availability: eq.availability,
      imageUrl: eq.imageUrl || '',
      lab: eq.lab?._id || ''
    });
    setErrors({});
    setEditingId(eq._id);
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (form.quantity < 1) errs.quantity = 'Quantity must be at least 1';
    if (!form.lab) errs.lab = 'Lab selection is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (editingId) {
        await equipmentService.update(editingId, form);
        toast.success('Equipment updated successfully!');
      } else {
        await equipmentService.create(form);
        toast.success('Equipment added successfully!');
      }
      setShowModal(false);
      fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await equipmentService.delete(id);
      toast.success('Equipment deleted');
      fetchEquipment();
    } catch (err) {
      toast.error('Failed to delete equipment');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">
            <i className="bi bi-tools me-2" style={{ color: 'var(--accent-blue)' }}></i>
            Manage Equipment
          </h1>
          <p className="page-subtitle">{equipment.length} items in the lab inventory</p>
        </div>
        <button className="btn-primary-custom" onClick={openAddModal} disabled={labs.length === 0}>
          <i className="bi bi-plus-lg"></i> Add Equipment
        </button>
      </div>

      {/* Search bar */}
      <div className="card-dark mb-4" style={{ padding: '0.875rem 1.25rem' }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <i className="bi bi-search search-icon"></i>
          <input
            placeholder="Search equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
        ) : equipment.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔬</div>
            <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No equipment found</h3>
            <p className="empty-state-text">Add your first piece of equipment to get started.</p>
            <button className="btn-primary-custom mt-3" onClick={openAddModal}>
              <i className="bi bi-plus-lg"></i> Add Equipment
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Lab</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((eq, idx) => (
                  <tr key={eq._id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{eq.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Added by {eq.addedBy?.name || 'Admin'}
                      </div>
                    </td>
                    <td><span className="category-badge">{eq.category}</span></td>
                    <td>{eq.lab?.name || 'Unassigned'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>{eq.description}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{eq.quantity}</td>
                    <td style={{ fontSize: '0.8rem' }}>{eq.location || '—'}</td>
                    <td>
                      <span className={eq.availability ? 'badge-available' : 'badge-unavailable'}>
                        {eq.availability ? '● Available' : '● Unavailable'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(eq.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn-outline-custom"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => openEditModal(eq)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn-danger-custom"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => handleDelete(eq._id, eq.name)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          overflowY: 'auto', padding: '1rem'
        }}>
          <div className="card-dark fade-in-up" style={{ width: '100%', maxWidth: 560 }}>
            <div className="card-header-custom d-flex align-items-center justify-content-between">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                <i className={`bi ${editingId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: 'var(--accent-blue)' }}></i>
                {editingId ? 'Edit Equipment' : 'Add New Equipment'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label-custom">Equipment Name *</label>
                  <input
                    name="name" type="text" className="form-control-custom"
                    placeholder="e.g., Digital Oscilloscope" value={form.name} onChange={handleChange}
                  />
                  {errors.name && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.name}</p>}
                </div>

                <div className="col-12">
                  <label className="form-label-custom">Description *</label>
                  <textarea
                    name="description" className="form-control-custom" rows={3}
                    placeholder="Describe the equipment and its use..." value={form.description} onChange={handleChange}
                  />
                  {errors.description && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.description}</p>}
                </div>

                <div className="col-6">
                  <label className="form-label-custom">Category *</label>
                  <select name="category" className="form-control-custom" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label-custom">Quantity *</label>
                  <input
                    name="quantity" type="number" min="1" className="form-control-custom"
                    value={form.quantity} onChange={handleChange}
                  />
                  {errors.quantity && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.quantity}</p>}
                </div>

                <div className="col-12">
                  <label className="form-label-custom">Lab *</label>
                  <select
                    name="lab"
                    className="form-control-custom"
                    value={form.lab}
                    onChange={handleChange}
                    disabled={labs.length === 0}
                  >
                    <option value="">Select lab</option>
                    {labs.map(l => (
                      <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                  </select>
                  {errors.lab && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.lab}</p>}
                </div>

                <div className="col-12">
                  <label className="form-label-custom">Location</label>
                  <input
                    name="location" type="text" className="form-control-custom"
                    placeholder="e.g., Lab A, Room 204" value={form.location} onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label-custom">Image URL (optional)</label>
                  <input
                    name="imageUrl" type="url" className="form-control-custom"
                    placeholder="https://..." value={form.imageUrl} onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox" name="availability" checked={form.availability}
                      onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Available for booking</span>
                  </label>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn-outline-custom" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-custom" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                    : <><i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                      {editingId ? 'Save Changes' : 'Add Equipment'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEquipmentPage;

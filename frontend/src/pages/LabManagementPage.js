/**
 * Lab Management Page
 * Superadmin-only page for adding and deleting lab facilities
 */

import React, { useState, useEffect } from 'react';
import { labService } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const INITIAL_FORM = {
    name: '',
    department: '',
    description: '',
    location: ''
};

const LabManagementPage = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLabId, setEditingLabId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const res = await labService.getAll();
            setLabs(res.data.labs || []);
        } catch (err) {
            toast.error('Failed to load labs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();
    }, []);

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Lab name is required';
        if (form.name.trim().length < 2) errs.name = 'Lab name must be at least 2 characters';
        if (!form.department.trim()) errs.department = 'Department is required';
        if (form.department.trim().length < 2) errs.department = 'Department must be at least 2 characters';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            if (editingLabId) {
                await labService.update(editingLabId, form);
                toast.success('Lab updated successfully');
            } else {
                await labService.create(form);
                toast.success('Lab added successfully');
            }
            setShowModal(false);
            setEditingLabId(null);
            setForm(INITIAL_FORM);
            fetchLabs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save lab');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete lab "${name}"? This action cannot be undone.`)) return;
        try {
            await labService.delete(id);
            toast.success('Lab deleted successfully');
            fetchLabs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete lab');
        }
    };

    const handleEdit = (lab) => {
        setForm({
            name: lab.name,
            department: lab.department || '',
            location: lab.location || '',
            description: lab.description || ''
        });
        setEditingLabId(lab._id);
        setErrors({});
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="page-container fade-in">
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <h1 className="page-title">
                        <i className="bi bi-building me-2" style={{ color: 'var(--accent-gold)' }}></i>
                        Manage Labs
                    </h1>
                    <p className="page-subtitle">Create and manage lab locations and facilities.</p>
                </div>
                <button className="btn-primary-custom" onClick={() => { setEditingLabId(null); setShowModal(true); setErrors({}); setForm(INITIAL_FORM); }}>
                    <i className="bi bi-plus-lg"></i> Add Lab
                </button>
            </div>

            <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
                ) : labs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏛️</div>
                        <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No labs configured</h3>
                        <p className="empty-state-text">Add your first lab or facility to organize equipment and bookings.</p>
                        <button className="btn-primary-custom mt-3" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg"></i> Add Lab
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-dark-custom">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                    <th>Added By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {labs.map((lab, idx) => (
                                    <tr key={lab._id}>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{idx + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{lab.name}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lab.department || 'N/A'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lab.location || 'N/A'}</td>
                                        <td style={{ fontSize: '0.8rem', maxWidth: 260 }}>
                                            {lab.description ? (
                                                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lab.description}</span>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>No description</span>}
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lab.createdBy?.name || 'System'}</td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn-outline-custom"
                                                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                                                    onClick={() => handleEdit(lab)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn-danger-custom"
                                                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                                                    onClick={() => handleDelete(lab._id, lab.name)}
                                                >
                                                    <i className="bi bi-trash3 me-1"></i>Delete
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

            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    overflowY: 'auto', padding: '1rem'
                }}>
                    <div className="card-dark fade-in-up" style={{ width: '100%', maxWidth: 520 }}>
                        <div className="card-header-custom d-flex align-items-center justify-content-between">
                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                                <i className={`bi ${editingLabId ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: 'var(--accent-blue)' }}></i>
                                {editingLabId ? 'Edit Lab' : 'Add New Lab'}
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
                                    <label className="form-label-custom">Lab Name *</label>
                                    <input
                                        name="name" type="text" className="form-control-custom"
                                        placeholder="e.g., Chemistry Lab B" value={form.name} onChange={handleChange}
                                    />
                                    {errors.name && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.name}</p>}
                                </div>
                                <div className="col-12">
                                    <label className="form-label-custom">Department *</label>
                                    <input
                                        name="department" type="text" className="form-control-custom"
                                        placeholder="e.g., Physics" value={form.department} onChange={handleChange}
                                    />
                                    {errors.department && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.department}</p>}
                                </div>
                                <div className="col-12">
                                    <label className="form-label-custom">Location</label>
                                    <input
                                        name="location" type="text" className="form-control-custom"
                                        placeholder="e.g., Building 1, Room 204" value={form.location} onChange={handleChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label-custom">Description</label>
                                    <textarea
                                        name="description" className="form-control-custom" rows={3}
                                        placeholder="Describe the lab facility..." value={form.description} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button type="button" className="btn-outline-custom" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary-custom" disabled={saving}>
                                    {saving ? (
                                        <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                                    ) : (
                                        <><i className="bi bi-plus-lg me-1"></i>Create Lab</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabManagementPage;

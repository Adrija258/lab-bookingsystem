/**
 * Equipment Page
 * Browse equipment with search and filter
 */

import React, { useState, useEffect, useCallback } from 'react';
import { equipmentService, labService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EquipmentCard from '../components/EquipmentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const CATEGORIES = ['All', 'Electronics', 'Chemistry', 'Biology', 'Physics', 'Computer', 'Mechanical', 'Other'];

const EquipmentPage = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [labFilter, setLabFilter] = useState('All');
  const [labs, setLabs] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (availabilityFilter !== '') params.availability = availabilityFilter;
      if (labFilter !== 'All') params.lab = labFilter;

      const [equipRes, labsRes] = await Promise.all([
        equipmentService.getAll(params),
        labService.getAll()
      ]);

      setEquipment(equipRes.data.equipment || []);
      setLabs(labsRes.data.labs || []);
    } catch (err) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [search, category, availabilityFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(timer);
  }, [fetchEquipment]);

  const groupedEquipment = equipment.reduce((groups, eq) => {
    const labName = eq.lab?.name || 'Unassigned';
    if (!groups[labName]) groups[labName] = [];
    groups[labName].push(eq);
    return groups;
  }, {});

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await equipmentService.delete(id);
      toast.success('Equipment deleted');
      fetchEquipment();
    } catch (err) {
      toast.error('Failed to delete equipment');
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">
            <i className="bi bi-cpu me-2" style={{ color: 'var(--accent-blue)' }}></i>
            Lab Equipment
          </h1>
          <p className="page-subtitle">
            {equipment.length} item{equipment.length !== 1 ? 's' : ''} available for booking
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div className="row g-3 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-5">
            <div className="search-bar">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                placeholder="Search equipment by name or description..."
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

          {/* Category */}
          <div className="col-12 col-md-3">
            <select
              className="form-control-custom"
              value={labFilter}
              onChange={e => setLabFilter(e.target.value)}
            >
              <option value="All">All Labs</option>
              {labs.map(lab => (
                <option key={lab._id} value={lab._id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <select
              className="form-control-custom"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Availability */}
          <div className="col-12 col-md-3">
            <select
              className="form-control-custom"
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Active category pills */}
        <div className="d-flex flex-wrap gap-2 mt-3">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                border: `1px solid ${category === c ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: category === c ? 'rgba(88,166,255,0.15)' : 'transparent',
                color: category === c ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <LoadingSpinner message="Loading equipment..." />
      ) : equipment.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔬</div>
          <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No equipment found</h3>
          <p className="empty-state-text">Try changing your search or filter criteria</p>
          {search && (
            <button className="btn-outline-custom mt-3" onClick={() => { setSearch(''); setCategory('All'); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        Object.keys(groupedEquipment).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔬</div>
            <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No equipment found</h3>
            <p className="empty-state-text">Try changing your search or filter criteria</p>
          </div>
        ) : (
          <div className="row g-4">
            {Object.entries(groupedEquipment).map(([labName, items]) => (
              <div key={labName} className="col-12">
                <div className="card-dark" style={{ padding: '1rem' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{labName}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
                    </div>
                    {labName !== 'Unassigned' && (
                      <span className="badge-available" style={{ fontSize: '0.8rem' }}>
                        Lab Equipment
                      </span>
                    )}
                  </div>
                  <div className="row g-3">
                    {items.map(eq => (
                      <div key={eq._id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                        <EquipmentCard
                          equipment={eq}
                          onEdit={() => { }}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default EquipmentPage;

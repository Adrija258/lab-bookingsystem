/**
 * EquipmentCard Component
 * Displays equipment info with booking CTA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  Electronics: '#58a6ff',
  Chemistry: '#3fb950',
  Biology: '#39d3bb',
  Physics: '#bc8cff',
  Computer: '#f0883e',
  Mechanical: '#d4a853',
  Other: '#8b949e'
};

const CATEGORY_ICONS = {
  Electronics: 'bi-lightning-charge',
  Chemistry: 'bi-eyedropper',
  Biology: 'bi-tree',
  Physics: 'bi-atom',
  Computer: 'bi-pc-display',
  Mechanical: 'bi-gear',
  Other: 'bi-box'
};

const EquipmentCard = ({ equipment, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const color = CATEGORY_COLORS[equipment.category] || '#8b949e';
  const icon = CATEGORY_ICONS[equipment.category] || 'bi-box';

  return (
    <div className="equipment-card">
      {/* Top color band */}
      <div className="equipment-card-banner" style={{ background: color }} />

      <div className="equipment-card-body">
        {/* Header row */}
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color, flexShrink: 0
            }}
          >
            <i className={`bi ${icon}`}></i>
          </div>
          <span className={equipment.availability ? 'badge-available' : 'badge-unavailable'}>
            {equipment.availability ? '● Available' : '● Unavailable'}
          </span>
        </div>

        {/* Name & description */}
        <h3 className="equipment-name mt-2">{equipment.name}</h3>
        <p className="equipment-description mb-3">{equipment.description}</p>

        {/* Meta info */}
        <div className="d-flex flex-wrap gap-2 mt-auto">
          <span className="category-badge">
            <i className={`bi ${icon} me-1`}></i>{equipment.category}
          </span>
          {equipment.lab && (
            <span className="category-badge" style={{ background: '#5b5de0', color: '#fff' }}>
              <i className="bi bi-building me-1"></i>{equipment.lab.name}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <i className="bi bi-stack me-1"></i>Qty: {equipment.quantity}
          </span>
          {equipment.location && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <i className="bi bi-geo-alt me-1"></i>{equipment.location}
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="equipment-card-footer">
        {user?.role === 'student' ? (
          <button
            className="btn-primary-custom w-100"
            disabled={!equipment.availability}
            onClick={() => navigate(`/book/${equipment._id}`)}
            style={{ justifyContent: 'center' }}
          >
            <i className="bi bi-calendar-plus"></i>
            {equipment.availability ? 'Book Now' : 'Unavailable'}
          </button>
        ) : (
          <div className="d-flex gap-2">
            <button
              className="btn-outline-custom flex-grow-1"
              onClick={() => onEdit(equipment)}
              style={{ justifyContent: 'center' }}
            >
              <i className="bi bi-pencil"></i> Edit
            </button>
            <button
              className="btn-danger-custom"
              onClick={() => onDelete(equipment._id)}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentCard;

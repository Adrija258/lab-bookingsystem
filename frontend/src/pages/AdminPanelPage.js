/**
 * Admin Panel Page
 * Admin-only page to manage booking requests
 */

import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanelPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [noteModal, setNoteModal] = useState({ open: false, booking: null, status: '', note: '' });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await bookingService.getAll(params);
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const openActionModal = (booking, status) => {
    setNoteModal({ open: true, booking, status, note: '' });
  };

  const handleAction = async () => {
    const { booking, status, note } = noteModal;
    setActionLoading(booking._id + status);
    try {
      await bookingService.updateStatus(booking._id, { status, adminNote: note });
      toast.success(`Booking ${status} successfully`);
      setNoteModal({ open: false, booking: null, status: '', note: '' });
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const StatusBadge = ({ status }) => (
    <span className={`badge-custom badge-${status}`}>
      {status === 'pending' && '⏳'}
      {status === 'approved' && '✓'}
      {status === 'rejected' && '✗'}
      {' '}{status}
    </span>
  );

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  return (
    <div className="page-container fade-in">
      <div className="mb-4">
        <h1 className="page-title">
          <i className="bi bi-shield-check me-2" style={{ color: 'var(--accent-gold)' }}></i>
          Admin Panel
        </h1>
        <p className="page-subtitle">Review and manage all lab equipment booking requests</p>
      </div>

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-purple"><i className="bi bi-list-check"></i></div>
            <div><div className="stat-value">{counts.all}</div><div className="stat-label">Total</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-orange"><i className="bi bi-hourglass-split"></i></div>
            <div><div className="stat-value">{counts.pending}</div><div className="stat-label">Pending</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><i className="bi bi-check-circle"></i></div>
            <div><div className="stat-value">{counts.approved}</div><div className="stat-label">Approved</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-red"><i className="bi bi-x-circle"></i></div>
            <div><div className="stat-value">{counts.rejected}</div><div className="stat-label">Rejected</div></div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)',
              border: `1px solid ${filter === tab ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: filter === tab ? 'rgba(88,166,255,0.12)' : 'var(--bg-card)',
              color: filter === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.2s ease', textTransform: 'capitalize'
            }}
          >
            {tab === 'all' ? 'All Requests' : tab}
            {tab === 'pending' && counts.pending > 0 && (
              <span style={{
                marginLeft: '0.4rem', background: 'var(--accent-orange)',
                color: '#000', borderRadius: '10px', padding: '0 0.4rem',
                fontSize: '0.7rem', fontWeight: 700
              }}>{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No booking requests</h3>
            <p className="empty-state-text">No {filter !== 'all' ? filter : ''} bookings found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Equipment</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => (
                  <tr key={booking._id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{booking.userId?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.equipmentId?.name || 'Deleted'}</div>
                      {booking.equipmentId?.category && (
                        <span className="category-badge">{booking.equipmentId.category}</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'center' }}>
                      {booking.requestedQuantity || 1}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(booking.date)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                      {booking.timeSlot}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 160 }}>
                      {booking.purpose ? (
                        <span title={booking.purpose} style={{
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>{booking.purpose}</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><StatusBadge status={booking.status} /></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {booking.status === 'pending' ? (
                        <div className="d-flex gap-1">
                          <button
                            className="btn-success-custom"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            onClick={() => openActionModal(booking, 'approved')}
                            disabled={!!actionLoading}
                          >
                            <i className="bi bi-check-lg"></i> Approve
                          </button>
                          <button
                            className="btn-danger-custom"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                            onClick={() => openActionModal(booking, 'rejected')}
                            disabled={!!actionLoading}
                          >
                            <i className="bi bi-x-lg"></i> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {booking.adminNote || 'Reviewed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {noteModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card-dark fade-in-up" style={{ width: '90%', maxWidth: 480 }}>
            <div className="card-header-custom">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                {noteModal.status === 'approved'
                  ? <><i className="bi bi-check-circle me-2" style={{ color: 'var(--accent-green)' }}></i>Approve Booking</>
                  : <><i className="bi bi-x-circle me-2" style={{ color: 'var(--accent-red)' }}></i>Reject Booking</>
                }
              </h3>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{noteModal.booking?.equipmentId?.name}</strong>
              {' '}for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{noteModal.booking?.userId?.name}</strong>
              {' '}on{' '}
              {formatDate(noteModal.booking?.date)} • {noteModal.booking?.timeSlot} • Qty {noteModal.booking?.requestedQuantity || 1}
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Note for Student (optional)</label>
              <textarea
                className="form-control-custom"
                rows={3}
                placeholder="Add a note to explain the decision..."
                value={noteModal.note}
                onChange={e => setNoteModal(p => ({ ...p, note: e.target.value }))}
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button className="btn-outline-custom" onClick={() => setNoteModal({ open: false, booking: null, status: '', note: '' })}>
                Cancel
              </button>
              <button
                className={noteModal.status === 'approved' ? 'btn-success-custom' : 'btn-danger-custom'}
                onClick={handleAction}
                disabled={!!actionLoading}
              >
                {actionLoading
                  ? <span className="spinner-border spinner-border-sm me-1"></span>
                  : <i className={`bi ${noteModal.status === 'approved' ? 'bi-check-lg' : 'bi-x-lg'} me-1`}></i>
                }
                Confirm {noteModal.status === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelPage;

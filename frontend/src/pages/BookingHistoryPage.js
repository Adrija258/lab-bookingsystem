/**
 * Booking History Page
 * Student view of their bookings with cancel option
 */

import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState(null);

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

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking request?')) return;
    setCancelling(id);
    try {
      await bookingService.updateStatus(id, { status: 'rejected' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

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
      {/* Header */}
      <div className="mb-4">
        <h1 className="page-title">
          <i className="bi bi-calendar2-check me-2" style={{ color: 'var(--accent-blue)' }}></i>
          My Bookings
        </h1>
        <p className="page-subtitle">Track and manage your equipment booking requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'All', icon: 'bi-list-ul' },
          { key: 'pending', label: 'Pending', icon: 'bi-hourglass-split' },
          { key: 'approved', label: 'Approved', icon: 'bi-check-circle' },
          { key: 'rejected', label: 'Rejected/Cancelled', icon: 'bi-x-circle' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${filter === tab.key ? 'var(--accent-blue)' : 'var(--border)'}`,
              background: filter === tab.key ? 'rgba(88,166,255,0.12)' : 'var(--bg-card)',
              color: filter === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
            <span style={{
              background: filter === tab.key ? 'rgba(88,166,255,0.2)' : 'var(--bg-secondary)',
              borderRadius: '10px', padding: '0 0.4rem', fontSize: '0.72rem', fontWeight: 700
            }}>
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="card-dark" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>No bookings found</h3>
            <p className="empty-state-text">
              {filter === 'all' ? "You haven't made any booking requests yet." : `No ${filter} bookings.`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, idx) => (
                  <tr key={booking._id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.equipmentId?.name || 'Deleted'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {booking.equipmentId?.location}
                      </div>
                    </td>
                    <td>
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
                    <td style={{ maxWidth: 150, fontSize: '0.8rem' }}>
                      <span style={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {booking.purpose || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td><StatusBadge status={booking.status} /></td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 150, color: 'var(--text-secondary)' }}>
                      {booking.adminNote || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {booking.status === 'pending' && (
                        <button
                          className="btn-danger-custom"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                          onClick={() => handleCancel(booking._id)}
                          disabled={cancelling === booking._id}
                        >
                          {cancelling === booking._id
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : <><i className="bi bi-x"></i> Cancel</>
                          }
                        </button>
                      )}
                      {booking.status === 'approved' && (
                        <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>
                          <i className="bi bi-check-circle-fill me-1"></i>Confirmed
                        </span>
                      )}
                      {booking.status === 'rejected' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <i className="bi bi-x-circle me-1"></i>Cancelled
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
    </div>
  );
};

export default BookingHistoryPage;

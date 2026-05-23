/**
 * Dashboard Page
 * Role-based dashboard with statistics and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService, equipmentService } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setConfirmText('');
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [equipRes, bookingRes] = await Promise.all([
          equipmentService.getAll(),
          bookingService.getAll()
        ]);

        const allEquipment = equipRes.data.equipment || [];
        const bookings = bookingRes.data.bookings || [];

        // Calculate stats locally
        setStats({
          totalEquipment: allEquipment.length,
          availableEquipment: allEquipment.filter(e => e.availability).length,
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length,
          approvedBookings: bookings.filter(b => b.status === 'approved').length,
          rejectedBookings: bookings.filter(b => b.status === 'rejected').length,
        });

        setRecentBookings(bookings.slice(0, 5));
        setRecentEquipment(allEquipment.slice(0, 4));
        setEquipment(allEquipment);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const labSummary = Object.values(equipment.reduce((acc, eq) => {
    const labName = eq.lab?.name || 'Unassigned';
    if (!acc[labName]) {
      acc[labName] = {
        name: labName,
        count: 0,
        department: eq.lab?.department || '',
        location: eq.lab?.location || ''
      };
    }
    acc[labName].count += 1;
    return acc;
  }, {}));

  const StatusBadge = ({ status }) => (
    <span className={`badge-custom badge-${status}`}>
      {status === 'pending' && '⏳'}
      {status === 'approved' && '✓'}
      {status === 'rejected' && '✗'}
      {' '}{status}
    </span>
  );

  if (loading) return <div className="page-container"><LoadingSpinner message="Loading dashboard..." /></div>;

  return (
    <div className="page-container fade-in">
      {/* Welcome Banner */}
      <div className="dashboard-welcome mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="welcome-title">
              {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
            </div>
            <div className="welcome-sub">
              {user?.role === 'admin'
                ? 'Manage lab equipment and review booking requests from the admin panel.'
                : 'Browse available equipment and book your next lab session below.'}
            </div>
          </div>
          <div className="d-flex gap-2">
            {user?.role === 'student' ? (
              <button className="btn-primary-custom" onClick={() => navigate('/equipment')}>
                <i className="bi bi-search"></i> Browse Equipment
              </button>
            ) : (
              <button className="btn-primary-custom" onClick={() => navigate('/admin')}>
                <i className="bi bi-shield-check"></i> Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="row g-3 mb-4 stagger-children">
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue"><i className="bi bi-cpu"></i></div>
              <div>
                <div className="stat-value">{stats.totalEquipment}</div>
                <div className="stat-label">Equipment</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-green"><i className="bi bi-check-circle"></i></div>
              <div>
                <div className="stat-value">{stats.availableEquipment}</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple"><i className="bi bi-calendar3"></i></div>
              <div>
                <div className="stat-value">{stats.totalBookings}</div>
                <div className="stat-label">Total Bookings</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange"><i className="bi bi-hourglass-split"></i></div>
              <div>
                <div className="stat-value">{stats.pendingBookings}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-teal"><i className="bi bi-check2-all"></i></div>
              <div>
                <div className="stat-value">{stats.approvedBookings}</div>
                <div className="stat-label">Approved</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="stat-card">
              <div className="stat-icon stat-icon-red"><i className="bi bi-x-circle"></i></div>
              <div>
                <div className="stat-value">{stats.rejectedBookings}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card-dark">
            <div className="card-header-custom d-flex align-items-center justify-content-between">
              <h2 style={{ fontSize: '1rem', margin: 0 }}>
                <i className="bi bi-building me-2" style={{ color: 'var(--accent-gold)' }}></i>
                Lab Overview
              </h2>
              <button
                className="btn-outline-custom"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => navigate('/equipment')}
              >
                View Equipment <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            {labSummary.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">🏛️</div>
                <p className="empty-state-text">No labs or equipment available yet.</p>
              </div>
            ) : (
              <div className="row g-3">
                {labSummary.slice(0, 3).map((lab) => (
                  <div key={lab.name} className="col-12 col-md-4">
                    <div className="lab-summary-card">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem' }}>{lab.name}</h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {lab.department || 'General'} • {lab.location || 'No location'}
                          </div>
                        </div>
                        <span className="badge-available" style={{ fontSize: '0.75rem' }}>
                          {lab.count} items
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Bookings */}
        <div className="col-12 col-lg-7">
          <div className="card-dark">
            <div className="card-header-custom d-flex align-items-center justify-content-between">
              <h2 style={{ fontSize: '1rem', margin: 0 }}>
                <i className="bi bi-clock-history me-2" style={{ color: 'var(--accent-blue)' }}></i>
                {user?.role === 'admin' ? 'Recent Booking Requests' : 'My Recent Bookings'}
              </h2>
              <button
                className="btn-outline-custom"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/my-bookings')}
              >
                View all <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📅</div>
                <p className="empty-state-text">No bookings yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table-dark-custom w-100">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.equipmentId?.name || 'N/A'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {formatDate(booking.date)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {booking.timeSlot}
                        </td>
                        <td><StatusBadge status={booking.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Equipment */}
        <div className="col-12 col-lg-5">
          <div className="card-dark h-100">
            <div className="card-header-custom d-flex align-items-center justify-content-between">
              <h2 style={{ fontSize: '1rem', margin: 0 }}>
                <i className="bi bi-lightning me-2" style={{ color: 'var(--accent-gold)' }}></i>
                Quick Book
              </h2>
              <button
                className="btn-outline-custom"
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => navigate('/equipment')}
              >
                All <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            <div className="d-flex flex-column gap-2">
              {recentEquipment.map(eq => (
                <div key={eq._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-light)'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{eq.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eq.category} • Qty: {eq.quantity}</div>
                  </div>
                  {user?.role === 'student' ? (
                    <button
                      className={eq.availability ? 'btn-primary-custom' : 'btn-outline-custom'}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      disabled={!eq.availability}
                      onClick={() => navigate(`/book/${eq._id}`)}
                    >
                      {eq.availability ? 'Book' : 'Unavailable'}
                    </button>
                  ) : (
                    <span className={eq.availability ? 'badge-available' : 'badge-unavailable'}>
                      {eq.availability ? 'Available' : 'Unavailable'}
                    </span>
                  )}
                </div>
              ))}
              {recentEquipment.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-icon">🔬</div>
                  <p className="empty-state-text">No equipment added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Danger Zone */}
      <div className="card-dark mt-4" style={{ border: '1px solid var(--accent-red)', background: 'rgba(248,81,73,0.04)' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ padding: '0.25rem 0' }}>
          <div>
            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>Danger Zone
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            className="btn-danger-custom"
            onClick={() => setShowDeleteModal(true)}
            style={{ whiteSpace: 'nowrap' }}
          >
            <i className="bi bi-trash3 me-1"></i> Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card-dark fade-in-up" style={{ width: '90%', maxWidth: 440 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem', paddingBottom: '1rem',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(248,81,73,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--accent-red)', fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--accent-red)', fontFamily: 'var(--font-display)' }}>
                  Delete Account
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This is permanent and irreversible
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem',
              fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--accent-red)' }}>Warning:</strong> Deleting your account will:
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                <li>Remove your profile and login credentials</li>
                <li>Delete all your booking history</li>
                <li>This action <strong>cannot</strong> be undone</li>
              </ul>
            </div>

            <div className="mb-3">
              <label className="form-label-custom" style={{ fontSize: '0.82rem' }}>
                Type <strong style={{ color: 'var(--accent-red)' }}>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                className="form-control-custom"
                placeholder="Type DELETE here"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn-outline-custom"
                onClick={() => { setShowDeleteModal(false); setConfirmText(''); }}
              >
                Cancel
              </button>
              <button
                className="btn-danger-custom"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || deleteLoading}
                style={{ opacity: confirmText !== 'DELETE' ? 0.5 : 1 }}
              >
                {deleteLoading
                  ? <span className="spinner-border spinner-border-sm me-1"></span>
                  : <i className="bi bi-trash3 me-1"></i>
                }
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

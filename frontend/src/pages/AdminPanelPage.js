/**
 * Admin Panel Page
 * Admin-only page to manage booking requests and users
 */

import React, { useState, useEffect } from 'react';
import { bookingService, authService, equipmentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanelPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [noteModal, setNoteModal] = useState({ open: false, booking: null, status: '', note: '' });
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deleteUserModal, setDeleteUserModal] = useState({ open: false, user: null });
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [createUserErrors, setCreateUserErrors] = useState({});

  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [presentBookings, setPresentBookings] = useState([]);
  const [absentBookings, setAbsentBookings] = useState([]);
  const [releasedEquipment, setReleasedEquipment] = useState([]);

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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await authService.getAllUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const [pendingRes, presentRes, absentRes, releasedRes] = await Promise.all([
        bookingService.getPendingAttendance(),
        bookingService.getAll({ attendanceStatus: 'present' }),
        bookingService.getAll({ attendanceStatus: 'absent' }),
        equipmentService.getReleased()
      ]);

      setPendingAttendance(pendingRes.data.bookings || []);
      setPresentBookings(presentRes.data.bookings || []);
      setAbsentBookings(absentRes.data.bookings || []);
      setReleasedEquipment(releasedRes.data.equipment || []);
    } catch (err) {
      toast.error('Failed to load attendance dashboard data');
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);
  useEffect(() => { fetchUsers(); fetchAttendanceSummary(); }, []);

  const handleDeleteUser = async () => {
    const target = deleteUserModal.user;
    if (!target) return;
    setDeleteUserLoading(true);
    try {
      await authService.deleteUser(target._id);
      toast.success(`User "${target.name}" deleted`);
      setDeleteUserModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const errs = {};
    if (!createUserForm.name.trim()) errs.name = 'Name is required';
    if (!createUserForm.email.trim()) errs.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createUserForm.email)) errs.email = 'Enter a valid email';
    if (!createUserForm.password) errs.password = 'Password is required';
    if (createUserForm.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!createUserForm.role) errs.role = 'Role is required';

    if (Object.keys(errs).length > 0) {
      setCreateUserErrors(errs);
      return;
    }

    setCreateUserLoading(true);
    try {
      await authService.createUser(createUserForm);
      toast.success(`Created ${createUserForm.role} successfully`);
      setCreateUserModal(false);
      setCreateUserForm({ name: '', email: '', password: '', role: 'student' });
      setCreateUserErrors({});
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create user';
      toast.error(msg);
      setCreateUserErrors({ general: msg });
    } finally {
      setCreateUserLoading(false);
    }
  };

  const canDeleteUser = (target) => {
    if (!target) return false;
    if (target._id === user?._id) return false;
    if (user?.role === 'superadmin') return true;
    return target.role === 'student';
  };

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
      fetchAttendanceSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} booking`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPresent = async (bookingId) => {
    setActionLoading(bookingId + 'present');
    try {
      await bookingService.markPresent(bookingId);
      toast.success('Marked student present');
      fetchBookings();
      fetchAttendanceSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark present');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAbsent = async (bookingId) => {
    setActionLoading(bookingId + 'absent');
    try {
      await bookingService.markAbsent(bookingId);
      toast.success('Marked student absent and released equipment');
      fetchBookings();
      fetchAttendanceSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark absent');
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

      {/* Attendance dashboard */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-orange"><i className="bi bi-clock"></i></div>
            <div><div className="stat-value">{pendingAttendance.length}</div><div className="stat-label">Pending Arrivals</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green"><i className="bi bi-person-check"></i></div>
            <div><div className="stat-value">{presentBookings.length}</div><div className="stat-label">Present Students</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-red"><i className="bi bi-person-dash"></i></div>
            <div><div className="stat-value">{absentBookings.length}</div><div className="stat-label">Absent Students</div></div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><i className="bi bi-box-arrow-in-down"></i></div>
            <div><div className="stat-value">{releasedEquipment.length}</div><div className="stat-label">Released Equipment</div></div>
          </div>
        </div>
      </div>

      {/* Attendance Actions */}
      <div className="card-dark mb-4" style={{ padding: '1rem' }}>
        <h3 className="section-title">Attendance Verification</h3>
        {pendingAttendance.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending attendance bookings at the moment.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Equipment</th>
                  <th>Lab</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAttendance.map((booking, idx) => (
                  <tr key={booking._id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{booking.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{booking.userId?.email}</div>
                    </td>
                    <td>{booking.equipmentId?.name || 'Deleted'}</td>
                    <td>{booking.lab?.name || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(booking.date)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>{booking.timeSlot}</td>
                    <td className="d-flex gap-1">
                      <button
                        className="btn-success-custom"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                        onClick={() => handleMarkPresent(booking._id)}
                        disabled={actionLoading === booking._id + 'present'}
                      >
                        ✓ Present
                      </button>
                      <button
                        className="btn-danger-custom"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                        onClick={() => handleMarkAbsent(booking._id)}
                        disabled={actionLoading === booking._id + 'absent'}
                      >
                        ✗ Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Manage Users Section */}
      <div className="card-dark mt-4" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header-custom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>
              <i className="bi bi-people me-2" style={{ color: 'var(--accent-blue)' }}></i>
              Manage Users
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {user?.role === 'superadmin'
                ? 'Create admins or students, and delete users across the system.'
                : 'Create student accounts and manage existing users.'}
            </p>
          </div>
          <div>
            <button className="btn-primary-custom" onClick={() => { setCreateUserModal(true); setCreateUserErrors({}); }}>
              <i className="bi bi-person-plus me-1"></i>
              Add User
            </button>
          </div>
        </div>
        <div className="card-header-custom" style={{ borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{users.length} total</span>
        </div>
        {usersLoading ? (
          <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <div className="empty-state"><p className="empty-state-text">No users found.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark-custom">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u._id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className={`role-pill ${u.role === 'admin' ? 'role-admin' : u.role === 'superadmin' ? 'role-superadmin' : 'role-student'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn-danger-custom"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                        onClick={() => setDeleteUserModal({ open: true, user: u })}
                        disabled={!canDeleteUser(u)}
                      >
                        <i className="bi bi-trash3 me-1"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createUserModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card-dark fade-in-up" style={{ width: '90%', maxWidth: 520 }}>
            <div className="card-header-custom d-flex align-items-center justify-content-between">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                <i className="bi bi-person-plus me-2" style={{ color: 'var(--accent-blue)' }}></i>
                Create User
              </h3>
              <button
                onClick={() => setCreateUserModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div style={{ padding: '1rem' }}>
              {createUserErrors.general && (
                <div className="alert-custom alert-error mb-3">
                  <i className="bi bi-exclamation-circle"></i> {createUserErrors.general}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label-custom">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    className="form-control-custom"
                    value={createUserForm.name}
                    onChange={e => setCreateUserForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {createUserErrors.name && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{createUserErrors.name}</p>}
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control-custom"
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {createUserErrors.email && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{createUserErrors.email}</p>}
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Password</label>
                  <input
                    name="password"
                    type="password"
                    className="form-control-custom"
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                  {createUserErrors.password && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{createUserErrors.password}</p>}
                </div>
                <div className="col-12">
                  <label className="form-label-custom">Role</label>
                  <select
                    name="role"
                    className="form-control-custom"
                    value={createUserForm.role}
                    onChange={e => setCreateUserForm(prev => ({ ...prev, role: e.target.value }))}
                    disabled={user?.role === 'admin'}
                  >
                    <option value="student">student</option>
                    {user?.role === 'superadmin' && <option value="admin">admin</option>}
                    {user?.role === 'superadmin' && <option value="superadmin">superadmin</option>}
                  </select>
                  {createUserErrors.role && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{createUserErrors.role}</p>}
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button className="btn-outline-custom" onClick={() => setCreateUserModal(false)}>Cancel</button>
                <button className="btn-primary-custom" onClick={handleCreateUser} disabled={createUserLoading}>
                  {createUserLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                  ) : (
                    <><i className="bi bi-person-plus me-1"></i>Create User</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card-dark fade-in-up" style={{ width: '90%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(248,81,73,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="bi bi-person-x-fill" style={{ color: 'var(--accent-red)', fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-red)' }}>Delete User</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteUserModal.user?.name}</strong>
              {' '}({deleteUserModal.user?.email})? All their bookings will also be removed.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn-outline-custom" onClick={() => setDeleteUserModal({ open: false, user: null })}>Cancel</button>
              <button className="btn-danger-custom" onClick={handleDeleteUser} disabled={deleteUserLoading}>
                {deleteUserLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-trash3 me-1"></i>}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelPage;

/**
 * Navbar Component
 * Responsive navigation with role-based links
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="app-navbar">
      {/* Brand */}
      <NavLink to="/dashboard" className="navbar-brand-text me-4">
        <span className="brand-icon">🔬</span>
        <span className="d-none d-sm-inline">LabBook</span>
      </NavLink>

      {/* Desktop Nav Links */}
      <div className="d-none d-md-flex align-items-center gap-1 flex-grow-1">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
          <i className="bi bi-grid-1x2"></i> Dashboard
        </NavLink>

        <NavLink to="/equipment" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
          <i className="bi bi-cpu"></i> Equipment
        </NavLink>

        {user?.role === 'student' && (
          <NavLink to="/my-bookings" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
            <i className="bi bi-calendar2-check"></i> My Bookings
          </NavLink>
        )}

        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <>
            <NavLink to="/admin" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
              <i className="bi bi-shield-check"></i> Admin Panel
            </NavLink>
            <NavLink to="/admin/equipment" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
              <i className="bi bi-tools"></i> Manage Equipment
            </NavLink>
            {user?.role === 'superadmin' && (
              <NavLink to="/admin/labs" className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}>
                <i className="bi bi-building"></i> Manage Labs
              </NavLink>
            )}
          </>
        )}
      </div>

      {/* User Info + Logout */}
      <div className="d-none d-md-flex align-items-center gap-2 ms-auto">
        <div className="user-badge">
          <i className="bi bi-person-circle"></i>
          <span>{user?.name?.split(' ')[0]}</span>
          <span className={`role-pill ${user?.role === 'admin' ? 'role-admin' : user?.role === 'superadmin' ? 'role-superadmin' : 'role-student'}`}>
            {user?.role}
          </span>
        </div>
        <button className="btn-outline-custom" onClick={handleLogout} style={{ padding: '0.35rem 0.75rem' }}>
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="d-md-none ms-auto btn-outline-custom"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ padding: '0.35rem 0.65rem' }}
      >
        <i className={`bi ${menuOpen ? 'bi-x' : 'bi-list'}`}></i>
      </button>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem', zIndex: 999,
          display: 'flex', flexDirection: 'column', gap: '0.25rem'
        }}>
          <NavLink to="/dashboard" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
            <i className="bi bi-grid-1x2"></i> Dashboard
          </NavLink>
          <NavLink to="/equipment" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
            <i className="bi bi-cpu"></i> Equipment
          </NavLink>
          {user?.role === 'student' && (
            <NavLink to="/my-bookings" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
              <i className="bi bi-calendar2-check"></i> My Bookings
            </NavLink>
          )}
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <>
              <NavLink to="/admin" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
                <i className="bi bi-shield-check"></i> Admin Panel
              </NavLink>
              <NavLink to="/admin/equipment" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
                <i className="bi bi-tools"></i> Manage Equipment
              </NavLink>
              {user?.role === 'superadmin' && (
                <NavLink to="/admin/labs" className="nav-link-custom" onClick={() => setMenuOpen(false)}>
                  <i className="bi bi-building"></i> Manage Labs
                </NavLink>
              )}
            </>
          )}
          <hr style={{ borderColor: 'var(--border)', margin: '0.5rem 0' }} />
          <div className="d-flex align-items-center justify-content-between">
            <div className="user-badge">
              <i className="bi bi-person-circle"></i>
              <span>{user?.name}</span>
              <span className={`role-pill ${user?.role === 'admin' ? 'role-admin' : user?.role === 'superadmin' ? 'role-superadmin' : 'role-student'}`}>{user?.role}</span>
            </div>
            <button className="btn-danger-custom" onClick={handleLogout} style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

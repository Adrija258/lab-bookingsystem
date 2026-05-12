import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="loading-overlay">
    <div className="spinner-custom"></div>
    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{message}</span>
  </div>
);

export default LoadingSpinner;

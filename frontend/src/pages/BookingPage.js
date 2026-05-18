/**
 * Booking Page
 * Book a specific equipment with date and time slot selection
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { equipmentService, bookingService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

const BookingPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);
  const [form, setForm] = useState({ date: '', timeSlot: '', requestedQuantity: 1, purpose: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingCount, setBookingCount] = useState({ activeBookings: 0, maxBookings: 15, remaining: 15 });

  // Get today as minimum date and 15 days ahead as maximum date
  const getMinDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const res = await equipmentService.getById(equipmentId);
        setEquipment(res.data.equipment);

        // Load bookings to check slot availability
        const bookRes = await bookingService.getAll();
        const relevant = (bookRes.data.bookings || []).filter(
          b => b.equipmentId?._id === equipmentId && ['pending', 'approved'].includes(b.status)
        );
        setExistingBookings(relevant);

        // Load booking count for this instrument
        const countRes = await bookingService.getBookingCount(equipmentId);
        setBookingCount(countRes.data);
      } catch (err) {
        toast.error('Equipment not found');
        navigate('/equipment');
      } finally {
        setLoading(false);
      }
    };
    loadEquipment();
  }, [equipmentId, navigate]);

  const isSlotTaken = (slot) => {
    if (!form.date) return false;
    return existingBookings.some(
      b => b.timeSlot === slot && new Date(b.date).toDateString() === new Date(form.date).toDateString()
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.date) errs.date = 'Please select a date';
    else {
      const selected = new Date(form.date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 15);
      if (selected < today) errs.date = 'Cannot book for a past date';
      else if (selected > maxDate) errs.date = 'Booking can only be made within the next 15 days';
    }
    if (!form.timeSlot) errs.timeSlot = 'Please select a time slot';
    if (!form.requestedQuantity || Number(form.requestedQuantity) < 1) {
      errs.requestedQuantity = 'Please select at least 1 unit';
    } else if (Number(form.requestedQuantity) > 15) {
      errs.requestedQuantity = 'You can select a maximum of 15 units';
    } else if (equipment && Number(form.requestedQuantity) > equipment.quantity) {
      errs.requestedQuantity = `Only ${equipment.quantity} unit${equipment.quantity > 1 ? 's are' : ' is'} available`;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await bookingService.create({ equipmentId, ...form });
      toast.success('Booking request submitted! Waiting for admin approval. 🎉');
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner /></div>;
  if (!equipment) return null;

  const takenCount = form.date
    ? TIME_SLOTS.filter(slot => isSlotTaken(slot)).length
    : 0;

  const isLimitReached = bookingCount.remaining <= 0;
  const capacityPercent = ((bookingCount.activeBookings / bookingCount.maxBookings) * 100).toFixed(0);

  return (
    <div className="page-container fade-in">
      {/* Back button */}
      <button className="btn-outline-custom mb-4" onClick={() => navigate('/equipment')}>
        <i className="bi bi-arrow-left"></i> Back to Equipment
      </button>

      <div className="row g-4">
        {/* Equipment Info Card */}
        <div className="col-12 col-lg-4">
          <div className="card-dark">
            <div style={{
              height: 8, borderRadius: '8px 8px 0 0', margin: '-1.5rem -1.5rem 1.25rem',
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))'
            }} />

            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {equipment.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {equipment.description}
            </p>

            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category</span>
                <span className="category-badge">{equipment.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Quantity</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{equipment.quantity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location</span>
                <span style={{ color: 'var(--text-primary)' }}>{equipment.location || 'Main Lab'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className={equipment.availability ? 'badge-available' : 'badge-unavailable'}>
                  {equipment.availability ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Booking capacity indicator */}
            <div style={{
              marginTop: '1rem', padding: '0.75rem',
              background: 'rgba(22,27,34,0.5)', borderRadius: 'var(--radius-md)',
              border: `1px solid ${isLimitReached ? 'rgba(248,81,73,0.3)' : 'var(--border-light)'}`
            }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <i className="bi bi-bar-chart me-1"></i>Booking Capacity
                </span>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 600,
                  color: isLimitReached ? 'var(--accent-red)' : bookingCount.remaining <= 3 ? 'var(--accent-orange)' : 'var(--accent-green)'
                }}>
                  {bookingCount.remaining} / {bookingCount.maxBookings} remaining
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${capacityPercent}%`,
                  background: isLimitReached ? 'var(--accent-red)' : capacityPercent > 70 ? 'var(--accent-orange)' : 'var(--accent-green)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              {isLimitReached && (
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.5rem', marginBottom: 0 }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  This instrument has reached its maximum booking limit.
                </p>
              )}
            </div>

            {/* Booking rules info */}
            <div className="alert-custom alert-info mt-3" style={{ fontSize: '0.8rem' }}>
              <i className="bi bi-info-circle"></i>
              <div>
                <strong>Booking Rules:</strong>
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem' }}>
                  <li>Bookings require admin approval</li>
                  <li>One slot per booking request</li>
                  <li>Only book within the next 15 days</li>
                  <li>Cannot book in the past</li>
                  <li>Max {bookingCount.maxBookings} active bookings per instrument</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="col-12 col-lg-8">
          <div className="card-dark">
            <div className="card-header-custom">
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
                <i className="bi bi-calendar-plus me-2" style={{ color: 'var(--accent-blue)' }}></i>
                Book Equipment
              </h2>
            </div>

            {errors.general && (
              <div className="alert-custom alert-error mb-3">
                <i className="bi bi-exclamation-circle"></i> {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Date Picker */}
              <div className="mb-4">
                <label className="form-label-custom">
                  <i className="bi bi-calendar3 me-1"></i> Select Date
                </label>
                <input
                  type="date"
                  className="form-control-custom"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={form.date}
                  onChange={e => { setForm(p => ({ ...p, date: e.target.value, timeSlot: '' })); setErrors(p => ({ ...p, date: '' })); }}
                  style={{ maxWidth: 300 }}
                />
                {errors.date && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>{errors.date}</p>}
              </div>

              {/* Time Slots */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label-custom" style={{ margin: 0 }}>
                    <i className="bi bi-clock me-1"></i> Select Time Slot
                  </label>
                  {form.date && takenCount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)' }}>
                      {takenCount} slot{takenCount > 1 ? 's' : ''} booked
                    </span>
                  )}
                </div>

                {!form.date ? (
                  <div className="alert-custom alert-info" style={{ fontSize: '0.825rem' }}>
                    <i className="bi bi-arrow-up-circle"></i> Please select a date first to see slot availability
                  </div>
                ) : (
                  <div className="time-slot-grid">
                    {TIME_SLOTS.map(slot => {
                      const taken = isSlotTaken(slot);
                      const selected = form.timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`time-slot-btn ${selected ? 'selected' : ''}`}
                          disabled={taken}
                          onClick={() => { setForm(p => ({ ...p, timeSlot: slot })); setErrors(p => ({ ...p, timeSlot: '' })); }}
                        >
                          {taken && <i className="bi bi-x-circle me-1" style={{ fontSize: '0.7rem' }}></i>}
                          {selected && !taken && <i className="bi bi-check-circle me-1" style={{ fontSize: '0.7rem' }}></i>}
                          {slot}
                          {taken && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-red)', marginTop: '2px' }}>Taken</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.timeSlot && <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.5rem' }}>{errors.timeSlot}</p>}
              </div>

              {/* Purpose */}
              <div className="mb-4">
                <label className="form-label-custom">
                  <i className="bi bi-123 me-1"></i> Quantity to Book
                </label>
                <input
                  type="number"
                  className="form-control-custom"
                  min="1"
                  max={Math.min(15, equipment.quantity)}
                  value={form.requestedQuantity}
                  onChange={e => {
                    setForm(p => ({ ...p, requestedQuantity: e.target.value }));
                    setErrors(p => ({ ...p, requestedQuantity: '' }));
                  }}
                  style={{ maxWidth: 180 }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
                  Students can request up to 15 units, limited by available stock.
                </p>
                {errors.requestedQuantity && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}>
                    {errors.requestedQuantity}
                  </p>
                )}
              </div>

              {/* Purpose */}
              <div className="mb-4">
                <label className="form-label-custom">
                  <i className="bi bi-card-text me-1"></i> Purpose / Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  className="form-control-custom"
                  rows={3}
                  placeholder="Describe your experiment or research purpose..."
                  value={form.purpose}
                  onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Booking Summary */}
              {form.date && form.timeSlot && (
                <div style={{
                  background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)',
                  borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem'
                }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--accent-green)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <i className="bi bi-check-circle me-1"></i> Booking Summary
                  </p>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span><strong>Equipment:</strong> {equipment.name}</span>
                    <span><strong>Quantity:</strong> {form.requestedQuantity}</span>
                    <span><strong>Date:</strong> {new Date(form.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span><strong>Time:</strong> {form.timeSlot}</span>
                  </div>
                </div>
              )}

              <div className="d-flex gap-3">
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={submitting || !equipment.availability || isLimitReached}
                  style={{ padding: '0.7rem 2rem' }}
                >
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Submitting...</>
                  ) : (
                    <><i className="bi bi-send me-1"></i>Submit Booking Request</>
                  )}
                </button>
                <button type="button" className="btn-outline-custom" onClick={() => navigate('/equipment')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

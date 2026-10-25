import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Car, Bike, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { ParkingSlot } from '../types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    slot_id: number;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    vehicle_reg_number: string;
    vehicle_type: string;
    start_time: string;
    end_time: string;
  }) => Promise<void>;
  slots: ParkingSlot[];
  preSelectedSlot?: ParkingSlot | null;
  currentUser?: any;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  slots,
  preSelectedSlot,
  currentUser
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike'>('Car');

  // Format default start time (now) and end time (now + 2 hours)
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setStartTime(formatDateTimeLocal(now));
    setEndTime(formatDateTimeLocal(future));

    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerEmail(currentUser.email || '');
      setCustomerPhone(currentUser.phone || '');
    }

    if (preSelectedSlot) {
      setSelectedSlotId(preSelectedSlot.id);
      setVehicleType(preSelectedSlot.vehicle_type);
    } else {
      const firstAvail = slots.find(s => s.status === 'Available');
      if (firstAvail) {
        setSelectedSlotId(firstAvail.id);
        setVehicleType(firstAvail.vehicle_type);
      }
    }
    setError(null);
  }, [isOpen, preSelectedSlot, slots, currentUser]);

  if (!isOpen) return null;

  // Selected slot object
  const currentSlot = slots.find(s => s.id === Number(selectedSlotId));

  // Compute duration and estimated cost in real-time
  let durationHours = 0;
  let estimatedTotal = 0;
  if (startTime && endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (end > start) {
      durationHours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
      if (currentSlot) {
        estimatedTotal = Math.round(durationHours * currentSlot.hourly_rate * 100) / 100;
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSlotId) {
      setError('Please select a parking slot.');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!vehicleReg.trim()) {
      setError('Vehicle registration number is required (e.g. CA-9842-TX).');
      return;
    }
    if (durationHours <= 0) {
      setError('Reservation end time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        slot_id: Number(selectedSlotId),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        vehicle_reg_number: vehicleReg.trim().toUpperCase(),
        vehicle_type: vehicleType,
        start_time: startTime.replace('T', ' '),
        end_time: endTime.replace('T', ' ')
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Create Parking Reservation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 2: Parking Reservation Management (EPIC-2)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Parking Slot *
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedSlotId(id);
                const s = slots.find(slot => slot.id === id);
                if (s) setVehicleType(s.vehicle_type);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b] bg-white"
              required
            >
              <option value="">-- Choose Slot --</option>
              {slots.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={s.status !== 'Available'}
                >
                  Slot #{s.slot_number} ({s.vehicle_type}) — {s.location_zone} [₹{s.hourly_rate.toFixed(2)}/hr] {s.status !== 'Available' ? `(${s.status})` : '✓ Available'}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name & Vehicle Reg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Julian Thorne"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Plate / Reg # *
              </label>
              <input
                type="text"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value)}
                placeholder="e.g. NY-3245-AB"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
              />
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>End Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                required
              />
            </div>
          </div>

          {/* Real-time Dynamic Fee Calculation Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Calculator className="w-3.5 h-3.5 text-slate-500" />
                Calculated Duration:
              </span>
              <span className="font-bold text-slate-800">
                {durationHours > 0 ? `${durationHours} hours` : 'Invalid Range'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Hourly Rate ({currentSlot?.vehicle_type || 'Vehicle'}):</span>
              <span className="font-semibold text-slate-800">
                ₹{currentSlot ? currentSlot.hourly_rate.toFixed(2) : '0.00'}/hr
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Estimated Total Fee:</span>
              <span className="text-base font-extrabold text-[#143d2b]">
                ₹{estimatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || durationHours <= 0}
              className="px-5 py-2.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm transition-all hover:shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

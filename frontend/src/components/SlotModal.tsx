import React, { useState, useEffect } from 'react';
import { X, Car, Bike, MapPin, DollarSign, ShieldAlert } from 'lucide-react';
import { ParkingSlot } from '../types';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { slot_number: string; vehicle_type: string; location_zone: string; hourly_rate: number }) => Promise<void>;
  editingSlot?: ParkingSlot | null;
}

export const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSlot
}) => {
  const [slotNumber, setSlotNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike'>('Car');
  const [locationZone, setLocationZone] = useState('Zone A (North Wing)');
  const [hourlyRate, setHourlyRate] = useState('5.00');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSlot) {
      setSlotNumber(editingSlot.slot_number);
      setVehicleType(editingSlot.vehicle_type);
      setLocationZone(editingSlot.location_zone);
      setHourlyRate(editingSlot.hourly_rate.toString());
    } else {
      setSlotNumber('');
      setVehicleType('Car');
      setLocationZone('Zone A (North Wing)');
      setHourlyRate('5.00');
    }
    setError(null);
  }, [editingSlot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!slotNumber.trim()) {
      setError('Parking slot number is required (e.g., A-105).');
      return;
    }

    const rateNum = parseFloat(hourlyRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setError('Hourly rate must be a valid positive number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        slot_number: slotNumber.trim().toUpperCase(),
        vehicle_type: vehicleType,
        location_zone: locationZone.trim(),
        hourly_rate: rateNum
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save parking slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingSlot ? 'Edit Parking Slot' : 'Add New Parking Slot'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 1: Parking Slot Management (EPIC-1)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slot Identifier / Number *
            </label>
            <input
              type="text"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              placeholder="e.g. A-107, B-205, C-302"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVehicleType('Car')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  vehicleType === 'Car'
                    ? 'border-[#143d2b] bg-emerald-50 text-[#143d2b] ring-1 ring-[#143d2b]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Car Slot</span>
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('Bike')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  vehicleType === 'Bike'
                    ? 'border-[#143d2b] bg-emerald-50 text-[#143d2b] ring-1 ring-[#143d2b]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Bike Slot</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Parking Zone *
            </label>
            <select
              value={locationZone}
              onChange={(e) => setLocationZone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b] bg-white"
            >
              <option value="Zone A (North Wing)">Zone A (North Wing) — Ground Level</option>
              <option value="Zone B (South Plaza)">Zone B (South Plaza) — Covered Deck</option>
              <option value="Zone C (Basement EV)">Zone C (Basement EV) — Fast Charging</option>
              <option value="Zone D (East Tower)">Zone D (East Tower) — Executive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hourly Rate ($ USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="5.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                required
              />
            </div>
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm transition-all hover:shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

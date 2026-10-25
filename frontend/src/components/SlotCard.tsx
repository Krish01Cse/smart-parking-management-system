import React from 'react';
import { Car, Bike, Wrench, CheckCircle2, Clock, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { ParkingSlot } from '../types';

interface SlotCardProps {
  slot: ParkingSlot;
  onBook: (slot: ParkingSlot) => void;
  onStatusChange: (slot: ParkingSlot, newStatus: string) => void;
  onEdit?: (slot: ParkingSlot) => void;
  isAdmin?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onBook,
  onStatusChange,
  onEdit,
  isAdmin = false
}) => {
  // Determine badge styling based on status
  const getStatusBadge = () => {
    switch (slot.status) {
      case 'Available':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Available'
        };
      case 'Occupied':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Occupied'
        };
      case 'Maintenance':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'In transit' // In screenshot, blue dot was "In transit", here Maintenance
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          dot: 'bg-slate-400',
          label: slot.status
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="dashboard-card bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      {/* Top Row: Icon, Zone + Slot Number, Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            {slot.vehicle_type === 'Car' ? (
              <Car className="w-5 h-5 stroke-[1.8]" />
            ) : (
              <Bike className="w-5 h-5 stroke-[1.8]" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {slot.location_zone}
            </h4>
            <span className="text-xs text-slate-400 font-medium">#{slot.slot_number}</span>
          </div>
        </div>

        {/* Status Pill matching screenshot bullet design */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
          {slot.status}
        </span>
      </div>

      {/* Middle Row (Inspired directly by screenshot metadata layout) */}
      <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Assigned to</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">
            {slot.status === 'Occupied' ? (slot.current_vehicle || 'Reserved') : 'Unassigned'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Rate</span>
          <span className="font-semibold text-slate-800 block mt-0.5">
            ${slot.hourly_rate.toFixed(2)}/hr
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Type</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            {slot.vehicle_type === 'Car' ? '🚘 Car' : '🏍️ Bike'}
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-4 flex items-center justify-between gap-2">
        {slot.status === 'Available' ? (
          <button
            onClick={() => onBook(slot)}
            className="w-full py-2 px-3 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Book Reservation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => onBook(slot)}
              disabled
              className="flex-1 py-2 px-3 rounded-full bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
            >
              {slot.status === 'Occupied' ? 'Slot Occupied' : 'Under Maintenance'}
            </button>
            {isAdmin && (
              <button
                onClick={() => onStatusChange(slot, slot.status === 'Occupied' ? 'Available' : 'Available')}
                title="Admin: Release / Free Slot"
                className="py-2 px-3 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium whitespace-nowrap"
              >
                Set Available
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => onEdit && onEdit(slot)}
            title="Admin: Edit Slot Settings"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

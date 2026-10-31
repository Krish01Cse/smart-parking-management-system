import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Bike,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  MapPin,
  Ticket,
  Plus
} from 'lucide-react';
import { Reservation } from '../types';

interface ReservationsPageProps {
  reservations: Reservation[];
  onNewReservation: () => void;
  onCancelReservation: (id: number) => Promise<void>;
  onPayReservation: (reservation: Reservation) => void;
  onNavigateToMap?: () => void;
  isAdmin?: boolean;
}

export const ReservationsPage: React.FC<ReservationsPageProps> = ({
  reservations,
  onNewReservation,
  onCancelReservation,
  onPayReservation,
  onNavigateToMap,
  isAdmin = false
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmed' | 'Completed' | 'Cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBooking = r.booking_id.toLowerCase().includes(q);
      const matchCustomer = r.customer_name.toLowerCase().includes(q);
      const matchPlate = r.vehicle_reg_number.toLowerCase().includes(q);
      const matchSlot = (r.slot_number || '').toLowerCase().includes(q);
      if (!matchBooking && !matchCustomer && !matchPlate && !matchSlot) return false;
    }
    return true;
  });

  const handleConfirmCancel = async () => {
    if (confirmCancelId) {
      await onCancelReservation(confirmCancelId);
      setConfirmCancelId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? `All Bookings (${reservations.length})` : `${st} (${reservations.filter(r => r.status === st).length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToMap && (
            <button
              onClick={onNavigateToMap}
              className="px-3.5 py-1.5 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="View Zones, Places, and Book on Interactive Map"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Explore Map & Book Slot</span>
            </button>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booking, customer, plate..."
              className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b] w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Reservations Table View */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Slot & Zone</th>
                <th className="py-3.5 px-4">Vehicle Reg</th>
                <th className="py-3.5 px-4">Schedule Window</th>
                <th className="py-3.5 px-4">Duration & Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#143d2b] flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-emerald-700" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No Reservations Matching Filters</h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        View real-time zone occupancy and book your parking slot directly on the interactive map.
                      </p>
                      {onNavigateToMap && (
                        <button
                          onClick={onNavigateToMap}
                          className="mt-2 px-4 py-2 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Explore Map & Book Slot</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.booking_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{r.customer_phone || r.customer_email || 'Direct Counter'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">Slot #{r.slot_number}</span>
                      <span className="block text-[11px] text-slate-400">{r.location_zone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        {r.vehicle_type === 'Car' ? '🚘' : '🏍️'} {r.vehicle_reg_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">{r.start_time}</div>
                      <div className="text-[11px] text-slate-400">until {r.end_time}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#143d2b]">₹{r.total_amount.toFixed(2)}</div>
                      <div className="text-[11px] text-slate-400">{r.duration_hours} hrs</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : r.status === 'Completed'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status === 'Confirmed'
                              ? 'bg-emerald-500'
                              : r.status === 'Completed'
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {r.payment_status === 'Paid' ? (
                        <button
                          onClick={() => onPayReservation(r)}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View Official Receipt & Digital Parking Pass with QR"
                        >
                          <Ticket className="w-3 h-3 text-emerald-700" />
                          <span>Receipt & QR Pass</span>
                        </button>
                      ) : (
                        r.status === 'Confirmed' && (
                          <button
                            onClick={() => onPayReservation(r)}
                            title="Complete Payment via UPI, Card, or Cash"
                            className="px-3 py-1 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3 text-emerald-300" />
                            <span>Pay ₹{r.total_amount.toFixed(2)}</span>
                          </button>
                        )
                      )}
                      {r.status === 'Confirmed' && (
                        <button
                          onClick={() => setConfirmCancelId(r.id)}
                          title={isAdmin ? "Administrator Force-Cancel Booking" : "Cancel Your Booking"}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            isAdmin
                              ? 'bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100'
                              : 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          {isAdmin ? 'Admin Cancel' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBooking(r)}
                        className="px-2 py-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                        title="View Full Booking Voucher"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Confirmation Modal for Reservation Cancellation */}
      {confirmCancelId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Cancel Parking Reservation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will mark the reservation as Cancelled and instantly restore the parking slot to Available status in the SQLite database.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Booking Voucher Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Booking Pass Details</h3>
                <span className="font-mono text-xs text-slate-500">{selectedBooking.booking_id}</span>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{selectedBooking.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Assigned Slot:</span>
                <span className="font-bold text-[#143d2b]">#{selectedBooking.slot_number} ({selectedBooking.location_zone})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Vehicle Type & Reg:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBooking.vehicle_type} • {selectedBooking.vehicle_reg_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-medium text-slate-800">{selectedBooking.start_time} → {selectedBooking.end_time}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Total Duration:</span>
                <span className="font-semibold text-slate-800">{selectedBooking.duration_hours} hours</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-extrabold text-[#143d2b]">
                <span>Total Fee Calculated:</span>
                <span>₹{selectedBooking.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

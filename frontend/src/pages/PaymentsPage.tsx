import React, { useState } from 'react';
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Calculator,
  ShieldCheck,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { Payment } from '../types';

interface PaymentsPageProps {
  payments: Payment[];
  onOpenCalculator?: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  payments,
  onViewReceipt
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Fee Calculator States
  const [calcVehicle, setCalcVehicle] = useState<'Car' | 'Bike'>('Car');
  const [calcRate, setCalcRate] = useState<number>(5.0);
  const [calcHours, setCalcHours] = useState<number>(3.5);

  const subtotal = Math.round(calcRate * calcHours * 100) / 100;
  const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
  const totalCalculated = Math.round((subtotal + serviceCharge) * 100) / 100;

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTxn = p.transaction_id.toLowerCase().includes(q);
      const matchCustomer = (p.customer_name || '').toLowerCase().includes(q);
      const matchPlate = (p.vehicle_reg_number || '').toLowerCase().includes(q);
      const matchBooking = (p.booking_id || '').toLowerCase().includes(q);
      if (!matchTxn && !matchCustomer && !matchPlate && !matchBooking) return false;
    }
    return true;
  });

  const totalCollected = payments
    .filter(p => p.status === 'Paid')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Dynamic Interactive Fee Engine Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#143d2b] flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dynamic Parking Fee Calculator</h3>
                <p className="text-xs text-slate-500">Configurable hourly tariff simulator</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              Module 4 Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setCalcVehicle('Car'); setCalcRate(5.0); }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    calcVehicle === 'Car' ? 'bg-[#143d2b] text-white border-[#143d2b]' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Car (₹5.00)
                </button>
                <button
                  type="button"
                  onClick={() => { setCalcVehicle('Bike'); setCalcRate(2.5); }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    calcVehicle === 'Bike' ? 'bg-[#143d2b] text-white border-[#143d2b]' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Bike (₹2.50)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={calcHours}
                onChange={(e) => setCalcHours(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Rate (₹/hr)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={calcRate}
                onChange={(e) => setCalcRate(parseFloat(e.target.value) || 5)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Breakdown pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between text-xs">
            <span className="text-slate-600">
              <b>{calcHours} hrs</b> × <b>₹{calcRate.toFixed(2)}/hr</b> = ₹{subtotal.toFixed(2)} (+ ₹{serviceCharge.toFixed(2)} 5% tax)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Calculated Total:</span>
              <span className="text-base font-extrabold text-[#143d2b]">₹{totalCalculated.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Ledger Summary */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settlement Summary</h4>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#143d2b]">₹{totalCollected.toFixed(2)}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Total collected across verified transactions</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Paid Transactions:</span>
              <span className="font-bold text-emerald-700">{payments.filter(p => p.status === 'Paid').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Processing:</span>
              <span className="font-bold text-amber-700">{payments.filter(p => p.status === 'Pending').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Declined / Unsuccessful:</span>
              <span className="font-bold text-rose-700">{payments.filter(p => p.status === 'Failed').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {['all', 'Paid', 'Pending', 'Failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? `All Ledger (${payments.length})` : `${st} (${payments.filter(p => p.status === st).length})`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TXN ID, booking, customer..."
            className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b] w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Reservation Ref</th>
                <th className="py-3.5 px-4">Customer & Slot</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Calculation Basis</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No transactions matching current filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.booking_id || `RES-#${p.reservation_id}`}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.customer_name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">Slot #{p.slot_number || '--'} ({p.vehicle_reg_number || '--'})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{p.payment_method}</span>
                      <span className="block text-[11px] text-slate-400">{p.notes || 'Razorpay Gateway Channel'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.duration_hours} hrs @ ₹{p.hourly_rate.toFixed(2)}/hr
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#143d2b] text-sm">
                      ₹{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : p.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'Paid'
                              ? 'bg-emerald-500'
                              : p.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewReceipt(p)}
                        className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

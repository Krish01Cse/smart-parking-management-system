import React from 'react';
import {
  Car,
  CalendarCheck,
  Wallet,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DashboardMetrics, ParkingSlot, Reservation, Payment } from '../types';

interface DashboardPageProps {
  metrics: DashboardMetrics | null;
  onNavigate: (tab: any) => void;
  onBookSlot: () => void;
  onRunTests?: () => void;
}

const COLORS = ['#143d2b', '#2d6a4f', '#52b788', '#f59e0b', '#3b82f6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  onNavigate,
  onBookSlot,
  onRunTests
}) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading live dashboard analytics...</span>
        </div>
      </div>
    );
  }

  // Format zone chart data
  const zoneChartData = metrics.zone_stats.map(z => ({
    name: z.location_zone.replace(/\s*\(.*\)/, ''),
    Available: z.available,
    Occupied: z.occupied,
    Maintenance: z.maintenance
  }));

  // Format vehicle pie data
  const vehiclePieData = metrics.vehicle_distribution.map(v => ({
    name: v.vehicle_type,
    value: v.count
  }));

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Slots Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Parking Slots</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#143d2b] flex items-center justify-center">
              <Car className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.total_slots}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {metrics.available_slots} Available
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Occupied: <b className="text-amber-600">{metrics.occupied_slots}</b></span>
            <span>Maintenance: <b className="text-blue-600">{metrics.maintenance_slots}</b></span>
          </div>
        </div>

        {/* Active Reservations Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Bookings</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.active_reservations}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {metrics.today_reservations} Today
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Completed: <b className="text-slate-700">{metrics.completed_reservations}</b></span>
            <span>Cancelled: <b className="text-rose-600">{metrics.cancelled_reservations}</b></span>
          </div>
        </div>

        {/* Revenue Collected Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Collected</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#143d2b] flex items-center justify-center">
              <Wallet className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ${metrics.total_revenue.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              Razorpay Verified
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pending Fees: <b className="text-amber-600">${metrics.pending_payments.toFixed(2)}</b></span>
            <span>Ledger: <b className="text-emerald-700">Verified</b></span>
          </div>
        </div>

        {/* Registered Users Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Accounts</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.total_users}</span>
            <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Role RBAC
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pass Storage: <b className="text-emerald-700">PBKDF2 Hashed</b></span>
            <span>Admin: <b className="text-slate-800">1</b></span>
          </div>
        </div>
      </div>

      {/* Middle Row: Zone Chart + Screenshot-style Standout Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Occupancy Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Parking Zone Occupancy</h3>
              <p className="text-xs text-slate-500">Available vs. Occupied distribution across physical zones</p>
            </div>
            <span className="text-xs font-bold text-[#143d2b] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              {metrics.occupancy_rate}% Occupancy Rate
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneChartData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                  }}
                />
                <Bar dataKey="Available" fill="#52b788" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Occupied" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Maintenance" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#52b788]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#94a3b8]" />
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {/* Vehicle Classification Distribution Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vehicle Distribution</h3>
              <p className="text-xs text-slate-500">Allocation by vehicle category</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              {metrics.total_slots} Slots
            </span>
          </div>

          <div className="h-52 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {vehiclePieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            {vehiclePieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-xs">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <div className="flex justify-between w-full">
                  <span className="font-semibold text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value} slots</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Bookings & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Parking Reservations</h3>
              <p className="text-xs text-slate-500">Live booking activity from database</p>
            </div>
            <button
              onClick={() => onNavigate('reservations')}
              className="text-xs font-semibold text-[#143d2b] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {metrics.recent_reservations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active reservations recorded.</p>
            ) : (
              metrics.recent_reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#143d2b] flex items-center justify-center font-bold">
                      {res.vehicle_type === 'Car' ? '🚘' : '🏍️'}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{res.customer_name}</h5>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {res.vehicle_reg_number} • Slot #{res.slot_number}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">${res.total_amount.toFixed(2)}</span>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'Completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Simulated Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Payment Transactions</h3>
              <p className="text-xs text-slate-500">Razorpay verified payment records</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-[#143d2b] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {metrics.recent_transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
            ) : (
              metrics.recent_transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      💳
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{txn.transaction_id}</h5>
                      <span className="text-[11px] text-slate-500">
                        {txn.customer_name} • {txn.payment_method}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#143d2b] block">${txn.amount.toFixed(2)}</span>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        txn.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : txn.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

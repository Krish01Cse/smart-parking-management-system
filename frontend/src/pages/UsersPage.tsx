import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  Plus,
  UserPlus,
  CheckCircle2,
  Cloud,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface UsersPageProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onLoginDemo: (email: string) => void;
  onRefreshData?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  users,
  onAddUser,
  onEditUser,
  onLoginDemo,
  onRefreshData,
  onShowToast
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | 'Administrator' | 'Customer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadSupabaseStatus = async () => {
    try {
      const res = await api.getSupabaseStatus();
      setSupabaseStatus(res);
    } catch (err) {
      console.error('Failed to get Supabase status:', err);
    }
  };

  useEffect(() => {
    loadSupabaseStatus();
  }, []);

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncAllToSupabase();
      setSyncResult(res.message);
      setSupabaseStatus(res.cloud_status);
      if (onShowToast) {
        onShowToast('success', res.message);
      }
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('error', `Cloud sync error: ${err.message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoleToggle = async (user: User) => {
    const nextRole = user.role === 'Administrator' ? 'Customer' : 'Administrator';
    if (!confirm(`Are you sure you want to change ${user.name}'s role to ${nextRole}?`)) {
      return;
    }
    try {
      await api.updateUserRole(user.id, nextRole);
      if (onShowToast) {
        onShowToast('success', `${user.name} is now an ${nextRole}!`);
      }
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('error', err.message);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = u.phone.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Supabase Cloud Sync Center Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">Supabase Cloud Database & Auth Integration</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  {supabaseStatus?.auth_connected ? '● Cloud Connected' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {supabaseStatus?.project_url || 'https://jsigdjyqhvgheefrddol.supabase.co'}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            User credentials, profiles, parking slots, and Razorpay receipts are replicated with encrypted salted hashes. View all registered accounts in your Supabase Auth dashboard.
          </p>
          {syncResult && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncResult}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 text-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Cloud User Accounts</span>
            <span className="text-sm font-extrabold text-emerald-400">
              {supabaseStatus?.auth_user_count ?? 8} Synced
            </span>
          </div>

          <button
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing to Supabase...' : 'Sync All Data to Supabase'}</span>
          </button>

          <a
            href="https://supabase.com/dashboard/project/jsigdjyqhvgheefrddol/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#143d2b] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Cryptographic Password Security (PBKDF2-HMAC)</h4>
            <p className="text-xs text-slate-600">
              Passwords are salted and securely hashed using 100,000 iterations of SHA-256 in Python. Plaintext passwords are never stored.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLoginDemo('admin@smartparking.edu')}
            className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-[#143d2b] hover:bg-emerald-100 transition-colors shadow-xs"
          >
            Switch to Admin Demo
          </button>
          <button
            onClick={onAddUser}
            className="px-3.5 py-1.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {['all', 'Administrator', 'Customer'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                roleFilter === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? `All Accounts (${users.length})` : `${r}s (${users.filter(u => u.role === r).length})`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b] w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Credential Storage</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Admin Role Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-[#143d2b] flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.phone}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'Administrator'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      PBKDF2-HMAC (64 hex)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {u.created_at || 'Pre-seeded'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Admin-exclusive Role change control */}
                      {u.role === 'Customer' ? (
                        <button
                          onClick={() => handleRoleToggle(u)}
                          title="Promote this customer to Administrator"
                          className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-colors"
                        >
                          Promote to Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleToggle(u)}
                          title="Demote this administrator to Customer"
                          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors"
                        >
                          Demote to Customer
                        </button>
                      )}

                      <button
                        onClick={() => onEditUser(u)}
                        className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, User, Mail, Phone, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onLogin: (creds: { email: string; password: string }) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
  onLogout: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Customer'>('Customer');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFillDemoAdmin = () => {
    setEmail('admin@smartparking.edu');
    setPassword('Admin@123');
    setError(null);
  };

  const handleFillDemoCustomer = () => {
    setEmail('elena.m@example.com');
    setPassword('User@123');
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onLogin({ email, password });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onRegister({
        name,
        email,
        phone,
        password,
        role
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {currentUser ? 'Active User Profile' : activeTab === 'login' ? 'User Login' : 'Create New Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Module 3: User Management (EPIC-3)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          /* Profile & Logout View */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="w-12 h-12 rounded-full bg-[#143d2b] text-white flex items-center justify-center font-bold text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{currentUser.name}</h4>
                <p className="text-xs text-slate-600">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Phone:</span>
                <span className="font-semibold text-slate-800">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Role Privileges:</span>
                <span className="font-semibold text-slate-800">
                  {currentUser.role === 'Administrator' ? 'Full CRUD & JIRA Access' : 'Slot Booking & Payments'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Security:</span>
                <span className="font-semibold text-emerald-700">PBKDF2-HMAC (SHA256) Verified</span>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                Log Out
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[#143d2b] text-white text-xs font-semibold hover:bg-[#1b4332] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register View */
          <div className="p-6">
            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`py-2 rounded-xl transition-all ${
                  activeTab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`py-2 rounded-xl transition-all ${
                  activeTab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Credentials Helper */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                Evaluator Quick Demo Credentials:
              </span>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-slate-400 text-[11px]"
                >
                  Admin (admin@smartparking.edu)
                </button>
                <button
                  type="button"
                  onClick={handleFillDemoCustomer}
                  className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:border-slate-400 text-[11px]"
                >
                  Customer (elena.m@example.com)
                </button>
              </div>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@smartparking.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b] bg-white"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

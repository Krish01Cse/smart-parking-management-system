import React, { useState } from 'react';
import {
  Shield,
  Car,
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  UserPlus,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { User as UserType } from '../types';

export type AuthMode = 'customer_login' | 'admin_login' | 'signup';

interface AuthPageProps {
  initialMode?: AuthMode;
  onLoginSuccess: (user: UserType) => void;
  onContinueAsGuest?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'customer_login',
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state (Full name, Email ID, Phone number, Password, Confirm password)
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
        required_role: 'Customer'
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
        required_role: 'Administrator'
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Please provide a valid phone number (at least 7 digits).');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.registerUser({
        name: fullName.trim(),
        email: signupEmail.trim().toLowerCase(),
        phone: phone.trim(),
        password: signupPassword,
        role: 'Customer'
      });

      setSuccessMsg('Account created successfully! Signing in...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsLoading(false);
    }
  };

  const quickDemoLogin = (email: string, pass: string, roleMode: 'customer_login' | 'admin_login') => {
    setMode(roleMode);
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#143d2b] to-[#2d6a4f] text-white shadow-lg shadow-emerald-950/20 mb-3">
            <Car className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              ParkPulse<span className="text-emerald-600">™</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Intelligent Cloud Parking Operating System • Real-Time Telemetry & ML
          </p>
        </div>

        {/* Portal Mode Switcher Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-3 gap-1 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => { setMode('customer_login'); setError(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'customer_login'
                ? 'bg-[#143d2b] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            User Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin_login'); setError(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'admin_login'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Admin Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xl relative overflow-hidden">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. CUSTOMER (NORMAL USER) LOGIN */}
          {mode === 'customer_login' && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Portal</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sign in to book parking</h2>
                <p className="text-xs text-slate-500">
                  Access live space availability, manage reservations, and pay via Razorpay.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. elena.m@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#143d2b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#143d2b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-[#143d2b] hover:bg-[#1b4332] active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In as Customer'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Navigation to Signup */}
              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="font-bold text-[#143d2b] hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>

              {/* Quick Fill Demo */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Demo Customer:</span>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('elena.m@example.com', 'User@123', 'customer_login')}
                  className="font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Use Elena Moretti (User@123)
                </button>
              </div>
            </form>
          )}

          {/* 2. ADMINISTRATOR LOGIN */}
          {mode === 'admin_login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold mb-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Administrator Portal</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
                <p className="text-xs text-slate-500">
                  Full control to add/edit parking slots, configure tariffs, and audit transactions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@smartparking.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>{isLoading ? 'Verifying Admin...' : 'Sign In as Administrator'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Looking for slot booking? </span>
                <button
                  type="button"
                  onClick={() => { setMode('customer_login'); setError(null); }}
                  className="font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Switch to Customer Login
                </button>
              </div>

              {/* Quick Fill Admin Demo */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Admin Demo:</span>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('admin@smartparking.edu', 'Admin@123', 'admin_login')}
                  className="font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Use Alex Morgan (Admin@123)
                </button>
              </div>
            </form>
          )}

          {/* 3. SIGNUP PAGE (FULL NAME, EMAIL, PHONE, PASSWORD, CONFIRM PASSWORD) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="mb-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Customer Registration</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Create an Account</h2>
                <p className="text-xs text-slate-500">
                  Register with your details to book and pay for parking slots.
                </p>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* 2. Email ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. rahul.sharma@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* 3. Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* 4. Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 5. Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('customer_login'); setError(null); }}
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Supabase Cloud Database Badge */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Supabase Cloud Database</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Passwords stored using <b>PBKDF2 SHA-256 salted hashes</b>. Credentials & user profiles appear in real time in your Supabase Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

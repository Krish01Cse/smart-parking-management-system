import React from 'react';
import {
  LayoutGrid,
  Car,
  CalendarCheck,
  Users,
  Wallet,
  BarChart3,
  Kanban,
  CheckSquare,
  Bug,
  BookOpen,
  Settings,
  Calendar,
  Sun
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'slots'
  | 'reservations'
  | 'users'
  | 'payments'
  | 'reports'
  | 'jira'
  | 'testing'
  | 'bugs'
  | 'docs';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings?: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenSettings, userRole = 'Administrator' }) => {
  const allNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutGrid, adminOnly: true },
    { id: 'slots' as NavTab, label: 'Parking Slots', icon: Car, adminOnly: false },
    { id: 'reservations' as NavTab, label: userRole === 'Customer' ? 'My Reservations' : 'Reservations', icon: CalendarCheck, adminOnly: false },
    { id: 'users' as NavTab, label: 'User Accounts', icon: Users, adminOnly: true },
    { id: 'payments' as NavTab, label: userRole === 'Customer' ? 'My Payments' : 'Payments Ledger', icon: Wallet, adminOnly: false },
    { id: 'reports' as NavTab, label: 'Analytics Reports', icon: BarChart3, adminOnly: true },
    { id: 'jira' as NavTab, label: 'JIRA Scrum Board', icon: Kanban, adminOnly: true },
    { id: 'testing' as NavTab, label: 'Testing & Matrix', icon: CheckSquare, adminOnly: true },
    { id: 'bugs' as NavTab, label: 'Bug Tracking', icon: Bug, adminOnly: true },
    { id: 'docs' as NavTab, label: 'Documentation', icon: BookOpen, adminOnly: false },
  ];

  const navItems = userRole === 'Customer'
    ? allNavItems.filter(item => !item.adminOnly)
    : allNavItems;

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-18 bg-white rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-center py-6 z-40 select-none">
      {/* Brand Logo - ParkPulse */}
      <div className="mb-5 flex flex-col items-center cursor-pointer group" onClick={() => onSelectTab('dashboard')} title="ParkPulse™ Operating System">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#143d2b] to-[#2d6a4f] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <circle cx="8" cy="8" r="3" fill="#f97316" />
              <circle cx="16" cy="8" r="3" fill="#ffffff" />
              <circle cx="8" cy="16" r="3" fill="#52b788" />
              <circle cx="16" cy="16" r="3" fill="#38bdf8" />
            </svg>
          </div>
        </div>
        <span className="text-[9px] font-black tracking-tight text-slate-800 uppercase mt-1.5 scale-90 group-hover:text-emerald-800 transition-colors">
          ParkPulse
        </span>
      </div>

      {/* Navigation Icon Stack */}
      <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full px-2 py-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md scale-105'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              
              {/* Tooltip on hover */}
              <span className="pointer-events-none absolute left-16 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Icons (Settings, Calendar, Sun from screenshot) */}
      <div className="mt-auto pt-4 flex flex-col items-center gap-3 w-full px-2 border-t border-slate-100">
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Settings className="w-4 h-4 stroke-[1.7]" />
        </button>
        <button
          onClick={() => onSelectTab('reservations')}
          title="Calendar Schedule"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Calendar className="w-4 h-4 stroke-[1.7]" />
        </button>
        <div
          title="Light Theme Active"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400"
        >
          <Sun className="w-4 h-4 stroke-[1.7]" />
        </div>
      </div>
    </aside>
  );
};

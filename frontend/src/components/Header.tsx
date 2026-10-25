import React from 'react';
import { SlidersHorizontal, Search, Plus, UserCheck, ShieldCheck, LogOut } from 'lucide-react';

export interface FilterPill {
  id: string;
  label: string;
  count?: number;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  filterPills?: FilterPill[];
  activePill?: string;
  onSelectPill?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  currentUser?: {
    name: string;
    role: string;
  };
  onUserClick?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  filterPills,
  activePill,
  onSelectPill,
  searchValue,
  onSearchChange,
  actionButton,
  currentUser = { name: 'Alex Morgan', role: 'Administrator' },
  onUserClick,
  onLogout
}) => {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#143d2b] text-[10px] font-black tracking-wider uppercase">
            ParkPulse™
          </span>
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Middle/Right: Pill Filters & Search & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Pills with Count Badges (Directly inspired by screenshot) */}
        {filterPills && filterPills.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {filterPills.map((pill) => {
              const isActive = activePill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => onSelectPill && onSelectPill(pill.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-150 whitespace-nowrap shadow-xs ${
                    isActive
                      ? 'bg-amber-400/90 text-slate-900 border border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <span>{pill.label}</span>
                  {pill.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pill.count}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Search Bar */}
        {onSearchChange !== undefined && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-44 lg:w-56 pl-9 pr-3 py-2 rounded-full bg-white border border-slate-200/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b]/20 focus:border-[#143d2b] transition-all shadow-xs"
            />
          </div>
        )}

        {/* Primary Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="px-4 py-2 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{actionButton.label}</span>
          </button>
        )}

        {/* Current User Badge */}
        <div
          onClick={onUserClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
          title="Click to view user profile"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
            currentUser.role === 'Administrator' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-[#143d2b]'
          }`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Logout / Switch Portal Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out / Switch Portal"
            className="p-2 rounded-full bg-white border border-slate-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

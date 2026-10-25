import React, { useState } from 'react';
import { Bug, Plus, Search, CheckCircle2, AlertCircle, Wrench, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Defect, DefectResponse } from '../types';

interface BugTrackingPageProps {
  defectResponse: DefectResponse | null;
  onAddDefect: () => void;
  onEditDefect: (defect: Defect) => void;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
}

export const BugTrackingPage: React.FC<BugTrackingPageProps> = ({
  defectResponse,
  onAddDefect,
  onEditDefect,
  onUpdateStatus
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!defectResponse) {
    return <div className="p-8 text-center text-slate-400">Loading defect register...</div>;
  }

  const { summary, defects } = defectResponse;

  const filteredDefects = defects.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.bug_id.toLowerCase().includes(q);
      const matchDesc = d.bug_description.toLowerCase().includes(q);
      const matchModule = d.related_module.toLowerCase().includes(q);
      if (!matchId && !matchDesc && !matchModule) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold mb-2">
            <Bug className="w-3.5 h-3.5" />
            <span>PBL Defect Register</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bug Tracking & Defect Lifecycle
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track defects through Open → In Progress → Fixed → Retested/Closed workflow.
          </p>
        </div>

        {/* Counters & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total</span>
              <span className="text-lg font-extrabold text-slate-900">{summary.total}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">Open</span>
              <span className="text-lg font-extrabold text-rose-800">{summary.open}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">In Progress</span>
              <span className="text-lg font-extrabold text-amber-800">{summary.in_progress}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Resolved</span>
              <span className="text-lg font-extrabold text-emerald-800">{summary.fixed + summary.closed}</span>
            </div>
          </div>

          <button
            onClick={onAddDefect}
            className="py-3 px-5 rounded-2xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log New Defect</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {['all', 'Open', 'In Progress', 'Fixed', 'Retested/Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bug ID or description..."
            className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b] w-48 sm:w-60"
          />
        </div>
      </div>

      {/* Defects Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 whitespace-nowrap">Bug ID</th>
                <th className="py-3.5 px-3">Module</th>
                <th className="py-3.5 px-4 min-w-[200px]">Description & Reproduction</th>
                <th className="py-3.5 px-3">Severity / Priority</th>
                <th className="py-3.5 px-3 min-w-[150px]">Resolution Notes</th>
                <th className="py-3.5 px-3 min-w-[140px]">Retest Outcome</th>
                <th className="py-3.5 px-3 text-center">Status Workflow</th>
                <th className="py-3.5 px-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredDefects.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {d.bug_id}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {d.related_module.replace(' Management', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{d.bug_description}</div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      <b>Steps:</b> {d.steps_to_reproduce}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : d.severity === 'Major'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {d.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Priority: {d.priority}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 text-[11px]">
                    {d.resolution || '--'}
                  </td>
                  <td className="py-3.5 px-3 text-emerald-800 text-[11px]">
                    {d.retest_result || '--'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <select
                      value={d.status}
                      onChange={(e) => onUpdateStatus(d.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        d.status === 'Open'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : d.status === 'In Progress'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : d.status === 'Fixed'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Fixed">Fixed</option>
                      <option value="Retested/Closed">Retested/Closed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onEditDefect(d)}
                      className="px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      Edit
                    </button>
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

import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCcw,
  FileCheck2
} from 'lucide-react';
import { TestCase, TestCaseResponse } from '../types';

interface TestingPageProps {
  testResponse: TestCaseResponse | null;
  onRunSuite: () => Promise<void>;
  onAddTestCase: () => void;
  onEditTestCase: (tc: TestCase) => void;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
}

export const TestingPage: React.FC<TestingPageProps> = ({
  testResponse,
  onRunSuite,
  onAddTestCase,
  onEditTestCase,
  onUpdateStatus
}) => {
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  if (!testResponse) {
    return <div className="p-8 text-center text-slate-400">Loading test matrix...</div>;
  }

  const { summary, cases } = testResponse;

  const filteredCases = cases.filter((tc) => {
    if (moduleFilter !== 'all' && tc.module !== moduleFilter) return false;
    if (statusFilter !== 'all' && tc.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = tc.test_case_id.toLowerCase().includes(q);
      const matchScenario = tc.test_scenario.toLowerCase().includes(q);
      const matchData = tc.test_data.toLowerCase().includes(q);
      if (!matchId && !matchScenario && !matchData) return false;
    }
    return true;
  });

  const handleRunSuite = async () => {
    setIsRunning(true);
    try {
      await onRunSuite();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>PBL Evaluation Test Register</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Verification & Quality Assurance Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Functional, boundary value, and equivalence partitioning test suites across all 4 system modules.
          </p>
        </div>

        {/* Action Button & Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Cases</span>
              <span className="text-lg font-extrabold text-slate-900">{summary.total}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Passed</span>
              <span className="text-lg font-extrabold text-emerald-800">{summary.passed}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">Failed</span>
              <span className="text-lg font-extrabold text-rose-800">{summary.failed}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">Pending</span>
              <span className="text-lg font-extrabold text-amber-800">{summary.pending}</span>
            </div>
          </div>

          <button
            onClick={handleRunSuite}
            disabled={isRunning}
            className="py-3 px-5 rounded-2xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-102"
          >
            {isRunning ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Execute Live Test Runner</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Selector */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 border-none text-slate-700 focus:ring-1 focus:ring-[#143d2b]"
          >
            <option value="all">All 4 Modules</option>
            <option value="Parking Slot Management">Module 1: Parking Slot Management</option>
            <option value="Parking Reservation Management">Module 2: Parking Reservation Management</option>
            <option value="User Management">Module 3: User Management</option>
            <option value="Parking Payment Management">Module 4: Parking Payment Management</option>
          </select>

          {/* Status filter pills */}
          {['all', 'Pass', 'Fail', 'Pending'].map((st) => (
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

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test scenario, ID..."
              className="pl-8 pr-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#143d2b] w-48 sm:w-60"
            />
          </div>
          <button
            onClick={onAddTestCase}
            className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test Case</span>
          </button>
        </div>
      </div>

      {/* PBL Required Test Case Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 whitespace-nowrap">Test Case ID</th>
                <th className="py-3.5 px-3">Module</th>
                <th className="py-3.5 px-4 min-w-[200px]">Test Scenario</th>
                <th className="py-3.5 px-3 min-w-[150px]">Test Data</th>
                <th className="py-3.5 px-3 min-w-[180px]">Expected Result</th>
                <th className="py-3.5 px-3 min-w-[180px]">Actual Result</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredCases.map((tc) => (
                <tr key={tc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {tc.test_case_id}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {tc.module.replace(' Management', '')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-semibold">{tc.test_scenario}</td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 bg-slate-50/50 rounded p-1">
                    {tc.test_data}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{tc.expected_result}</td>
                  <td className="py-3.5 px-3 text-emerald-900 font-medium">
                    {tc.actual_result}
                    {tc.executed_at && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {tc.executed_at}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <select
                      value={tc.status}
                      onChange={(e) => onUpdateStatus(tc.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        tc.status === 'Pass'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : tc.status === 'Fail'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onEditTestCase(tc)}
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

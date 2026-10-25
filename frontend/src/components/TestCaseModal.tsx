import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertCircle } from 'lucide-react';
import { TestCase } from '../types';

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingCase?: TestCase | null;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingCase
}) => {
  const [testCaseId, setTestCaseId] = useState('');
  const [module, setModule] = useState('Parking Slot Management');
  const [testScenario, setTestScenario] = useState('');
  const [testData, setTestData] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [status, setStatus] = useState<'Pass' | 'Fail' | 'Pending'>('Pending');
  const [testType, setTestType] = useState('Functional');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCase) {
      setTestCaseId(editingCase.test_case_id);
      setModule(editingCase.module);
      setTestScenario(editingCase.test_scenario);
      setTestData(editingCase.test_data);
      setExpectedResult(editingCase.expected_result);
      setActualResult(editingCase.actual_result);
      setStatus(editingCase.status);
      setTestType(editingCase.test_type || 'Functional');
    } else {
      setTestCaseId(`TC-VAL-${Math.floor(100 + Math.random() * 900)}`);
      setModule('Parking Slot Management');
      setTestScenario('');
      setTestData('');
      setExpectedResult('');
      setActualResult('');
      setStatus('Pending');
      setTestType('Functional');
    }
    setError(null);
  }, [editingCase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        test_case_id: testCaseId.trim(),
        module,
        test_scenario: testScenario.trim(),
        test_data: testData.trim(),
        expected_result: expectedResult.trim(),
        actual_result: actualResult.trim() || 'Awaiting execution',
        status,
        test_type: testType
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save test case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingCase ? 'Edit PBL Test Case' : 'Register New PBL Test Case'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              SE-lab-LA Verification Matrix
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Case ID *</label>
              <input
                type="text"
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
                disabled={!!editingCase}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module *</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="Parking Slot Management">Parking Slot Management</option>
                <option value="Parking Reservation Management">Parking Reservation Management</option>
                <option value="User Management">User Management</option>
                <option value="Parking Payment Management">Parking Payment Management</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Scenario *</label>
            <input
              type="text"
              value={testScenario}
              onChange={(e) => setTestScenario(e.target.value)}
              placeholder="e.g. Verify duplicate slot rejection"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Data *</label>
            <input
              type="text"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder="e.g. Slot: A-101 (Already exists)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Result *</label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="e.g. System responds with HTTP 400 Bad Request"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Result</label>
            <input
              type="text"
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="e.g. Returned 400 with duplicate slot error"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="Functional">Functional Testing</option>
                <option value="Validation">Validation Testing</option>
                <option value="Boundary Value">Boundary Value Analysis</option>
                <option value="Equivalence Partitioning">Equivalence Partitioning</option>
                <option value="Integration">Integration Testing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                <option value="Pass">Pass (Verified)</option>
                <option value="Fail">Fail (Defect Logged)</option>
                <option value="Pending">Pending (Not Run)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-bold shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Test Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

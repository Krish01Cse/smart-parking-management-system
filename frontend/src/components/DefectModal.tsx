import React, { useState, useEffect } from 'react';
import { X, Bug, AlertCircle } from 'lucide-react';
import { Defect } from '../types';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingDefect?: Defect | null;
}

export const DefectModal: React.FC<DefectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingDefect
}) => {
  const [bugId, setBugId] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState<'Critical' | 'Major' | 'Minor' | 'Low'>('Major');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Fixed' | 'Retested/Closed'>('Open');
  const [resolution, setResolution] = useState('');
  const [module, setModule] = useState('Parking Slot Management');
  const [retestResult, setRetestResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingDefect) {
      setBugId(editingDefect.bug_id);
      setDescription(editingDefect.bug_description);
      setSteps(editingDefect.steps_to_reproduce);
      setSeverity(editingDefect.severity);
      setPriority(editingDefect.priority);
      setStatus(editingDefect.status);
      setResolution(editingDefect.resolution || '');
      setModule(editingDefect.related_module);
      setRetestResult(editingDefect.retest_result || '');
    } else {
      setBugId(`BUG-${Math.floor(100 + Math.random() * 900)}`);
      setDescription('');
      setSteps('');
      setSeverity('Major');
      setPriority('High');
      setStatus('Open');
      setResolution('');
      setModule('Parking Slot Management');
      setRetestResult('');
    }
    setError(null);
  }, [editingDefect, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        bug_id: bugId.trim().toUpperCase(),
        bug_description: description.trim(),
        steps_to_reproduce: steps.trim(),
        severity,
        priority,
        status,
        resolution: resolution.trim(),
        related_module: module,
        retest_result: retestResult.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save defect.');
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
              {editingDefect ? 'Update Defect Record' : 'Log New Defect / Bug'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defect Register & Workflow Lifecycle
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bug ID *</label>
              <input
                type="text"
                value={bugId}
                onChange={(e) => setBugId(e.target.value)}
                disabled={!!editingDefect}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Related Module *</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bug Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cannot transition slot to Maintenance during active reservation"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Steps to Reproduce *</label>
            <textarea
              rows={2}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Open slot card. 2. Click status. 3. Observe validation trigger."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Fixed">Fixed</option>
                <option value="Retested/Closed">Retested/Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Notes</label>
            <input
              type="text"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="e.g. Applied guard clause and returned 400 with active reservation notice"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Retest Outcome</label>
            <input
              type="text"
              value={retestResult}
              onChange={(e) => setRetestResult(e.target.value)}
              placeholder="e.g. Verified against test case TC-PS-004. Passed."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
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
              {isSubmitting ? 'Saving...' : 'Save Defect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

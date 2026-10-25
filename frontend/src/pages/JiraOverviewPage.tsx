import React, { useState } from 'react';
import {
  Kanban,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  GitPullRequest,
  Check,
  Edit2
} from 'lucide-react';
import { JiraOverview, JiraEpic, JiraItem, JiraSprint } from '../types';

interface JiraOverviewPageProps {
  jira: JiraOverview | null;
  onUpdateItemStatus: (itemKey: string, newStatus: string) => Promise<void>;
}

export const JiraOverviewPage: React.FC<JiraOverviewPageProps> = ({
  jira,
  onUpdateItemStatus
}) => {
  const [activeSprintTab, setActiveSprintTab] = useState<string>('all');
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({
    'EPIC-1': true,
    'EPIC-2': true,
    'EPIC-3': true,
    'EPIC-4': true
  });

  if (!jira) {
    return <div className="p-8 text-center text-slate-400">Loading JIRA project workspace...</div>;
  }

  const toggleEpic = (epicKey: string) => {
    setExpandedEpics(prev => ({ ...prev, [epicKey]: !prev[epicKey] }));
  };

  // Group items by Epic
  const itemsByEpic: Record<string, JiraItem[]> = {};
  jira.epics.forEach(e => {
    itemsByEpic[e.epic_key] = jira.items.filter(i => {
      if (activeSprintTab !== 'all' && i.sprint_name !== activeSprintTab) return false;
      return i.epic_key === e.epic_key;
    });
  });

  return (
    <div className="space-y-6">
      {/* Project Meta Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Kanban className="w-3.5 h-3.5" />
            <span>Project Key: SE-lab-LA (SCRUM)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Software Engineering Agile Scrum Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Local representation of student PBL JIRA project mapping requirements, sprints, and verified implementations.
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-semibold block">Sprint Completion</span>
            <span className="text-2xl font-extrabold text-emerald-800">{jira.completion_rate}%</span>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Verified Items</span>
            <span className="text-base font-bold text-slate-800">
              {jira.completed_work_items} / {jira.total_work_items} Items
            </span>
          </div>
        </div>
      </div>

      {/* Sprints Timeline Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scrum Sprint Cycles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {jira.sprints.map((sprint, idx) => (
            <button
              key={sprint.id}
              onClick={() => setActiveSprintTab(activeSprintTab === sprint.sprint_name ? 'all' : sprint.sprint_name)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                activeSprintTab === sprint.sprint_name
                  ? 'border-[#143d2b] bg-emerald-50 ring-2 ring-[#143d2b]/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 truncate">Sprint {idx + 1}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {sprint.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-2">{sprint.goal}</p>
              <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                {sprint.start_date} → {sprint.end_date}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hierarchy View: Epics -> User Stories/Tasks -> Subtasks */}
      <div className="space-y-4">
        {jira.epics.map((epic) => {
          const isExpanded = expandedEpics[epic.epic_key] ?? true;
          const epicItems = itemsByEpic[epic.epic_key] || [];

          return (
            <div key={epic.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Epic Banner */}
              <div
                onClick={() => toggleEpic(epic.epic_key)}
                className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#143d2b] text-white text-[10px] font-mono font-bold">
                        {epic.epic_key}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{epic.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{epic.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    {epicItems.length} Work Items
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {epic.status}
                  </span>
                </div>
              </div>

              {/* Items List (User Stories, Tasks, Subtasks) */}
              {isExpanded && (
                <div className="p-4 space-y-2">
                  {epicItems.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No items matching selected sprint.</p>
                  ) : (
                    epicItems.map((item) => {
                      const isSubtask = item.item_type === 'Subtask';
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border border-slate-100 hover:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                            isSubtask ? 'ml-6 bg-slate-50/60' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                item.item_type === 'Story'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.item_type === 'Task'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {item.item_key}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900">{item.title}</span>
                              <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-[10px] text-slate-400 hidden md:inline">
                              {item.sprint_name.split(':')[0]}
                            </span>
                            <select
                              value={item.status}
                              onChange={(e) => onUpdateItemStatus(item.item_key, e.target.value)}
                              className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 border-none text-slate-800 focus:ring-1 focus:ring-[#143d2b]"
                            >
                              <option value="Planned">Planned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Verified">Verified ✓</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Award, ClipboardCheck, History, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function InspectorDashboard() {
  const sidebarItems = [
    { label: 'Pending Reviews', icon: ClipboardCheck, badge: '0' },
    { label: 'Inspection History', icon: History, badge: '0' },
    { label: 'Reports', icon: FileSpreadsheet, badge: '0' },
  ];

  return (
    <DashboardLayout
      roleName="Quality Inspector Workspace"
      roleBadgeColor="bg-amber-500"
      sidebarItems={sidebarItems}
      title="Quality Inspector Dashboard — coming soon"
      description="Perform quality audits on completed jobs and ensure platform service standards."
      icon={Award}
    >
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Pending Audits</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Completed Audits</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Quality Score Standard</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">98.5%</p>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="p-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          No Pending Quality Reviews
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          Randomized quality audits and customer verification review requests will populate here when active.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed text-sm font-semibold"
        >
          <span>Request Random Audit Sample (Coming Soon)</span>
        </button>
      </div>
    </DashboardLayout>
  );
}

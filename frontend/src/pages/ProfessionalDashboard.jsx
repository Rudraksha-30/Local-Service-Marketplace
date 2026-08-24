import React from 'react';
import { Briefcase, Star, FileText, Wrench, CheckCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function ProfessionalDashboard() {
  const sidebarItems = [
    { label: 'My Jobs', icon: Wrench, badge: '0' },
    { label: 'Trust Score', icon: Star, badge: '100%' },
    { label: 'Documents', icon: FileText, badge: 'Verified' },
  ];

  return (
    <DashboardLayout
      roleName="Professional Workspace"
      roleBadgeColor="bg-emerald-500"
      sidebarItems={sidebarItems}
      title="Professional Dashboard — coming soon"
      description="Manage job offers, track provider Trust Scores, and maintain verification documents."
      icon={Briefcase}
    >
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Assigned Jobs</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Trust Score</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">100 / 100</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Verification Status</p>
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Ready for verification
          </p>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="p-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Wrench className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          No Job Assignments Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          Service dispatch, job queue management, and instant payout tracking for trade professionals will be enabled here.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed text-sm font-semibold"
        >
          <span>Update Availability Schedule (Coming Soon)</span>
        </button>
      </div>
    </DashboardLayout>
  );
}

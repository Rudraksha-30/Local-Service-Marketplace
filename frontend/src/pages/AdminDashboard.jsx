import React, { useEffect, useState } from 'react';
import { ShieldAlert, Scale, CheckSquare, Activity, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthData(data);
        setLoading(false);
      })
      .catch((err) => {
        setHealthData({ status: 'error', error: err.message });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const sidebarItems = [
    { label: 'Disputes', icon: Scale, badge: '0' },
    { label: 'Verifications', icon: CheckSquare, badge: '0' },
    { label: 'System Health', icon: Activity, badge: 'Active' },
  ];

  return (
    <DashboardLayout
      roleName="Admin & Support Workspace"
      roleBadgeColor="bg-violet-500"
      sidebarItems={sidebarItems}
      title="Support / Admin Dashboard — coming soon"
      description="Resolve customer disputes, audit professional verifications, and monitor platform health."
      icon={ShieldAlert}
    >
      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Escalated Disputes</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Pending Verifications</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">System Status</p>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1 uppercase">
            {healthData?.status || 'Checking'}
          </p>
        </div>
      </div>

      {/* Backend API Health Verification Widget */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Live REST API Health Monitor
            </h3>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
          <p className="font-semibold text-slate-500 mb-1">// Response from /api/health</p>
          <pre>{JSON.stringify(healthData || { loading: true }, null, 2)}</pre>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="p-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          No Escalations Flagged
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          Admin tools for dispute arbitration, background verification check approvals, and audit logs will be surfaced here.
        </p>
      </div>
    </DashboardLayout>
  );
}

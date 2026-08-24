import React from 'react';
import { UserCheck, Calendar, Clock, AlertCircle, ShoppingBag, Search } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function CustomerDashboard() {
  const sidebarItems = [
    { label: 'My Bookings', icon: Calendar, badge: '0' },
    { label: 'Service History', icon: Clock, badge: '0' },
    { label: 'Disputes', icon: AlertCircle, badge: '0' },
  ];

  return (
    <DashboardLayout
      roleName="Customer Workspace"
      roleBadgeColor="bg-blue-500"
      sidebarItems={sidebarItems}
      title="Customer Dashboard — coming soon"
      description="Manage your service requests, track booking statuses, and view past work history."
      icon={UserCheck}
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Active Bookings</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Completed Services</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase">Open Disputes</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">0</p>
        </div>
      </div>

      {/* Main Empty State Content */}
      <div className="p-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          No Active Service Bookings
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
          When customer booking functionality is wired up, your scheduled local service appointments, estimated arrival times, and invoices will appear here.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed text-sm font-semibold"
        >
          <Search className="w-4 h-4" />
          <span>Browse Marketplace (Coming Soon)</span>
        </button>
      </div>
    </DashboardLayout>
  );
}

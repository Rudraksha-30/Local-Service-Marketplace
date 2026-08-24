import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({
  roleName,
  roleBadgeColor,
  sidebarItems,
  title,
  description,
  icon: HeaderIcon,
  children
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          roleName={roleName}
          roleBadgeColor={roleBadgeColor}
          items={sidebarItems}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Dashboard Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {HeaderIcon && (
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                    <HeaderIcon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {title}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Children or Empty State Shell */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

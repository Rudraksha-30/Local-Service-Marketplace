import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ roleName, roleBadgeColor, items = [] }) {
  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0">
      <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1">
          Active Role Workspace
        </p>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${roleBadgeColor}`} />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {roleName}
          </h2>
        </div>
      </div>

      <nav className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
          Menu Navigation
        </p>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href="#placeholder"
              onClick={(e) => e.preventDefault()}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Navigation Note</p>
        <p>Sidebar links are static placeholders for this scaffold pass.</p>
      </div>
    </aside>
  );
}

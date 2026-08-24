import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Briefcase, Award, ShieldAlert, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  const roles = [
    {
      title: 'Customer Dashboard',
      roleKey: 'customer',
      path: '/dashboard/customer',
      icon: UserCheck,
      color: 'from-blue-500 to-teal-500',
      badgeColor: 'bg-blue-500',
      tag: 'Service Seekers',
      description: 'Book verified local pros, track ongoing jobs, and view service history.',
      actionText: 'Enter as Customer',
    },
    {
      title: 'Professional Dashboard',
      roleKey: 'professional',
      path: '/dashboard/professional',
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500',
      tag: 'Service Providers',
      description: 'Manage active jobs, track your Trust Score, and upload verification docs.',
      actionText: 'Enter as Professional',
    },
    {
      title: 'Quality Inspector Dashboard',
      roleKey: 'inspector',
      path: '/dashboard/inspector',
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      badgeColor: 'bg-amber-500',
      tag: 'Audit & Compliance',
      description: 'Perform service quality reviews, audit jobs, and submit evaluation reports.',
      actionText: 'Enter as Inspector',
    },
    {
      title: 'Support / Admin Dashboard',
      roleKey: 'admin',
      path: '/dashboard/admin',
      icon: ShieldAlert,
      color: 'from-violet-500 to-indigo-600',
      badgeColor: 'bg-violet-500',
      tag: 'Platform Management',
      description: 'Handle user disputes, manage provider verifications, and inspect system logs.',
      actionText: 'Enter as Admin',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Local Service Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            TrustHome
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-medium">
            A local service marketplace built on trust
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Explore our role-based dashboard shells below. Select a workspace to preview the tailored navigation and interface designed for each user role.
          </p>
        </div>

        {/* 4 Role Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.roleKey}
                className="group relative bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  {/* Icon & Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {role.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                    {role.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {role.description}
                  </p>
                </div>

                {/* Direct Link Action */}
                <Link
                  to={role.path}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-600 dark:bg-slate-700 dark:hover:bg-teal-600 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
                >
                  <span>{role.actionText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-16 max-w-2xl mx-auto p-5 rounded-2xl bg-teal-50/50 dark:bg-slate-800/40 border border-teal-100 dark:border-slate-700/60 text-center">
          <div className="flex items-center justify-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-sm mb-1">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Developer Note</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Authentication and database constraints are currently deferred. All four dashboard shells are directly accessible for inspection.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        TrustHome Scaffold &bull; Local Service Marketplace System
      </footer>
    </div>
  );
}

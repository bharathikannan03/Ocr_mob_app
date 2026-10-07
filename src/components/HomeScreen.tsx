import React from 'react';
import { Camera, Users, Sparkles, Clock, ArrowRight, Phone, Mail, Building2, ShieldCheck, ChevronRight } from 'lucide-react';
import { Contact, ScanLog } from '../types';

interface HomeScreenProps {
  userName?: string;
  contacts: Contact[];
  scans: ScanLog[];
  onStartScan: () => void;
  onSelectContact: (contact: Contact) => void;
  onViewAllContacts: () => void;
  onViewHistory: () => void;
  onOpenArchitecture: () => void;
  onLogout?: () => void;
  onManualAdd?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName = 'Alex',
  contacts,
  scans,
  onStartScan,
  onSelectContact,
  onViewAllContacts,
  onViewHistory,
  onOpenArchitecture,
  onLogout,
  onManualAdd,
}) => {
  const thisMonthScans = contacts.filter((c) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear() &&
      c.source === 'scanned'
    );
  }).length;

  const recentContacts = contacts.slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header bar */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CardScan AI Mobile</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Hello, {userName.split(' ')[0]} 👋
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              title="Inspect Flutter Architecture & Specs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Specs</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                title="Sign out or switch user"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Primary Hero Action: Scan Visiting Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
              <Camera className="w-3 h-3" />
              OCR + Gemini 3.8 Engine
            </span>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">
              Scan Visiting Card
            </h2>
            <p className="mt-1 text-xs text-blue-100 leading-relaxed max-w-[280px]">
              Point camera at any physical business card. Auto-crop, extract contact details, and review instantly.
            </p>
            <button
              onClick={onStartScan}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-blue-600 shadow-md hover:bg-blue-50 active:scale-[0.98] transition-all"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Open Card Scanner</span>
            </button>
          </div>
          {/* Subtle background card watermark */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-2xl border-4 border-white/10 rotate-12 bg-white/5 pointer-events-none" />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={onViewAllContacts}
            className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs cursor-pointer hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium text-slate-500">Total Contacts</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{contacts.length}</span>
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            </div>
          </div>

          <div
            onClick={onViewHistory}
            className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs cursor-pointer hover:border-blue-200 transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium text-slate-500">Scanned This Month</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{thisMonthScans}</span>
              <span className="text-xs text-blue-600 font-medium">Cards</span>
            </div>
          </div>
        </div>

        {/* Recent Contacts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Contacts
            </h3>
            <button
              onClick={onViewAllContacts}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentContacts.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-100">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-500">No contacts saved yet.</p>
              <button
                onClick={onStartScan}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
              >
                Scan your first business card
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onSelectContact(contact)}
                  className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {contact.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{contact.company || 'Private'}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick OCR Tips Banner */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-slate-600 text-xs flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-blue-100 text-blue-600 shrink-0 mt-0.5">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800">Pro Scanning Tip:</span> Hold card flat under good lighting. You will always review and edit all extracted fields before saving to the database.
          </div>
        </div>
      </div>
    </div>
  );
};

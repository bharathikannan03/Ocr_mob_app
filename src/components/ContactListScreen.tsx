import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Camera,
  Share2,
  Download,
  UserPlus,
} from 'lucide-react';
import { Contact } from '../types';
import { exportContactsToCsv } from '../utils/csv';

interface ContactListScreenProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onNewScan: () => void;
  onManualAdd?: () => void;
}

export const ContactListScreen: React.FC<ContactListScreenProps> = ({
  contacts,
  onSelectContact,
  onNewScan,
  onManualAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'scanned' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter & Search Logic
  const filteredContacts = contacts.filter((c) => {
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.designation.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.city.toLowerCase().includes(query)
    );
  });

  // Sort Logic
  filteredContacts.sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Contacts</h1>
            <p className="text-xs text-slate-500">{contacts.length} total saved contacts</p>
          </div>
          <div className="flex items-center gap-1.5">
            {onManualAdd && (
              <button
                onClick={onManualAdd}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                title="Add Contact Manually"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => exportContactsToCsv(contacts)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
              title="Export Contacts as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onNewScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, company, email, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and Sorting bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSourceFilter('scanned')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sourceFilter === 'scanned'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Scanned
            </button>
          </div>

          <button
            onClick={() => {
              if (sortBy === 'name') setSortBy('company');
              else if (sortBy === 'company') setSortBy('createdAt');
              else setSortBy('name');
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span className="capitalize">Sort: {sortBy === 'createdAt' ? 'Recent' : sortBy}</span>
          </button>
        </div>
      </div>

      {/* Contact Cards List */}
      <div className="p-4 space-y-2.5 flex-1">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 mt-4">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="mt-2 text-sm font-bold text-slate-800">No matching contacts</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery ? 'Try adjusting your search criteria' : 'No contacts saved yet.'}
            </p>
            <button
              onClick={onNewScan}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors"
            >
              Scan a Business Card
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {contact.name}
                      </h3>
                      {contact.source === 'scanned' && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-medium border border-blue-200/60 shrink-0">
                          OCR
                        </span>
                      )}
                    </div>
                    {contact.designation && (
                      <p className="text-xs text-slate-600 truncate">{contact.designation}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.company || 'Private'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              {/* Direct Quick Badges */}
              {(contact.phone || contact.email) && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                  {contact.phone && (
                    <span className="flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span className="truncate">{contact.phone}</span>
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-rose-500" />
                      <span className="truncate">{contact.email}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

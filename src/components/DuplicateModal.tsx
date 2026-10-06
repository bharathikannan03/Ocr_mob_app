import React from 'react';
import { AlertCircle, ArrowRight, UserCheck, Check, X } from 'lucide-react';
import { Contact, ExtractedContact } from '../types';

interface DuplicateModalProps {
  existingContact: Contact;
  incomingContact: ExtractedContact;
  matchType: string;
  onViewExisting: () => void;
  onSaveAnyway: () => void;
  onCancel: () => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  existingContact,
  incomingContact,
  matchType,
  onViewExisting,
  onSaveAnyway,
  onCancel,
}) => {
  const formatMatchType = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email match';
      case 'phone':
        return 'Phone number match';
      case 'name_and_company':
        return 'Same Person & Company';
      default:
        return 'Similar contact';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-100" />
            <h3 className="font-bold text-sm tracking-tight">Possible Duplicate Found</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed">
            A contact with matching credentials already exists in your database (
            <span className="font-semibold text-amber-800">{formatMatchType(matchType)}</span>
            ).
          </div>

          {/* Comparison Cards */}
          <div className="space-y-2.5">
            {/* Existing Contact */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Existing in Database
              </div>
              <div className="font-bold text-slate-900 text-sm">{existingContact.name}</div>
              <div className="text-xs text-slate-600">{existingContact.company || 'Private'}</div>
              <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                {existingContact.email && <span>✉️ {existingContact.email}</span>}
                {existingContact.phone && <span>📞 {existingContact.phone}</span>}
              </div>
            </div>

            {/* New Scanned Contact */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                New Scanned Card
              </div>
              <div className="font-bold text-slate-900 text-sm">{incomingContact.name}</div>
              <div className="text-xs text-slate-600">{incomingContact.company || 'Private'}</div>
              <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                {incomingContact.email && <span>✉️ {incomingContact.email}</span>}
                {incomingContact.phone && <span>📞 {incomingContact.phone}</span>}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            You can view the existing contact to update it, or save this card anyway as a separate entry.
          </p>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onViewExisting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>View Existing Contact</span>
            </button>
            <button
              onClick={onSaveAnyway}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Save Anyway as New Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

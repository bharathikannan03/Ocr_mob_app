import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Share2,
  Download,
  Edit3,
  Trash2,
  Building2,
  Briefcase,
  FileText,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';
import { Contact } from '../types';
import { downloadVCard } from '../utils/vcard';

interface ContactDetailScreenProps {
  contact: Contact;
  onBack: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  contact,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: contact.name,
          text: `Contact: ${contact.name}\n${contact.company}\nPhone: ${contact.phone}\nEmail: ${contact.email}`,
        })
        .catch(() => {});
    } else {
      copyToClipboard(`${contact.name} - ${contact.phone} - ${contact.email}`, 'contact');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs font-bold text-slate-700">Contact Details</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
            title="Edit Contact"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
            title="Delete Contact"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white p-6 border-b border-slate-200 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-4 border-white">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-3 text-xl font-bold text-slate-900">{contact.name}</h1>
        {contact.designation && (
          <p className="text-xs font-medium text-slate-600 mt-0.5">{contact.designation}</p>
        )}
        {contact.company && (
          <p className="text-xs font-semibold text-blue-600 mt-0.5">{contact.company}</p>
        )}

        {/* Action Buttons Row */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs mt-5">
          {/* Call */}
          <a
            href={contact.phone ? `tel:${contact.phone}` : undefined}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              contact.phone
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-50 border-slate-100 text-slate-300 pointer-events-none'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Call</span>
          </a>

          {/* Email */}
          <a
            href={contact.email ? `mailto:${contact.email}` : undefined}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              contact.email
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs'
                : 'bg-slate-50 border-slate-100 text-slate-300 pointer-events-none'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Email</span>
          </a>

          {/* Website */}
          <a
            href={contact.website || undefined}
            target="_blank"
            rel="noreferrer"
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
              contact.website
                ? 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 shadow-2xs'
                : 'bg-slate-50 border-slate-100 text-slate-300 pointer-events-none'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Web</span>
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex flex-col items-center gap-1 shadow-2xs transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Share</span>
          </button>
        </div>
      </div>

      {/* Save to Phone Contacts (vCard Export) Feature Banner */}
      <div className="p-4 bg-slate-100/70 border-b border-slate-200">
        <button
          onClick={() => downloadVCard(contact)}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Save to Phone Contacts (vCard .vcf)</span>
        </button>
        <p className="mt-1 text-center text-[10px] text-slate-500">
          Exports standard RFC 6350 vCard to immediately sync with iOS & Android address books.
        </p>
      </div>

      {/* Contact Fields List */}
      <div className="p-4 space-y-3 flex-1">
        {/* Phone */}
        {contact.phone && (
          <div
            onClick={() => copyToClipboard(contact.phone, 'phone')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Phone Number</div>
                <div className="text-xs font-bold text-slate-800">{contact.phone}</div>
              </div>
            </div>
            {copiedField === 'phone' ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Copied
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Tap to copy</span>
            )}
          </div>
        )}

        {/* Email */}
        {contact.email && (
          <div
            onClick={() => copyToClipboard(contact.email, 'email')}
            className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Email Address</div>
                <div className="text-xs font-bold text-slate-800">{contact.email}</div>
              </div>
            </div>
            {copiedField === 'email' ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Copied
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Tap to copy</span>
            )}
          </div>
        )}

        {/* Website */}
        {contact.website && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Website</div>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {contact.website}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        {contact.address && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Address & Location</div>
              <div className="text-xs font-medium text-slate-800 leading-relaxed">{contact.address}</div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Open in Maps →
              </a>
            </div>
          </div>
        )}

        {/* LinkedIn */}
        {contact.linkedin && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">LinkedIn Profile</div>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {contact.linkedin}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Notes & Meta</div>
            <p className="text-xs text-slate-700 leading-relaxed">{contact.notes}</p>
          </div>
        )}

        {/* OCR Raw Text and Confidence info */}
        {contact.rawOcrText && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Source & OCR Confidence</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                {Math.round((contact.ocrConfidence || 0.95) * 100)}% accuracy
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 font-mono text-[10px] whitespace-pre-wrap max-h-24 overflow-y-auto">
              {contact.rawOcrText}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Delete Contact?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{contact.name}</span> from your database?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(contact.id);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  User,
  Briefcase,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  Share2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { ExtractedContact, FieldConfidences } from '../types';

interface ReviewEditScreenProps {
  initialContact: ExtractedContact;
  fieldConfidences?: FieldConfidences;
  rawOcrText: string;
  cardImage?: string;
  onSave: (contact: ExtractedContact) => void;
  onRetake: () => void;
  onDiscard: () => void;
}

export const ReviewEditScreen: React.FC<ReviewEditScreenProps> = ({
  initialContact,
  fieldConfidences = {},
  rawOcrText,
  cardImage,
  onSave,
  onRetake,
  onDiscard,
}) => {
  const [formData, setFormData] = useState<ExtractedContact>({ ...initialContact });
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ExtractedContact, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error on change
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Contact name is required';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (formData.phone.trim()) {
      const cleanDigits = formData.phone.replace(/\D/g, '');
      if (cleanDigits.length < 6) {
        errors.phone = 'Phone number seems too short';
      }
    }

    if (formData.website.trim()) {
      if (!formData.website.includes('.') || formData.website.length < 4) {
        errors.website = 'Invalid website format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  // Helper for low confidence highlight
  const isLowConfidence = (field: string) => {
    const val = (fieldConfidences as any)[field];
    return typeof val === 'number' && val < 0.85;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Header bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Review Contact</h2>
          <p className="text-[11px] text-slate-500">Verify & edit extracted information</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRetake}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            title="Retake Scan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onDiscard}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
            title="Discard Scan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Content */}
      <div className="p-4 space-y-4">
        {/* Verification Alert Banner */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Review notice:</span> OCR and AI extraction may occasionally misinterpret stylized fonts. Please verify all fields before saving.
          </div>
        </div>

        {/* Collapsible Original Card Image Drawer */}
        {cardImage && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              onClick={() => setShowImagePreview(!showImagePreview)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Original Scanned Card Image
              </span>
              {showImagePreview ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showImagePreview && (
              <div className="p-3 bg-slate-950 flex justify-center border-t border-slate-100">
                <img
                  src={cardImage}
                  alt="Original visiting card"
                  className="max-h-48 object-contain rounded-lg shadow-md border border-slate-800"
                />
              </div>
            )}
          </div>
        )}

        {/* Editable Fields Form */}
        <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Full Name *</span>
              </label>
              {isLowConfidence('name') && (
                <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                  Low confidence
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Raj Kumar"
              className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                validationErrors.name
                  ? 'border-rose-400 bg-rose-50/30'
                  : isLowConfidence('name')
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 focus:border-blue-500'
              } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
            />
            {validationErrors.name && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{validationErrors.name}</p>
            )}
          </div>

          {/* Designation / Job Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Designation</span>
              </label>
              {isLowConfidence('designation') && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  Verify
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Company */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Company / Organization</span>
              </label>
              {isLowConfidence('company') && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  Verify
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="e.g. ABC Technologies Pvt Ltd"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phone Number</span>
              </label>
              {isLowConfidence('phone') && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  Verify
                </span>
              )}
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="e.g. +91 9876543210"
              className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                validationErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-blue-500'
              } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
            />
            {validationErrors.phone && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{validationErrors.phone}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span>Email Address</span>
              </label>
              {isLowConfidence('email') && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                  Verify
                </span>
              )}
            </div>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g. raj@abc.com"
              className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                validationErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-blue-500'
              } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{validationErrors.email}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span>Website</span>
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="e.g. https://abc.com"
              className={`w-full px-3 py-2 text-sm rounded-xl border transition-all ${
                validationErrors.website ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-blue-500'
              } focus:outline-hidden focus:ring-2 focus:ring-blue-500/20`}
            />
            {validationErrors.website && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">{validationErrors.website}</p>
            )}
          </div>

          {/* Address & City */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Address & Location</span>
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="e.g. Block B, Tidel Park, Chennai, India"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* LinkedIn Profile */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
              <Share2 className="w-3.5 h-3.5 text-blue-700" />
              <span>LinkedIn Profile</span>
            </label>
            <input
              type="text"
              value={formData.linkedin || ''}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="e.g. https://linkedin.com/in/rajkumar"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Raw OCR Text Inspector Drawer */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowRawOcr(!showRawOcr)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              View Raw OCR Text Extraction
            </span>
            {showRawOcr ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showRawOcr && (
            <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border-t border-slate-200">
              {rawOcrText || 'No raw OCR captured.'}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20 shadow-lg flex items-center gap-3">
        <button
          onClick={onDiscard}
          className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          Discard
        </button>
        <button
          onClick={handleSaveClick}
          className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          <Check className="w-4 h-4" />
          <span>Save Contact</span>
        </button>
      </div>
    </div>
  );
};

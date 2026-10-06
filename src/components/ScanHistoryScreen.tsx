import React, { useState } from 'react';
import { Clock, FileText, ChevronRight, CheckCircle, Search, ArrowLeft, Camera, ExternalLink } from 'lucide-react';
import { ScanLog, Contact } from '../types';

interface ScanHistoryScreenProps {
  scans: ScanLog[];
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onNewScan: () => void;
  onBack: () => void;
}

export const ScanHistoryScreen: React.FC<ScanHistoryScreenProps> = ({
  scans,
  contacts,
  onSelectContact,
  onNewScan,
  onBack,
}) => {
  const [selectedScanForOcr, setSelectedScanForOcr] = useState<ScanLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScans = scans.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.contactName && s.contactName.toLowerCase().includes(q)) ||
      (s.companyName && s.companyName.toLowerCase().includes(q)) ||
      s.rawOcrText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Scan History</h1>
              <p className="text-xs text-slate-500">{scans.length} total card captures</p>
            </div>
          </div>
          <button
            onClick={onNewScan}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scan logs or OCR text..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* History List */}
      <div className="p-4 space-y-2.5 flex-1">
        {filteredScans.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-2 text-xs text-slate-500">No scans recorded yet.</p>
          </div>
        ) : (
          filteredScans.map((scan) => {
            const matchedContact = contacts.find((c) => c.id === scan.contactId);
            const dateStr = new Date(scan.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={scan.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      OCR
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {scan.contactName || 'Unsaved Scanned Card'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {scan.companyName || 'Business Contact'} • {dateStr}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {Math.round(scan.ocrConfidence * 100)}% Match
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => setSelectedScanForOcr(scan)}
                    className="text-slate-500 hover:text-blue-600 text-[11px] font-medium flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Inspect Raw OCR Text</span>
                  </button>

                  {matchedContact && (
                    <button
                      onClick={() => onSelectContact(matchedContact)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>Open Contact</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Raw OCR Inspection Modal */}
      {selectedScanForOcr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800">Raw OCR Extracted Text</h3>
              <button
                onClick={() => setSelectedScanForOcr(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-3 p-3 bg-slate-950 text-slate-300 font-mono text-[11px] whitespace-pre-wrap rounded-xl overflow-y-auto flex-1">
              {selectedScanForOcr.rawOcrText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

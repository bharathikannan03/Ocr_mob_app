import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Database, Code, Smartphone, CheckCircle, Copy, Terminal, Shield } from 'lucide-react';

interface ArchitectureViewerProps {
  onBack: () => void;
}

export const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'api' | 'flutter'>('architecture');
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Architecture & System Design
            </h2>
            <p className="text-[10px] text-slate-400">Section 1–44 Full Technical Blueprint</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/80 px-2 text-xs">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1 px-3 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'architecture'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>System Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('flutter')}
          className={`flex items-center gap-1 px-3 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'flutter'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Flutter Clean Arc</span>
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-1 px-3 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'database'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>PostgreSQL DDL</span>
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1 px-3 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'api'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>REST API</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4 text-xs">
        {activeTab === 'architecture' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-bold text-white text-sm mb-1">Architecture Flow</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                Production architecture isolating Flutter presentation from PostgreSQL database through Node.js Express REST services and intelligent multi-tier OCR parsing.
              </p>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre">
{`Camera Frame (3.5" x 2")
       ↓
Edge Detection / Preprocessing
       ↓
On-Device OCR (ML Kit Abstraction)
       ↓
Tier 1: Regex Deterministic Parser (Email, Phone, Web, LinkedIn)
       ↓
Tier 2: Gemini 3.8 Flash Entity Boundary Resolution
       ↓
Interactive Review & Validation Screen
       ↓
Duplicate Detection Engine
       ↓
Node.js Express Backend (/api/contacts)
       ↓
PostgreSQL Isolated Tenant Store (UUIDs)`}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h4 className="font-bold text-white">Non-Negotiable Rules Enforced:</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Flutter never connects directly to PostgreSQL.</li>
                <li>No automated saving without explicit user review & confirmation.</li>
                <li>Raw OCR text is always preserved for audit & debug.</li>
                <li>OCR and AI engines are decoupled behind abstract interfaces.</li>
                <li>Full user-level data isolation via authenticated tokens.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'flutter' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-bold text-white text-sm mb-1">Flutter Mobile Codebase Tree</h3>
              <p className="text-slate-300 mb-3">
                Clean Architecture organized by feature with Riverpod state management and GoRouter:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
{`flutter_app/
├── lib/
│   ├── core/
│   │   ├── constants/ (endpoints, regexes)
│   │   ├── network/ (Dio client, interceptors)
│   │   ├── storage/ (FlutterSecureStorage)
│   │   └── theme/ (Material 3 light/dark)
│   ├── features/
│   │   ├── auth/ (domain, data, presentation)
│   │   ├── scanning/
│   │   │   ├── domain/ (OcrService, ContactExtractionService)
│   │   │   ├── data/ (MLKitOcrServiceImpl, GeminiAiExtractor)
│   │   │   └── presentation/ (CameraScanScreen, ReviewEditScreen)
│   │   ├── contacts/ (domain, data, presentation)
│   │   └── home/ (DashboardScreen)
│   ├── shared/ (widgets, models)
│   └── main.dart (Riverpod ProviderScope, GoRouter)
├── android/ (AndroidManifest.xml, Camera & Contact permissions)
└── ios/ (Info.plist, NSCameraUsageDescription, NSContactsUsageDescription)`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-sm">PostgreSQL Production DDL</h3>
                <button
                  onClick={() =>
                    copyCode(`CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  designation VARCHAR(150),
  company VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  linkedin VARCHAR(255),
  notes TEXT,
  source VARCHAR(20) DEFAULT 'scanned',
  raw_ocr_text TEXT,
  image_url TEXT,
  ocr_confidence NUMERIC(4, 2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);`)
                  }
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-slate-200 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg font-mono text-[10px] text-amber-300 overflow-x-auto whitespace-pre">
{`CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  designation VARCHAR(150),
  company VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  linkedin VARCHAR(255),
  notes TEXT,
  source VARCHAR(20) DEFAULT 'scanned',
  raw_ocr_text TEXT,
  image_url TEXT,
  ocr_confidence NUMERIC(4, 2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- Partial index for fast duplicate checks:
CREATE INDEX idx_contacts_user_email ON contacts(user_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_user_phone ON contacts(user_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_company_name ON contacts(user_id, LOWER(company), LOWER(name)) WHERE deleted_at IS NULL;`}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-white text-sm">Active REST Endpoints in Server</h3>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/ocr/extract</span>
                  <span className="text-slate-500 text-[10px]">Gemini 3.8 + OCR</span>
                </div>
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/contacts/check-duplicate</span>
                  <span className="text-slate-500 text-[10px]">Deduplication</span>
                </div>
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-blue-400 font-bold">GET</span>
                  <span className="text-slate-300">/api/contacts</span>
                  <span className="text-slate-500 text-[10px]">Search & Filter</span>
                </div>
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/contacts</span>
                  <span className="text-slate-500 text-[10px]">Save Reviewed</span>
                </div>
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-amber-400 font-bold">PUT</span>
                  <span className="text-slate-300">/api/contacts/:id</span>
                  <span className="text-slate-500 text-[10px]">Update Contact</span>
                </div>
                <div className="p-2 rounded bg-slate-950 flex items-center justify-between">
                  <span className="text-rose-400 font-bold">DELETE</span>
                  <span className="text-slate-300">/api/contacts/:id</span>
                  <span className="text-slate-500 text-[10px]">Soft Delete</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

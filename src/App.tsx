import React, { useState, useEffect } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { HomeScreen } from './components/HomeScreen';
import { CameraScanScreen } from './components/CameraScanScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ReviewEditScreen } from './components/ReviewEditScreen';
import { DuplicateModal } from './components/DuplicateModal';
import { ContactListScreen } from './components/ContactListScreen';
import { ContactDetailScreen } from './components/ContactDetailScreen';
import { EditContactModal } from './components/EditContactModal';
import { ScanHistoryScreen } from './components/ScanHistoryScreen';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { Contact, ExtractedContact, FieldConfidences, ScanLog } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'scan' | 'contacts' | 'history' | 'specs'>('home');
  const [scanFlowState, setScanFlowState] = useState<'idle' | 'processing' | 'review'>('idle');

  // Contact & Scan State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Active Scan Capture State
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [capturedRawText, setCapturedRawText] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedContact | null>(null);
  const [fieldConfidences, setFieldConfidences] = useState<FieldConfidences>({});

  // Duplicate Check Modal State
  const [duplicateMatch, setDuplicateMatch] = useState<{
    existingContact: Contact;
    incomingContact: ExtractedContact;
    matchType: string;
  } | null>(null);

  // Load initial contacts and scans from backend
  const loadData = async () => {
    try {
      const [contactsRes, scansRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/scans'),
      ]);
      const contactsJson = await contactsRes.json();
      const scansJson = await scansRes.json();

      if (contactsJson.success) setContacts(contactsJson.data.contacts);
      if (scansJson.success) setScans(scansJson.data.scans);
    } catch (err) {
      console.warn('Backend load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Card Shutter Capture
  const handleCardCapture = async (imageData: string, rawText?: string) => {
    setCapturedImageData(imageData);
    setScanFlowState('processing');

    try {
      // Call backend Gemini 3.8 OCR / Parser
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData,
          rawText: rawText || '',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExtractedData(json.data.extracted);
        setFieldConfidences(json.data.fieldConfidences || {});
        setCapturedRawText(json.data.rawOcrText || rawText || '');
      } else {
        throw new Error(json.error?.message || 'Extraction failed');
      }
    } catch (err) {
      console.warn('Extraction fallback:', err);
      // Fallback extracted contact
      setExtractedData({
        name: 'Scanned Contact',
        designation: '',
        company: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        linkedin: '',
        notes: '',
      });
      setCapturedRawText(rawText || '');
    }
  };

  // Processing animation finishes -> transition to Review Screen
  const handleProcessingFinished = () => {
    setScanFlowState('review');
  };

  // Review Screen: Save Trigger with Duplicate Check
  const handleReviewSave = async (contactData: ExtractedContact) => {
    try {
      // 1. Perform duplicate check
      const dupRes = await fetch('/api/contacts/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          name: contactData.name,
        }),
      });

      const dupJson = await dupRes.json();
      if (dupJson.success && dupJson.data.isDuplicate) {
        // Trigger Duplicate Confirmation Modal
        setDuplicateMatch({
          existingContact: dupJson.data.existingContact,
          incomingContact: contactData,
          matchType: dupJson.data.matchType,
        });
        return;
      }

      // 2. No duplicate found, proceed to save
      await saveContactToBackend(contactData);
    } catch (err) {
      console.error('Error during save check:', err);
      await saveContactToBackend(contactData);
    }
  };

  const saveContactToBackend = async (contactData: ExtractedContact) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          source: 'scanned',
          rawOcrText: capturedRawText,
          imageUrl: capturedImageData,
          ocrConfidence: 0.95,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await loadData();
        setDuplicateMatch(null);
        setScanFlowState('idle');
        setSelectedContact(json.data.contact);
        setCurrentTab('contacts');
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  // Edit existing contact
  const handleUpdateContact = async (updated: Contact) => {
    try {
      const res = await fetch(`/api/contacts/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setSelectedContact(json.data.contact);
        setEditingContact(null);
      }
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setSelectedContact(null);
      }
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  return (
    <DeviceFrame
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        if (tab === 'scan') {
          setScanFlowState('idle');
        }
      }}
    >
      {/* Tab: Specs / Architecture */}
      {currentTab === 'specs' ? (
        <ArchitectureViewer onBack={() => setCurrentTab('home')} />
      ) : currentTab === 'history' ? (
        /* Tab: Scan History */
        <ScanHistoryScreen
          scans={scans}
          contacts={contacts}
          onSelectContact={(c) => {
            setSelectedContact(c);
            setCurrentTab('contacts');
          }}
          onNewScan={() => {
            setScanFlowState('idle');
            setCurrentTab('scan');
          }}
          onBack={() => setCurrentTab('home')}
        />
      ) : currentTab === 'contacts' ? (
        /* Tab: Contacts Directory or Contact Details */
        selectedContact ? (
          <ContactDetailScreen
            contact={selectedContact}
            onBack={() => setSelectedContact(null)}
            onEdit={(c) => setEditingContact(c)}
            onDelete={handleDeleteContact}
          />
        ) : (
          <ContactListScreen
            contacts={contacts}
            onSelectContact={(c) => setSelectedContact(c)}
            onNewScan={() => {
              setScanFlowState('idle');
              setCurrentTab('scan');
            }}
          />
        )
      ) : currentTab === 'scan' ? (
        /* Tab: Scan Workflow (Camera -> Processing -> Review) */
        scanFlowState === 'idle' ? (
          <CameraScanScreen
            onCapture={handleCardCapture}
            onCancel={() => setCurrentTab('home')}
          />
        ) : scanFlowState === 'processing' ? (
          <ProcessingScreen
            cardPreview={capturedImageData || undefined}
            onFinished={handleProcessingFinished}
          />
        ) : scanFlowState === 'review' && extractedData ? (
          <ReviewEditScreen
            initialContact={extractedData}
            fieldConfidences={fieldConfidences}
            rawOcrText={capturedRawText}
            cardImage={capturedImageData || undefined}
            onSave={handleReviewSave}
            onRetake={() => setScanFlowState('idle')}
            onDiscard={() => {
              setScanFlowState('idle');
              setCurrentTab('home');
            }}
          />
        ) : null
      ) : (
        /* Tab: Home Dashboard */
        <HomeScreen
          contacts={contacts}
          scans={scans}
          onStartScan={() => {
            setScanFlowState('idle');
            setCurrentTab('scan');
          }}
          onSelectContact={(c) => {
            setSelectedContact(c);
            setCurrentTab('contacts');
          }}
          onViewAllContacts={() => {
            setSelectedContact(null);
            setCurrentTab('contacts');
          }}
          onViewHistory={() => setCurrentTab('history')}
          onOpenArchitecture={() => setCurrentTab('specs')}
        />
      )}

      {/* Duplicate Alert Modal */}
      {duplicateMatch && (
        <DuplicateModal
          existingContact={duplicateMatch.existingContact}
          incomingContact={duplicateMatch.incomingContact}
          matchType={duplicateMatch.matchType}
          onViewExisting={() => {
            const match = duplicateMatch.existingContact;
            setDuplicateMatch(null);
            setScanFlowState('idle');
            setSelectedContact(match);
            setCurrentTab('contacts');
          }}
          onSaveAnyway={() => {
            saveContactToBackend(duplicateMatch.incomingContact);
          }}
          onCancel={() => setDuplicateMatch(null)}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onSave={handleUpdateContact}
          onClose={() => setEditingContact(null)}
        />
      )}
    </DeviceFrame>
  );
}

import React, { useState, useEffect } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { CameraScanScreen } from './components/CameraScanScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ReviewEditScreen } from './components/ReviewEditScreen';
import { DuplicateModal } from './components/DuplicateModal';
import { ContactListScreen } from './components/ContactListScreen';
import { ContactDetailScreen } from './components/ContactDetailScreen';
import { EditContactModal } from './components/EditContactModal';
import { ManualAddContactModal } from './components/ManualAddContactModal';
import { ScanHistoryScreen } from './components/ScanHistoryScreen';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { Contact, ExtractedContact, FieldConfidences, ScanLog, User } from './types';

export default function App() {
  // Navigation & User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<'home' | 'scan' | 'contacts' | 'history' | 'specs'>('home');
  const [scanFlowState, setScanFlowState] = useState<'idle' | 'processing' | 'review'>('idle');
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);

  // Contact & Scan State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

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

  // Load contacts and scans from backend with active auth token
  const loadData = async (token?: string) => {
    const activeToken = token || authToken;
    if (!activeToken) return;
    try {
      const [contactsRes, scansRes] = await Promise.all([
        fetch('/api/contacts', {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch('/api/scans', {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
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
    if (authToken) {
      loadData(authToken);
    }
  }, [authToken]);

  // Auth Handler
  const handleAuthSuccess = (token: string, user: User) => {
    setAuthToken(token);
    setCurrentUser(user);
    loadData(token);
    setCurrentTab('home');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setContacts([]);
    setScans([]);
    setSelectedContact(null);
  };

  // Handle Card Shutter Capture
  const handleCardCapture = async (imageData: string, rawText?: string) => {
    setCapturedImageData(imageData);
    setIsExtractionComplete(false);
    setScanFlowState('processing');

    try {
      // Call backend Gemini 3.8 OCR / Parser
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
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
      setExtractedData({
        name: '',
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
    } finally {
      setIsExtractionComplete(true);
    }
  };

  // Processing animation finishes -> transition to Review Screen
  const handleProcessingFinished = () => {
    setScanFlowState('review');
  };

  // Review Screen: Save Trigger with Duplicate Check
  const handleReviewSave = async (contactData: ExtractedContact) => {
    try {
      // 1. Duplicate check
      const dupRes = await fetch('/api/contacts/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          name: contactData.name,
        }),
      });

      const dupJson = await dupRes.json();
      if (dupJson.success && dupJson.data.isDuplicate) {
        setDuplicateMatch({
          existingContact: dupJson.data.existingContact,
          incomingContact: contactData,
          matchType: dupJson.data.matchType,
        });
        return;
      }

      // 2. Save
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
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

  // Manual Contact Add
  const handleManualContactSave = async (
    contactData: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(contactData),
      });
      const json = await res.json();
      if (json.success) {
        await loadData();
        setIsManualAddOpen(false);
        setSelectedContact(json.data.contact);
        setCurrentTab('contacts');
      }
    } catch (err) {
      console.error('Failed to save manual contact:', err);
    }
  };

  // Edit contact
  const handleUpdateContact = async (updated: Contact) => {
    try {
      const res = await fetch(`/api/contacts/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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

  // If user is not logged in, show AuthScreen
  if (!currentUser || !authToken) {
    return (
      <DeviceFrame
        currentTab="home"
        onTabChange={() => {}}
      >
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </DeviceFrame>
    );
  }

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
            onManualAdd={() => setIsManualAddOpen(true)}
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
            isExtractionComplete={isExtractionComplete}
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
          userName={currentUser.name}
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
          onLogout={handleLogout}
          onManualAdd={() => setIsManualAddOpen(true)}
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

      {/* Manual Add Contact Modal */}
      {isManualAddOpen && (
        <ManualAddContactModal
          onSave={handleManualContactSave}
          onClose={() => setIsManualAddOpen(false)}
        />
      )}
    </DeviceFrame>
  );
}

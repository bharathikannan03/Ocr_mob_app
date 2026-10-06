export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  designation: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  linkedin: string;
  notes: string;
  source: 'scanned' | 'manual' | 'imported';
  rawOcrText: string;
  imageUrl?: string;
  ocrConfidence: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ExtractedContact {
  name: string;
  designation: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  linkedin: string;
  notes: string;
}

export interface FieldConfidences {
  name?: number;
  designation?: number;
  company?: number;
  email?: number;
  phone?: number;
  website?: number;
  address?: number;
}

export interface ScanLog {
  id: string;
  userId: string;
  contactId?: string;
  contactName?: string;
  companyName?: string;
  rawOcrText: string;
  imageUrl?: string;
  ocrConfidence: number;
  createdAt: string;
}

export interface SampleCard {
  id: string;
  name: string;
  company: string;
  role: string;
  previewUrl: string;
  rawText: string;
  tag: string;
}

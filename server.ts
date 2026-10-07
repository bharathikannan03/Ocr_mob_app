import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Local project directory storage for visiting card images
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'cards');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------------------------------------------------
// Gemini AI Initialization
// -------------------------------------------------------------
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// -------------------------------------------------------------
// In-Memory PostgreSQL-Compatible Storage
// -------------------------------------------------------------
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
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

interface ScanLog {
  id: string;
  userId: string;
  contactId?: string;
  rawOcrText: string;
  imageUrl?: string;
  ocrConfidence: number;
  contactName?: string;
  companyName?: string;
  createdAt: string;
}

const mockPasswordHash = (pwd: string) => crypto.createHash('sha256').update(pwd).digest('hex');

const users: Map<string, User> = new Map();
const contacts: Map<string, Contact> = new Map();
const scanLogs: ScanLog[] = [];

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication is required' } });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication is required' } });
  }

  // Token is a user ID in the current local-auth implementation.
  const foundUser = users.get(token);
  if (!foundUser) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }

  (req as any).user = foundUser;
  next();
};

// -------------------------------------------------------------
// Deterministic Rule-Based Contact Extractor (Fallback & Pre-Parser)
// -------------------------------------------------------------
function deterministicExtract(rawText: string) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  
  // Email regex
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : '';

  // Phone regex (support +, brackets, dashes, spaces)
  const phoneRegex = /(?:(?:\+|00)\d{1,4}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,6}/;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Website regex
  const urlRegex = /(https?:\/\/[^\s]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i;
  const urlMatch = rawText.match(urlRegex);
  let website = urlMatch ? urlMatch[0] : '';
  if (website && !website.startsWith('http')) {
    website = `https://${website}`;
  }

  // LinkedIn regex
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/i;
  const linkedinMatch = rawText.match(linkedinRegex);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

  // Filter out lines that were matched as email, phone, or website to find Name, Company, Designation
  const remainingLines = lines.filter((line) => {
    if (email && line.includes(email)) return false;
    if (phone && line.includes(phone)) return false;
    if (website && line.includes(website.replace('https://', ''))) return false;
    if (linkedin && line.includes(linkedin)) return false;
    return true;
  });

  const name = remainingLines[0] || 'Unknown Name';
  const designation = remainingLines[1] || '';
  const company = remainingLines[2] || '';
  const address = remainingLines.slice(3).join(', ') || '';

  return {
    name,
    designation,
    company,
    email,
    phone,
    website,
    address,
    city: '',
    state: '',
    country: '',
    linkedin,
    confidence: {
      name: name ? 0.88 : 0.4,
      designation: designation ? 0.82 : 0.4,
      company: company ? 0.85 : 0.4,
      email: email ? 0.99 : 0.3,
      phone: phone ? 0.97 : 0.3,
      website: website ? 0.95 : 0.3,
      address: address ? 0.75 : 0.3,
    },
  };
}

// -------------------------------------------------------------
// Authentication Routes
// -------------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' },
    });
  }

  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    passwordHash: mockPasswordHash(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.set(newUser.id, newUser);

  res.status(201).json({
    success: true,
    data: {
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      accessToken: newUser.id,
      refreshToken: `refresh-${newUser.id}`,
    },
    message: 'User registered successfully',
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email and password required' },
    });
  }

  let foundUser: User | undefined;
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser || foundUser.passwordHash !== mockPasswordHash(password)) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Invalid email or password' },
    });
  }

  res.json({
    success: true,
    data: {
      user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
      accessToken: foundUser.id,
      refreshToken: `refresh-${foundUser.id}`,
    },
    message: 'Login successful',
  });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email },
    },
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email address is required' },
    });
  }

  // Simulated password reset token
  const resetToken = `reset-${Date.now()}`;
  res.json({
    success: true,
    message: 'Password reset link sent to registered email address',
    data: { resetToken },
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and new password are required' },
    });
  }

  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      u.passwordHash = mockPasswordHash(newPassword);
      u.updatedAt = new Date().toISOString();
      return res.json({
        success: true,
        message: 'Password has been successfully reset',
      });
    }
  }

  res.status(404).json({
    success: false,
    error: { code: 'USER_NOT_FOUND', message: 'User account not found' },
  });
});

app.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'TOKEN_REQUIRED', message: 'Refresh token required' },
    });
  }
  const userId = refreshToken.replace('refresh-', '');
  const user = users.get(userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' },
    });
  }
  res.json({
    success: true,
    data: {
      accessToken: user.id,
      refreshToken: `refresh-${user.id}`,
    },
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// -------------------------------------------------------------
// OCR & AI Parsing Endpoint
// -------------------------------------------------------------
app.post('/api/ocr/extract', authMiddleware, async (req: Request, res: Response) => {
  const { rawText, imageBase64 } = req.body;

  if (!rawText && !imageBase64) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_INPUT', message: 'Either rawText or imageBase64 must be provided' },
    });
  }

  let rawOcrText = rawText || '';
  let extractedData: any = null;
  let fieldConfidences: Record<string, number> = {};

  try {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

    if (hasGeminiKey) {
      const parts: any[] = [];

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64,
          },
        });
        parts.push({
          text: `You are a high-precision business card OCR and information extraction engine.
Carefully read the visiting card image.
First, extract all raw text visible on the card line by line into "rawText".
Second, intelligently extract and categorize the fields:
- name: Full person's name
- designation: Job title or role
- company: Business, institution or organization name
- email: Valid email address
- phone: Primary telephone or mobile number with country code if visible
- website: Company or personal website URL (include https:// if possible)
- address: Street address / office location
- city: City or locality
- state: State, province, or prefecture
- country: Country
- linkedin: LinkedIn profile or company URL if present
- notes: Any extra services, slogans, or credentials
Also provide an estimated extraction confidence (0.0 to 1.0) for each field in "fieldConfidences".`,
        });
      } else {
        parts.push({
          text: `You are an intelligent contact information parser.
Given this raw OCR text extracted from a business/visiting card:
"""
${rawText}
"""
Extract the structured contact fields:
- name: Full person's name
- designation: Job title / designation
- company: Company or business name
- email: Primary email
- phone: Primary phone number with country code if available
- website: Website URL
- address: Full street address
- city: City
- state: State / Province
- country: Country
- linkedin: LinkedIn profile URL if mentioned
- notes: Tagline or key services
Also provide a confidence score (0.0 to 1.0) for each field in "fieldConfidences".`,
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rawText: { type: Type.STRING },
              name: { type: Type.STRING },
              designation: { type: Type.STRING },
              company: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              website: { type: Type.STRING },
              address: { type: Type.STRING },
              city: { type: Type.STRING },
              state: { type: Type.STRING },
              country: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              notes: { type: Type.STRING },
              fieldConfidences: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.NUMBER },
                  designation: { type: Type.NUMBER },
                  company: { type: Type.NUMBER },
                  email: { type: Type.NUMBER },
                  phone: { type: Type.NUMBER },
                  website: { type: Type.NUMBER },
                  address: { type: Type.NUMBER },
                },
              },
            },
            required: ['name', 'company'],
          },
        },
      });

      const parsedJson = JSON.parse(response.text || '{}');
      if (parsedJson.rawText) {
        rawOcrText = parsedJson.rawText;
      }
      extractedData = {
        name: parsedJson.name || '',
        designation: parsedJson.designation || '',
        company: parsedJson.company || '',
        email: parsedJson.email || '',
        phone: parsedJson.phone || '',
        website: parsedJson.website || '',
        address: parsedJson.address || '',
        city: parsedJson.city || '',
        state: parsedJson.state || '',
        country: parsedJson.country || '',
        linkedin: parsedJson.linkedin || '',
        notes: parsedJson.notes || '',
      };
      fieldConfidences = parsedJson.fieldConfidences || {
        name: 0.95,
        designation: 0.92,
        company: 0.96,
        email: 0.98,
        phone: 0.95,
        website: 0.94,
        address: 0.88,
      };
    }
  } catch (err: any) {
    console.warn('Gemini extraction fallback triggered:', err?.message);
  }

  // Fallback to deterministic regex extractor if Gemini was unavailable or fields missing
  if (!extractedData) {
    const fallback = deterministicExtract(rawOcrText);
    extractedData = {
      name: fallback.name,
      designation: fallback.designation,
      company: fallback.company,
      email: fallback.email,
      phone: fallback.phone,
      website: fallback.website,
      address: fallback.address,
      city: fallback.city,
      state: fallback.state,
      country: fallback.country,
      linkedin: fallback.linkedin,
      notes: '',
    };
    fieldConfidences = fallback.confidence;
  }

  return res.json({
    success: true,
    data: {
      extracted: extractedData,
      fieldConfidences,
      rawOcrText,
      ocrConfidence: 0.95,
    },
  });
});

// -------------------------------------------------------------
// Duplicate Detection Endpoint
// -------------------------------------------------------------
app.post('/api/contacts/check-duplicate', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { email, phone, company, name } = req.body;

  const userContacts = Array.from(contacts.values()).filter(
    (c) => c.userId === user.id && !c.deletedAt
  );

  const cleanPhone = (p: string) => (p || '').replace(/\D/g, '');
  const reqCleanPhone = cleanPhone(phone);

  let duplicate: Contact | null = null;
  let matchType = '';

  for (const c of userContacts) {
    // 1. Email check
    if (email && c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      duplicate = c;
      matchType = 'email';
      break;
    }
    // 2. Phone check
    if (reqCleanPhone && reqCleanPhone.length >= 7 && cleanPhone(c.phone) === reqCleanPhone) {
      duplicate = c;
      matchType = 'phone';
      break;
    }
    // 3. Name + Company match
    if (
      name &&
      company &&
      c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      c.company.trim().toLowerCase() === company.trim().toLowerCase()
    ) {
      duplicate = c;
      matchType = 'name_and_company';
      break;
    }
  }

  if (duplicate) {
    return res.json({
      success: true,
      data: {
        isDuplicate: true,
        matchType,
        existingContact: duplicate,
      },
    });
  }

  res.json({
    success: true,
    data: {
      isDuplicate: false,
    },
  });
});

// -------------------------------------------------------------
// Contacts CRUD Endpoints
// -------------------------------------------------------------
app.get('/api/contacts', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { q, source, sortBy = 'createdAt', order = 'desc' } = req.query;

  let list = Array.from(contacts.values()).filter(
    (c) => c.userId === user.id && !c.deletedAt
  );

  if (q && typeof q === 'string') {
    const query = q.toLowerCase().trim();
    list = list.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query) ||
      c.designation.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.city.toLowerCase().includes(query)
    );
  }

  if (source && source !== 'all') {
    list = list.filter((c) => c.source === source);
  }

  list.sort((a: any, b: any) => {
    let valA = a[sortBy as string] || '';
    let valB = b[sortBy as string] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (order === 'asc') {
      return valA > valB ? 1 : -1;
    }
    return valA < valB ? 1 : -1;
  });

  res.json({
    success: true,
    data: {
      contacts: list,
      total: list.length,
    },
  });
});

app.get('/api/contacts/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const contact = contacts.get(req.params.id);

  if (!contact || contact.userId !== user.id || contact.deletedAt) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Contact not found' },
    });
  }

  res.json({
    success: true,
    data: { contact },
  });
});

app.post('/api/contacts', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    name,
    designation = '',
    company = '',
    email = '',
    phone = '',
    website = '',
    address = '',
    city = '',
    state = '',
    country = '',
    linkedin = '',
    notes = '',
    source = 'scanned',
    rawOcrText = '',
    imageUrl = '',
    ocrConfidence = 0.95,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Contact name is required' },
    });
  }

  const id = `c-${Date.now()}`;
  const now = new Date().toISOString();

  // Save image to local project directory folder instead of cloud bucket
  let storedImageUrl = imageUrl;
  if (imageUrl && imageUrl.startsWith('data:image/')) {
    try {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const filename = `card-${id}.jpg`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      storedImageUrl = `/uploads/cards/${filename}`;
    } catch (err) {
      console.warn('Failed to save card image to local directory:', err);
    }
  }

  const newContact: Contact = {
    id,
    userId: user.id,
    name: name.trim(),
    designation: designation.trim(),
    company: company.trim(),
    email: email.trim(),
    phone: phone.trim(),
    website: website.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
    linkedin: linkedin.trim(),
    notes: notes.trim(),
    source,
    rawOcrText,
    imageUrl: storedImageUrl,
    ocrConfidence,
    createdAt: now,
    updatedAt: now,
  };

  contacts.set(id, newContact);

  // Add scan log
  if (source === 'scanned') {
    scanLogs.unshift({
      id: `scan-${Date.now()}`,
      userId: user.id,
      contactId: id,
      contactName: newContact.name,
      companyName: newContact.company,
      rawOcrText,
      imageUrl: storedImageUrl,
      ocrConfidence,
      createdAt: now,
    });
  }

  res.status(201).json({
    success: true,
    data: { contact: newContact },
    message: 'Contact created successfully',
  });
});

app.put('/api/contacts/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const existing = contacts.get(req.params.id);

  if (!existing || existing.userId !== user.id || existing.deletedAt) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Contact not found' },
    });
  }

  const updated: Contact = {
    ...existing,
    ...req.body,
    id: existing.id,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  contacts.set(existing.id, updated);

  res.json({
    success: true,
    data: { contact: updated },
    message: 'Contact updated successfully',
  });
});

app.delete('/api/contacts/:id', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const existing = contacts.get(req.params.id);

  if (!existing || existing.userId !== user.id || existing.deletedAt) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Contact not found' },
    });
  }

  // Soft delete per PostgreSQL schema
  existing.deletedAt = new Date().toISOString();
  contacts.set(existing.id, existing);

  res.json({
    success: true,
    message: 'Contact deleted successfully',
  });
});

// -------------------------------------------------------------
// Scan History & Dashboard Metrics
// -------------------------------------------------------------
app.get('/api/scans', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userScans = scanLogs.filter((s) => s.userId === user.id);
  res.json({
    success: true,
    data: { scans: userScans },
  });
});

app.get('/api/metrics', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userContacts = Array.from(contacts.values()).filter(
    (c) => c.userId === user.id && !c.deletedAt
  );

  const thisMonthScans = userContacts.filter((c) => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear() &&
      c.source === 'scanned'
    );
  }).length;

  res.json({
    success: true,
    data: {
      totalContacts: userContacts.length,
      scannedThisMonth: thisMonthScans,
      recentContacts: userContacts.slice(0, 5),
    },
  });
});

// -------------------------------------------------------------
// Mount Vite middlewares in development
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

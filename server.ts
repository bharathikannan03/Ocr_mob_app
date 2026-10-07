import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import pg from 'pg';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
dotenv.config({ path: '.env.development', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to .env before starting the server.');
}

const db = new pg.Pool({ connectionString: databaseUrl });

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
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// -------------------------------------------------------------
// PostgreSQL data models
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

const toIsoString = (value: Date | string) => new Date(value).toISOString();

const toUser = (row: any): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
});

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const geminiRequestTimeoutMs = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 20_000);

const toContact = (row: any): Contact => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  designation: row.designation || '',
  company: row.company || '',
  email: row.email || '',
  phone: row.phone || '',
  website: row.website || '',
  address: row.address || '',
  city: row.city || '',
  state: row.state || '',
  country: row.country || '',
  linkedin: row.linkedin || '',
  notes: row.notes || '',
  source: row.source,
  rawOcrText: row.raw_ocr_text || '',
  imageUrl: row.image_url || undefined,
  ocrConfidence: Number(row.ocr_confidence || 0),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at),
  deletedAt: row.deleted_at ? toIsoString(row.deleted_at) : null,
});

const toScanLog = (row: any): ScanLog => ({
  id: row.id,
  userId: row.user_id,
  contactId: row.contact_id || undefined,
  rawOcrText: row.raw_ocr_text,
  imageUrl: row.image_url || undefined,
  ocrConfidence: Number(row.ocr_confidence || 0),
  contactName: row.contact_name || undefined,
  companyName: row.company_name || undefined,
  createdAt: toIsoString(row.created_at),
});

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication is required' } });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication is required' } });
  }

  // Token is a user ID in the current local-auth implementation.
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [token]);
    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
    (req as any).user = toUser(result.rows[0]);
    next();
  } catch (error) {
    next(error);
  }
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
app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' },
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), email.trim().toLowerCase(), mockPasswordHash(password)],
    );
    const newUser = toUser(result.rows[0]);
    res.status(201).json({
      success: true,
      data: {
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
        accessToken: newUser.id,
        refreshToken: `refresh-${newUser.id}`,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }
    next(error);
  }
});

app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email and password required' },
    });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    const foundUser = result.rowCount ? toUser(result.rows[0]) : undefined;
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
  } catch (error) {
    next(error);
  }
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

app.post('/api/auth/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and new password are required' },
    });
  }

  try {
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2)',
      [mockPasswordHash(newPassword), email.trim()],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User account not found' } });
    }
    res.json({ success: true, message: 'Password has been successfully reset' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'TOKEN_REQUIRED', message: 'Refresh token required' },
    });
  }
  const userId = refreshToken.replace('refresh-', '');
  try {
    const result = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
    res.json({ success: true, data: { accessToken: userId, refreshToken: `refresh-${userId}` } });
  } catch (error) {
    next(error);
  }
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
    const hasGeminiKey = Boolean(ai && geminiApiKey !== 'MY_GEMINI_API_KEY');

    if (hasGeminiKey) {
      const parts: any[] = [];

      if (imageBase64) {
        const imageMatch = imageBase64.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([\s\S]+)$/i);
        if (!imageMatch) {
          throw new Error('Unsupported image format. Upload a JPEG, PNG, WEBP, or GIF image.');
        }
        const mimeType = imageMatch[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : imageMatch[1].toLowerCase();
        parts.push({
          inlineData: {
            mimeType,
            data: imageMatch[2],
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

      const models = [...new Set([
        process.env.AI_MODEL || 'gemini-3.8-flash',
        process.env.AI_FALLBACK_MODEL || 'gemini-3.5-flash-lite',
      ])];
      let response: any;
      let lastGeminiError: unknown;

      for (const model of models) {
        try {
          response = await withTimeout(ai!.models.generateContent({
        model,
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
          }), geminiRequestTimeoutMs);
          break;
        } catch (error: any) {
          lastGeminiError = error;
          console.warn(`Gemini model ${model} failed; trying the next configured model:`, error?.message);
        }
      }

      if (!response) throw lastGeminiError || new Error('All configured Gemini models failed.');

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
app.post('/api/contacts/check-duplicate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { email, phone, company, name } = req.body;
  try {
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const result = await db.query(
      `SELECT *,
        CASE
          WHEN $2 <> '' AND LOWER(email) = LOWER($2) THEN 'email'
          WHEN LENGTH($3) >= 7 AND REGEXP_REPLACE(phone, '\\D', '', 'g') = $3 THEN 'phone'
          WHEN $4 <> '' AND $5 <> '' AND LOWER(name) = LOWER($4) AND LOWER(company) = LOWER($5) THEN 'name_and_company'
        END AS match_type
       FROM contacts
       WHERE user_id = $1 AND deleted_at IS NULL
         AND (($2 <> '' AND LOWER(email) = LOWER($2))
           OR (LENGTH($3) >= 7 AND REGEXP_REPLACE(phone, '\\D', '', 'g') = $3)
           OR ($4 <> '' AND $5 <> '' AND LOWER(name) = LOWER($4) AND LOWER(company) = LOWER($5)))
       LIMIT 1`,
      [user.id, (email || '').trim(), phoneDigits, (name || '').trim(), (company || '').trim()],
    );
    if (result.rowCount) {
      return res.json({ success: true, data: { isDuplicate: true, matchType: result.rows[0].match_type, existingContact: toContact(result.rows[0]) } });
    }
    res.json({ success: true, data: { isDuplicate: false } });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Contacts CRUD Endpoints
// -------------------------------------------------------------
app.get('/api/contacts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { q, source, sortBy = 'createdAt', order = 'desc' } = req.query;
  const sortColumns: Record<string, string> = { name: 'name', company: 'company', createdAt: 'created_at', updatedAt: 'updated_at' };
  const sortColumn = sortColumns[String(sortBy)] || 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  const query = typeof q === 'string' ? q.trim() : '';
  try {
    const result = await db.query(
      `SELECT * FROM contacts
       WHERE user_id = $1 AND deleted_at IS NULL
         AND ($2 = '' OR CONCAT_WS(' ', name, company, designation, email, phone, city) ILIKE '%' || $2 || '%')
         AND ($3 = '' OR source = $3)
       ORDER BY ${sortColumn} ${sortOrder}`,
      [user.id, query, source && source !== 'all' ? source : ''],
    );
    const contacts = result.rows.map(toContact);
    res.json({ success: true, data: { contacts, total: contacts.length } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/contacts/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  try {
    const result = await db.query('SELECT * FROM contacts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [req.params.id, user.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    res.json({ success: true, data: { contact: toContact(result.rows[0]) } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

  // Save image to local project directory folder instead of cloud bucket
  let storedImageUrl = imageUrl;
  if (imageUrl && imageUrl.startsWith('data:image/')) {
    try {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const filename = `card-${Date.now()}.jpg`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      storedImageUrl = `/uploads/cards/${filename}`;
    } catch (err) {
      console.warn('Failed to save card image to local directory:', err);
    }
  }

  try {
    const result = await db.query(
      `INSERT INTO contacts (
        user_id, name, designation, company, email, phone, website, address, city, state,
        country, linkedin, notes, source, raw_ocr_text, image_url, ocr_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [user.id, name.trim(), designation.trim(), company.trim(), email.trim(), phone.trim(), website.trim(), address.trim(), city.trim(), state.trim(), country.trim(), linkedin.trim(), notes.trim(), source, rawOcrText, storedImageUrl || null, ocrConfidence],
    );
    const newContact = toContact(result.rows[0]);
    if (source === 'scanned') {
      await db.query(
        'INSERT INTO scan_logs (user_id, contact_id, raw_ocr_text, image_url, ocr_confidence) VALUES ($1, $2, $3, $4, $5)',
        [user.id, newContact.id, rawOcrText, storedImageUrl || null, ocrConfidence],
      );
    }
    res.status(201).json({ success: true, data: { contact: newContact }, message: 'Contact created successfully' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/contacts/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const fields = ['name', 'designation', 'company', 'email', 'phone', 'website', 'address', 'city', 'state', 'country', 'linkedin', 'notes', 'source', 'rawOcrText', 'imageUrl', 'ocrConfidence'];
  const columns: Record<string, string> = { rawOcrText: 'raw_ocr_text', imageUrl: 'image_url', ocrConfidence: 'ocr_confidence' };
  const updates = fields.filter((field) => field in req.body);
  if (!updates.length) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No contact fields supplied' } });
  const assignments = updates.map((field, index) => `${columns[field] || field} = $${index + 3}`);
  const values = updates.map((field) => typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]);
  try {
    const result = await db.query(
      `UPDATE contacts SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *`,
      [req.params.id, user.id, ...values],
    );
    if (!result.rowCount) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    res.json({ success: true, data: { contact: toContact(result.rows[0]) }, message: 'Contact updated successfully' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/contacts/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  try {
    const result = await db.query('UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [req.params.id, user.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Scan History & Dashboard Metrics
// -------------------------------------------------------------
app.get('/api/scans', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  try {
    const result = await db.query(
      `SELECT scan_logs.*, contacts.name AS contact_name, contacts.company AS company_name
       FROM scan_logs LEFT JOIN contacts ON contacts.id = scan_logs.contact_id
       WHERE scan_logs.user_id = $1 ORDER BY scan_logs.created_at DESC`,
      [user.id],
    );
    res.json({ success: true, data: { scans: result.rows.map(toScanLog) } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/metrics', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  try {
    const [summary, recent] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total_contacts, COUNT(*) FILTER (WHERE source = 'scanned' AND created_at >= date_trunc('month', CURRENT_TIMESTAMP))::int AS scanned_this_month FROM contacts WHERE user_id = $1 AND deleted_at IS NULL`, [user.id]),
      db.query('SELECT * FROM contacts WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 5', [user.id]),
    ]);
    res.json({ success: true, data: { totalContacts: summary.rows[0].total_contacts, scannedThisMonth: summary.rows[0].scanned_this_month, recentContacts: recent.rows.map(toContact) } });
  } catch (error) {
    next(error);
  }
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

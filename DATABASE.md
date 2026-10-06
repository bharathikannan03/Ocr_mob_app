# PostgreSQL Database Schema & Migrations

## 1. Entity Relationship Diagram

```
┌───────────────────────────┐
│           users           │
├───────────────────────────┤
│ id (UUID, PK)             │
│ name (VARCHAR 100)        │
│ email (VARCHAR 255, UQ)   │
│ password_hash (TEXT)      │
│ created_at (TIMESTAMPTZ)  │
│ updated_at (TIMESTAMPTZ)  │
└─────────────┬─────────────┘
              │ 1
              │
              │ N
┌─────────────▼─────────────┐          ┌───────────────────────────┐
│         contacts          │          │        scan_logs          │
├───────────────────────────┤          ├───────────────────────────┤
│ id (UUID, PK)             │          │ id (UUID, PK)             │
│ user_id (UUID, FK)        │◄─────────┤ user_id (UUID, FK)        │
│ name (VARCHAR 150)        │          │ contact_id (UUID, FK, opt)│
│ designation (VARCHAR 150) │          │ raw_ocr_text (TEXT)       │
│ company (VARCHAR 150)     │          │ image_url (TEXT)          │
│ email (VARCHAR 255)       │          │ ocr_confidence (NUMERIC)  │
│ phone (VARCHAR 50)        │          │ created_at (TIMESTAMPTZ)  │
│ website (VARCHAR 255)     │          └───────────────────────────┘
│ address (TEXT)            │
│ city (VARCHAR 100)        │
│ state (VARCHAR 100)       │
│ country (VARCHAR 100)     │
│ linkedin (VARCHAR 255)    │
│ notes (TEXT)              │
│ source (VARCHAR 20)       │  -- 'scanned' | 'manual' | 'imported'
│ raw_ocr_text (TEXT)       │
│ image_url (TEXT)          │
│ ocr_confidence (NUMERIC)  │
│ created_at (TIMESTAMPTZ)  │
│ updated_at (TIMESTAMPTZ)  │
│ deleted_at (TIMESTAMPTZ)  │  -- Soft deletion support
└───────────────────────────┘
```

## 2. PostgreSQL DDL Script

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Table: contacts
CREATE TABLE IF NOT EXISTS contacts (
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
  source VARCHAR(20) DEFAULT 'scanned' CHECK (source IN ('scanned', 'manual', 'imported', 'api')),
  raw_ocr_text TEXT,
  image_url TEXT,
  ocr_confidence NUMERIC(4, 2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- Indexes for performance & duplicate lookups
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_user_phone ON contacts(user_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_user_company_name ON contacts(user_id, LOWER(company), LOWER(name)) WHERE deleted_at IS NULL;

-- Table: scan_logs
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  raw_ocr_text TEXT NOT NULL,
  image_url TEXT,
  ocr_confidence NUMERIC(4, 2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
```

## 3. Duplicate Detection Logic

Duplicate candidate detection evaluates against active contacts (`deleted_at IS NULL`):
1. **Email Match**: Exact case-insensitive match on `email`.
2. **Phone Match**: Cleaned normalized digits match on `phone` (strip spaces, hyphens, parentheses).
3. **Company + Name Match**: Fuzzy or exact match on `LOWER(name)` AND `LOWER(company)`.

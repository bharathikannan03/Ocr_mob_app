# REST API Specification

Base URL: `/api`

## Authentication

### `POST /api/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "name": "Alex Developer",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "name": "Alex Developer", "email": "alex@example.com" },
      "accessToken": "jwt_token...",
      "refreshToken": "refresh_token..."
    },
    "message": "User registered successfully"
  }
  ```

### `POST /api/auth/login`
Authenticates existing user.
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "name": "Alex Developer", "email": "alex@example.com" },
      "accessToken": "jwt_token...",
      "refreshToken": "refresh_token..."
    }
  }
  ```

---

## Scanning & OCR Processing

### `POST /api/ocr/extract`
Performs OCR or processes uploaded visiting card image / raw OCR text. Runs Google Gemini 3.8 Flash parsing combined with deterministic regex extraction.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...", // Optional if rawText provided
    "rawText": "Raj Kumar\nSenior Software Engineer\nABC Technologies..." // Optional if image provided
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "extracted": {
        "name": "Raj Kumar",
        "designation": "Senior Software Engineer",
        "company": "ABC Technologies Pvt Ltd",
        "email": "raj@abc.com",
        "phone": "+91 9876543210",
        "website": "https://abc.com",
        "address": "Chennai, India",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "linkedin": "https://linkedin.com/in/rajkumar"
      },
      "fieldConfidences": {
        "name": 0.95,
        "designation": 0.92,
        "company": 0.96,
        "email": 0.99,
        "phone": 0.98,
        "website": 0.94,
        "address": 0.88
      },
      "rawOcrText": "Raj Kumar\nSenior Software Engineer...",
      "ocrConfidence": 0.94
    }
  }
  ```

---

## Contacts Management

### `GET /api/contacts`
Retrieves contacts for authenticated user with search, filter, and pagination.
- **Query Params**:
  - `q`: Search string (searches name, company, email, phone, designation)
  - `source`: 'scanned' | 'manual' | 'all'
  - `sortBy`: 'name' | 'created_at' | 'company'
  - `order`: 'asc' | 'desc'
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "contacts": [...],
      "total": 32,
      "page": 1,
      "totalPages": 2
    }
  }
  ```

### `POST /api/contacts/check-duplicate`
Checks whether a pending contact matches any existing contact.
- **Request Body**:
  ```json
  {
    "name": "Raj Kumar",
    "company": "ABC Technologies Pvt Ltd",
    "email": "raj@abc.com",
    "phone": "+91 9876543210"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "isDuplicate": true,
      "matchType": "email",
      "existingContact": { ... }
    }
  }
  ```

### `POST /api/contacts`
Creates and saves a reviewed contact.
- **Request Body**:
  ```json
  {
    "name": "Raj Kumar",
    "designation": "Senior Software Engineer",
    "company": "ABC Technologies Pvt Ltd",
    "email": "raj@abc.com",
    "phone": "+91 9876543210",
    "website": "https://abc.com",
    "address": "Chennai, India",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "linkedin": "https://linkedin.com/in/rajkumar",
    "notes": "Met at Tech Expo 2026",
    "source": "scanned",
    "rawOcrText": "Raj Kumar\nSenior...",
    "imageUrl": "data:image/jpeg;base64,...",
    "ocrConfidence": 0.94
  }
  ```
- **Response** (`201 Created`)

### `GET /api/contacts/:id`
### `PUT /api/contacts/:id`
### `DELETE /api/contacts/:id`
### `GET /api/scans` (Scan history)
### `GET /api/metrics` (Dashboard stats: total, monthly scanned, recent list)

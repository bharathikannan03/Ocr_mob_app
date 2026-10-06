# Architecture Specification

## 1. System Overview

CardScan AI is a mobile-first business card scanning and contact management solution. It integrates on-device card framing, OCR text extraction, intelligent parsing using a hybrid rule-based engine and Google Gemini AI, interactive contact review/edit with duplicate detection, and persistent backend storage.

```
┌────────────────────────────────────────────────────────┐
│                   Flutter Mobile App                   │
│           (Presentation, Domain, Data, Core)           │
│                                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ Camera & Guide │  │ Riverpod State │ │ GoRouter  │ │
│  │ Scanning Frame │  │ Management     │ │ Navigation│ │
│  └───────┬────────┘  └───────┬────────┘  └─────┬─────┘ │
└──────────┼───────────────────┼─────────────────┼───────┘
           │                   │                 │
           ▼                   ▼                 ▼
   ┌────────────────┐  ┌────────────────┐  ┌───────────┐
   │ ML Kit OCR /   │  │ Hybrid Contact │  │ Secure    │
   │ On-Device OCR  │  │ Regex Parser   │  │ Storage   │
   └───────┬────────┘  └───────┬────────┘  └───────────┘
           │                   │
           └─────────┬─────────┘
                     │ HTTPS REST API (Bearer JWT)
                     ▼
┌────────────────────────────────────────────────────────┐
│                  Node.js Express Backend               │
│                                                        │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ Auth & JWT     │  │ Contact Engine │  │ Gemini AI │ │
│  │ Controller     │  │ & Deduplication│  │ Parser    │ │
│  └───────┬────────┘  └───────┬────────┘  └─────┬─────┘ │
└──────────┼───────────────────┼─────────────────┼───────┘
           │                   │                 │
           ▼                   ▼                 ▼
   ┌────────────────┐  ┌────────────────┐  ┌───────────┐
   │ PostgreSQL DB  │  │ Object Storage │  │ Gemini    │
   │ (Users, Scans, │  │ (Card Images / │  │ 3.8 Flash │
   │ Contacts)      │  │ Secure URLs)   │  │ Service   │
   └────────────────┘  └────────────────┘  └───────────┘
```

## 2. Flutter Mobile Architecture (Clean Architecture)

```
lib/
├── core/
│   ├── constants/       # App constants, regex patterns, API endpoints
│   ├── errors/          # Failure & exception hierarchies
│   ├── network/         # Dio HTTP client, interceptors, token refresh
│   ├── storage/         # FlutterSecureStorage wrapper
│   ├── theme/           # Material 3 light/dark palette, typography
│   └── utils/           # Formatters, vCard exporter, share helpers
├── features/
│   ├── auth/
│   │   ├── data/        # AuthRemoteDataSource, AuthRepositoryImpl
│   │   ├── domain/      # UserModel, AuthState
│   │   └── presentation/# LoginScreen, RegisterScreen, ForgotPassword
│   ├── scanning/
│   │   ├── data/        # OcrServiceImpl, GeminiAiExtractionService
│   │   ├── domain/      # OcrResult, ExtractedContact, ScanHistoryItem
│   │   └── presentation/# CameraScanScreen, CardOverlayGuide, ReviewEditScreen
│   ├── contacts/
│   │   ├── data/        # ContactRepositoryImpl
│   │   ├── domain/      # ContactModel, DuplicateCheckResult
│   │   └── presentation/# ContactListScreen, ContactDetailScreen, EditContactScreen
│   └── home/
│       └── presentation/# DashboardScreen, MetricsCards, RecentScans
└── shared/
    ├── widgets/         # AppButton, AppTextField, CardBadge, ShimmerLoading
    └── models/          # ApiResponse<T>, Pagination
```

## 3. OCR & Parsing Abstraction Layer

- **`OcrService` Interface**:
  ```dart
  abstract class OcrService {
    Future<OcrResult> extractText(String imagePathOrBase64);
  }
  ```
- **`ContactExtractionService` Interface**:
  ```dart
  abstract class ContactExtractionService {
    Future<ExtractedContact> extractContact(String rawText, {String? imageBase64});
  }
  ```

### Two-Tier Parsing Pipeline:
1. **Tier 1: Deterministic Engine (Fast, Client/Local)**
   - Regex matching for emails (`RFC 5322`), international phone numbers (`E.164` / formatted), URLs (HTTP/HTTPS/www), LinkedIn profiles (`linkedin.com/in/*`), Twitter/X, GitHub.
2. **Tier 2: AI Parser (Context-Aware via Gemini 3.8 Flash)**
   - Resolves ambiguous entity boundaries (Name vs Company vs Designation, multi-line addresses, postal codes, state/country).
   - Generates confidence scores per field.
   - Enforces strict JSON Schema to guarantee type safety before UI presentation.

## 4. Security & Data Isolation
- JWT access tokens (15m expiration) + refresh tokens (7d).
- User data isolation strictly enforced on the server using `WHERE user_id = req.user.id`.
- Sanitized database queries with parameterized SQL to prevent SQL injection.
- Passwords hashed using bcrypt with salt rounds >= 10.
- No sensitive keys or unhashed credentials exposed to client bundles.

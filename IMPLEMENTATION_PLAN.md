# Implementation Plan

## Phase 1: Architecture, Core Contracts & Server API Setup
- [x] Step 1.1: System Inspection & Documentation (`ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`, `MOBILE_SCREENS.md`, `IMPLEMENTATION_PLAN.md`).
- [ ] Step 1.2: Node.js Express Backend (`server.ts`) with PostgreSQL-compatible schema, JWT auth, contact CRUD, duplicate detection engine, and Gemini 3.8 Flash AI parser for visiting cards.
- [ ] Step 1.3: Deterministic Regex Parser fallback for offline/instant entity extraction.

## Phase 2: Flutter Production Project Codebase (`/flutter_app`)
- [ ] Step 2.1: Complete Flutter project tree with Clean Architecture (Core, Shared, Features: Auth, Scanning, Contacts, Home).
- [ ] Step 2.2: Models, Repositories, Riverpod State Providers, GoRouter setup, Dio network client.
- [ ] Step 2.3: Native Android & iOS configuration files (`AndroidManifest.xml`, `Info.plist`, `pubspec.yaml`).

## Phase 3: High-Fidelity Mobile App Simulator & Interactive Web Client
- [ ] Step 3.1: Full responsive Material 3 mobile UI with device chrome switcher (iPhone 16 Pro / Google Pixel 9 / Fullscreen).
- [ ] Step 3.2: Interactive Camera Scanner with real webcam support, drag-and-drop image upload, and high-res sample visiting cards.
- [ ] Step 3.3: Processing pipeline with OCR visualizer and server-side Gemini 3.8 Flash extraction.
- [ ] Step 3.4: Review & Edit screen with field validations, confidence flags, retake, and duplicate detection modal.
- [ ] Step 3.5: Contact Directory with real-time multi-field search, filters, contact detail actions (Call, Email, Website, Map, LinkedIn, vCard export to phone).
- [ ] Step 3.6: Scan History log with raw OCR inspection.
- [ ] Step 3.7: In-app Flutter Project Codebase Inspector & Exporter.

## Phase 4: Verification, Lint & Build
- [ ] Step 4.1: Compile and verify Node/TypeScript code without errors.
- [ ] Step 4.2: Test complete user flow end-to-end: Register/Login -> Scan card -> Extract -> Review -> Duplicate Detection -> Save -> View in Directory -> Export vCard.

# Mobile UI Screens & Navigation Specification

## 1. Screen Architecture & Routes (GoRouter)

| Route | Screen Name | Description |
|---|---|---|
| `/splash` | SplashScreen | App initialization, session validation |
| `/login` | LoginScreen | Secure user login |
| `/register` | RegisterScreen | Account creation |
| `/home` | DashboardScreen | Metric cards, quick scan action, recent scans |
| `/scan` | CameraScanScreen | Live camera viewfinder, card positioning guide, capture |
| `/scan/preview` | PreviewCropScreen | Blur check, rotation, crop confirmation |
| `/scan/processing`| ProcessingScreen | Animated 4-step OCR & AI extraction indicator |
| `/scan/review` | ReviewEditScreen | Side-by-side card preview, editable fields, confidence highlights |
| `/contacts` | ContactListScreen | Search, filter chips, alphabet grouping, swipe actions |
| `/contacts/:id`| ContactDetailScreen | Avatar, full details, dial/email/website/LinkedIn buttons, vCard export |
| `/contacts/:id/edit`| EditContactScreen| Modify saved contact record |
| `/history` | ScanHistoryScreen | Chronological scan archive, raw OCR viewer |

## 2. Key Screen UX Guidelines

### A. CameraScanScreen
- Visiting card aspect ratio guide (3.5" x 2.0" ~ 1.75 ratio) with rounded guide corners.
- Live edge illumination guidance: "Align card within borders".
- Flash/torch toggle, camera flip (back/front), gallery image upload button.
- Sample visiting cards quick selector (for testing/demo across diverse industries: Tech, Finance, Medical, Design).

### B. ReviewEditScreen
- Top banner: "AI & OCR Extraction Complete. Please review and verify below."
- Collapsible original card preview drawer.
- Low-confidence badge indicator (e.g. orange outline when confidence < 0.85).
- Field validations:
  - Email regex: standard RFC email pattern.
  - Phone validation: cleans country codes, flags irregular lengths.
  - Website & LinkedIn: prepends `https://` if omitted.
- Actions:
  - "Save Contact" (triggers duplicate check modal if match detected).
  - "Retake Scan" (returns to camera).
  - "Discard" (confirms discard dialog).

### C. Duplicate Detection Modal
- Alert card with matched fields highlighted (e.g. "Duplicate found by Email: raj@abc.com").
- Shows comparison between existing contact and incoming scanned contact.
- Dual options:
  - `[View Existing]` -> navigates to existing contact details.
  - `[Save Anyway]` -> saves as a new distinct contact.

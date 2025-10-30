# Upload Section Firebase Migration Note

## Critical Limitation

The UploadSection component currently relies on Supabase Edge Functions for:
1. **extract-invoice-data** - AI-powered OCR and data extraction from invoice images
2. **categorize-invoice** - AI categorization of invoices

**Firebase Alternative Options:**

### Option 1: Client-Side Processing (Currently Implemented)
- Keep Tesseract.js for OCR (already in dependencies)
- Manual extraction logic
- No AI categorization

### Option 2: Firebase Functions (Requires Setup)
- Create Firebase Cloud Functions
- Implement similar AI extraction logic
- Requires Firebase Blaze plan
- Additional configuration needed

### Option 3: Direct API Calls (Requires API Keys)
- Call AI APIs directly from client
- Expose API keys (security risk)
- Not recommended

## Current Implementation Status

The UploadSection has been **partially converted** to work without AI features. Manual upload works but AI extraction is disabled until you choose an implementation option above.

To fully enable AI features with Firebase, you would need to:
1. Set up Firebase Cloud Functions
2. Implement the extraction logic
3. Configure billing (Blaze plan required for external API calls)
4. Deploy the functions

## File Storage

Firebase Storage replaces Supabase Storage:
- Path: `invoice-documents/{userId}/{filename}`
- Security rules configured in FIREBASE_MIGRATION_GUIDE.md

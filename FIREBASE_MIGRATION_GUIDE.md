# Firebase Migration Guide

## Overview
This project has been migrated from Supabase to Firebase.

## Firebase Console Setup Required

### 1. Enable Authentication
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `todo-app-cp-d3000`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider

### 2. Create Firestore Database
1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** or **Test mode** (for development)
4. Select a region closest to your users

### 3. Set Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/user_roles/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Profiles
    match /profiles/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow update: if isOwner(userId);
      allow create: if isOwner(userId);
    }
    
    // Invoices
    match /invoices/{invoiceId} {
      allow read: if isOwner(resource.data.user_id) || isAdmin();
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update: if (isOwner(resource.data.user_id) && resource.data.status == 'pending') || isAdmin();
    }
    
    // Invoice Categories
    match /invoice_categories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Reminders
    match /reminders/{reminderId} {
      allow read: if isOwner(resource.data.user_id) || isAdmin();
      allow create: if isAuthenticated() && isOwner(request.resource.data.user_id);
      allow update: if isAdmin();
    }
    
    // User Roles
    match /user_roles/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

### 4. Set up Storage
1. Navigate to **Storage**
2. Click **Get started**
3. Set up storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /invoice-documents/{userId}/{allPaths=**} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         exists(/databases/$(database)/documents/user_roles/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == 'admin');
      
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Initialize Collections
You'll need to manually create initial data in Firestore:

#### Invoice Categories
Create documents in `invoice_categories` collection:
- Document ID: Auto-generate
- Fields:
  - name: "Office Supplies"
  - color: "#3b82f6"
  - icon: "package"
  - created_at: Current timestamp

Repeat for other categories: Travel, Software, Marketing, Legal, Utilities, Equipment, Other

### 6. Set Admin User
After a user signs up, manually add their role:
1. Go to Firestore
2. Create document in `user_roles` collection:
   - Document ID: Use the user's UID from Authentication
   - Fields:
     - role: "admin"
     - created_at: Current timestamp

## Data Migration from Supabase

If you have existing data in Supabase:

1. Export data using the provided `export-data.sql` queries
2. Convert the SQL results to JSON
3. Import to Firestore using Firebase Admin SDK or manually through console

## Edge Functions Replacement

The following Supabase Edge Functions need alternative implementations:

### 1. categorize-invoice
- **Purpose**: AI-powered invoice categorization
- **Solution**: Implement as client-side call to AI API or use Firebase Functions

### 2. extract-invoice-data
- **Purpose**: OCR and data extraction from invoice images
- **Solution**: Use client-side Tesseract.js (already in dependencies) or Firebase Functions

### 3. send-admin-reminder
- **Purpose**: Email notifications to admins
- **Solution**: Implement using Firebase Functions with SendGrid/Resend

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can upload invoices
- [ ] Admin can view all invoices
- [ ] Admin can approve/reject invoices
- [ ] Categories are visible to all users
- [ ] Reminders work correctly
- [ ] File uploads work
- [ ] Real-time updates function properly

## Notes

- Firebase uses subcollections and denormalization differently than SQL
- Real-time listeners replace Supabase's PostgreSQL change subscriptions
- Authentication tokens and session management work differently
- No RLS - security is enforced through Firestore Security Rules

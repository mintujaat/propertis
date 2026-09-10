# Nestora Properties & Rental

Two-page Firebase real-estate listing website:
- `index.html` = public/user side
- `admin.html` = admin panel
- Firebase Firestore stores listings, categories and settings.
- ImgBB handles image uploads.
- Property gallery auto-changes every 2 seconds and opens in a viewer.
- WhatsApp button generates a pre-filled message containing the full property details.

## Setup
1. Create/enable a Firebase Web App and Authentication > Email/Password.
2. Create one admin email/password in Firebase Authentication and use it on `admin.html`.
3. Create a Firestore database.
4. Publish the rules from `firestore.rules` (or deploy equivalent rules).
5. The supplied Firebase config and ImgBB API key are already in `firebase-config.js`.
6. Open/deploy the folder on any static host (Vercel/Netlify/GitHub Pages). ES module imports use Firebase CDN.

## First admin steps
Login -> add categories (Flats, PG, Rooms, Homes, Commercial etc.) -> set WhatsApp number -> add properties and upload images.

## Important
The ImgBB key is a client-side upload key. Firebase config web keys are normally public too. For a production setup, add stronger Firebase admin/role rules and preferably move image uploading behind a serverless function if you need the upload key hidden.

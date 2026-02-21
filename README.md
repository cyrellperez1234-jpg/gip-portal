# GIP Portal - Gmail Registration/Login + Dashboard

Simple Express app na may **Google (Gmail) registration/login**, persistent **SQLite database**, at protected **dashboard**.

## Features
- Login/Register via Gmail (Google OAuth 2.0)
- Auto-create or update user record sa SQLite database
- Protected dashboard (requires authenticated session)
- Logout flow

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env
   ```
3. Fill in Google OAuth credentials in `.env`.
4. Start app:
   ```bash
   npm start
   ```

## Google OAuth configuration
Sa Google Cloud Console:
- Create OAuth 2.0 Client ID (Web application)
- Authorized redirect URI:
  - `http://localhost:3000/auth/google/callback`

## Database
- File: `gip_portal.db`
- Table: `users`
  - `google_id` (unique)
  - `email` (unique)
  - `name`
  - `photo_url`
  - `created_at`

## Routes
- `/` landing/login page
- `/auth/google` start Google login
- `/auth/google/callback` OAuth callback
- `/dashboard` protected page
- `/logout` end session

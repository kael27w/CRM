# Environment Setup for Local Development

## Critical: Create .env File

To fix the infinite loading screen, you **MUST** create a `.env` file in the **root directory** (same level as `package.json`).

### Step 1: Create .env file

```bash
# Create the file in the root directory
touch .env
```

### Step 2: Add this content to .env

```bash
# Frontend API Configuration
VITE_API_BASE_URL=http://localhost:3002

# Supabase Configuration  
VITE_SUPABASE_URL=https://jsgdcnvoargsjozhzvso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ2RjbnZvYXJnc2pvemh6dnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5ODQ2NjEsImV4cCI6MjA1OTU2MDY2MX0.8fQeosEUTh7DGaVeGJkWH8l9jzRH5oXaNAJWuimHnV8
```

### Step 3: Restart Development Server

**CRITICAL:** After creating/modifying the `.env` file, you **MUST** restart the Vite development server:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd client
npm run dev
```

### Step 4: Verify Configuration

1. Open browser DevTools Console
2. Look for: `"API base URL: http://localhost:3002"`
3. Should see authentication debugging messages with emojis
4. Should see login page instead of infinite loading

### Troubleshooting

If still having issues:

1. **Check console for these messages:**
   - `🚀 AuthContext initializing...`
   - `📋 Initial session check:`
   - `👻 No user in session` (expected for first load)
   - `✅ Auth loading completed`

2. **Check Network tab:**
   - No requests to `crm-2lmw.onrender.com`
   - Supabase requests to `jsgdcnvoargsjozhzvso.supabase.co`

3. **Backend running:**
   - Make sure `npx tsx server/index.ts` is running on port 3002

## Why This Was Needed

The infinite loading was caused by:
1. Missing `.env` file meant `VITE_API_BASE_URL` was undefined
2. Some code was falling back to production URLs
3. Supabase profile fetches were hanging without proper timeout
4. AuthContext never finished loading

The fixes include:
- Proper environment variable setup
- Timeout on Supabase queries
- Better error handling in AuthContext
- Consistent localhost fallbacks throughout the codebase 
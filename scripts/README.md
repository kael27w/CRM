# Contact Status Fix Scripts

This directory contains scripts to fix contact status issues in the Supabase database.

## fix-contact-statuses.js

This script directly connects to the Supabase database and updates any contacts with NULL, undefined, or empty status values to have a default status of 'Lead'.

### Prerequisites

1. Node.js installed
2. Supabase project credentials

### Setup

1. Create a `.env` file in the root directory with the following variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

2. Install dependencies:
   ```
   npm install @supabase/supabase-js dotenv
   ```

### Running the Script

```
node scripts/fix-contact-statuses.js
```

This will:
1. Find all contacts with NULL, undefined, or empty status values
2. Log the contacts that will be updated
3. Update their status to 'Lead'
4. Log the updated contacts

## Alternative Scripts

- `fix-contact-statuses-api.js`: Uses the API endpoint to fix contact statuses
- `fix-contact-statuses-direct.js`: Another direct database connection approach
- `fix-contact-statuses.sql`: SQL query that can be run directly in the Supabase SQL editor
- `direct-db-fix.js`: General-purpose direct database connection utility
- `raw-sql-fix.js`: Uses raw SQL queries to fix contact statuses 
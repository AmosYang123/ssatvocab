# Supabase Database Setup Guide

Since this application uses Supabase for cloud synchronization and I cannot directly execute SQL commands on your remote Supabase instance, you need to manually set up the database schema.

## Step 1: Log in to Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Open your project (the one linked to your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

## Step 2: Open Logic / SQL Editor

1. In the left sidebar, click on the **SQL Editor** icon (it looks like a terminal `>_`).
2. Click **New Query** (or just use the scratchpad).

## Step 3: Run the Schema Script

1. Copy the **entire content** of the file `supabase_schema.sql` from your project folder.
   - You can find this file in the root directory: `c:\Users\Amos\Downloads\ssat-vocab-mastery (3)\supabase_schema.sql`
2. Paste the content into the Supabase SQL Editor.
3. Click the **Run** button (usually in the bottom right or top right).

## Step 4: Verify Setup

After running the script, your database will have the following tables:
- `profiles`
- `user_word_statuses`
- `user_marked_words`
- `user_study_sets`
- `user_preferences`

It also sets up Row Level Security (RLS) policies so users can only access their own data.

## Troubleshooting

- **"Relation already exists"**: If you see this, it means some tables already exist. The script uses `IF NOT EXISTS` so it should be safe to run multiple times, but check if you have old conflicting tables.
- **Permission errors**: Ensure you are running the query as a superuser or admin (default in the SQL Editor).

## Next Steps

Once the database is set up:
1. Reload your application (`http://localhost:3000`).
2. Try to Sign Up with a new account using the "Cloud Sync" toggle enabled (this requires an email).
3. If successful, your data will now be synced to the cloud!

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
export const isSupabaseConfigured = Boolean(envUrl && envKey);

// Create Supabase client (use placeholders if config missing to prevent crash)
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseKey = envKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Database types
export interface DbProfile {
    id: string;
    username: string;
    created_at: string;
}

export interface DbWordStatus {
    id: string;
    user_id: string;
    word_name: string;
    status: 'mastered' | 'review';
    updated_at: string;
}

export interface DbMarkedWord {
    id: string;
    user_id: string;
    word_name: string;
    marked: boolean;
}

export interface DbStudySet {
    id: string;
    user_id: string;
    name: string;
    word_names: string[];
    created_at: string;
}

export interface DbUserPreferences {
    user_id: string;
    theme: 'light' | 'dark' | 'system';
    updated_at: string;
}

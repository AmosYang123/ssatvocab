import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

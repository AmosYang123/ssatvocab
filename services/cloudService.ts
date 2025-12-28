/**
 * Cloud Database Service (Supabase)
 * 
 * This service handles all cloud database operations for user data.
 * It provides the same interface as the local authService for easy migration.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WordStatusMap, MarkedWordsMap, StudySet, ThemeMode } from '../types';

// ============================
// Types
// ============================
export interface CloudUserData {
    wordStatuses: WordStatusMap;
    markedWords: MarkedWordsMap;
    savedSets: StudySet[];
}

export interface CloudAuthResult {
    success: boolean;
    message: string;
    userId?: string;
    username?: string;
}

// ============================
// Cloud Database Service
// ============================
export const cloudService = {
    // ----------------
    // Configuration Check
    // ----------------
    isConfigured(): boolean {
        return isSupabaseConfigured;
    },

    // ----------------
    // Authentication
    // ----------------
    async register(email: string, password: string, username: string): Promise<CloudAuthResult> {
        if (!isSupabaseConfigured) {
            return { success: false, message: 'Cloud service not configured.' };
        }

        try {
            // Check if username is already taken
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username.toLowerCase())
                .single();

            if (existingProfile) {
                return { success: false, message: 'Username already taken.' };
            }

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username: username.toLowerCase() }
                }
            });

            if (authError) {
                return { success: false, message: authError.message };
            }

            if (!authData.user) {
                return { success: false, message: 'Registration failed.' };
            }

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    username: username.toLowerCase(),
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // User is created but profile failed - they can still log in
            }

            // Initialize preferences
            await supabase
                .from('user_preferences')
                .insert({
                    user_id: authData.user.id,
                    theme: 'system',
                });

            return {
                success: true,
                message: 'Account created successfully!',
                userId: authData.user.id,
                username: username.toLowerCase(),
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    },

    async login(email: string, password: string): Promise<CloudAuthResult> {
        if (!isSupabaseConfigured) {
            return { success: false, message: 'Cloud service not configured.' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (!data.user) {
                return { success: false, message: 'Login failed.' };
            }

            // Get username from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', data.user.id)
                .single();

            return {
                success: true,
                message: 'Login successful!',
                userId: data.user.id,
                username: profile?.username || data.user.email,
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    },

    async loginWithUsername(username: string, password: string): Promise<CloudAuthResult> {
        if (!isSupabaseConfigured) {
            return { success: false, message: 'Cloud service not configured.' };
        }

        try {
            // Look up email by username
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username.toLowerCase())
                .single();

            if (profileError || !profile) {
                return { success: false, message: 'Username not found.' };
            }

            // Get user email from auth (requires admin, so we'll use a different approach)
            // For now, we'll require email login or store email in profile
            return {
                success: false,
                message: 'Please use your email address to log in.'
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    },

    async logout(): Promise<void> {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    },

    async getCurrentUser(): Promise<{ id: string; username: string } | null> {
        if (!isSupabaseConfigured) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

        return {
            id: user.id,
            username: profile?.username || user.email || 'unknown',
        };
    },

    // ----------------
    // User Data Operations
    // ----------------
    async getUserData(userId: string): Promise<CloudUserData | null> {
        if (!isSupabaseConfigured) return null;

        try {
            // Fetch word statuses
            const { data: wordStatusRows } = await supabase
                .from('user_word_statuses')
                .select('word_name, status')
                .eq('user_id', userId);

            const wordStatuses: WordStatusMap = {};
            wordStatusRows?.forEach(row => {
                wordStatuses[row.word_name] = row.status;
            });

            // Fetch marked words
            const { data: markedRows } = await supabase
                .from('user_marked_words')
                .select('word_name, marked')
                .eq('user_id', userId);

            const markedWords: MarkedWordsMap = {};
            markedRows?.forEach(row => {
                markedWords[row.word_name] = row.marked;
            });

            // Fetch study sets
            const { data: setRows } = await supabase
                .from('user_study_sets')
                .select('id, name, word_names')
                .eq('user_id', userId);

            const savedSets: StudySet[] = (setRows || []).map(row => ({
                id: row.id,
                name: row.name,
                wordNames: row.word_names,
            }));

            return { wordStatuses, markedWords, savedSets };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },

    async saveUserData(userId: string, data: CloudUserData): Promise<boolean> {
        if (!isSupabaseConfigured) return false;

        try {
            // Upsert word statuses
            const wordStatusUpserts = Object.entries(data.wordStatuses)
                .filter(([_, status]) => status !== null)
                .map(([word_name, status]) => ({
                    user_id: userId,
                    word_name,
                    status,
                    updated_at: new Date().toISOString(),
                }));

            if (wordStatusUpserts.length > 0) {
                const { error: statusError } = await supabase
                    .from('user_word_statuses')
                    .upsert(wordStatusUpserts, { onConflict: 'user_id,word_name' });

                if (statusError) {
                    console.error('Error saving word statuses:', statusError);
                }
            }

            // Delete unmarked words (status = null)
            const nullStatusWords = Object.entries(data.wordStatuses)
                .filter(([_, status]) => status === null)
                .map(([word_name]) => word_name);

            if (nullStatusWords.length > 0) {
                await supabase
                    .from('user_word_statuses')
                    .delete()
                    .eq('user_id', userId)
                    .in('word_name', nullStatusWords);
            }

            // Upsert marked words
            const markedUpserts = Object.entries(data.markedWords)
                .map(([word_name, marked]) => ({
                    user_id: userId,
                    word_name,
                    marked,
                }));

            if (markedUpserts.length > 0) {
                const { error: markedError } = await supabase
                    .from('user_marked_words')
                    .upsert(markedUpserts, { onConflict: 'user_id,word_name' });

                if (markedError) {
                    console.error('Error saving marked words:', markedError);
                }
            }

            // Handle study sets - delete all and re-insert to handle updates/deletions
            await supabase
                .from('user_study_sets')
                .delete()
                .eq('user_id', userId);

            if (data.savedSets.length > 0) {
                const setInserts = data.savedSets.map(set => ({
                    id: set.id,
                    user_id: userId,
                    name: set.name,
                    word_names: set.wordNames,
                }));

                const { error: setsError } = await supabase
                    .from('user_study_sets')
                    .insert(setInserts);

                if (setsError) {
                    console.error('Error saving study sets:', setsError);
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },

    // ----------------
    // Preferences
    // ----------------
    async getPreferences(userId: string): Promise<{ theme: ThemeMode } | null> {
        if (!isSupabaseConfigured) return null;

        try {
            const { data } = await supabase
                .from('user_preferences')
                .select('theme')
                .eq('user_id', userId)
                .single();

            return data ? { theme: data.theme as ThemeMode } : null;
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return null;
        }
    },

    async savePreferences(userId: string, theme: ThemeMode): Promise<boolean> {
        if (!isSupabaseConfigured) return false;

        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    theme,
                    updated_at: new Date().toISOString(),
                });

            return !error;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    },

    // ----------------
    // Migration Helper
    // ----------------
    async migrateFromLocal(
        userId: string,
        localData: CloudUserData
    ): Promise<{ success: boolean; message: string }> {
        if (!isSupabaseConfigured) {
            return { success: false, message: 'Cloud service not configured.' };
        }

        try {
            const saved = await this.saveUserData(userId, localData);
            if (saved) {
                return {
                    success: true,
                    message: `Successfully migrated ${Object.keys(localData.wordStatuses).length} word statuses, ${Object.keys(localData.markedWords).length} marked words, and ${localData.savedSets.length} study sets.`
                };
            }
            return { success: false, message: 'Failed to save data to cloud.' };
        } catch (error) {
            console.error('Migration error:', error);
            return { success: false, message: 'Migration failed. Please try again.' };
        }
    },

    // ----------------
    // Real-time Subscription (for future use)
    // ----------------
    subscribeToChanges(userId: string, callback: (data: CloudUserData) => void) {
        if (!isSupabaseConfigured) return null;

        // Subscribe to changes on user's data
        const subscription = supabase
            .channel(`user-data-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_word_statuses',
                filter: `user_id=eq.${userId}`,
            }, async () => {
                // Refetch all data on any change
                const data = await this.getUserData(userId);
                if (data) callback(data);
            })
            .subscribe();

        return subscription;
    },

    unsubscribe(subscription: any) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    },
};

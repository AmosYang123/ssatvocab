/**
 * Hybrid Data Service
 * 
 * This service provides a unified interface that works with both:
 * 1. Cloud storage (Supabase) - when configured and online
 * 2. Local storage (IndexedDB) - as fallback and for offline support
 * 
 * It handles:
 * - Automatic fallback to local when cloud is unavailable
 * - Data migration from local to cloud
 * - Sync between local and cloud
 */

import { cloudService, CloudUserData, CloudAuthResult } from './cloudService';
import { authService } from '../authService';
import { WordStatusMap, MarkedWordsMap, StudySet, ThemeMode } from '../types';

// ============================
// Types
// ============================
export type StorageMode = 'cloud' | 'local' | 'hybrid';

export interface HybridAuthResult {
    success: boolean;
    message: string;
    userId?: string;
    username?: string;
    mode: StorageMode;
}

export interface SyncStatus {
    mode: StorageMode;
    lastSynced: Date | null;
    pendingChanges: boolean;
    isOnline: boolean;
}

// ============================
// Storage Mode Management
// ============================
const STORAGE_MODE_KEY = 'ssat_storage_mode';
const CLOUD_USER_ID_KEY = 'ssat_cloud_user_id';

function getStorageMode(): StorageMode {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    if (saved === 'cloud' || saved === 'local' || saved === 'hybrid') {
        return saved;
    }
    // Default: use cloud if configured, otherwise local
    return cloudService.isConfigured() ? 'hybrid' : 'local';
}

function setStorageMode(mode: StorageMode) {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
}

function getCloudUserId(): string | null {
    return localStorage.getItem(CLOUD_USER_ID_KEY);
}

function setCloudUserId(userId: string | null) {
    if (userId) {
        localStorage.setItem(CLOUD_USER_ID_KEY, userId);
    } else {
        localStorage.removeItem(CLOUD_USER_ID_KEY);
    }
}

// ============================
// Hybrid Data Service
// ============================
export const hybridService = {
    // ----------------
    // Configuration
    // ----------------
    isCloudAvailable(): boolean {
        return cloudService.isConfigured();
    },

    getStorageMode(): StorageMode {
        return getStorageMode();
    },

    setStorageMode(mode: StorageMode): void {
        setStorageMode(mode);
    },

    // ----------------
    // Authentication
    // ----------------
    async register(
        username: string,
        password: string,
        email?: string
    ): Promise<HybridAuthResult> {
        const mode = getStorageMode();

        // For cloud/hybrid mode, require email and use Supabase
        if ((mode === 'cloud' || mode === 'hybrid') && cloudService.isConfigured()) {
            if (!email) {
                return {
                    success: false,
                    message: 'Email is required for cloud accounts.',
                    mode
                };
            }

            const result = await cloudService.register(email, password, username);
            if (result.success && result.userId) {
                setCloudUserId(result.userId);
                // Also create local account as backup
                await authService.register(username, password);
            }
            return { ...result, mode };
        }

        // Local-only mode
        const localResult = await authService.register(username, password);
        return {
            success: localResult.success,
            message: localResult.message,
            username: localResult.user,
            mode: 'local'
        };
    },

    async login(
        usernameOrEmail: string,
        password: string
    ): Promise<HybridAuthResult> {
        const mode = getStorageMode();

        // Try cloud login if available
        if ((mode === 'cloud' || mode === 'hybrid') && cloudService.isConfigured()) {
            // Check if input looks like an email
            const isEmail = usernameOrEmail.includes('@');

            if (isEmail) {
                const result = await cloudService.login(usernameOrEmail, password);
                if (result.success && result.userId) {
                    setCloudUserId(result.userId);
                    return { ...result, mode: 'cloud' };
                }
            }

            // If not email or email login failed, fall back to local
        }

        // Try local login
        const localResult = await authService.login(usernameOrEmail, password);
        if (localResult.success) {
            return {
                success: true,
                message: localResult.message,
                username: localResult.user,
                mode: 'local'
            };
        }

        return {
            success: false,
            message: mode === 'hybrid'
                ? 'Login failed. For cloud accounts, please use your email address.'
                : localResult.message,
            mode
        };
    },

    async logout(): Promise<void> {
        // Logout from both
        await cloudService.logout();
        authService.logout();
        setCloudUserId(null);
    },

    async getCurrentUser(): Promise<{
        id: string;
        username: string;
        mode: StorageMode;
    } | null> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();

        // Try cloud first if in cloud/hybrid mode
        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId) {
            const cloudUser = await cloudService.getCurrentUser();
            if (cloudUser) {
                return { ...cloudUser, mode: 'cloud' };
            }
        }

        // Fall back to local
        const localUser = authService.getCurrentUser();
        if (localUser) {
            return {
                id: localUser,
                username: localUser,
                mode: 'local'
            };
        }

        return null;
    },

    // ----------------
    // Data Operations
    // ----------------
    async getUserData(): Promise<{
        wordStatuses: WordStatusMap;
        markedWords: MarkedWordsMap;
        savedSets: StudySet[];
    } | null> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();

        // Try cloud first
        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId && cloudService.isConfigured()) {
            try {
                const cloudData = await cloudService.getUserData(cloudUserId);
                if (cloudData) {
                    return cloudData;
                }
            } catch (e) {
                console.warn('Cloud fetch failed, falling back to local:', e);
            }
        }

        // Fall back to local
        const localData = await authService.getCurrentUserData();
        if (localData) {
            return {
                wordStatuses: localData.wordStatuses,
                markedWords: localData.markedWords,
                savedSets: localData.savedSets,
            };
        }

        return null;
    },

    async saveUserData(data: {
        wordStatuses: WordStatusMap;
        markedWords: MarkedWordsMap;
        savedSets: StudySet[];
    }): Promise<boolean> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();
        const localUsername = authService.getCurrentUser();

        let cloudSuccess = false;
        let localSuccess = false;

        // Save to cloud if available
        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId && cloudService.isConfigured()) {
            try {
                cloudSuccess = await cloudService.saveUserData(cloudUserId, data);
            } catch (e) {
                console.warn('Cloud save failed:', e);
            }
        }

        // Also save locally (as cache/backup)
        if (localUsername) {
            try {
                await authService.saveUserData(localUsername, data);
                localSuccess = true;
            } catch (e) {
                console.warn('Local save failed:', e);
            }
        }

        // Success if either worked (in hybrid mode)
        if (mode === 'hybrid') {
            return cloudSuccess || localSuccess;
        }

        return mode === 'cloud' ? cloudSuccess : localSuccess;
    },

    // ----------------
    // Preferences
    // ----------------
    async getPreferences(): Promise<{ theme: ThemeMode } | null> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();

        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId) {
            const cloudPrefs = await cloudService.getPreferences(cloudUserId);
            if (cloudPrefs) return cloudPrefs;
        }

        const localPrefs = await authService.getUserPreferences();
        if (localPrefs) {
            return { theme: localPrefs.theme };
        }

        return { theme: 'system' };
    },

    async savePreferences(theme: ThemeMode): Promise<boolean> {
        const cloudUserId = getCloudUserId();

        // Save to both
        if (cloudUserId && cloudService.isConfigured()) {
            await cloudService.savePreferences(cloudUserId, theme);
        }

        await authService.saveUserPreferences(theme);
        return true;
    },

    // ----------------
    // Migration
    // ----------------
    async migrateLocalToCloud(): Promise<{
        success: boolean;
        message: string;
    }> {
        const cloudUserId = getCloudUserId();
        if (!cloudUserId) {
            return { success: false, message: 'Not logged into cloud account.' };
        }

        if (!cloudService.isConfigured()) {
            return { success: false, message: 'Cloud service not configured.' };
        }

        // Get local data
        const localData = await authService.getCurrentUserData();
        if (!localData) {
            return { success: false, message: 'No local data to migrate.' };
        }

        // Migrate to cloud
        const result = await cloudService.migrateFromLocal(cloudUserId, {
            wordStatuses: localData.wordStatuses,
            markedWords: localData.markedWords,
            savedSets: localData.savedSets,
        });

        return result;
    },

    async hasLocalData(): Promise<boolean> {
        const localData = await authService.getCurrentUserData();
        if (!localData) return false;

        const hasStatuses = Object.keys(localData.wordStatuses).length > 0;
        const hasMarked = Object.keys(localData.markedWords).length > 0;
        const hasSets = localData.savedSets.length > 0;

        return hasStatuses || hasMarked || hasSets;
    },

    // ----------------
    // Sync Status
    // ----------------
    getSyncStatus(): SyncStatus {
        return {
            mode: getStorageMode(),
            lastSynced: null, // TODO: implement sync tracking
            pendingChanges: false,
            isOnline: navigator.onLine,
        };
    },
};

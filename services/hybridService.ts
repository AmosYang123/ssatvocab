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
import { Word, WordStatusMap, MarkedWordsMap, StudySet, ThemeMode } from '../types';

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
        password: string
    ): Promise<HybridAuthResult> {
        const mode = getStorageMode();

        // For cloud/hybrid mode, use Supabase with username-only
        if ((mode === 'cloud' || mode === 'hybrid') && cloudService.isConfigured()) {
            const result = await cloudService.register(username, password);
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
        username: string,
        password: string
    ): Promise<HybridAuthResult> {
        const mode = getStorageMode();

        // Try cloud login if available
        if ((mode === 'cloud' || mode === 'hybrid') && cloudService.isConfigured()) {
            const result = await cloudService.login(username, password);
            if (result.success && result.userId) {
                setCloudUserId(result.userId);
                return { ...result, mode: 'cloud' };
            }
            // If cloud login failed and we're in hybrid mode, try local
            if (mode === 'hybrid') {
                const localResult = await authService.login(username, password);
                if (localResult.success) {
                    return {
                        success: true,
                        message: localResult.message,
                        username: localResult.user,
                        mode: 'local'
                    };
                }
            }
            return { ...result, mode };
        }

        // Local-only mode
        const localResult = await authService.login(username, password);
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
            message: localResult.message,
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
        customVocab?: Word[];
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
                // Cloud fetch failed, falling back to local silently

            }
        }

        // Fall back to local
        const localData = await authService.getCurrentUserData();
        if (localData) {
            return {
                wordStatuses: localData.wordStatuses,
                markedWords: localData.markedWords,
                savedSets: localData.savedSets,
                customVocab: localData.customVocab,
            };
        }

        return null;
    },

    async saveUserData(data: {
        wordStatuses: WordStatusMap;
        markedWords: MarkedWordsMap;
        savedSets: StudySet[];
        customVocab?: Word[];
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
                // Cloud save failed silently

            }
        }

        // Also save locally (as cache/backup)
        if (localUsername) {
            try {
                await authService.saveUserData(localUsername, data);
                localSuccess = true;
            } catch (e) {
                // Local save failed silently

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
    async getPreferences(): Promise<{
        theme: ThemeMode;
        showDefaultVocab: boolean;
        showSatVocab: boolean;
        isPro: boolean;
        lastStudyMode?: string;
        lastActiveSetId?: string;
        lastCardIndex?: number;
    } | null> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();

        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId) {
            const cloudUser = await cloudService.getCurrentUser();
            const cloudPrefs = await cloudService.getPreferences(cloudUserId);
            // Use isPro from getCurrentUser as it's the source of truth for subscription status
            if (cloudPrefs) return { ...cloudPrefs, isPro: cloudUser?.isPro || false };
        }

        const localPrefs = await authService.getUserPreferences();
        if (localPrefs) {
            return {
                theme: localPrefs.theme,
                showDefaultVocab: localPrefs.showDefaultVocab ?? true,
                showSatVocab: localPrefs.showSatVocab ?? false,
                isPro: localPrefs.isPro ?? false,
                // These are loaded from localStorage in App.tsx typically, but keeping here for consistency
                lastStudyMode: localStorage.getItem(`ssat_${localPrefs.username}_mode`) || 'all',
                lastActiveSetId: localStorage.getItem(`ssat_${localPrefs.username}_set_id`) || undefined,
                lastCardIndex: parseInt(localStorage.getItem(`ssat_${localPrefs.username}_index`) || '0', 10)
            };
        }

        return { theme: 'light', showDefaultVocab: true, showSatVocab: false, isPro: false };
    },

    async updateProStatus(isPro: boolean): Promise<boolean> {
        const mode = getStorageMode();
        const cloudUserId = getCloudUserId();

        // 1. Update Cloud
        if ((mode === 'cloud' || mode === 'hybrid') && cloudUserId) {
            await cloudService.updateProStatus(isPro);
        }

        // 2. Update Local
        // We need to re-save preferences with the new isPro status
        const currentPrefs = await authService.getUserPreferences();
        if (currentPrefs) {
            await authService.saveUserPreferences(currentPrefs.theme, currentPrefs.showDefaultVocab, isPro);
        }

        return true;
    },

    async savePreferences(
        theme: ThemeMode,
        showDefaultVocab: boolean,
        showSatVocab?: boolean,
        lastStudyMode?: string,
        lastActiveSetId?: string,
        lastCardIndex?: number
    ): Promise<boolean> {
        const cloudUserId = getCloudUserId();

        // Save to both
        if (cloudUserId && cloudService.isConfigured()) {
            await cloudService.savePreferences(cloudUserId, theme, showDefaultVocab, showSatVocab, lastStudyMode, lastActiveSetId, lastCardIndex);
        }

        await authService.saveUserPreferences(theme, showDefaultVocab, undefined, showSatVocab);
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
            customVocab: localData.customVocab,
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

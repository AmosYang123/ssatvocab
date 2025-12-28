import { WordStatusMap, MarkedWordsMap, StudySet, ThemeMode } from './types';

// ============================
// IndexedDB Configuration
// ============================
const DB_NAME = 'ssat_vocab_mastery_db';
const DB_VERSION = 1;

const STORES = {
    USERS: 'users',
    USER_DATA: 'userData',
    USER_PREFERENCES: 'userPreferences',
};

// ============================
// Types
// ============================
interface User {
    username: string;
    passwordHash: string;
    createdAt: number;
}

interface UserData {
    username: string;
    wordStatuses: WordStatusMap;
    markedWords: MarkedWordsMap;
    savedSets: StudySet[];
}

interface UserPreferences {
    username: string;
    theme: ThemeMode;
}

interface AuthResult {
    success: boolean;
    message: string;
    user?: string;
}

// ============================
// Simple Password Hashing (for demo purposes)
// In production, use a proper library like bcrypt
// ============================
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ssat_vocab_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================
// IndexedDB Helper Functions
// ============================
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Users store
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                db.createObjectStore(STORES.USERS, { keyPath: 'username' });
            }

            // User data store (progress, groups, etc.)
            if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
                db.createObjectStore(STORES.USER_DATA, { keyPath: 'username' });
            }

            // User preferences store (theme, settings)
            if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
                db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'username' });
            }
        };
    });
}

async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        transaction.oncomplete = () => db.close();
    });
}

async function dbPut<T>(storeName: string, data: T): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
}

async function dbDelete(storeName: string, key: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
        transaction.oncomplete = () => db.close();
    });
}

// ============================
// Session Management
// ============================
const SESSION_KEY = 'ssat_current_user';

function setSession(username: string): void {
    localStorage.setItem(SESSION_KEY, username);
}

function getSession(): string | null {
    return localStorage.getItem(SESSION_KEY);
}

function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

// ============================
// Auth Service
// ============================
export const authService = {
    // ----------------
    // Authentication
    // ----------------
    async register(username: string, password: string): Promise<AuthResult> {
        if (!username || username.length < 3) {
            return { success: false, message: 'Username must be at least 3 characters.' };
        }
        if (!password || password.length < 4) {
            return { success: false, message: 'Password must be at least 4 characters.' };
        }

        const existingUser = await dbGet<User>(STORES.USERS, username.toLowerCase());
        if (existingUser) {
            return { success: false, message: 'Username already exists. Please choose another.' };
        }

        const passwordHash = await hashPassword(password);
        const newUser: User = {
            username: username.toLowerCase(),
            passwordHash,
            createdAt: Date.now(),
        };

        await dbPut(STORES.USERS, newUser);

        // Initialize user data
        const userData: UserData = {
            username: username.toLowerCase(),
            wordStatuses: {},
            markedWords: {},
            savedSets: [],
        };
        await dbPut(STORES.USER_DATA, userData);

        // Initialize preferences
        const preferences: UserPreferences = {
            username: username.toLowerCase(),
            theme: 'system',
        };
        await dbPut(STORES.USER_PREFERENCES, preferences);

        return { success: true, message: 'Account created successfully! Please log in.' };
    },

    async login(username: string, password: string): Promise<AuthResult> {
        if (!username || !password) {
            return { success: false, message: 'Please enter username and password.' };
        }

        const user = await dbGet<User>(STORES.USERS, username.toLowerCase());
        if (!user) {
            return { success: false, message: 'Account not found. Please register first.' };
        }

        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        setSession(username.toLowerCase());
        return { success: true, message: 'Login successful!', user: username.toLowerCase() };
    },

    logout(): void {
        clearSession();
    },

    getCurrentUser(): string | null {
        return getSession();
    },

    // ----------------
    // Password Change
    // ----------------
    async changePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
        const username = getSession();
        if (!username) {
            return { success: false, message: 'Not logged in.' };
        }

        if (!newPassword || newPassword.length < 4) {
            return { success: false, message: 'New password must be at least 4 characters.' };
        }

        const user = await dbGet<User>(STORES.USERS, username);
        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        const oldHash = await hashPassword(oldPassword);
        if (user.passwordHash !== oldHash) {
            return { success: false, message: 'Current password is incorrect.' };
        }

        const newHash = await hashPassword(newPassword);
        user.passwordHash = newHash;
        await dbPut(STORES.USERS, user);

        return { success: true, message: 'Password changed successfully!' };
    },

    // ----------------
    // Username Change
    // ----------------
    async changeUsername(newUsername: string, password: string): Promise<AuthResult> {
        const currentUsername = getSession();
        if (!currentUsername) {
            return { success: false, message: 'Not logged in.' };
        }

        if (!newUsername || newUsername.length < 3) {
            return { success: false, message: 'New username must be at least 3 characters.' };
        }

        const normalizedNew = newUsername.toLowerCase();
        if (normalizedNew === currentUsername) {
            return { success: false, message: 'New username is the same as current.' };
        }

        // Check if new username exists
        const existingUser = await dbGet<User>(STORES.USERS, normalizedNew);
        if (existingUser) {
            return { success: false, message: 'Username already taken.' };
        }

        // Verify password
        const user = await dbGet<User>(STORES.USERS, currentUsername);
        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        const passwordHash = await hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Incorrect password.' };
        }

        // Migrate all data to new username
        const userData = await dbGet<UserData>(STORES.USER_DATA, currentUsername);
        const preferences = await dbGet<UserPreferences>(STORES.USER_PREFERENCES, currentUsername);

        // Create new records
        const newUser: User = { ...user, username: normalizedNew };
        await dbPut(STORES.USERS, newUser);

        if (userData) {
            await dbPut(STORES.USER_DATA, { ...userData, username: normalizedNew });
        }
        if (preferences) {
            await dbPut(STORES.USER_PREFERENCES, { ...preferences, username: normalizedNew });
        }

        // Delete old records
        await dbDelete(STORES.USERS, currentUsername);
        await dbDelete(STORES.USER_DATA, currentUsername);
        await dbDelete(STORES.USER_PREFERENCES, currentUsername);

        // Update session
        setSession(normalizedNew);

        return { success: true, message: 'Username changed successfully!', user: normalizedNew };
    },

    // ----------------
    // User Data (Progress)
    // ----------------
    async getCurrentUserData(): Promise<UserData | null> {
        const username = getSession();
        if (!username) return null;

        const data = await dbGet<UserData>(STORES.USER_DATA, username);
        return data || null;
    },

    async saveUserData(
        username: string,
        data: { wordStatuses: WordStatusMap; markedWords: MarkedWordsMap; savedSets: StudySet[] }
    ): Promise<void> {
        const userData: UserData = {
            username: username.toLowerCase(),
            ...data,
        };
        await dbPut(STORES.USER_DATA, userData);
    },

    // ----------------
    // User Preferences
    // ----------------
    async getUserPreferences(): Promise<UserPreferences | null> {
        const username = getSession();
        if (!username) return null;

        const prefs = await dbGet<UserPreferences>(STORES.USER_PREFERENCES, username);
        return prefs || null;
    },

    async saveUserPreferences(theme: ThemeMode): Promise<void> {
        const username = getSession();
        if (!username) return;

        const preferences: UserPreferences = {
            username,
            theme,
        };
        await dbPut(STORES.USER_PREFERENCES, preferences);
    },

    // ----------------
    // Reset Data
    // ----------------
    async resetAllData(): Promise<void> {
        const username = getSession();
        if (!username) return;

        const userData: UserData = {
            username,
            wordStatuses: {},
            markedWords: {},
            savedSets: [],
        };
        await dbPut(STORES.USER_DATA, userData);

        // Clear localStorage navigation data
        localStorage.removeItem(`ssat_${username}_mode`);
        localStorage.removeItem(`ssat_${username}_set_id`);
        localStorage.removeItem(`ssat_${username}_index`);
    },

    // ----------------
    // Migration & Backup
    // ----------------
    async migrateLegacyData(username: string): Promise<void> {
        const normalized = username.toLowerCase();
        // Check if there's old localStorage data for this user
        const oldStatuses = localStorage.getItem(`ssat_vocab_statuses_${normalized}`);
        const oldMarked = localStorage.getItem(`ssat_vocab_marked_${normalized}`);
        const oldSets = localStorage.getItem(`ssat_vocab_sets_${normalized}`);

        if (oldStatuses || oldMarked || oldSets) {
            const currentData = await this.getCurrentUserData();
            const updatedData: UserData = {
                username: normalized,
                wordStatuses: oldStatuses ? JSON.parse(oldStatuses) : (currentData?.wordStatuses || {}),
                markedWords: oldMarked ? JSON.parse(oldMarked) : (currentData?.markedWords || {}),
                savedSets: oldSets ? JSON.parse(oldSets) : (currentData?.savedSets || []),
            };
            await this.saveUserData(normalized, updatedData);

            // Clean up to avoid re-migration
            localStorage.removeItem(`ssat_vocab_statuses_${normalized}`);
            localStorage.removeItem(`ssat_vocab_marked_${normalized}`);
            localStorage.removeItem(`ssat_vocab_sets_${normalized}`);
        }
    },

    // ----------------
    // Enhanced Export/Import System
    // ----------------

    /**
     * Generate a checksum for data integrity verification
     */
    async generateChecksum(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Export all user data with comprehensive metadata for safe backup
     */
    async exportAllData(): Promise<string> {
        const username = getSession();
        if (!username) throw new Error('Not logged in');

        const userData = await this.getCurrentUserData();
        const preferences = await this.getUserPreferences();
        const user = await dbGet<User>(STORES.USERS, username);

        // Compute statistics
        const wordStatuses = userData?.wordStatuses || {};
        const markedWords = userData?.markedWords || {};
        const savedSets = userData?.savedSets || [];

        const masteredWords = Object.entries(wordStatuses).filter(([_, status]) => status === 'mastered');
        const reviewWords = Object.entries(wordStatuses).filter(([_, status]) => status === 'review');
        const markedCount = Object.values(markedWords).filter(Boolean).length;

        // Get localStorage navigation state
        const navigationState = {
            mode: localStorage.getItem(`ssat_${username}_mode`),
            setId: localStorage.getItem(`ssat_${username}_set_id`),
            cardIndex: localStorage.getItem(`ssat_${username}_index`),
        };

        // Build comprehensive export object
        const exportData = {
            // Metadata
            _meta: {
                exportVersion: 2,
                dbVersion: DB_VERSION,
                appName: 'SSAT Vocab Mastery',
                exportedAt: new Date().toISOString(),
                exportedAtTimestamp: Date.now(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },

            // User Account Info
            account: {
                username: username,
                createdAt: user?.createdAt || null,
                createdAtDate: user?.createdAt ? new Date(user.createdAt).toISOString() : null,
            },

            // Statistics Summary (for quick reference)
            statistics: {
                totalWordsStudied: Object.keys(wordStatuses).length,
                masteredCount: masteredWords.length,
                reviewCount: reviewWords.length,
                markedCount: markedCount,
                customSetsCount: savedSets.length,
                customSetsTotalWords: savedSets.reduce((sum, set) => sum + set.wordNames.length, 0),
            },

            // Full Data
            data: {
                wordStatuses: wordStatuses,
                markedWords: markedWords,
                savedSets: savedSets.map(set => ({
                    ...set,
                    wordCount: set.wordNames.length, // Add count for reference
                })),
            },

            // Preferences
            preferences: {
                theme: preferences?.theme || 'system',
            },

            // App State (for full restoration)
            appState: navigationState,

            // Lists for human readability
            wordLists: {
                mastered: masteredWords.map(([word]) => word).sort(),
                review: reviewWords.map(([word]) => word).sort(),
                marked: Object.entries(markedWords)
                    .filter(([_, isMarked]) => isMarked)
                    .map(([word]) => word)
                    .sort(),
            },
        };

        // Generate checksum of the data portion
        const dataString = JSON.stringify(exportData.data);
        const checksum = await this.generateChecksum(dataString);

        const finalExport = {
            ...exportData,
            _integrity: {
                checksum: checksum,
                algorithm: 'SHA-256',
            },
        };

        return JSON.stringify(finalExport, null, 2);
    },

    /**
     * Validate import data structure
     */
    validateImportData(imported: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!imported) {
            errors.push('Empty or invalid JSON');
            return { valid: false, errors };
        }

        // Check for v2 format
        if (imported._meta?.exportVersion === 2) {
            if (!imported.account?.username) {
                errors.push('Missing username in account data');
            }
            if (!imported.data) {
                errors.push('Missing data section');
            }
            if (imported.data && typeof imported.data.wordStatuses !== 'object') {
                errors.push('Invalid wordStatuses format');
            }
            if (imported.data && typeof imported.data.markedWords !== 'object') {
                errors.push('Invalid markedWords format');
            }
            if (imported.data && !Array.isArray(imported.data.savedSets)) {
                errors.push('Invalid savedSets format');
            }
        }
        // Check for v1 (legacy) format
        else if (imported.version && imported.username && imported.data) {
            // Legacy format is valid
        }
        // Invalid format
        else {
            errors.push('Unrecognized backup format. Expected v1 or v2 format.');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Import user data with validation and optional merge
     */
    async importAllData(jsonString: string, options?: { merge?: boolean }): Promise<AuthResult> {
        try {
            const imported = JSON.parse(jsonString);

            // Validate structure
            const validation = this.validateImportData(imported);
            if (!validation.valid) {
                return {
                    success: false,
                    message: `Invalid backup file: ${validation.errors.join(', ')}`
                };
            }

            const currentUsername = getSession();

            // Handle v2 format
            if (imported._meta?.exportVersion === 2) {
                const importUsername = imported.account.username;

                if (currentUsername && currentUsername !== importUsername) {
                    return {
                        success: false,
                        message: `This backup belongs to user "${importUsername}". You are logged in as "${currentUsername}". Please log in as "${importUsername}" first, or use the full database restore feature.`
                    };
                }

                // Verify checksum if present
                if (imported._integrity?.checksum) {
                    const dataString = JSON.stringify(imported.data);
                    const computedChecksum = await this.generateChecksum(dataString);
                    if (computedChecksum !== imported._integrity.checksum) {
                        return {
                            success: false,
                            message: 'Data integrity check failed. The backup file may be corrupted.'
                        };
                    }
                }

                // Get existing data if merging
                let finalData = {
                    wordStatuses: imported.data.wordStatuses || {},
                    markedWords: imported.data.markedWords || {},
                    savedSets: (imported.data.savedSets || []).map((set: any) => ({
                        id: set.id,
                        name: set.name,
                        wordNames: set.wordNames,
                    })),
                };

                if (options?.merge && currentUsername) {
                    const existingData = await this.getCurrentUserData();
                    if (existingData) {
                        // Merge word statuses (imported takes precedence)
                        finalData.wordStatuses = {
                            ...existingData.wordStatuses,
                            ...finalData.wordStatuses,
                        };
                        // Merge marked words (imported takes precedence)
                        finalData.markedWords = {
                            ...existingData.markedWords,
                            ...finalData.markedWords,
                        };
                        // Merge saved sets (avoid duplicates by id)
                        const existingIds = new Set(existingData.savedSets.map(s => s.id));
                        const newSets = finalData.savedSets.filter((s: StudySet) => !existingIds.has(s.id));
                        finalData.savedSets = [...existingData.savedSets, ...newSets];
                    }
                }

                await this.saveUserData(importUsername, finalData);

                // Restore preferences
                if (imported.preferences) {
                    await dbPut(STORES.USER_PREFERENCES, {
                        username: importUsername,
                        theme: imported.preferences.theme || 'system',
                    });
                }

                // Restore app state if present
                if (imported.appState && currentUsername === importUsername) {
                    if (imported.appState.mode) {
                        localStorage.setItem(`ssat_${importUsername}_mode`, imported.appState.mode);
                    }
                    if (imported.appState.setId) {
                        localStorage.setItem(`ssat_${importUsername}_set_id`, imported.appState.setId);
                    }
                    if (imported.appState.cardIndex) {
                        localStorage.setItem(`ssat_${importUsername}_index`, imported.appState.cardIndex);
                    }
                }

                const stats = imported.statistics || {};
                return {
                    success: true,
                    message: `Data restored successfully! (${stats.masteredCount || 0} mastered, ${stats.reviewCount || 0} review, ${stats.customSetsCount || 0} custom sets)`
                };
            }

            // Handle v1 (legacy) format
            if (!imported.username || !imported.data) {
                return { success: false, message: 'Invalid backup file format (v1).' };
            }

            if (currentUsername && currentUsername !== imported.username) {
                return {
                    success: false,
                    message: `This backup belongs to user "${imported.username}". Please log in as that user first.`
                };
            }

            await this.saveUserData(imported.username, imported.data);
            if (imported.preferences) {
                await dbPut(STORES.USER_PREFERENCES, imported.preferences);
            }

            return { success: true, message: 'Legacy backup restored successfully! Refreshing...' };
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            return { success: false, message: `Could not parse backup file: ${errorMessage}` };
        }
    },

    /**
     * Export entire database (all users) - for pre-migration backup
     * This is useful before migrating to a real database
     */
    async exportFullDatabase(): Promise<string> {
        const db = await openDatabase();

        const getAllFromStore = <T>(storeName: string): Promise<T[]> => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        };

        try {
            const users = await getAllFromStore<User>(STORES.USERS);
            const userData = await getAllFromStore<UserData>(STORES.USER_DATA);
            const userPreferences = await getAllFromStore<UserPreferences>(STORES.USER_PREFERENCES);

            // Build comprehensive database export
            const dbExport = {
                _meta: {
                    exportVersion: 2,
                    exportType: 'full_database',
                    dbVersion: DB_VERSION,
                    appName: 'SSAT Vocab Mastery',
                    exportedAt: new Date().toISOString(),
                    exportedAtTimestamp: Date.now(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                statistics: {
                    totalUsers: users.length,
                    usersWithData: userData.length,
                    usersWithPreferences: userPreferences.length,
                },
                users: users.map(u => ({
                    username: u.username,
                    createdAt: u.createdAt,
                    createdAtDate: new Date(u.createdAt).toISOString(),
                    // Password hash included for full restoration
                    passwordHash: u.passwordHash,
                })),
                userData: userData.map(ud => {
                    const masteredCount = Object.values(ud.wordStatuses).filter(s => s === 'mastered').length;
                    const reviewCount = Object.values(ud.wordStatuses).filter(s => s === 'review').length;
                    const markedCount = Object.values(ud.markedWords).filter(Boolean).length;

                    return {
                        username: ud.username,
                        statistics: {
                            masteredCount,
                            reviewCount,
                            markedCount,
                            customSetsCount: ud.savedSets.length,
                        },
                        wordStatuses: ud.wordStatuses,
                        markedWords: ud.markedWords,
                        savedSets: ud.savedSets,
                    };
                }),
                userPreferences: userPreferences,
            };

            db.close();

            // Generate checksum
            const dataString = JSON.stringify({ users, userData, userPreferences });
            const checksum = await this.generateChecksum(dataString);

            const finalExport = {
                ...dbExport,
                _integrity: {
                    checksum: checksum,
                    algorithm: 'SHA-256',
                },
            };

            return JSON.stringify(finalExport, null, 2);
        } catch (e) {
            db.close();
            throw e;
        }
    },

    /**
     * Import full database backup - for post-migration recovery
     */
    async importFullDatabase(jsonString: string): Promise<AuthResult> {
        try {
            const imported = JSON.parse(jsonString);

            // Validate it's a full database export
            if (imported._meta?.exportType !== 'full_database') {
                return {
                    success: false,
                    message: 'This is not a full database backup. Use regular import for single-user backups.'
                };
            }

            if (!imported.users || !Array.isArray(imported.users)) {
                return { success: false, message: 'Invalid database backup: missing users array.' };
            }

            // Verify checksum if present
            if (imported._integrity?.checksum) {
                const dataString = JSON.stringify({
                    users: imported.users.map((u: any) => ({
                        username: u.username,
                        createdAt: u.createdAt,
                        passwordHash: u.passwordHash,
                    })),
                    userData: imported.userData,
                    userPreferences: imported.userPreferences,
                });
                const computedChecksum = await this.generateChecksum(dataString);
                if (computedChecksum !== imported._integrity.checksum) {
                    return {
                        success: false,
                        message: 'Data integrity check failed. The backup file may be corrupted.'
                    };
                }
            }

            // Restore all users
            for (const user of imported.users) {
                const userRecord: User = {
                    username: user.username,
                    passwordHash: user.passwordHash,
                    createdAt: user.createdAt,
                };
                await dbPut(STORES.USERS, userRecord);
            }

            // Restore all user data
            for (const ud of imported.userData || []) {
                const userDataRecord: UserData = {
                    username: ud.username,
                    wordStatuses: ud.wordStatuses || {},
                    markedWords: ud.markedWords || {},
                    savedSets: ud.savedSets || [],
                };
                await dbPut(STORES.USER_DATA, userDataRecord);
            }

            // Restore all preferences
            for (const pref of imported.userPreferences || []) {
                await dbPut(STORES.USER_PREFERENCES, pref);
            }

            return {
                success: true,
                message: `Database restored successfully! ${imported.users.length} user(s) recovered.`
            };
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            return { success: false, message: `Could not restore database: ${errorMessage}` };
        }
    },

    /**
     * Get a summary of all data for display purposes
     */
    async getDataSummary(): Promise<{
        username: string;
        masteredCount: number;
        reviewCount: number;
        markedCount: number;
        customSetsCount: number;
        lastActivity: string | null;
    } | null> {
        const username = getSession();
        if (!username) return null;

        const userData = await this.getCurrentUserData();
        if (!userData) return null;

        const masteredCount = Object.values(userData.wordStatuses).filter(s => s === 'mastered').length;
        const reviewCount = Object.values(userData.wordStatuses).filter(s => s === 'review').length;
        const markedCount = Object.values(userData.markedWords).filter(Boolean).length;

        return {
            username,
            masteredCount,
            reviewCount,
            markedCount,
            customSetsCount: userData.savedSets.length,
            lastActivity: null, // Could be enhanced to track this
        };
    }
};

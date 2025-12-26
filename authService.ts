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
};

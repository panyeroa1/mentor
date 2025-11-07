
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import type { Profile, UserRole, Video } from '../types';

// --- IndexedDB Utility Functions ---

const DB_NAME = 'MagnetarDB';
const DB_VERSION = 1;
const PROFILE_STORE = 'profiles';
const VIDEO_STORE = 'videos';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening database');
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(PROFILE_STORE)) {
        const profileStore = dbInstance.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
        profileStore.createIndex('email', 'email', { unique: true });
      }
      if (!dbInstance.objectStoreNames.contains(VIDEO_STORE)) {
        const videoStore = dbInstance.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
        videoStore.createIndex('owner_id', 'owner_id', { unique: false });
      }
    };
  });
};

const getFromDB = <T>(storeName: string, key: string): Promise<T | undefined> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
};

const getFromDBByIndex = <T>(storeName: string, indexName: string, query: string): Promise<T | undefined> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.get(query);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
    });
};


const addToDB = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Video Specific DB Functions ---
interface StoredVideo {
    id: string;
    owner_id: string;
    title: string;
    description?: string;
    file: File;
    thumbnail_url?: string;
    visibility: 'public' | 'unlisted' | 'private';
    views_count: number;
    created_at: Date;
}

export const addVideoToDB = (video: StoredVideo) => addToDB(VIDEO_STORE, video);

export const getVideosFromDB = (ownerId: string): Promise<StoredVideo[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(VIDEO_STORE, 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('owner_id');
        const request = index.getAll(ownerId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}


// --- Auth Context ---
interface AuthContextType {
    user: Profile | null;
    login: (email: string, password: string) => Promise<{ user?: Profile; error?: Error }>;
    signup: (email: string, fullName: string, role: UserRole) => Promise<{ user?: Profile; error?: Error }>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const userId = localStorage.getItem('currentUser');
                if (userId) {
                    const profile = await getFromDB<Profile>(PROFILE_STORE, userId);
                    if (profile) {
                        setUser(profile);
                    }
                }
            } catch (error) {
                console.error("Failed to load user from storage:", error);
            } finally {
                setLoading(false);
            }
        };
        loadUserFromStorage();
    }, []);

    const login = async (email: string, password: string): Promise<{ user?: Profile; error?: Error }> => {
        // NOTE: Password is not checked as this is an insecure local-only DB.
        try {
            const profile = await getFromDBByIndex<Profile & { email: string }>(PROFILE_STORE, 'email', email);
            if (profile) {
                localStorage.setItem('currentUser', profile.id);
                setUser(profile);
                return { user: profile };
            }
            return { error: new Error('User not found.') };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signup = async (email: string, fullName: string, role: UserRole): Promise<{ user?: Profile; error?: Error }> => {
        try {
            const existingUser = await getFromDBByIndex(PROFILE_STORE, 'email', email);
            if (existingUser) {
                return { error: new Error("An account with this email already exists.") };
            }

            const userId = crypto.randomUUID();
            const profileData: Profile & { email: string } = {
                id: userId,
                full_name: fullName,
                role: role,
                avatar_url: `https://i.pravatar.cc/150?u=${userId}`,
                bio: 'Welcome to Magnetar! Edit your bio in your profile.',
                email: email, // Storing email for login lookup
            };

            await addToDB(PROFILE_STORE, profileData);
            localStorage.setItem('currentUser', userId);
            setUser(profileData);
            return { user: profileData };
        } catch (error) {
             return { error: error as Error };
        }
    };

    const logout = () => {
        localStorage.removeItem('currentUser');
        setUser(null);
    };

    const value = { user, login, signup, logout, loading };

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
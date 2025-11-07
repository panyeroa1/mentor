

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import type { Profile, UserRole, Video, Post } from '../types';

// --- IndexedDB Utility Functions ---

const DB_NAME = 'MagnetarDB';
const DB_VERSION = 2; // Incremented version for schema change
const PROFILE_STORE = 'profiles';
const VIDEO_STORE = 'videos';
const POST_STORE = 'posts';

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
      if (!dbInstance.objectStoreNames.contains(POST_STORE)) {
        const postStore = dbInstance.createObjectStore(POST_STORE, { keyPath: 'id' });
        postStore.createIndex('created_at', 'created_at', { unique: false });
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

const addToDB = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const updateInDB = <T>(storeName: string, item: T): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateProfileInDB = (profile: Profile) => updateInDB(PROFILE_STORE, profile);


// --- Video Specific DB Functions ---
export interface StoredVideo {
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

export const getVideoFromDB = (id: string): Promise<StoredVideo | undefined> => {
    return getFromDB<StoredVideo>(VIDEO_STORE, id);
};

// --- Post Specific DB Functions ---
export const addPostToDB = (post: Post) => addToDB(POST_STORE, post);

export const getPostsFromDB = (): Promise<Post[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(POST_STORE, 'readonly');
        const store = transaction.objectStore(POST_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            const sorted = request.result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            resolve(sorted);
        };
        request.onerror = () => reject(request.error);
    });
};


// --- Auth Context ---
interface AuthContextType {
    user: Profile | null;
    logout: () => void;
    loading: boolean;
    updateUser: (profile: Profile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrCreateUser = async () => {
            try {
                await initDB();
                const GUEST_USER_ID = 'default-guest-user';
                let currentUserId = localStorage.getItem('currentUser');
                let profile: Profile | undefined;

                if (currentUserId) {
                    profile = await getFromDB<Profile>(PROFILE_STORE, currentUserId);
                }

                if (!profile) {
                    profile = await getFromDB<Profile>(PROFILE_STORE, GUEST_USER_ID);
                    
                    if (!profile) {
                        const guestProfile: Profile = {
                            id: GUEST_USER_ID,
                            full_name: 'Guest User',
                            role: 'learner',
                            avatar_url: `https://i.pravatar.cc/150?u=${GUEST_USER_ID}`,
                            bio: 'Exploring Magnetar as a guest. All data is stored locally in your browser.',
                        };
                        await addToDB(PROFILE_STORE, guestProfile);
                        profile = guestProfile;
                    }
                    localStorage.setItem('currentUser', GUEST_USER_ID);
                }
                
                setUser(profile);
            } catch (error) {
                console.error("Failed to initialize user session:", error);
            } finally {
                setLoading(false);
            }
        };
        loadOrCreateUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('currentUser');
        // A full reload is the simplest way to reset the state and re-trigger guest creation.
        window.location.reload(); 
    };

    const updateUser = async (profile: Profile) => {
        try {
            await updateProfileInDB(profile);
            setUser(profile);
        } catch (error) {
            console.error("Failed to update user profile:", error);
            throw error;
        }
    };

    const value = { user, logout, loading, updateUser };

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
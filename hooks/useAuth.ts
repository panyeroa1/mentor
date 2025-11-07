
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { auth, db } from '../firebaseClient';
import type { Profile, UserRole } from '../types';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updateProfile as updateFirebaseProfile,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';


interface AuthContextType {
    user: Profile | null;
    firebaseUser: FirebaseUser | null;
    login: (email: string, password: string) => Promise<any>;
    signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                // Fetch profile from Firestore
                const profileRef = doc(db, 'profiles', user.uid);
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    setUser(profileSnap.data() as Profile);
                } else {
                    // This case might happen if profile creation failed after signup
                    // Or if a user exists in auth but not in profiles collection
                    console.warn("User profile not found in Firestore for UID:", user.uid);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { user: userCredential.user, error: null };
        } catch (error) {
            return { user: null, error };
        }
    };

    const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // Update Firebase Auth profile with full name
            await updateFirebaseProfile(newUser, { displayName: fullName });

            // Create user profile document in Firestore
            const profileData: Profile = {
                id: newUser.uid,
                full_name: fullName,
                role: role,
                avatar_url: `https://i.pravatar.cc/150?u=${newUser.uid}`,
                bio: 'Welcome to Magnetar! Edit your bio in your profile.'
            };
            await setDoc(doc(db, "profiles", newUser.uid), profileData);
            
            setUser(profileData); // Immediately set user state
            
            return { user: newUser, error: null };
        } catch (error) {
            return { user: null, error };
        }
    };


    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
    };

    const value = {
        user,
        firebaseUser,
        login,
        signup,
        logout,
        loading,
    };

    return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
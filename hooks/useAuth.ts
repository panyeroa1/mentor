
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { Profile } from '../types';

interface AuthContextType {
    user: Profile | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user profile for demonstration
const mockUser: Profile = {
    id: 'mock-user-id',
    full_name: 'Alex Doe',
    role: 'mentor',
    avatar_url: 'https://i.pravatar.cc/150?u=alexdoe',
    bio: 'Experienced educator and tech enthusiast sharing knowledge with the world.'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd check for an active session here.
        // For this mock, we'll just end the loading state.
        setLoading(false);
    }, []);

    const login = async (email: string) => {
        // Simulating a network request and login
        setLoading(true);
        // FIX: The mock signInWithPassword method only accepts an email property.
        await supabase.auth.signInWithPassword({ email }); // Password is not used in mock
        setUser(mockUser);
        setLoading(false);
    };

    const logout = () => {
        setUser(null);
        supabase.auth.signOut();
    };

    const value = {
        user,
        login,
        logout,
        loading,
    };

    // FIX: A .ts file cannot contain JSX. Rewriting with React.createElement to solve parsing errors.
    return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Profile } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';

interface EditProfileProps {
    user: Profile;
    onClose: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onClose }) => {
    const { updateUser } = useAuth();
    const [fullName, setFullName] = useState(user.full_name);
    const [bio, setBio] = useState(user.bio || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError('Full name cannot be empty.');
            return;
        }
        setIsSaving(true);
        setError('');

        try {
            await updateUser({
                ...user,
                full_name: fullName,
                bio: bio,
            });
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                {isSaving && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                        <LoadingSpinner text="Saving..." />
                    </div>
                )}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    {error && <p className="text-amber-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-700 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

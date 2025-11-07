
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { EditProfile } from '../EditProfile';

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    if (!user) {
        return <p>Loading profile...</p>;
    }

    return (
        <div>
            {/* No sticky header, let content scroll */}
            <div className="max-w-3xl mx-auto p-4">
                <div className="flex flex-col items-center pt-8 text-white">
                    <img src={user.avatar_url} alt={user.full_name} className="w-24 h-24 rounded-full mb-4 border-4 border-gray-800 shadow-lg" />
                    <h1 className="text-2xl font-bold text-white">{user.full_name}</h1>
                    <p className="text-sm font-semibold capitalize text-amber-500 mb-2">{user.role}</p>
                    <p className="text-gray-400 text-center max-w-md mb-6">{user.bio}</p>

                    {/* Stats */}
                    <div className="flex justify-around w-full max-w-xs bg-gray-800 rounded-lg p-3 mb-8">
                        <div className="text-center">
                            <p className="font-bold text-lg text-white">12</p>
                            <p className="text-xs text-gray-400">Trainings</p>
                        </div>
                         <div className="text-center">
                            <p className="font-bold text-lg text-white">34</p>
                            <p className="text-xs text-gray-400">Videos</p>
                        </div>
                         <div className="text-center">
                            <p className="font-bold text-lg text-white">256</p>
                            <p className="text-xs text-gray-400">Followers</p>
                        </div>
                    </div>
                    
                    <div className="w-full max-w-xs space-y-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={logout}
                            className="w-full bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-700 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>

                </div>
            </div>
            {isEditing && <EditProfile user={user} onClose={() => setIsEditing(false)} />}
        </div>
    );
};

export default ProfileScreen;
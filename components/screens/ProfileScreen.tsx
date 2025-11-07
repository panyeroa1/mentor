import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();

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
                    <p className="text-sm font-semibold capitalize text-red-500 mb-2">{user.role}</p>
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

                    <button
                        onClick={logout}
                        className="w-full max-w-xs bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
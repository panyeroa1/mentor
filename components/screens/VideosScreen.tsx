import React, { useState, useEffect } from 'react';
import { useAuth, addVideoToDB, getVideosFromDB } from '../../hooks/useAuth';
import { VideoIcon } from '../ui/icons';

// Define a type for videos fetched from DB, which includes the raw File object
interface LocalVideo {
  id: string;
  owner_id: string;
  title: string;
  file: File;
  created_at: Date;
}

// Define a type for videos ready for rendering, with an object URL
interface PlayableVideo extends Omit<LocalVideo, 'file'> {
    url: string;
}

const VideosScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [videos, setVideos] = useState<PlayableVideo[]>([]);

  const fetchVideos = async () => {
    if (!user) return;
    const storedVideos = await getVideosFromDB(user.id);
    const playableVideos = storedVideos.map(v => ({
      ...v,
      url: URL.createObjectURL(v.file)
    }));
    setVideos(playableVideos);
  };

  useEffect(() => {
    fetchVideos();

    // Cleanup object URLs on component unmount
    return () => {
      videos.forEach(video => URL.revokeObjectURL(video.url));
    };
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      setError('Please select a file and make sure you are logged in.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
        const videoData = {
            id: crypto.randomUUID(),
            owner_id: user.id,
            title: selectedFile.name,
            file: selectedFile,
            visibility: 'private' as const,
            created_at: new Date(),
            views_count: 0
        };

        await addVideoToDB(videoData);
        
        setSuccessMessage('Video saved to your local library!');
        setSelectedFile(null);
        await fetchVideos(); // Refresh video list

    } catch (e: any) {
        console.error("Error saving video:", e);
        setError(e.message || 'Failed to save video to the local database.');
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div>
        <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-800">
            <div className="max-w-3xl mx-auto px-4 py-3">
                <h1 className="text-xl font-bold text-white">Video Library</h1>
            </div>
        </header>
        <div className="max-w-3xl mx-auto p-4">
             {/* Upload Section */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">Add New Video to Library</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="flex-grow w-full sm:w-auto px-4 py-2 bg-gray-700 text-white rounded-md cursor-pointer text-center hover:bg-gray-600 transition-colors truncate">
                        <span>{selectedFile ? selectedFile.name : 'Choose a file...'}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                        className="w-full sm:w-auto bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isUploading ? 'Saving...' : 'Save to Library'}
                    </button>
                </div>
                 {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                 {successMessage && <p className="text-green-500 text-sm mt-3">{successMessage}</p>}
            </div>
            
            {/* Video List */}
            {videos.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {videos.map(video => (
                        <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden">
                             <video controls src={video.url} className="w-full h-32 object-cover bg-black"></video>
                             <div className="p-3">
                                <p className="text-white font-semibold text-sm truncate" title={video.title}>{video.title}</p>
                                <p className="text-gray-400 text-xs">{video.created_at.toLocaleDateString()}</p>
                             </div>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-16">
                    <VideoIcon className="w-12 h-12 mx-auto text-gray-600 mb-4"/>
                    <h3 className="text-lg font-semibold text-white">Your Library is Empty</h3>
                    <p className="text-gray-400 mt-1">Add a video using the form above to get started.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default VideosScreen;
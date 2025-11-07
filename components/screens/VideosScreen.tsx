import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

const VideosScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      // 1. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
          throw new Error("Could not get public URL for the uploaded file.");
      }
      
      const publicUrl = urlData.publicUrl;

      // 3. Insert the video metadata into the 'videos' table
      const { error: dbError } = await supabase.from('videos').insert({
        owner_id: user.id,
        title: selectedFile.name,
        file_url: publicUrl,
        visibility: 'private', // Default to private
      });

      if (dbError) {
        throw dbError;
      }

      setSuccessMessage('Video uploaded successfully!');
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
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
                <h2 className="text-lg font-semibold text-white mb-3">Upload New Video</h2>
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
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
                {isUploading && (
                    <div className="mt-4">
                        <LoadingSpinner text="Uploading video, please wait." />
                    </div>
                )}
                 {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                 {successMessage && <p className="text-green-500 text-sm mt-3">{successMessage}</p>}
            </div>
            
            <div className="text-center">
                <p className="text-gray-400 mt-8">Your private video library will appear here.</p>
            </div>
        </div>
    </div>
  );
};

export default VideosScreen;

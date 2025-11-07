import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';

const VideosScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(null);
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
    setUploadProgress(0);

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      // 1. Get a signed URL for the upload
      const { data: uploadUrlData, error: urlError } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(filePath);

      if (urlError) throw urlError;

      const { signedUrl } = uploadUrlData;

      // 2. Upload using XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', selectedFile.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
            try {
                // 3. Get the public URL of the uploaded file
                const { data: urlData } = supabase.storage
                    .from('videos')
                    .getPublicUrl(filePath);

                if (!urlData || !urlData.publicUrl) {
                    throw new Error("Could not get public URL for the uploaded file.");
                }

                const publicUrl = urlData.publicUrl;

                // 4. Insert video metadata into the 'videos' table
                const { error: dbError } = await supabase.from('videos').insert({
                    owner_id: user.id,
                    title: selectedFile.name,
                    file_url: publicUrl,
                    visibility: 'private', // Default to private
                });

                if (dbError) throw dbError;
                
                setSuccessMessage('Video uploaded successfully!');
                setSelectedFile(null);
                
                // Let the 100% progress bar show for a moment
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(null);
                }, 1000);

            } catch (e: any) {
                setError(e.message || 'Failed to process video after upload.');
                setIsUploading(false);
                setUploadProgress(null);
            }
        } else {
            setError(`Upload failed: ${xhr.statusText}`);
            setIsUploading(false);
            setUploadProgress(null);
        }
      };

      xhr.onerror = () => {
        setError('A network error occurred during the upload. Please check your connection.');
        setIsUploading(false);
        setUploadProgress(null);
      };

      xhr.send(selectedFile);

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
      setIsUploading(false);
      setUploadProgress(null);
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
                    <div className="mt-4 space-y-2">
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress || 0}%` }}
                            ></div>
                        </div>
                        <p className="text-center text-sm text-gray-400">
                            Uploading... {Math.round(uploadProgress || 0)}%
                        </p>
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
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../firebaseClient';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

    const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.total) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setError('An unexpected error occurred during upload. Please check your connection and try again.');
        setIsUploading(false);
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          await addDoc(collection(db, 'videos'), {
            owner_id: user.id,
            title: selectedFile.name,
            file_url: downloadURL,
            visibility: 'private',
            created_at: serverTimestamp(),
            views_count: 0
          });

          setSuccessMessage('Video uploaded successfully!');
          setSelectedFile(null);

          // Let the 100% progress bar show for a moment
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(null);
          }, 1000);

        } catch (e: any) {
            console.error("Error saving metadata:", e);
            setError(e.message || 'Failed to process video after upload.');
            setIsUploading(false);
        }
      }
    );
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
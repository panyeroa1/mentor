import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingSpinner } from './common/LoadingSpinner';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

export const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImage(file);
            setOriginalImagePreview(URL.createObjectURL(file));
            setEditedImage(null);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!originalImage || !prompt.trim()) {
            setError('Please select an image and enter an editing prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEditedImage(null);

        try {
            const imageBase64 = await fileToBase64(originalImage);
            const resultBase64 = await editImage(prompt, imageBase64, originalImage.type);
            setEditedImage(`data:image/jpeg;base64,${resultBase64}`);
        } catch (err) {
            console.error(err);
            setError('Failed to edit the image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">AI Image Editor</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                     <label htmlFor="image-upload" className="cursor-pointer block border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-amber-500 transition-colors">
                        {originalImagePreview ? (
                            <img src={originalImagePreview} alt="Original" className="max-h-40 mx-auto rounded-md" />
                        ) : (
                           <UploadIcon />
                        )}
                        <span className="mt-2 block text-sm font-medium text-gray-400">{originalImage ? originalImage.name : 'Click to upload an image'}</span>
                     </label>
                     <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Add a retro filter, or remove the person in the background..."
                        className="w-full h-full bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !originalImage || !prompt.trim()}
                        className="w-full bg-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-700 disabled:bg-gray-700 transition-colors"
                    >
                        {isLoading ? 'Editing...' : 'Edit Image'}
                    </button>
                </div>
            </div>

            {error && <p className="text-amber-500 text-center mb-4">{error}</p>}
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Original</h3>
                    {originalImagePreview ? (
                        <img src={originalImagePreview} alt="Original" className="max-h-80 w-auto rounded-lg shadow-lg" />
                    ) : (
                        <p className="text-gray-500">Upload an image to see it here.</p>
                    )}
                </div>
                <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Edited</h3>
                    {isLoading && <LoadingSpinner text="Generating..." />}
                    {!isLoading && editedImage && (
                         <img src={editedImage} alt="Edited" className="max-h-80 w-auto rounded-lg shadow-lg" />
                    )}
                    {!isLoading && !editedImage && (
                        <p className="text-gray-500">Your edited image will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
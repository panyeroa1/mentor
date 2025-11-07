import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const imageBase64 = await generateImage(prompt);
            setGeneratedImage(`data:image/jpeg;base64,${imageBase64}`);
        } catch (err) {
            console.error(err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">AI Image Generator (Imagen 4.0)</h2>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic image of a cat wearing a tiny wizard hat"
                    className="flex-grow bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-amber-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-amber-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </form>

            {error && <p className="text-amber-500 text-center mb-4">{error}</p>}
            
            <div className="flex-grow bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                {isLoading ? (
                    <LoadingSpinner text="Creating your image..." />
                ) : generatedImage ? (
                    <img src={generatedImage} alt={prompt} className="max-h-full max-w-full rounded-lg shadow-lg" />
                ) : (
                    <p className="text-gray-500">Your generated image will appear here.</p>
                )}
            </div>
        </div>
    );
};
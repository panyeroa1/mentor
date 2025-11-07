import React, { useState } from 'react';
import { runDeepDive } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';

export const DeepDive: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setResult('');
        setError('');

        try {
            const analysisResult = await runDeepDive(prompt);
            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError('An error occurred during the deep dive analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">Deep Dive Analysis</h2>
            <p className="text-gray-400 mb-4">For your most complex questions. Powered by Gemini 2.5 Pro with maximum thinking budget.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a complex query, paste a document for analysis, or describe a challenging problem..."
                    className="w-full bg-gray-800 text-white rounded-lg p-3 h-48 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-amber-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-amber-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors self-start"
                >
                    {isLoading ? 'Thinking...' : 'Analyze'}
                </button>
            </form>

            <div className="flex-grow bg-gray-900 rounded-lg p-4 mt-4">
                {isLoading && <LoadingSpinner text="Performing deep analysis... This may take a moment." />}
                {error && <p className="text-amber-500">{error}</p>}
                {result && <div className="text-gray-300 whitespace-pre-wrap overflow-y-auto max-h-[40vh] prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">{result}</div>}
                {!isLoading && !result && !error && <p className="text-gray-500 text-center pt-8">The in-depth analysis will appear here.</p>}
            </div>
        </div>
    );
};
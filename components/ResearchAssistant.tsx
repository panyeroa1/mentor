import React, { useState, useCallback } from 'react';
import { runGroundedSearch, runGroundedMapsSearch } from '../services/geminiService';
import type { GroundingChunk } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';

type SearchType = 'Web' | 'Maps';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export const ResearchAssistant: React.FC = () => {
    const [searchType, setSearchType] = useState<SearchType>('Web');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<{ text: string; sources: GroundingChunk[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setResult(null);
        setError('');

        try {
            if (searchType === 'Web') {
                const response = await runGroundedSearch(prompt);
                setResult({
                    text: response.text,
                    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
                });
            } else if (searchType === 'Maps') {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const response = await runGroundedMapsSearch(prompt, latitude, longitude);
                        setResult({
                            text: response.text,
                            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
                        });
                        setIsLoading(false);
                    },
                    (geoError) => {
                        console.error(geoError);
                        setError('Could not get your location. Please enable location services.');
                        setIsLoading(false);
                    }
                );
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred during the search.');
            setIsLoading(false);
        } finally {
            if(searchType === 'Web') setIsLoading(false);
        }
    };
    
    const TypeButton = useCallback(({ type }: { type: SearchType }) => (
        <button
            onClick={() => { setSearchType(type); setResult(null); setError(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${searchType === type ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
            {type} Search
        </button>
    ), [searchType]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Research Assistant</h2>
            <div className="flex gap-2 mb-4">
                <TypeButton type="Web" />
                <TypeButton type="Maps" />
            </div>

            <form onSubmit={handleSubmit} className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={searchType === 'Web' ? 'Ask about recent events or topics...' : 'Find nearby places, e.g., "good coffee shops"'}
                        className="w-full bg-gray-800 text-white rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                </div>
            </form>

            <div className="flex-grow bg-black rounded-lg p-4">
                {isLoading && <LoadingSpinner text="Searching..." />}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {result && (
                    <div>
                        <div className="text-gray-300 whitespace-pre-wrap mb-6 prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">{result.text}</div>
                        {result.sources.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-red-300 mb-2 border-t border-gray-700 pt-4">Sources</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index}>
                                            {/* FIX: Check for URI existence and provide fallback for title to prevent rendering broken links. */}
                                            {source.web?.uri && <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">{source.web.title || source.web.uri}</a>}
                                            {source.maps?.uri && <a href={source.maps.uri} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">{source.maps.title || source.maps.uri}</a>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {!isLoading && !result && !error && <p className="text-gray-500 text-center pt-8">Search results will appear here.</p>}
            </div>
        </div>
    );
};
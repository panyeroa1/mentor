

import React, { useState, useCallback } from 'react';
import { analyzeImage, analyzeVideo, transcribeAudio } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../firebaseClient';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type AnalysisType = 'Image' | 'Video' | 'Audio';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

export const ContentAnalyzer: React.FC = () => {
    const { user } = useAuth();
    const [analysisType, setAnalysisType] = useState<AnalysisType>('Image');
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult('');
            setError('');
            setUploadProgress(null);
            if (selectedFile.type.startsWith('image/')) {
                setFilePreview(URL.createObjectURL(selectedFile));
            } else if (selectedFile.type.startsWith('audio/')) {
                 setFilePreview('audio');
            } else if (selectedFile.type.startsWith('video/')) {
                setFilePreview('video');
            } else {
                 setFilePreview(null);
            }
        }
    };

    const handleVideoSubmit = async () => {
        if (!file) return;
        if (!user) {
            setError('You must be logged in to upload and analyze videos.');
            return;
        }

        setIsLoading(true);
        setResult('');
        setError('');
        setUploadProgress(0);
        
        const filePath = `${user.id}/analysis/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.total) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                setError('A network error occurred during upload.');
                setIsLoading(false);
                setUploadProgress(null);
            },
            async () => {
                // Upload completed successfully, now analyze.
                try {
                    const analysisResult = await analyzeVideo(prompt, file);
                    setResult(analysisResult);
                } catch (e: any) {
                    setError(e.message || 'Failed to analyze video after upload.');
                } finally {
                    setIsLoading(false);
                    setUploadProgress(null);
                }
            }
        );
    };

    const handleStandardSubmit = async () => {
        if (!file) return;
        setIsLoading(true);
        setResult('');
        setError('');
        setUploadProgress(null);
        
        try {
            let analysisResult = '';
            if (analysisType === 'Image') {
                const imageBase64 = await fileToBase64(file);
                analysisResult = await analyzeImage(prompt, imageBase64, file.type);
            } else if (analysisType === 'Audio') {
                const audioBase64 = await fileToBase64(file);
                analysisResult = await transcribeAudio(audioBase64, file.type);
            }
            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError('An error occurred during analysis. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!file) {
            setError('Please select a file to analyze.');
            return;
        }
        if (analysisType !== 'Audio' && !prompt.trim()) {
            setError('Please enter a prompt for the analysis.');
            return;
        }
        
        if (analysisType === 'Video') {
            handleVideoSubmit();
        } else {
            handleStandardSubmit();
        }
    };
    
    const acceptedFileTypes = {
        'Image': 'image/*',
        'Video': 'video/*',
        'Audio': 'audio/*'
    };

    const TypeButton = useCallback(({ type }: { type: AnalysisType }) => (
        <button
            onClick={() => { setAnalysisType(type); setFile(null); setFilePreview(null); setResult(''); setError(''); setUploadProgress(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${analysisType === type ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
            Analyze {type}
        </button>
    ), [analysisType]);

    const renderResultArea = () => {
        if (isLoading) {
            if (analysisType === 'Video' && uploadProgress !== null && uploadProgress < 100) {
                return (
                    <div className="w-full px-4">
                        <p className="text-center text-sm text-gray-300 mb-2">
                            Uploading... {Math.round(uploadProgress)}%
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-amber-500 h-2.5 rounded-full transition-all duration-150"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
            return <LoadingSpinner text={analysisType === 'Video' ? 'Analyzing...' : 'Processing...'} />;
        }
        if (error) return <p className="text-amber-500 text-center">{error}</p>;
        if (result) return <div className="text-gray-200 whitespace-pre-wrap overflow-y-auto max-h-96 w-full">{result}</div>;
        return <p className="text-gray-500">Analysis result will appear here.</p>;
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Content Analyzer</h2>
            <div className="flex gap-2 mb-4">
                <TypeButton type="Image" />
                <TypeButton type="Video" />
                <TypeButton type="Audio" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="flex flex-col gap-4">
                    <div className="flex-grow flex flex-col justify-center items-center border-2 border-dashed border-gray-700 rounded-lg p-4">
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={acceptedFileTypes[analysisType]} />
                        <label htmlFor="file-upload" className="cursor-pointer text-center">
                            {!filePreview && <UploadIcon />}
                            {filePreview && analysisType === 'Image' && <img src={filePreview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />}
                             {filePreview === 'audio' && <p className="text-center text-gray-400">Audio file selected: <br/> <span className="font-semibold text-gray-200">{file?.name}</span></p>}
                             {filePreview === 'video' && <p className="text-center text-gray-400">Video file selected: <br/> <span className="font-semibold text-gray-200">{file?.name}</span></p>}
                            <p className="mt-2 text-amber-400 font-semibold">
                                {file ? 'Change file' : `Click to upload ${analysisType}`}
                            </p>
                        </label>
                    </div>

                    {analysisType !== 'Audio' && (
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={analysisType === 'Video' ? `e.g., Transcribe this video, or Summarize this for me.` : `e.g., What is in this image?`}
                            className="w-full bg-gray-800 text-white rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            disabled={isLoading}
                        />
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !file}
                        className="w-full bg-amber-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-amber-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (uploadProgress !== null ? 'Uploading...' : 'Analyzing...') : `Analyze ${analysisType}`}
                    </button>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                    {renderResultArea()}
                </div>
            </div>
        </div>
    );
};
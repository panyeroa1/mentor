
import React, { useState, useRef, useEffect } from 'react';
import { useAuth, addPostToDB, addVideoToDB } from '../hooks/useAuth';
import { fileToDataUrl } from '../utils/fileUtils';
import type { Post } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { PhotoIcon, VideoIcon } from './ui/icons';

interface CreatePostProps {
    onClose: () => void;
    onPostCreated: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFilePreview(URL.createObjectURL(selectedFile));
        }
    };
    
    const handleRemoveMedia = () => {
        if(filePreview) URL.revokeObjectURL(filePreview);
        setFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!user || (!textContent.trim() && !file)) {
            return;
        }

        setIsPosting(true);
        let mediaPayload: Post['media'] | undefined;

        try {
            if (file) {
                if (file.type.startsWith('image/')) {
                    const dataUrl = await fileToDataUrl(file);
                    mediaPayload = { type: 'image', content: dataUrl };
                } else if (file.type.startsWith('video/')) {
                    const videoId = crypto.randomUUID();
                    const videoData = {
                        id: videoId,
                        owner_id: user.id,
                        title: file.name,
                        file: file,
                        visibility: 'private' as const,
                        created_at: new Date(),
                        views_count: 0
                    };
                    await addVideoToDB(videoData);
                    mediaPayload = { type: 'video', content: videoId };
                }
            }

            const newPost: Post = {
                id: crypto.randomUUID(),
                author_id: user.id,
                text_content: textContent.trim() || undefined,
                media: mediaPayload,
                created_at: new Date().toISOString(),
                like_count: 0,
                comment_count: 0,
            };

            await addPostToDB(newPost);
            onPostCreated();

        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Sorry, there was an error creating your post.");
        } finally {
            setIsPosting(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                {isPosting && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                        <LoadingSpinner text="Posting..." />
                    </div>
                )}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Create Post</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <img src={user?.avatar_url} alt="My Avatar" className="w-10 h-10 rounded-full" />
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="flex-grow bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none resize-none"
                            rows={4}
                        />
                    </div>
                    {filePreview && (
                        <div className="mt-4 relative max-h-80 overflow-hidden rounded-lg">
                            {file?.type.startsWith('image/') ? (
                                <img src={filePreview} alt="Preview" className="w-full h-auto object-contain max-h-80" />
                            ) : (
                                <video controls src={filePreview} className="w-full h-auto bg-black max-h-80" />
                            )}
                            <button onClick={handleRemoveMedia} className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 text-xs">&times;</button>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center p-4 border-t border-gray-700">
                    <div>
                        <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold p-2 rounded-md hover:bg-gray-700 transition-colors">
                            <PhotoIcon className="w-6 h-6" /> Add Photo/Video
                        </button>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isPosting || (!textContent.trim() && !file)}
                        className="bg-amber-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
};

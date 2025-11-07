
import React, { useState, useEffect, useCallback } from 'react';
import FeedCard from '../ui/FeedCard';
import { useAuth, getPostsFromDB, getVideoFromDB } from '../../hooks/useAuth';
import type { FeedItem, Post } from '../../types';
import { CreatePost } from '../CreatePost';
import { LoadingSpinner } from '../common/LoadingSpinner';

const HomeScreen: React.FC = () => {
    const { user } = useAuth();
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatePostOpen, setCreatePostOpen] = useState(false);

    const loadFeed = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        // Clean up old object URLs before creating new ones
        feedItems.forEach(item => {
            if (item.media_type === 'video' && item.media_url?.startsWith('blob:')) {
                URL.revokeObjectURL(item.media_url);
            }
        });

        const dbPosts = await getPostsFromDB();
        const items = await Promise.all(
            dbPosts.map(async (post): Promise<FeedItem> => {
                let media_url: string | undefined;
                let media_type: 'image' | 'video' | undefined;

                if (post.media) {
                    media_type = post.media.type;
                    if (post.media.type === 'image') {
                        media_url = post.media.content; // It's a data URL
                    } else if (post.media.type === 'video') {
                        const videoRecord = await getVideoFromDB(post.media.content);
                        if (videoRecord) {
                            media_url = URL.createObjectURL(videoRecord.file);
                        }
                    }
                }

                return {
                    id: post.id,
                    author: user, // Simplified for single user app
                    text_content: post.text_content,
                    created_at: post.created_at,
                    like_count: post.like_count,
                    comment_count: post.comment_count,
                    media_url,
                    media_type,
                    type: post.media?.type === 'video' ? 'video' : 'post',
                };
            })
        );
        setFeedItems(items);
        setIsLoading(false);
    }, [user]); // Removed feedItems from dependencies to prevent loop

    useEffect(() => {
        loadFeed();

        return () => {
            // Final cleanup on component unmount
            feedItems.forEach(item => {
                if (item.media_type === 'video' && item.media_url?.startsWith('blob:')) {
                    URL.revokeObjectURL(item.media_url);
                }
            });
        };
    }, [loadFeed]);
    
    const handlePostCreated = () => {
        setCreatePostOpen(false);
        loadFeed();
    };


    return (
        <div>
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center h-16">
                    <img src="https://aiteksoftware.site/magnetar/logo.png" alt="Magnetar Logo" className="h-8 w-auto" />
                    <img src={user?.avatar_url} alt="My Avatar" className="w-8 h-8 rounded-full" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-0 md:py-4">
                {/* Create Post section */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <img src={user?.avatar_url} alt="My Avatar" className="w-10 h-10 rounded-full" />
                    <button onClick={() => setCreatePostOpen(true)} className="flex-grow text-left bg-gray-900 text-gray-400 rounded-full px-4 py-2 hover:bg-gray-700 transition-colors">
                        What's on your mind?
                    </button>
                </div>

                {/* Feed */}
                {isLoading ? (
                    <div className="flex justify-center mt-16">
                        <LoadingSpinner text="Loading Feed..." />
                    </div>
                ) : feedItems.length > 0 ? (
                    feedItems.map(item => (
                        <FeedCard key={item.id} item={item} />
                    ))
                ) : (
                     <div className="text-center py-16 text-gray-500">
                        <h3 className="text-lg font-semibold text-white">Your Feed is Empty</h3>
                        <p>Create your first post to get started!</p>
                    </div>
                )}
            </main>
            
            {isCreatePostOpen && (
                <CreatePost 
                    onClose={() => setCreatePostOpen(false)} 
                    onPostCreated={handlePostCreated}
                />
            )}
        </div>
    );
};

export default HomeScreen;
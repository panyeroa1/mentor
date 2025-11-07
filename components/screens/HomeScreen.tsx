import React from 'react';
import FeedCard from '../ui/FeedCard';
import { useAuth } from '../../hooks/useAuth';
import type { FeedItem } from '../../types';

const mockFeedItems: FeedItem[] = [
    {
        id: '1',
        author: { id: 'mentor-1', full_name: 'Jane Smith', role: 'mentor', avatar_url: 'https://i.pravatar.cc/150?u=janesmith' },
        type: 'training',
        media_title: 'Introduction to FastAPI',
        text_content: 'Just dropped a new training module covering the basics of FastAPI for modern web development. Perfect for beginners!',
        media_thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14694dd?w=400&q=80',
        created_at: '2h ago',
        like_count: 42,
        comment_count: 8,
    },
    {
        id: '2',
        author: { id: 'mentor-2', full_name: 'Mark Johnson', role: 'mentor', avatar_url: 'https://i.pravatar.cc/150?u=markjohnson' },
        type: 'post',
        text_content: 'What are your biggest challenges when it comes to client presentations? Let\'s discuss in the comments! 👇',
        created_at: '5h ago',
        like_count: 18,
        comment_count: 12,
    },
     {
        id: '3',
        author: { id: 'mentor-1', full_name: 'Jane Smith', role: 'mentor', avatar_url: 'https://i.pravatar.cc/150?u=janesmith' },
        type: 'video',
        media_title: 'Client Pitch Deck - Q3 2024',
        text_content: 'Sharing a recent presentation video for feedback. This one is unlisted, just for my trusted network.',
        media_thumbnail_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80',
        created_at: '1d ago',
        like_count: 25,
        comment_count: 4,
    }
];


const HomeScreen: React.FC = () => {
    const { user } = useAuth();

    return (
        <div>
            {/* Header */}
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center h-16">
                    <img src="https://aiteksoftware.site/magnetar/logo.png" alt="Magnetar Logo" className="h-8 w-auto" />
                    <img src={user?.avatar_url} alt="My Avatar" className="w-8 h-8 rounded-full" />
                </div>
            </header>

            {/* Feed */}
            <div className="max-w-3xl mx-auto p-4 md:p-0 md:py-4">
               {mockFeedItems.map(item => (
                   <FeedCard key={item.id} item={item} />
               ))}
            </div>
        </div>
    );
};

export default HomeScreen;
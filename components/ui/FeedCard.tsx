
import React from 'react';
import type { FeedItem } from '../../types';
import { LikeIcon, CommentIcon, ShareIcon } from './icons';
import { timeAgo } from '../../utils/timeUtils';

interface FeedCardProps {
  item: FeedItem;
}

const FeedCard: React.FC<FeedCardProps> = ({ item }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mb-4">
      <div className="p-4">
        {/* Card Header */}
        <div className="flex items-center mb-3">
          <img src={item.author.avatar_url} alt={item.author.full_name} className="w-11 h-11 rounded-full mr-3" />
          <div>
            <p className="font-bold text-white">{item.author.full_name}</p>
            <p className="text-xs text-gray-400">{timeAgo(item.created_at)} &middot; <span className="capitalize font-semibold text-amber-500">{item.type}</span></p>
          </div>
        </div>

        {/* Card Body */}
        {item.text_content && <p className="text-gray-300 mb-3 whitespace-pre-wrap">{item.text_content}</p>}
        
        {item.media_url && (
          <div className="rounded-lg overflow-hidden border border-gray-700">
            {item.media_type === 'image' ? (
              <img src={item.media_url} alt="Feed media" className="w-full h-auto" />
            ) : item.media_type === 'video' ? (
              <video controls src={item.media_url} className="w-full h-auto bg-black" />
            ) : null}
          </div>
        )}

      </div>
        {/* Card Footer Actions */}
        <div className="flex justify-around border-t border-gray-700">
            <button className="flex-1 flex items-center justify-center py-3 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
                <LikeIcon className="w-5 h-5 mr-2" /> {item.like_count}
            </button>
             <button className="flex-1 flex items-center justify-center py-3 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition-colors border-l border-r border-gray-700">
                <CommentIcon className="w-5 h-5 mr-2" /> {item.comment_count}
            </button>
             <button className="flex-1 flex items-center justify-center py-3 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition-colors">
                <ShareIcon className="w-5 h-5 mr-2" /> Share
            </button>
        </div>
    </div>
  );
};

export default FeedCard;
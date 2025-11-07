

export type UserRole = 'mentor' | 'learner' | 'client' | 'admin';

export interface Profile {
  id: string; // UUID, matches auth.users(id)
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
}

export interface Post {
  id: string;
  author_id: string;
  text_content?: string;
  media?: {
    type: 'image' | 'video';
    // For image: base64 data URL
    // For video: ID of the video in the 'videos' object store
    content: string;
  };
  created_at: string; // ISO timestamp
  like_count: number;
  comment_count: number;
}

export type FeedItemType = 'post' | 'training' | 'seminar' | 'video';

export interface FeedItem {
  id: string; // UUID from Post
  author: Profile;
  type: FeedItemType;
  text_content?: string;
  created_at: string; // ISO timestamp
  like_count: number;
  comment_count: number;
  media_url?: string; // for image or video
  media_type?: 'image' | 'video';
}


export interface Video {
  id: string; // UUID
  owner: Profile;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  visibility: 'public' | 'unlisted' | 'private';
  views_count: number;
}

export interface Training {
  id: string; // UUID
  mentor: Profile;
  title: string;
  description?: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  main_video_id?: string; // UUID
}

// FIX: Added ChatMessage type for use in Chatbot component.
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// FIX: Added GroundingChunk type for use in ResearchAssistant component.
export interface GroundingChunk {
  web?: {
    // FIX: Made uri and title optional to match the @google/genai library type.
    uri?: string;
    title?: string;
  };
  maps?: {
    // FIX: Made uri and title optional to match the @google/genai library type.
    uri?: string;
    title?: string;
  };
}
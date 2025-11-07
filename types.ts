

export type UserRole = 'mentor' | 'learner' | 'client' | 'admin';

export interface Profile {
  id: string; // UUID, matches auth.users(id)
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
}

export type FeedItemType = 'post' | 'training' | 'seminar' | 'video';

export interface FeedItem {
  id: string; // UUID
  author: Profile;
  type: FeedItemType;
  ref_id?: string; // UUID reference to the actual content
  text_content?: string;
  created_at: string; // ISO timestamp
  like_count: number;
  comment_count: number;
  media_thumbnail_url?: string;
  media_title?: string;
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

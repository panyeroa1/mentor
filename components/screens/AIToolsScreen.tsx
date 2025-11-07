
import React, { useState } from 'react';
import { AIToolsIcon, BackIcon, CommentIcon, LightbulbIcon, MessageIcon, PhoneIcon, ScriptIcon, ShieldIcon, VideoIcon } from '../ui/icons';
import { runQuickResponse } from '../../services/geminiService';
import { LoadingSpinner } from '../common/LoadingSpinner';

import { Chatbot } from '../Chatbot';
import { ContentAnalyzer } from '../ContentAnalyzer';
import { ImageEditor } from '../ImageEditor';
import { ImageGenerator } from '../ImageGenerator';
import { LiveAssistant } from '../LiveAssistant';
import { ResearchAssistant } from '../ResearchAssistant';
import { DeepDive } from '../DeepDive';
import { CallCenterAgent } from '../CallCenterAgent';

interface PromptInfo {
    placeholder: string;
    systemPrompt: string;
}

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    component?: React.ReactElement;
    promptInfo?: PromptInfo;
}

const allTools: Tool[] = [
    // MLM Tools
    { id: 'prospect', name: 'Prospecting Messages', description: 'Generate personalized outreach messages.', icon: MessageIcon, promptInfo: { placeholder: 'Describe your ideal prospect. E.g., "A 35-year-old working mom in the Philippines who is interested in health and wellness products and looking for a side income."', systemPrompt: 'You are an expert network marketing script writer. Generate 3 friendly, non-pushy, and engaging Facebook Messenger outreach messages for the following prospect:' } },
    { id: 'product_post', name: 'Product Posts', description: 'Create engaging social media posts for products.', icon: AIToolsIcon, promptInfo: { placeholder: 'Enter product name and key benefits. E.g., "Ascendra Coffee, helps with weight loss, boosts energy, contains Glutathione."', systemPrompt: 'You are a social media marketing expert for an MLM company. Write an exciting and benefit-focused Facebook post for the following product. Include emojis and a call-to-action.' } },
    { id: 'objection_handler', name: 'Objection Handler', description: 'Get smart rebuttals to common objections.', icon: CommentIcon, promptInfo: { placeholder: 'Enter the prospect\'s objection. E.g., "Is this a pyramid scheme?" or "I don\'t have time for this."', systemPrompt: 'You are a veteran network marketing coach. Provide a confident, respectful, and effective response to the following prospect objection:' } },
    { id: 'training_script', name: 'Training Script Writer', description: 'Create scripts for training new downlines.', icon: ScriptIcon, promptInfo: { placeholder: 'Enter the training topic. E.g., "How to do a product demo for Ascendra Coffee" or "Explaining the compensation plan basics."', systemPrompt: 'You are an MLM training director. Write a clear, step-by-step training script for new distributors on the following topic:' } },
    { id: 'presentation_builder', name: 'Presentation Builder', description: 'Generate outlines for opportunity presentations.', icon: ScriptIcon, promptInfo: { placeholder: 'Enter the target audience for the presentation. E.g., "A group of college students" or "A room of experienced sales professionals."', systemPrompt: 'You are a master presenter. Create a compelling 5-point outline for a business opportunity presentation for the following audience:' } },
    { id: 'video_script', name: 'Short Video Scripts', description: 'Create scripts for TikTok, Reels, and Shorts.', icon: VideoIcon, promptInfo: { placeholder: 'Describe the video\'s goal. E.g., "A 30-second video showing the benefits of our new skincare product" or "A quick teaser for our upcoming business seminar."', systemPrompt: 'You are a viral video scriptwriter. Create a short, punchy, and engaging video script (including visual cues) for the following goal:' } },
    { id: 'motivation_bot', name: 'Team Motivation Bot', description: 'Generate motivational messages for your team.', icon: MessageIcon, promptInfo: { placeholder: 'What is your team celebrating? E.g., "We just hit our monthly sales target!" or "A new member just joined."', systemPrompt: 'You are an inspiring team leader. Write a powerful and encouraging motivational message for a team chat based on this context:' } },
    { id: 'content_ideas', name: 'Content Idea Generator', description: 'Brainstorm content to build your personal brand.', icon: LightbulbIcon, promptInfo: { placeholder: 'Enter your niche or area of expertise. E.g., "health and wellness," "financial literacy for network marketers," "leadership skills."', systemPrompt: 'You are a content strategy expert. Generate 5 creative content ideas (blog posts, videos, or live streams) for a network marketer in the following niche:' } },
    { id: 'compliance_checker', name: 'Ad Compliance Checker', description: 'Check your ad copy for compliance red flags.', icon: ShieldIcon, promptInfo: { placeholder: 'Paste your ad copy or social media post here.', systemPrompt: 'You are an MLM compliance officer. Review the following text for potential compliance issues like income claims or unapproved health claims. Point out the potential issues and suggest safer alternatives.' } },
    { id: 'follow_up', name: 'Lead Follow-up Helper', description: 'Generate a sequence of follow-up messages.', icon: MessageIcon, promptInfo: { placeholder: 'Describe the lead and the last interaction. E.g., "A prospect named Maria attended our webinar yesterday but hasn\'t replied yet."', systemPrompt: 'You are a sales follow-up expert. Write a friendly, non-annoying 3-message follow-up sequence (spaced out over a few days) for the following lead:' } },
    
    // Existing Tools
    { id: 'call_center_agent', name: 'Live Agent Call', description: 'Speak with Vanessa, an Ascendra presenter.', icon: PhoneIcon, component: <CallCenterAgent /> },
    { id: 'chatbot', name: 'AI Chat Assistant', description: 'A friendly AI to answer your questions.', icon: CommentIcon, component: <Chatbot /> },
    { id: 'content_analyzer', name: 'Content Analyzer', description: 'Analyze images, video, or audio files.', icon: AIToolsIcon, component: <ContentAnalyzer /> },
    { id: 'image_editor', name: 'AI Image Editor', description: 'Edit images with text prompts.', icon: AIToolsIcon, component: <ImageEditor /> },
    { id: 'image_gen', name: 'AI Image Generator', description: 'Create stunning visuals with AI.', icon: AIToolsIcon, component: <ImageGenerator /> },
    { id: 'live_assistant', name: 'Live AI Assistant', description: 'Have a real-time voice conversation.', icon: AIToolsIcon, component: <LiveAssistant /> },
    { id: 'research', name: 'Research Assistant', description: 'Get up-to-date info from the web.', icon: AIToolsIcon, component: <ResearchAssistant /> },
    { id: 'deep_dive', name: 'Deep Dive Analysis', description: 'For your most complex questions.', icon: AIToolsIcon, component: <DeepDive /> },
];

const GenericTool: React.FC<{ tool: Tool, onBack: () => void }> = ({ tool, onBack }) => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !tool.promptInfo) return;

        setIsLoading(true);
        setResult('');
        setError('');

        try {
            const fullPrompt = `${tool.promptInfo.systemPrompt}\n\nHere is the user's input:\n${prompt}`;
            const analysisResult = await runQuickResponse(fullPrompt);
            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!tool.promptInfo) return null;

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="text-amber-400 p-2 rounded-full hover:bg-gray-800">
                    <BackIcon />
                </button>
                <h2 className="text-xl font-bold text-amber-400 ml-2">{tool.name}</h2>
            </div>
            <p className="text-gray-400 mb-4">{tool.description}</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={tool.promptInfo.placeholder}
                    className="w-full bg-gray-800 text-white rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={isLoading}
                />
                 <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="bg-amber-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-amber-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors self-start"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </form>

            <div className="flex-grow bg-gray-900 rounded-lg p-4 mt-4 overflow-y-auto">
                {isLoading && <LoadingSpinner text="Generating..." />}
                {error && <p className="text-amber-500">{error}</p>}
                {result && <div className="text-gray-300 whitespace-pre-wrap">{result}</div>}
                {!isLoading && !result && !error && <p className="text-gray-500 text-center pt-8">The result will appear here.</p>}
            </div>
        </div>
    );
};

const AIToolsScreen: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    if (selectedTool) {
        if (selectedTool.component) {
            return (
                 <div className="h-full flex flex-col p-4">
                    <div className="flex items-center mb-4 flex-shrink-0">
                        <button onClick={() => setSelectedTool(null)} className="text-amber-400 p-2 rounded-full hover:bg-gray-800">
                            <BackIcon />
                        </button>
                         <h2 className="text-xl font-bold text-amber-400 ml-2">{selectedTool.name}</h2>
                    </div>
                    <div className="flex-grow min-h-0">
                         {selectedTool.component}
                    </div>
                </div>
            );
        }
        return <GenericTool tool={selectedTool} onBack={() => setSelectedTool(null)} />;
    }

    return (
        <div>
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-800">
                <div className="max-w-3xl mx-auto px-4 py-3 h-16 flex items-center">
                    <h1 className="text-xl font-bold text-white">AI Toolkit</h1>
                </div>
            </header>
            <div className="max-w-3xl mx-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allTools.map((tool) => (
                        <button key={tool.id} onClick={() => setSelectedTool(tool)} className="bg-gray-800 p-4 rounded-lg text-left hover:bg-gray-700 hover:ring-2 hover:ring-amber-500 transition-all duration-200">
                            <tool.icon className="w-8 h-8 text-amber-400 mb-3" />
                            <h3 className="font-bold text-white mb-1">{tool.name}</h3>
                            <p className="text-xs text-gray-400">{tool.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIToolsScreen;

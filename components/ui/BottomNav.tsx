
import React from 'react';
import type { Screen } from '../Layout';
import { HomeIcon, AIToolsIcon, VideoIcon, ProfileIcon, PhoneIcon } from './icons';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const navItems: { screen: Screen; icon: React.FC<{ className?: string }> }[] = [
  { screen: 'Home', icon: HomeIcon },
  { screen: 'AITools', icon: AIToolsIcon },
  { screen: 'Call', icon: PhoneIcon },
  { screen: 'Videos', icon: VideoIcon },
  { screen: 'Profile', icon: ProfileIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-around items-center md:hidden">
      {navItems.map(({ screen, icon: Icon }) => (
        <button
          key={screen}
          onClick={() => setActiveScreen(screen)}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <Icon className={`w-6 h-6 mb-1 transition-colors ${
            activeScreen === screen ? 'text-amber-500' : 'text-gray-400'
          }`} />
          <span className={`text-xs font-medium transition-colors ${
            activeScreen === screen ? 'text-amber-500' : 'text-gray-400'
          }`}>
            {screen === 'AITools' ? 'AI Tools' : screen}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;


import React, { useState } from 'react';
import BottomNav from './ui/BottomNav';
import HomeScreen from './screens/HomeScreen';
import AIToolsScreen from './screens/AIToolsScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';
import { CallCenterAgent } from './CallCenterAgent';

export type Screen = 'Home' | 'AITools' | 'Call' | 'Videos' | 'Profile';

const screens: Record<Screen, React.FC> = {
  Home: HomeScreen,
  AITools: AIToolsScreen,
  Call: CallCenterAgent,
  Videos: VideosScreen,
  Profile: ProfileScreen,
};

const Layout: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('Home');
  const ActiveComponent = screens[activeScreen];

  return (
    // This div ensures content doesn't get hidden behind the bottom nav
    <div className="pb-16 md:pb-0">
      <main>
        <ActiveComponent />
      </main>
      <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  );
};

export default Layout;

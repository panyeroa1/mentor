
import React, { useState } from 'react';
import BottomNav from './ui/BottomNav';
import HomeScreen from './screens/HomeScreen';
import TrainingsScreen from './screens/TrainingsScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';

export type Screen = 'Home' | 'Trainings' | 'Videos' | 'Profile';

const screens: Record<Screen, React.FC> = {
  Home: HomeScreen,
  Trainings: TrainingsScreen,
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

import React from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

const SplashScreen: React.FC = () => (
  <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-pulse">
      <img src="https://aiteksoftware.site/magnetar/logo.png" alt="Magnetar Logo" className="h-32 w-auto" />
    </div>
  </div>
);

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <SplashScreen />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-900">
      <Layout />
    </div>
  );
};

export default App;

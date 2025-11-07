import React from 'react';
import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Layout from './components/Layout';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can add a global loading spinner here
    return <div className="w-screen h-screen flex items-center justify-center bg-black"><p className="text-white">Loading...</p></div>;
  }

  return (
    <div className="w-full min-h-screen bg-black">
      {user ? <Layout /> : <AuthScreen />}
    </div>
  );
};

export default App;
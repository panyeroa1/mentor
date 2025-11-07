import React from 'react';

const TrainingsScreen: React.FC = () => {
  return (
    <div>
      <header className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-3">
              <h1 className="text-xl font-bold text-white">Trainings</h1>
          </div>
      </header>
      <div className="max-w-3xl mx-auto p-4 text-center">
        <p className="text-gray-400 mt-8">Training modules will be listed here.</p>
      </div>
    </div>
  );
};

export default TrainingsScreen;
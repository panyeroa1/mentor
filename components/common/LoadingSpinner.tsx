import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
    <span className="text-red-400">{text}</span>
  </div>
);
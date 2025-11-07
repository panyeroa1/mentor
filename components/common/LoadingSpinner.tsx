import React from 'react';

export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center space-y-2">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    <span className="text-amber-400">{text}</span>
  </div>
);
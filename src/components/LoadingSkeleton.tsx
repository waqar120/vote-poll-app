import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-6">
        {/* Status and votes skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded-full w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>

        {/* Question skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-6 bg-gray-200 rounded w-full"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Options skeleton */}
        <div className="space-y-2 mb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-4"></div>
            </div>
          ))}
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}; 
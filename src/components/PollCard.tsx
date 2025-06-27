import React from 'react';
import { Link } from 'react-router-dom';
import { Poll } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  poll: Poll;
}

export const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();
  const timeLeft = poll.ends_at
    ? formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })
    : null;

  return (
    <Link
      to={`/poll/${poll.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden"
    >
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              poll.is_active && !isExpired
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {poll.is_active && !isExpired ? 'Active' : 'Ended'}
          </span>
          {poll.total_votes > 0 && (
            <span className="text-sm text-gray-500">
              {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {poll.question}
        </h3>

        {/* Options Preview */}
        <div className="space-y-2 mb-4">
          {poll.options.slice(0, 3).map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
            >
              <span className="text-gray-700 truncate">{option.text}</span>
              <span className="text-gray-500 ml-2">{option.votes}</span>
            </div>
          ))}
          {poll.options.length > 3 && (
            <div className="text-sm text-gray-500 text-center">
              +{poll.options.length - 3} more option{poll.options.length - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
          </span>
          {timeLeft && (
            <span className={isExpired ? 'text-red-500' : 'text-blue-500'}>
              {isExpired ? 'Expired' : `Ends ${timeLeft}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}; 
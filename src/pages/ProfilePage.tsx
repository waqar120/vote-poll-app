import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Poll } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPolls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user polls:', error);
        return;
      }

      setPolls(data || []);
    } catch (error) {
      console.error('Error fetching user polls:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserPolls();
    }
  }, [user, fetchUserPolls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Email</h3>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Total Polls</h3>
            <p className="text-2xl font-bold text-primary-600">{polls.length}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Total Votes</h3>
            <p className="text-2xl font-bold text-green-600">
              {polls.reduce((sum, poll) => sum + poll.total_votes, 0)}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
          <Link
            to="/create"
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Create New Poll
          </Link>
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any polls yet.</p>
            <Link
              to="/create"
              className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Create Your First Poll
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <div
                key={poll.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {poll.question}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{poll.total_votes} votes</span>
                      <span>•</span>
                      <span>{poll.options.length} options</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          poll.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {poll.is_active ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/poll/${poll.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={signOut}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}; 
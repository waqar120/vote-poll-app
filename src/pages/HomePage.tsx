import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Poll, PollListFilter } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PollCard } from '../components/PollCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useDebounce } from '../hooks/useDebounce';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PollListFilter>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const debouncedSearch = useDebounce(filter.search, 500);

  const fetchPolls = useCallback(async (resetList = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('polls')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filter.status === 'ended') {
        query = query.eq('is_active', false);
      } else if (filter.status === 'my-polls' && user) {
        query = query.eq('created_by', user.id);
      }

      if (debouncedSearch) {
        query = query.ilike('question', `%${debouncedSearch}%`);
      }

      const offset = resetList ? 0 : (filter.page - 1) * filter.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + filter.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching polls:', error);
        return;
      }

      const pollsWithVotes = await Promise.all(
        (data || []).map(async (poll) => {
          const { count: voteCount } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);

          return {
            ...poll,
            total_votes: voteCount || 0,
          };
        })
      );

      if (resetList) {
        setPolls(pollsWithVotes);
      } else {
        setPolls((prev) => [...prev, ...pollsWithVotes]);
      }

      setTotalCount(count || 0);
      setHasMore((count || 0) > offset + filter.limit);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  }, [filter.status, filter.page, filter.limit, debouncedSearch, user]);

  useEffect(() => {
    setFilter((prev) => ({ ...prev, page: 1 }));
    fetchPolls(true);
  }, [filter.status, debouncedSearch, fetchPolls]);

  useEffect(() => {
    if (filter.page > 1) {
      fetchPolls(false);
    }
  }, [filter.page, fetchPolls]);

  const handleFilterChange = (status: PollListFilter['status']) => {
    setFilter((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleSearchChange = (search: string) => {
    setFilter((prev) => ({ ...prev, search, page: 1 }));
  };

  const loadMore = () => {
    setFilter((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Real-time Polling Made Simple
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create polls, gather opinions, and see results in real-time
        </p>
        {user ? (
          <Link
            to="/create"
            className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium text-lg"
          >
            Create Your First Poll
          </Link>
        ) : (
          <div className="space-x-4">
            <Link
              to="/signup"
              className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium text-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-primary-500 text-primary-500 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors font-medium text-lg"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all' as const, label: 'All Polls' },
              { key: 'active' as const, label: 'Active' },
              { key: 'ended' as const, label: 'Ended' },
              ...(user ? [{ key: 'my-polls' as const, label: 'My Polls' }] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFilterChange(key)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter.status === key
                    ? 'bg-white text-primary-500 shadow-sm'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search polls..."
              value={filter.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Polls Grid */}
      {loading && polls.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingSkeleton key={index} />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
          <p className="text-gray-600 mb-6">
            {filter.search ? 'Try adjusting your search terms.' : 'Be the first to create a poll!'}
          </p>
          {user && (
            <Link
              to="/create"
              className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Create Poll
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-center mt-8 text-gray-600">
            Showing {polls.length} of {totalCount} polls
          </div>
        </>
      )}
    </div>
  );
}; 
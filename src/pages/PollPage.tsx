import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getIpHash } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Poll } from '../types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { PollResults } from '../components/PollResults';

export const PollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  const fetchPoll = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        navigate('/');
        return;
      }

      // Calculate vote counts
      const { data: votes } = await supabase
        .from('votes')
        .select('selected_options')
        .eq('poll_id', id);

      const optionVotes: { [key: string]: number } = {};
      votes?.forEach((vote) => {
        vote.selected_options.forEach((optionId: string) => {
          optionVotes[optionId] = (optionVotes[optionId] || 0) + 1;
        });
      });

      const updatedOptions = data.options.map((option: any) => ({
        ...option,
        votes: optionVotes[option.id] || 0,
      }));

      const totalVotes = Object.values(optionVotes).reduce((sum: number, count: number) => sum + count, 0);

      setPoll({
        ...data,
        options: updatedOptions,
        total_votes: totalVotes,
      });

      // Check if user has voted
      if (user) {
        const { data: userVote } = await supabase
          .from('votes')
          .select('selected_options')
          .eq('poll_id', id)
          .eq('user_id', user.id)
          .single();

        if (userVote) {
          setSelectedOptions(userVote.selected_options);
          setHasVoted(true);
        }
      } else {
        const voteKey = `poll_${id}_voted`;
        const hasVotedLocally = localStorage.getItem(voteKey);
        if (hasVotedLocally) {
          setHasVoted(true);
          setSelectedOptions(JSON.parse(hasVotedLocally));
        }
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, user]);

  const submitVote = async () => {
    if (!id || !poll || selectedOptions.length === 0) return;

    try {
      setSubmitting(true);

      let voteData: any = {
        poll_id: id,
        selected_options: selectedOptions,
      };

      if (user) {
        voteData.user_id = user.id;
      } else {
        voteData.ip_hash = await getIpHash();
      }

      if (!hasVoted) {
        await supabase.from('votes').insert([voteData]);

        if (!user) {
          const voteKey = `poll_${id}_voted`;
          localStorage.setItem(voteKey, JSON.stringify(selectedOptions));
        }
      }

      setHasVoted(true);
      toast.success('Vote submitted!');
      
      await fetchPoll();
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted) return;

    if (poll?.settings.allowMultipleSelections) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [id, fetchPoll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Poll not found</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.question}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}</span>
            <span>•</span>
            <span>{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              poll.is_active && !isExpired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {poll.is_active && !isExpired ? 'Active' : 'Ended'}
            </span>
          </div>
        </div>

        {!hasVoted && poll.is_active && !isExpired ? (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cast Your Vote</h3>
            <div className="space-y-3">
              {poll.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOptions.includes(option.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type={poll.settings.allowMultipleSelections ? 'checkbox' : 'radio'}
                    name="poll-option"
                    value={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => handleOptionSelect(option.id)}
                    className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="text-gray-900">{option.text}</span>
                </label>
              ))}
            </div>

            {selectedOptions.length > 0 && (
              <button
                onClick={submitVote}
                disabled={submitting}
                className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Results</h3>
            <PollResults poll={poll} />
          </div>
        )}
      </div>
    </div>
  );
}; 
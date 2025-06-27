import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PollSettings } from '../types';
import toast from 'react-hot-toast';

interface CreatePollFormData {
  question: string;
  options: { text: string }[];
  settings: PollSettings;
}

export const CreatePollPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePollFormData>({
    defaultValues: {
      question: '',
      options: [{ text: '' }, { text: '' }],
      settings: {
        allowMultipleSelections: false,
        showResultsBeforeVoting: false,
        allowChangeVote: true,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const onSubmit = async (data: CreatePollFormData) => {
    try {
      setLoading(true);
      console.log('Starting poll creation with data:', data);

      // Ensure user profile exists first
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user!.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileCheckError);
        toast.error('Failed to verify user profile');
        return;
      }

      // Create profile if it doesn't exist
      if (!existingProfile) {
        console.log('Creating user profile...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: user!.id,
            email: user!.email!,
            created_polls_count: 0
          }]);

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          toast.error('Failed to create user profile');
          return;
        }
        console.log('User profile created successfully');
      }

      // Filter out empty options
      const validOptions = data.options
        .filter((option) => option.text.trim() !== '')
        .map((option, index) => ({
          id: `option_${index}`,
          text: option.text.trim(),
          votes: 0,
        }));

      if (validOptions.length < 2) {
        toast.error('Please provide at least 2 options');
        setLoading(false);
        return;
      }

      if (validOptions.length > 10) {
        toast.error('Maximum 10 options allowed');
        setLoading(false);
        return;
      }

      const pollData = {
        question: data.question.trim(),
        options: validOptions,
        settings: data.settings,
        created_by: user!.id,
        ends_at: data.settings.endDate || null,
        is_active: true,
      };

      console.log('Attempting to insert poll data:', pollData);

      const { data: newPoll, error } = await supabase
        .from('polls')
        .insert([pollData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating poll:', error);
        toast.error(`Failed to create poll: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('Poll created successfully:', newPoll);

      // Update user's poll count
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('created_polls_count')
          .eq('id', user!.id)
          .single();
        
        if (profileError) {
          console.warn('Could not fetch profile for poll count update:', profileError);
        } else if (profile) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ created_polls_count: (profile.created_polls_count || 0) + 1 })
            .eq('id', user!.id);
          
          if (updateError) {
            console.warn('Could not update poll count:', updateError);
          }
        }
      } catch (profileError) {
        console.warn('Error updating poll count:', profileError);
      }

      toast.success('Poll created successfully!');
      navigate(`/poll/${newPoll.id}`);
    } catch (error) {
      console.error('Unexpected error creating poll:', error);
      toast.error('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (fields.length < 10) {
      append({ text: '' });
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Poll</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Question */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Poll Question *
            </label>
            <textarea
              {...register('question', {
                required: 'Question is required',
                minLength: {
                  value: 5,
                  message: 'Question must be at least 5 characters',
                },
                maxLength: {
                  value: 200,
                  message: 'Question must be less than 200 characters',
                },
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What would you like to ask?"
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Answer Options *
            </label>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      {...register(`options.${index}.text` as const, {
                        maxLength: {
                          value: 100,
                          message: 'Option must be less than 100 characters',
                        },
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                    />
                    {errors.options?.[index]?.text && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.options[index]?.text?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {fields.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Option
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Poll Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('settings.allowMultipleSelections')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  Allow multiple selections
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('settings.showResultsBeforeVoting')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  Show results before voting
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('settings.allowChangeVote')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm text-gray-700">
                  Allow users to change their vote
                </label>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  {...register('settings.endDate')}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
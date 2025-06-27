export interface User {
  id: string;
  email?: string;
  created_at?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollSettings {
  allowMultipleSelections: boolean;
  showResultsBeforeVoting: boolean;
  allowChangeVote: boolean;
  endDate?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  settings: PollSettings;
  created_by: string;
  created_at: string;
  ends_at?: string;
  total_votes: number;
  is_active: boolean;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id?: string;
  ip_hash?: string;
  selected_options: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  created_polls_count: number;
}

export interface PollListFilter {
  status: 'all' | 'active' | 'ended' | 'my-polls';
  search: string;
  page: number;
  limit: number;
}



export interface VoteData {
  poll_id: string;
  selected_options: string[];
}

export interface PollStats {
  total_votes: number;
  active_viewers: number;
  options_stats: {
    option_id: string;
    votes: number;
    percentage: number;
  }[];
} 
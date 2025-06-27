# Poll App

A modern real-time polling application built with React, TypeScript, and Supabase.

## Features

- 🔐 **User Authentication** with Supabase Auth
- 📊 **Create Polls** with multiple options and settings  
- 🗳️ **Real-time Voting** with live results
- 📱 **Responsive Design** for all devices
- 🎨 **Modern UI** with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Libraries**: React Hook Form, React Router, Recharts

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poll-app
   npm install
   ```

2. **Set up environment variables**
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Database Setup

Create these tables in your Supabase project:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_polls_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  settings JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  ip_hash TEXT,
  selected_options TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## License

MIT License 
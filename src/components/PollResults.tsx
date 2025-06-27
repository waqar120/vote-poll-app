import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Poll } from '../types';

interface PollResultsProps {
  poll: Poll;
}

type ViewMode = 'bar' | 'pie' | 'list';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export const PollResults: React.FC<PollResultsProps> = ({ poll }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bar');

  const chartData = poll.options
    .map((option) => ({
      name: option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text,
      fullName: option.text,
      votes: option.votes,
      percentage: poll.total_votes > 0 ? Math.round((option.votes / poll.total_votes) * 100) : 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const exportToCSV = () => {
    const csvContent = [
      ['Option', 'Votes', 'Percentage'],
      ...poll.options.map((option) => [
        option.text,
        option.votes.toString(),
        poll.total_votes > 0 ? `${Math.round((option.votes / poll.total_votes) * 100)}%` : '0%',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-results-${poll.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAsImage = () => {
    // Create a canvas element for image export
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(poll.question, canvas.width / 2, 40);

    // Draw results
    let y = 100;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';

    poll.options.forEach((option, index) => {
      const percentage = poll.total_votes > 0 ? Math.round((option.votes / poll.total_votes) * 100) : 0;
      
      // Draw option text
      ctx.fillStyle = '#374151';
      ctx.fillText(`${option.text}: ${option.votes} votes (${percentage}%)`, 50, y);
      
      // Draw bar
      const barWidth = (percentage / 100) * 600;
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fillRect(50, y + 10, barWidth, 20);
      
      y += 60;
    });

    // Download the image
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll-results-${poll.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  };

  if (poll.total_votes === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No votes yet. Be the first to vote!</p>
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'bar'
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600 hover:text-primary-500'
            }`}
          >
            📊 Bar Chart
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'pie'
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600 hover:text-primary-500'
            }`}
          >
            🥧 Pie Chart
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-gray-600 hover:text-primary-500'
            }`}
          >
            📋 List View
          </button>
        </div>

        {/* Export Controls */}
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            📄 Export CSV
          </button>
          <button
            onClick={exportAsImage}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            🖼️ Export Image
          </button>
        </div>
      </div>

      {/* Results Display */}
      {viewMode === 'bar' && (
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, 'Votes']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="votes" fill="#3b82f6" radius={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'pie' && (
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="votes"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, 'Votes']}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {chartData.map((option, index) => (
            <div
              key={option.name}
              className="border border-gray-200 rounded-lg p-4 animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 flex items-center">
                  <span
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  {option.fullName}
                </span>
                <span className="text-sm text-gray-600">
                  {option.votes} vote{option.votes !== 1 ? 's' : ''} ({option.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${option.percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">{poll.total_votes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
            <div className="text-sm text-gray-600">Options</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {poll.options.reduce((max, option) => Math.max(max, option.votes), 0)}
            </div>
            <div className="text-sm text-gray-600">Highest Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {poll.total_votes > 0 ? 
                Math.round((poll.options.reduce((max, option) => Math.max(max, option.votes), 0) / poll.total_votes) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Winner Margin</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
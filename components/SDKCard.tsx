'use client';

import { SDKStats } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SDKCardProps {
  name: string;
  icon: string;
  stats: SDKStats;
  period: 'day' | 'week' | 'month';
  color: string;
  dateRange?: { start: string; end: string } | null;
}

export default function SDKCard({ name, icon, stats, period, color, dateRange }: SDKCardProps) {
  const currentDownloads = stats[period];
  const isCustomRange = dateRange !== null;

  const chartData = [
    { name: 'Daily', downloads: stats.day },
    { name: 'Weekly', downloads: stats.week },
    { name: 'Monthly', downloads: stats.month },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {name} SDK
      </h2>

      {/* Stats Box */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-sm opacity-90 mb-1">
            Downloads ({isCustomRange ? 'Custom' : period.charAt(0).toUpperCase() + period.slice(1)})
          </p>
          <p className="text-4xl font-bold">{currentDownloads.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Bar dataKey="downloads" fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2 border-purple-600">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Period</th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">Downloads</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">Daily</td>
              <td className="px-4 py-2 text-right text-gray-700 font-semibold">{stats.day.toLocaleString()}</td>
            </tr>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">Weekly</td>
              <td className="px-4 py-2 text-right text-gray-700 font-semibold">{stats.week.toLocaleString()}</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">Monthly</td>
              <td className="px-4 py-2 text-right text-gray-700 font-semibold">{stats.month.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


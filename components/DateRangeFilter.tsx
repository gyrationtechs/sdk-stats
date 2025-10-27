'use client';

import { useState, useEffect } from 'react';

interface DateRangeFilterProps {
  onApply: (start: string, end: string) => void;
  onReset: () => void;
}

export default function DateRangeFilter({ onApply, onReset }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate);
    }
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    onReset();
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="px-4 py-2 border-2 border-purple-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <span className="flex items-center text-gray-700 font-semibold">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="px-4 py-2 border-2 border-purple-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        onClick={handleApply}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
      >
        Apply
      </button>
      <button
        onClick={handleReset}
        className="px-6 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-all"
      >
        Reset
      </button>
    </div>
  );
}


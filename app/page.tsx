'use client';

import { useState, useEffect, useCallback } from 'react';
import SDKCard from '@/components/SDKCard';
import RubySection from '@/components/RubySection';
import FilterButtons from '@/components/FilterButtons';
import DateRangeFilter from '@/components/DateRangeFilter';
import { SDKStats, RubyStats, fetchPythonStats, fetchNodejsStats, fetchPhpStats, fetchRubyStats } from '@/lib/api';

export default function Home() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [pythonStats, setPythonStats] = useState<SDKStats | null>(null);
  const [nodejsStats, setNodejsStats] = useState<SDKStats | null>(null);
  const [phpStats, setPhpStats] = useState<SDKStats | null>(null);
  const [rubyStats, setRubyStats] = useState<RubyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const fetchAllStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pass date range parameters if available
      const startDate = dateRange?.start;
      const endDate = dateRange?.end;
      
      console.log('Fetching stats with date range:', { startDate, endDate });
      
      const [python, nodejs, php, ruby] = await Promise.all([
        fetchPythonStats(startDate, endDate),
        fetchNodejsStats(startDate, endDate),
        fetchPhpStats(startDate, endDate),
        fetchRubyStats(startDate, endDate),
      ]);
      
      console.log('Fetched stats:', { python, nodejs, php, ruby });
      
      setPythonStats(python);
      setNodejsStats(nodejs);
      setPhpStats(php);
      setRubyStats(ruby);
    } catch (err) {
      setError('Failed to load statistics. Please try again later.');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const handleDateRangeApply = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleDateRangeReset = () => {
    setDateRange(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 text-white">
          <h1 className="text-5xl font-bold mb-2">📊 Sendlayer SDK Download Statistics</h1>
          <p className="text-lg opacity-90">Real-time download metrics across all supported platforms</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            <div>
              <label className="font-semibold text-gray-700 block mb-2">Time Period:</label>
              <FilterButtons period={period} onChange={setPeriod} />
            </div>
            <div className="flex-1">
              <label className="font-semibold text-gray-700 block mb-2">Custom Date Range:</label>
              <DateRangeFilter onApply={handleDateRangeApply} onReset={handleDateRangeReset} />
            </div>
          </div>
          {dateRange && (
            <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
              📅 Showing data for: <strong>{dateRange.start}</strong> to <strong>{dateRange.end}</strong>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white text-xl py-12">
            Loading download statistics...
          </div>
        )}

        {/* Dashboard Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {pythonStats && (
                <SDKCard
                  name="Python"
                  icon="🐍"
                  stats={pythonStats}
                  period={period}
                  color="#3776ab"
                  dateRange={dateRange}
                />
              )}
              {nodejsStats && (
                <SDKCard
                  name="Node.js"
                  icon="📦"
                  stats={nodejsStats}
                  period={period}
                  color="#68a063"
                  dateRange={dateRange}
                />
              )}
              {phpStats && (
                <SDKCard
                  name="PHP"
                  icon="🐘"
                  stats={phpStats}
                  period={period}
                  color="#777bb4"
                  dateRange={dateRange}
                />
              )}
            </div>

            {/* Ruby Section */}
            {rubyStats && <RubySection stats={rubyStats} />}
          </>
        )}
      </div>
    </main>
  );
}

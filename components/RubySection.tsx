import { RubyStats } from '@/lib/api';

interface RubySectionProps {
  stats: RubyStats;
}

export default function RubySection({ stats }: RubySectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>💎</span>
        Ruby SDK - Total Download History
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-lg p-6 text-center">
          <p className="text-sm opacity-90 mb-2">Total Downloads</p>
          <p className="text-4xl font-bold">{stats.total.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-lg p-6 text-center">
          <p className="text-sm opacity-90 mb-2">Latest Version</p>
          <p className="text-4xl font-bold">{stats.version}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-lg p-6 text-center">
          <p className="text-sm opacity-90 mb-2">Version Downloads</p>
          <p className="text-4xl font-bold">{stats.versionDownloads.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}


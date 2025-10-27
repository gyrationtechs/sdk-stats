interface FilterButtonsProps {
  period: 'day' | 'week' | 'month';
  onChange: (period: 'day' | 'week' | 'month') => void;
}

export default function FilterButtons({ period, onChange }: FilterButtonsProps) {
  return (
    <div className="flex gap-3">
      {(['day', 'week', 'month'] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            period === p
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}


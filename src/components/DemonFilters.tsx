import { Filter, ArrowUpDown } from 'lucide-react';

interface DemonFiltersProps {
  filters: {
    difficulty: string;
    gauntlet: boolean;
    weekly: boolean;
    event: boolean;
  };
  onFiltersChange: (filters: any) => void;
  sortBy: 'name' | 'attempts' | 'difficulty' | 'order';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'attempts' | 'difficulty' | 'order') => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

export function DemonFilters({
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
}: DemonFiltersProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="size-5 text-red-500" />
        <h3 className="text-lg font-semibold text-white">Filters & Sorting</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Insane">Insane</option>
            <option value="Extreme">Extreme</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="name">Name</option>
            <option value="difficulty">Difficulty</option>
            <option value="attempts">Attempts</option>
            <option value="order">Order</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowUpDown className="size-4" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {/* Checkbox Filters */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <p className="text-sm font-medium text-gray-300 mb-3">Show only:</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.gauntlet}
              onChange={(e) => onFiltersChange({ ...filters, gauntlet: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Gauntlet</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.weekly}
              onChange={(e) => onFiltersChange({ ...filters, weekly: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Weekly</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.event}
              onChange={(e) => onFiltersChange({ ...filters, event: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Event</span>
          </label>
        </div>
      </div>
    </div>
  );
}
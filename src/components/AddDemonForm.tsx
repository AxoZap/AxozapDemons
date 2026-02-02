import { useState } from 'react';
import { Demon } from '../App';

interface AddDemonFormProps {
  onAdd: (demon: Omit<Demon, 'id'>) => void;
  onCancel: () => void;
}

export function AddDemonForm({ onAdd, onCancel }: AddDemonFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    difficulty: 'Medium' as Demon['difficulty'],
    gauntlet: false,
    weekly: false,
    event: false,
    attempts: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.difficulty === 'Extreme' && formData.attempts < 0) {
      newErrors.attempts = 'Attempts cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Only include attempts if it's an Extreme demon
      const demonData: any = {
        name: formData.name,
        difficulty: formData.difficulty,
        gauntlet: formData.gauntlet,
        weekly: formData.weekly,
        event: formData.event,
      };
      
      if (formData.difficulty === 'Extreme') {
        demonData.attempts = formData.attempts;
      }
      
      onAdd(demonData);
      setFormData({
        name: '',
        difficulty: 'Medium',
        gauntlet: false,
        weekly: false,
        event: false,
        attempts: 0,
      });
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Add New Demon</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter demon name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value as Demon['difficulty'] })
              }
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Insane">Insane</option>
              <option value="Extreme">Extreme</option>
            </select>
          </div>

          {/* Attempts - Only show for Extreme demons */}
          {formData.difficulty === 'Extreme' && (
            <div className="md:col-span-2">
              <label htmlFor="attempts" className="block text-sm font-medium text-gray-300 mb-2">
                Attempts *
              </label>
              <input
                type="number"
                id="attempts"
                min="0"
                value={formData.attempts}
                onChange={(e) => setFormData({ ...formData, attempts: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {errors.attempts && <p className="mt-1 text-sm text-red-400">{errors.attempts}</p>}
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.gauntlet}
              onChange={(e) => setFormData({ ...formData, gauntlet: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Gauntlet</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.weekly}
              onChange={(e) => setFormData({ ...formData, weekly: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Weekly</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.checked })}
              className="size-4 rounded border-gray-700 bg-gray-800 text-red-600 focus:ring-2 focus:ring-red-500"
            />
            <span className="text-gray-300">Event</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Add Demon
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
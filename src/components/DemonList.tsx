import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target } from 'lucide-react';

interface DemonListProps {
  demons: Demon[];
}

const difficultyColors: Record<Demon['difficulty'], string> = {
  Easy: 'text-green-400 bg-green-950/50',
  Medium: 'text-yellow-400 bg-yellow-950/50',
  Hard: 'text-orange-400 bg-orange-950/50',
  Insane: 'text-red-400 bg-red-950/50',
  Extreme: 'text-purple-400 bg-purple-950/50',
};

export function DemonList({ demons }: DemonListProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Difficulty</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Gauntlet</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Weekly</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Event</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {demons.map((demon, index) => (
              <tr
                key={demon.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    {index < 3 && (
                      <Trophy
                        className={`size-5 ${
                          index === 0
                            ? 'text-yellow-400'
                            : index === 1
                            ? 'text-gray-300'
                            : 'text-orange-400'
                        }`}
                      />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-semibold">{demon.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      difficultyColors[demon.difficulty]
                    }`}
                  >
                    {demon.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {demon.gauntlet && (
                    <div className="flex justify-center">
                      <Target className="size-5 text-cyan-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {demon.weekly && (
                    <div className="flex justify-center">
                      <Calendar className="size-5 text-blue-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {demon.event && (
                    <div className="flex justify-center">
                      <Zap className="size-5 text-yellow-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {demon.attempts !== undefined && (
                    <span className="text-gray-300">{demon.attempts.toLocaleString()}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {demons.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No demons added yet. Click "Add Demon" to get started!
        </div>
      )}
    </div>
  );
}
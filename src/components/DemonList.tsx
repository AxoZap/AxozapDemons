import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target, Trash2, Star, Moon, Edit } from 'lucide-react';
import { useMemo } from 'react';

interface DemonListProps {
  demons: Demon[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isUnlocked: boolean;
}

export function DemonList({ demons, onDelete, onEdit, isUnlocked }: DemonListProps) {
  // Calculate which demons should get trophies
  const demonTrophies = useMemo(() => {
    const trophyMap = new Map<string, boolean>();
    const seen = {
      difficulties: new Set<string>(), // e.g., "Easy-Star", "Easy-Moon"
      gauntlet: false,
      weekly: false,
      event: false,
    };

    demons.forEach((demon) => {
      const difficultyRating = `${demon.difficulty}-${demon.rating}`;
      
      // Check if this is first of this difficulty/rating combo
      if (!seen.difficulties.has(difficultyRating)) {
        trophyMap.set(`${demon.id}-difficulty`, true);
        seen.difficulties.add(difficultyRating);
      }
      
      // Check if this is first gauntlet
      if (demon.gauntlet && !seen.gauntlet) {
        trophyMap.set(`${demon.id}-gauntlet`, true);
        seen.gauntlet = true;
      }
      
      // Check if this is first weekly
      if (demon.weekly && !seen.weekly) {
        trophyMap.set(`${demon.id}-weekly`, true);
        seen.weekly = true;
      }
      
      // Check if this is first event
      if (demon.event && !seen.event) {
        trophyMap.set(`${demon.id}-event`, true);
        seen.event = true;
      }
    });

    return trophyMap;
  }, [demons]);

  if (demons.length === 0) {
    return (
      <div className="empty-state">
        <p>No demons added yet. Click "Add Demon" to get started!</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Rank</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Name</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Difficulty</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Rating</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Special</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Attempts</th>
              {isUnlocked && (
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Delete</th>
              )}
              {isUnlocked && (
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Edit</th>
              )}
            </tr>
          </thead>
          <tbody>
            {demons.map((demon, index) => (
              <tr
                key={demon.id}
                style={{ 
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>{demon.name}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`tag tag-${demon.difficulty.toLowerCase()}`}>
                      {demon.difficulty}
                    </span>
                    {demonTrophies.get(`${demon.id}-difficulty`) && (
                      <Trophy size={16} color="#eab308" fill="#eab308" />
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {demon.rating === 'Star' ? (
                      <Star size={20} color="#fbbf24" fill="#fbbf24" />
                    ) : (
                      <Moon size={20} color="#a78bfa" fill="#a78bfa" />
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    {demon.gauntlet && (
                      <>
                        <Target size={20} color="#22d3ee" />
                        {demonTrophies.get(`${demon.id}-gauntlet`) && (
                          <Trophy size={16} color="#eab308" fill="#eab308" />
                        )}
                      </>
                    )}
                    {demon.weekly && (
                      <>
                        <Calendar size={20} color="#3b82f6" />
                        {demonTrophies.get(`${demon.id}-weekly`) && (
                          <Trophy size={16} color="#eab308" fill="#eab308" />
                        )}
                      </>
                    )}
                    {demon.event && (
                      <>
                        <Zap size={20} color="#eab308" />
                        {demonTrophies.get(`${demon.id}-event`) && (
                          <Trophy size={16} color="#eab308" fill="#eab308" />
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {demon.attempts !== undefined && (
                    <span style={{ 
                      color: demon.difficulty === 'Extreme' ? '#fbbf24' : 'var(--text-secondary)',
                      fontWeight: demon.difficulty === 'Extreme' ? '600' : 'normal'
                    }}>
                      {demon.attempts.toLocaleString()}
                    </span>
                  )}
                </td>
                {isUnlocked && (
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button
                      onClick={() => onDelete(demon.id)}
                      className="delete-btn"
                    >
                      <Trash2 size={20} color="#ef4444" />
                    </button>
                  </td>
                )}
                {isUnlocked && (
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button
                      onClick={() => onEdit(demon.id)}
                      className="edit-btn"
                    >
                      <Edit size={20} color="#65a30d" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
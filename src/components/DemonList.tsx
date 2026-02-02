import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target } from 'lucide-react';

interface DemonListProps {
  demons: Demon[];
}

export function DemonList({ demons }: DemonListProps) {
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
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gauntlet</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Weekly</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Event</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Attempts</th>
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
                    {index < 3 && (
                      <Trophy
                        size={20}
                        color={index === 0 ? '#eab308' : index === 1 ? '#d1d5db' : '#f97316'}
                      />
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>{demon.name}</span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span className={`tag tag-${demon.difficulty.toLowerCase()}`}>
                    {demon.difficulty}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  {demon.gauntlet && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Target size={20} color="#22d3ee" />
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  {demon.weekly && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Calendar size={20} color="#3b82f6" />
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  {demon.event && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Zap size={20} color="#eab308" />
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {demon.attempts !== undefined && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {demon.attempts.toLocaleString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

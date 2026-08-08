import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target, Trash2, Star, Moon, Edit, Youtube, Loader2 } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986`;

interface GddlData {
  tier: number | null;
  myTier: number | null;
  enjoyment: number | null;
}

interface DemonListProps {
  demons: Demon[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isUnlocked: boolean;
}

function GddlInline({ demon }: { demon: Demon }) {
  const [data, setData] = useState<GddlData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demon.levelId || demon.rating === 'Moon') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetched) {
          setFetched(true);
          setLoading(true);
          fetch(`${API_URL}/gddl/${demon.levelId}`, {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          })
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [demon.levelId, demon.rating, fetched]);

  const tierColor = (tier: number | null) => {
    if (tier === null) return 'var(--text-secondary)';
    if (tier <= 3)  return '#22c55e';
    if (tier <= 6)  return '#86efac';
    if (tier <= 10) return '#eab308';
    if (tier <= 15) return '#f97316';
    if (tier <= 20) return '#ef4444';
    if (tier <= 30) return '#a855f7';
    return '#dc2626';
  };

  if (!demon.levelId || demon.rating === 'Moon') {
    return (
      <div ref={ref} className="gddl-inline gddl-inline-empty">—</div>
    );
  }

  if (loading) {
    return (
      <div ref={ref} className="gddl-inline gddl-inline-loading">
        <Loader2 size={13} className="gddl-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="gddl-inline">
      <div className="gddl-stat">
        <span className="gddl-stat-label">Tier</span>
        <span className="gddl-stat-val" style={{ color: tierColor(data?.tier ?? null) }}>
          {data?.tier != null ? data.tier : '?'}
        </span>
      </div>
      <div className="gddl-stat">
        <span className="gddl-stat-label">Mine</span>
        <span className="gddl-stat-val" style={{ color: tierColor(data?.myTier ?? null) }}>
          {data?.myTier != null ? data.myTier : '—'}
        </span>
      </div>
      <div className="gddl-stat">
        <span className="gddl-stat-label">Enjoy</span>
        <span className="gddl-stat-val" style={{ color: data?.enjoyment != null ? '#f59e0b' : 'var(--text-secondary)' }}>
          {data?.enjoyment != null ? `${data.enjoyment}/10` : '—'}
        </span>
      </div>
    </div>
  );
}

export function DemonList({ demons, onDelete, onEdit, isUnlocked }: DemonListProps) {
  const demonTrophies = useMemo(() => {
    const trophyMap = new Map<string, boolean>();
    const seen = {
      difficulties: new Set<string>(),
      gauntlet: false,
      weekly: false,
      event: false,
    };

    demons.forEach((demon) => {
      const difficultyRating = `${demon.difficulty}-${demon.rating}`;
      if (!seen.difficulties.has(difficultyRating)) {
        trophyMap.set(`${demon.id}-difficulty`, true);
        seen.difficulties.add(difficultyRating);
      }
      if (demon.gauntlet && !seen.gauntlet) {
        trophyMap.set(`${demon.id}-gauntlet`, true);
        seen.gauntlet = true;
      }
      if (demon.weekly && !seen.weekly) {
        trophyMap.set(`${demon.id}-weekly`, true);
        seen.weekly = true;
      }
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
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>GDDL</th>
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
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    #{demon.placement || index + 1}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>{demon.name}</span>
                    {demon.videoUrl && (
                      <a
                        href={demon.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#ef4444', display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }}
                        title="Watch Video"
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <Youtube size={20} />
                      </a>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`tag tag-${demon.difficulty.toLowerCase()}`}>{demon.difficulty}</span>
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
                        {demonTrophies.get(`${demon.id}-gauntlet`) && <Trophy size={16} color="#eab308" fill="#eab308" />}
                      </>
                    )}
                    {demon.weekly && (
                      <>
                        <Calendar size={20} color="#3b82f6" />
                        {demonTrophies.get(`${demon.id}-weekly`) && <Trophy size={16} color="#eab308" fill="#eab308" />}
                      </>
                    )}
                    {demon.event && (
                      <>
                        <Zap size={20} color="#eab308" />
                        {demonTrophies.get(`${demon.id}-event`) && <Trophy size={16} color="#eab308" fill="#eab308" />}
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
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  <GddlInline demon={demon} />
                </td>
                {isUnlocked && (
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button onClick={() => onDelete(demon.id)} className="delete-btn">
                      <Trash2 size={20} color="#ef4444" />
                    </button>
                  </td>
                )}
                {isUnlocked && (
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button onClick={() => onEdit(demon.id)} className="edit-btn">
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
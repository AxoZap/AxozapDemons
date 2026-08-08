import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target, Trash2, Star, Moon, Edit, Youtube, BarChart2, X, Loader2 } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986`;

interface GddlData {
  tier: number | null;
  myTier: number | null;
  enjoyment: number | null;
}

interface GddlPopupState {
  demonId: string;
  loading: boolean;
  data: GddlData | null;
  error: string | null;
}

interface DemonListProps {
  demons: Demon[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isUnlocked: boolean;
}

function GddlButton({ demon }: { demon: Demon }) {
  const [popup, setPopup] = useState<GddlPopupState | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!popup) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setPopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popup]);

  if (!demon.levelId || demon.rating === 'Moon') return null;

  const handleClick = async () => {
    if (popup) {
      setPopup(null);
      return;
    }

    // Position popup near button
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        top: rect.bottom + window.scrollY + 8,
        left: Math.min(rect.left + window.scrollX, window.innerWidth - 260),
      });
    }

    setPopup({ demonId: demon.id, loading: true, data: null, error: null });

    try {
      const res = await fetch(`${API_URL}/gddl/${demon.levelId}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch GDDL data' }));
        setPopup({ demonId: demon.id, loading: false, data: null, error: err.error || 'Failed to fetch' });
        return;
      }
      const data: GddlData = await res.json();
      setPopup({ demonId: demon.id, loading: false, data, error: null });
    } catch (e) {
      setPopup({ demonId: demon.id, loading: false, data: null, error: 'Network error' });
    }
  };

  const tierColor = (tier: number | null) => {
    if (tier === null) return 'var(--text-secondary)';
    if (tier <= 5) return '#22c55e';
    if (tier <= 10) return '#eab308';
    if (tier <= 15) return '#f97316';
    if (tier <= 20) return '#ef4444';
    if (tier <= 30) return '#a855f7';
    return '#dc2626';
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className="gddl-btn"
        title="View GDDL Data"
        aria-label="GDDL Data"
      >
        <BarChart2 size={16} />
        <span>GDDL</span>
      </button>

      {popup && popupPos && (
        <div
          ref={popupRef}
          className="gddl-popup"
          style={{ top: popupPos.top, left: popupPos.left }}
        >
          <div className="gddl-popup-header">
            <span className="gddl-popup-title">
              <BarChart2 size={14} style={{ marginRight: '0.4rem' }} />
              GDDL Info
            </span>
            <button className="gddl-popup-close" onClick={() => setPopup(null)}>
              <X size={14} />
            </button>
          </div>

          {popup.loading && (
            <div className="gddl-popup-loading">
              <Loader2 size={20} className="gddl-spin" />
              <span>Loading...</span>
            </div>
          )}

          {popup.error && (
            <div className="gddl-popup-error">{popup.error}</div>
          )}

          {popup.data && !popup.loading && (
            <div className="gddl-popup-body">
              <div className="gddl-row">
                <span className="gddl-label">GDDL Tier</span>
                <span className="gddl-value" style={{ color: tierColor(popup.data.tier) }}>
                  {popup.data.tier !== null ? `Tier ${popup.data.tier}` : '?'}
                </span>
              </div>
              <div className="gddl-row">
                <span className="gddl-label">My Rating</span>
                <span className="gddl-value" style={{ color: tierColor(popup.data.myTier) }}>
                  {popup.data.myTier !== null ? `Tier ${popup.data.myTier}` : '—'}
                </span>
              </div>
              <div className="gddl-row">
                <span className="gddl-label">Enjoyment</span>
                <span className="gddl-value" style={{ color: popup.data.enjoyment !== null ? '#f59e0b' : 'var(--text-secondary)' }}>
                  {popup.data.enjoyment !== null ? `${popup.data.enjoyment} / 10` : '—'}
                </span>
              </div>
              <a
                href={`https://gdladder.com/level/${demon.levelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gddl-link"
              >
                View on GDDL ↗
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
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
                      #{demon.placement || index + 1}
                    </span>
                  </div>
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
                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                  <GddlButton demon={demon} />
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
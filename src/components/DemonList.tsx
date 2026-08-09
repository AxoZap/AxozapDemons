import { Demon } from '../App';
import { Trophy, Zap, Calendar, Target, Trash2, Star, Moon, Edit, Youtube, Loader2, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
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

  const handleFetch = () => {
    if (!demon.levelId || demon.rating === 'Moon' || loading) return;

    setLoading(true);
    fetch(`${API_URL}/gddl/${demon.levelId}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
    .then((r) => r.json())
    .then((d) => {
      setData(d);
      setFetched(true);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  };

  const tierColor = (tier: number | null) => {
    if (tier === null) return 'var(--text-secondary)';
    if (tier <= 3) return '#22c55e';
    if (tier <= 6) return '#86efac';
    if (tier <= 10) return '#eab308';
    if (tier <= 15) return '#f97316';
    if (tier <= 20) return '#ef4444';
    if (tier <= 30) return '#a855f7';
    return '#dc2626';
  };

  if (!demon.levelId || demon.rating === 'Moon') {
    return (
      <div className="gddl-inline gddl-inline-empty" style={{ opacity: 0.5 }}>
      —
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gddl-inline gddl-inline-loading" style={{ display: 'flex', justifyContent: 'center' }}>
      <Loader2 size={16} className="gddl-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!fetched) {
    return (
      <button
      onClick={handleFetch}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      >
      Load GDDL
      </button>
    );
  }

  return (
    <div
    className="gddl-inline"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.85rem',
      background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.35rem 0.65rem',
          borderRadius: '6px',
          border: '1px solid var(--border)',
    }}
    >
    {/* Level Tier */}
    <div className="gddl-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span className="gddl-stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
    Tier
    </span>
    <span className="gddl-stat-val" style={{ fontWeight: 600, color: tierColor(data?.tier ?? null) }}>
    {data?.tier != null ? Math.round(data.tier) : '?'}
    </span>
    </div>

    {/* Personal Rating */}
    <div className="gddl-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span className="gddl-stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
    Mine
    </span>
    <span className="gddl-stat-val" style={{ fontWeight: 600, color: tierColor(data?.myTier ?? null) }}>
    {data?.myTier != null ? Math.round(data.myTier) : '—'}
    </span>
    </div>

    {/* Enjoyment Rating */}
    <div className="gddl-stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span className="gddl-stat-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
    Enjoy
    </span>
    <span className="gddl-stat-val" style={{ fontWeight: 600, color: data?.enjoyment != null ? '#f59e0b' : 'var(--text-secondary)' }}>
    {data?.enjoyment != null ? Math.round(data.enjoyment) : '—'}
    </span>
    </div>

    <a
    href={`https://gdladder.com/level/${demon.levelId}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', marginLeft: '0.25rem' }}
    title="View on GDDL"
    >
    <ExternalLink size={12} />
    </a>
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
      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
      <p>No demons added yet. Click "Add Demon" to get started!</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', borderRadius: '12px', background: 'var(--card-bg)' }}>
    <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
    <thead>
    <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
    <th style={thStyle}>Rank</th>
    <th style={thStyle}>Name</th>
    <th style={thStyle}>Difficulty</th>
    <th style={{ ...thStyle, textAlign: 'center' }}>Rating</th>
    <th style={{ ...thStyle, textAlign: 'center' }}>Special</th>
    <th style={thStyle}>Attempts</th>
    <th style={{ ...thStyle, textAlign: 'center' }}>GDDL</th>
    {isUnlocked && <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>}
    </tr>
    </thead>
    <tbody>
    {demons.map((demon, index) => (
      <tr
      key={demon.id}
      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
      <td style={{ padding: '1rem 1.25rem' }}>
      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
      #{demon.placement || index + 1}
      </span>
      </td>

      <td style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: '#fff', fontWeight: 600 }}>{demon.name}</span>
      {demon.videoUrl && (
        <a
        href={demon.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}
        title="Watch Video"
        >
        <Youtube size={18} />
        </a>
      )}
      </div>
      </td>

      <td style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className={`tag tag-${demon.difficulty.toLowerCase()}`}>{demon.difficulty}</span>
      {demonTrophies.get(`${demon.id}-difficulty`) && <Trophy size={16} color="#eab308" fill="#eab308" />}
      </div>
      </td>

      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
      {demon.rating === 'Star' ? (
        <Star size={18} color="#fbbf24" fill="#fbbf24" />
      ) : (
        <Moon size={18} color="#a78bfa" fill="#a78bfa" />
      )}
      </div>
      </td>

      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
      {demon.gauntlet && (
        <>
        <Target size={18} color="#22d3ee" title="Gauntlet" />
        {demonTrophies.get(`${demon.id}-gauntlet`) && <Trophy size={14} color="#eab308" fill="#eab308" />}
        </>
      )}
      {demon.weekly && (
        <>
        <Calendar size={18} color="#3b82f6" title="Weekly" />
        {demonTrophies.get(`${demon.id}-weekly`) && <Trophy size={14} color="#eab308" fill="#eab308" />}
        </>
      )}
      {demon.event && (
        <>
        <Zap size={18} color="#eab308" title="Event" />
        {demonTrophies.get(`${demon.id}-event`) && <Trophy size={14} color="#eab308" fill="#eab308" />}
        </>
      )}
      </div>
      </td>

      <td style={{ padding: '1rem 1.25rem' }}>
      {demon.attempts !== undefined ? (
        <span
        style={{
          color: demon.difficulty === 'Extreme' ? '#fbbf24' : 'var(--text-secondary)',
                                       fontWeight: demon.difficulty === 'Extreme' ? '600' : '400',
        }}
        >
        {demon.attempts.toLocaleString()}
        </span>
      ) : (
        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>—</span>
      )}
      </td>

      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
      <GddlInline demon={demon} />
      </td>

      {isUnlocked && (
        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button onClick={() => onEdit(demon.id)} className="edit-btn" style={actionBtnStyle} title="Edit">
        <Edit size={16} color="#84cc16" />
        </button>
        <button onClick={() => onDelete(demon.id)} className="delete-btn" style={actionBtnStyle} title="Delete">
        <Trash2 size={16} color="#ef4444" />
        </button>
        </div>
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

const thStyle: React.CSSProperties = {
  padding: '1rem 1.25rem',
  color: 'var(--text-secondary)',
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0.35rem',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

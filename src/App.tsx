import { useState, useEffect } from 'react';
import { DemonList } from './components/DemonList';
import { AddDemonForm } from './components/AddDemonForm';
import { DemonFilters } from './components/DemonFilters';
import { Flame, Lock, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';

export interface Demon {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane' | 'Extreme';
  gauntlet: boolean;
  weekly: boolean;
  event: boolean;
  attempts?: number; // Optional now - only for Extreme demons
}

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986`;

export default function App() {
  const [demons, setDemons] = useState<Demon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: 'All',
    gauntlet: false,
    weekly: false,
    event: false,
  });
  const [sortBy, setSortBy] = useState<'name' | 'attempts' | 'difficulty' | 'order'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load demons from database on mount
  useEffect(() => {
    loadDemons();
  }, []);

  const loadDemons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/demons`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDemons(data);
      } else {
        console.error('Failed to load demons:', await response.text());
      }
    } catch (error) {
      console.error('Error loading demons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDemon = async (demon: Omit<Demon, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/demons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ password, demon }),
      });

      if (response.ok) {
        const newDemon = await response.json();
        setDemons([...demons, newDemon]);
        setShowAddForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add demon');
      }
    } catch (error) {
      console.error('Error adding demon:', error);
      alert('Failed to add demon. Please try again.');
    }
  };

  const handleUnlock = async () => {
    try {
      const response = await fetch(`${API_URL}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.valid) {
        setIsUnlocked(true);
        setShowPasswordPrompt(false);
        // Keep password in state for adding demons
      } else {
        alert('Incorrect password!');
        setPassword('');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      alert('Failed to verify password. Please try again.');
    }
  };

  const handleAddButtonClick = () => {
    if (isUnlocked) {
      setShowAddForm(!showAddForm);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const filteredAndSortedDemons = demons
    .filter((demon) => {
      if (filters.difficulty !== 'All' && demon.difficulty !== filters.difficulty) return false;
      if (filters.gauntlet && !demon.gauntlet) return false;
      if (filters.weekly && !demon.weekly) return false;
      if (filters.event && !demon.event) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'order') {
        // Sort by insertion order (ID)
        comparison = parseInt(a.id) - parseInt(b.id);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'attempts') {
        comparison = (a.attempts || 0) - (b.attempts || 0);
      } else if (sortBy === 'difficulty') {
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3, Insane: 4, Extreme: 5 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="loading">
        <Loader2 size={48} />
        <p>Loading demons...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1 className="title">
          <Flame size={48} />
          Demon List
        </h1>
        <p className="subtitle">Track and showcase the hardest demons</p>
        
        <div className="header-actions">
          <button onClick={handleAddButtonClick} className="btn btn-primary">
            {!isUnlocked && <Lock size={16} />}
            {showAddForm ? 'Cancel' : 'Add Demon'}
          </button>
        </div>
      </header>

      {/* Password Prompt */}
      {showPasswordPrompt && !isUnlocked && (
        <div className="card">
          <h2>Enter Password</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Only authorized users can add demons.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter password"
              className="form-input"
            />
            <button onClick={handleUnlock} className="btn btn-primary">
              Unlock
            </button>
            <button
              onClick={() => setShowPasswordPrompt(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && isUnlocked && (
        <div style={{ marginBottom: '2rem' }}>
          <AddDemonForm onAdd={handleAddDemon} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Filters */}
      <DemonFilters
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      {/* Demon List */}
      <DemonList demons={filteredAndSortedDemons} />
    </div>
  );
}
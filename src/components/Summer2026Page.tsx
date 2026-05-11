import { useEffect, useRef, useState } from 'react';
import './summer2026.css';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const storageKey = 'summer2026-unlocked';
const summerUnlockUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986/summer-2026/unlock`;
const summerCounterUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986/summer-2026/counter`;
const passwordLoreText = "All shall be reborn, the state of limbo shall disgress, it's time for a new era, not one of arrogance. That's what the infernal dragon says.";

export function Summer2026Page() {
  const [typedBuffer, setTypedBuffer] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [counterValue, setCounterValue] = useState('0');
  const [statusText, setStatusText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const typedBufferRef = useRef('');

  const relock = () => {
    localStorage.removeItem(storageKey);
    typedBufferRef.current = '';
    setTypedBuffer('');
    setIsUnlocked(false);
    setStatusText('');
  };

  useEffect(() => {
    document.title = 'The Final Countdown';
    return () => {
      document.title = 'AxoZap Demons';
    };
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      localStorage.setItem(storageKey, 'true');
      setStatusText(passwordLoreText);
    }
  }, [isUnlocked]);

  useEffect(() => {
    const loadCounter = async () => {
      try {
        const response = await fetch(summerCounterUrl, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const nextCounter = Number.parseInt(String(data.counter ?? '0'), 10);
        setCounterValue(String(Number.isFinite(nextCounter) ? nextCounter : 0));
      } catch (error) {
        console.error('Error fetching Summer 2026 counter:', error);
      }
    };

    void loadCounter();
    const interval = window.setInterval(() => {
      void loadCounter();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const verifyPassword = async (candidate: string) => {
      if (isChecking || isUnlocked) {
        return;
      }

      if (!candidate) {
        setStatusText('');
        return;
      }

      setIsChecking(true);
      setStatusText('verifying...');

      try {
        const response = await fetch(summerUnlockUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ password: candidate }),
        });

        if (!response.ok) {
          setStatusText('signal error');
          return;
        }

        const data = await response.json();
        if (data.valid) {
          setIsUnlocked(true);
          typedBufferRef.current = '';
          setTypedBuffer('');
          return;
        }

        typedBufferRef.current = '';
        setTypedBuffer('');
        setStatusText('access denied');
      } catch (error) {
        console.error('Error verifying Summer 2026 password:', error);
        setStatusText('signal error');
      } finally {
        setIsChecking(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        relock();
        return;
      }

      if (isUnlocked) {
        return;
      }

      if (event.key === 'Enter') {
        void verifyPassword(typedBufferRef.current.trim());
        return;
      }

      if (event.key.length === 1) {
        setTypedBuffer((current) => {
          const next = `${current}${event.key}`.slice(-48);
          typedBufferRef.current = next;
          return next;
        });
      } else if (event.key === 'Backspace') {
        setTypedBuffer((current) => {
          const next = current.slice(0, -1);
          typedBufferRef.current = next;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChecking, isUnlocked]);

  return (
    <main className={`summer-page-shell${isUnlocked ? ' unlocked' : ''}`}>
      <div className="summer-bg-grid" />
      <div className="summer-bg-glow summer-bg-glow-a" />
      <div className="summer-bg-glow summer-bg-glow-b" />

      <section className="summer-hero-panel">
        <p className="summer-eyebrow">The Final Countdown</p>
        <h1>The Final Countdown</h1>
        <p className="summer-intro">It will all come to a rebirth....</p>

        <div className="summer-countdown-frame" aria-live="polite">
          <div className="summer-timer-card">
            <span className="summer-timer-value">{counterValue}/10</span>
            <span className="summer-timer-label">The Final Ten</span>
          </div>
        </div>

        <p className={`summer-typed-line${isChecking ? ' checking' : ''}`}>{statusText}</p>
      </section>
    </main>
  );
}

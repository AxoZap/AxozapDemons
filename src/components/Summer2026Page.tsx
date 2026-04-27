import { useEffect, useState } from 'react';
import './summer2026.css';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const targetTime = new Date('2026-05-14T16:00:00Z').getTime();
const scrambledChars = '0123456789#?%&@!AXO<>/\\\\[]{}';
const storageKey = 'summer2026-unlocked';
const summerUnlockUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7e6e6986/summer-2026/unlock`;

function randomChunk(length: number) {
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += scrambledChars[Math.floor(Math.random() * scrambledChars.length)];
  }
  return output;
}

function formatPart(value: number) {
  return String(value).padStart(2, '0');
}

function getRealCountdown() {
  const diff = Math.max(0, targetTime - Date.now());
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: String(Math.floor(totalSeconds / 86400)),
    hours: formatPart(Math.floor((totalSeconds % 86400) / 3600)),
    minutes: formatPart(Math.floor((totalSeconds % 3600) / 60)),
    seconds: formatPart(totalSeconds % 60),
  };
}

function getScrambledCountdown() {
  return {
    days: randomChunk(2 + Math.floor(Math.random() * 2)),
    hours: randomChunk(2 + Math.floor(Math.random() * 2)),
    minutes: randomChunk(2 + Math.floor(Math.random() * 2)),
    seconds: randomChunk(2 + Math.floor(Math.random() * 2)),
  };
}

export function Summer2026Page() {
  const [typedBuffer, setTypedBuffer] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem(storageKey) === 'true');
  const [display, setDisplay] = useState(() => (
    localStorage.getItem(storageKey) === 'true' ? getRealCountdown() : getScrambledCountdown()
  ));
  const [statusText, setStatusText] = useState('awaiting sequence...');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    document.title = 'The Final Countdown';
    return () => {
      document.title = 'AxoZap Demons';
    };
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      localStorage.setItem(storageKey, 'true');
      setDisplay(getRealCountdown());
      setStatusText('countdown stabilized');
      return;
    }

    const verifyPassword = async (candidate: string) => {
      if (!candidate || isChecking) {
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
          setTypedBuffer('');
          return;
        }

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
      if (event.key === 'Enter') {
        void verifyPassword(typedBuffer.trim());
        return;
      }

      if (event.key.length === 1) {
        setTypedBuffer((current) => {
          const next = `${current}${event.key}`.slice(-48);
          setStatusText(next);
          return next;
        });
      } else if (event.key === 'Backspace') {
        setTypedBuffer((current) => {
          const next = current.slice(0, -1);
          setStatusText(next || 'awaiting sequence...');
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDisplay(isUnlocked ? getRealCountdown() : getScrambledCountdown());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isUnlocked]);

  return (
    <main className={`summer-page-shell${isUnlocked ? ' unlocked' : ''}`}>
      <div className="summer-bg-grid" />
      <div className="summer-bg-glow summer-bg-glow-a" />
      <div className="summer-bg-glow summer-bg-glow-b" />

      <section className="summer-hero-panel">
        <p className="summer-eyebrow">Geometry Dash x Tech x Axolotl Signal</p>
        <h1>The Final Countdown</h1>
        <p className="summer-intro">It will all come to a rebirth....</p>

        <div className="summer-countdown-frame" aria-live="polite">
          <div className="summer-timer-card">
            <span className="summer-timer-value">{display.days}</span>
            <span className="summer-timer-label">D</span>
          </div>
          <div className="summer-timer-card">
            <span className="summer-timer-value">{display.hours}</span>
            <span className="summer-timer-label">H</span>
          </div>
          <div className="summer-timer-card">
            <span className="summer-timer-value">{display.minutes}</span>
            <span className="summer-timer-label">M</span>
          </div>
          <div className="summer-timer-card">
            <span className="summer-timer-value">{display.seconds}</span>
            <span className="summer-timer-label">S</span>
          </div>
        </div>

        <p className={`summer-typed-line${isChecking ? ' checking' : ''}`}>{statusText}</p>
      </section>
    </main>
  );
}

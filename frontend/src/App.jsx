import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [username, setUsername] = useState('Player');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [secretNumber, setSecretNumber] = useState(Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('Guess a number from 1 to 100.');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(10);
  const [chatMessages, setChatMessages] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyBonusText, setDailyBonusText] = useState('Checking bonus...');
  const [tab, setTab] = useState('game');

  const primaryButtonStyle = useMemo(() => ({
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 700,
  }), []);

  useEffect(() => {
    const savedUsername = localStorage.getItem('ngc-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }

    loadChatMessages();
    loadLeaderboard();
    loadGameStats();
    checkBonusStatus();
  }, []);

  const loadChatMessages = () => {
    fetch(`${API_URL}/api/chat/messages`)
      .then((res) => res.json())
      .then((data) => setChatMessages(data.messages || []))
      .catch(() => setChatMessages([{ username: 'system', message: 'Chat is unavailable.' }]));
  };

  const loadLeaderboard = () => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => setLeaderboard([]));
  };

  const loadGameStats = () => {
    fetch(`${API_URL}/api/game/stats`)
      .then((res) => res.json())
      .then((data) => {
        const stats = data.stats || {};
        setBestScore(stats.bestScore || 0);
        setStreak(stats.streak || 0);
      })
      .catch(() => {});
  };

  const checkBonusStatus = () => {
    const bonus = Number(localStorage.getItem('ngc-bonus') || 0);
    const now = Date.now();

    if (!bonus || now - bonus > 86400000) {
      setDailyBonusText('Daily bonus available');
    } else {
      const remaining = Math.max(0, 86400000 - (now - bonus));
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      setDailyBonusText(`Next bonus in ${hours}h ${mins}m`);
    }
  };

  const saveUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    localStorage.setItem('ngc-username', trimmed);
    fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: trimmed }),
    }).catch(() => {});
  };

  const claimDailyBonus = async () => {
    const now = Date.now();
    const lastBonus = Number(localStorage.getItem('ngc-bonus') || 0);

    if (lastBonus && now - lastBonus < 86400000) {
      const remaining = 86400000 - (now - lastBonus);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      setMessage(`Bonus not ready. Next in ${hours}h ${mins}m.`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/game/bonus`, { method: 'POST' });
      const data = await response.json();

      if (data.granted) {
        const extra = score + 50;
        setScore(extra);
        setBestScore((current) => Math.max(current, extra));
        localStorage.setItem('ngc-bonus', String(Date.now()));
        setMessage('🎁 Daily bonus claimed: +50 points!');
        setDailyBonusText('Bonus claimed today');
      } else {
        const remaining = Math.max(0, Number(data.nextAvailableAt || 0) - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        setMessage(`Bonus not ready. Next in ${hours}h ${mins}m.`);
      }
    } catch (error) {
      setMessage('Bonus service unavailable.');
    }
  };

  const submitGuess = async () => {
    const parsedGuess = Number(guess);

    if (!Number.isInteger(parsedGuess) || parsedGuess < 1 || parsedGuess > 100) {
      setMessage('Enter a valid number between 1 and 100.');
      return;
    }

    const response = await fetch(`${API_URL}/api/game/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretNumber, guess: parsedGuess }),
    });

    const data = await response.json();

    if (data.result === 'too-low') {
      setMessage('📉 Too low! Try again.');
    } else if (data.result === 'too-high') {
      setMessage('📈 Too high! Try again.');
    } else if (data.result === 'correct') {
      const points = Math.max(20, 100 - (attempts + 1) * 8);
      const nextScore = score + points;
      const nextStreak = streak + 1;
      const best = Math.max(bestScore, nextScore);

      setScore(nextScore);
      setBestScore(best);
      setStreak(nextStreak);
      setMessage(`✅ Correct! You won ${points} points.`);
      setSecretNumber(Math.floor(Math.random() * 100) + 1);
      setGuess('');
      setAttempts(0);
      loadLeaderboard();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (nextAttempts >= maxAttempts) {
      setStreak(0);
      setMessage(`❌ Game over! The number was ${secretNumber}.`);
      setAttempts(0);
      setSecretNumber(Math.floor(Math.random() * 100) + 1);
    }

    setGuess('');
  };

  const sendChatMessage = async () => {
    const message = window.prompt('Write a message:');
    if (!message || !message.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: message.trim(), score }),
      });

      const data = await res.json();
      if (data.ok) {
        loadChatMessages();
      }
    } catch (error) {
      setMessage('Chat unavailable.');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, background: '#0f172a', color: '#f8fafc', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>🎮 Number Guessing Challenge</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{ flex: 1, minWidth: 200, borderRadius: 10, padding: '12px 14px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
        />
        <button onClick={saveUsername} style={primaryButtonStyle}>Set Username</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Score" value={score} accent="#facc15" />
        <StatCard label="Best" value={bestScore} accent="#86efac" />
        <StatCard label="Streak" value={streak} accent="#93c5fd" />
        <StatCard label="Bonus" value={dailyBonusText} accent="#fca5a5" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
        <button onClick={() => setTab('game')} style={{ ...primaryButtonStyle, background: tab === 'game' ? '#3b82f6' : '#1f2937' }}>Game</button>
        <button onClick={() => setTab('chat')} style={{ ...primaryButtonStyle, background: tab === 'chat' ? '#3b82f6' : '#1f2937' }}>Chat</button>
        <button onClick={() => setTab('leaderboard')} style={{ ...primaryButtonStyle, background: tab === 'leaderboard' ? '#3b82f6' : '#1f2937' }}>Leaderboard</button>
      </div>

      {tab === 'game' && (
        <div>
          <div style={{ background: '#111827', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <strong>{message}</strong>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
              placeholder="Enter your guess"
              style={{ flex: 1, minWidth: 220, borderRadius: 10, padding: '12px 14px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
            />
            <button onClick={submitGuess} style={primaryButtonStyle}>Guess</button>
            <button onClick={claimDailyBonus} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', cursor: 'pointer', fontWeight: 700 }}>Daily Bonus</button>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div style={{ background: '#111827', borderRadius: 18, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>Global Chat</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12, background: '#0f172a', borderRadius: 12, padding: 12 }}>
            {chatMessages.map((item, index) => (
              <div key={`${item.username}-${index}`} style={{ padding: '8px 0', borderBottom: '1px solid #1f2937' }}>
                <strong style={{ color: '#93c5fd' }}>{item.username}</strong> {item.score > 0 && <span style={{ color: '#facc15' }}>({item.score})</span>}: {item.message}
              </div>
            ))}
          </div>
          <button onClick={sendChatMessage} style={{ ...primaryButtonStyle, background: '#8b5cf6', width: '100%' }}>Send Chat Message</button>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div style={{ background: '#111827', borderRadius: 18, padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>🏆 Global Leaderboard</h3>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {leaderboard.length === 0 ? (
              <p>No scores yet.</p>
            ) : (
              leaderboard.map((entry) => (
                <div key={entry.username} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px', gap: 12, padding: '12px 0', borderBottom: '1px solid #1f2937', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#facc15', fontSize: 16 }}>{entry.rank}</div>
                  <div>{entry.username}</div>
                  <div style={{ color: '#86efac' }}>Score: {entry.bestScore}</div>
                  <div style={{ color: '#93c5fd' }}>Streak: {entry.streak}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#111827', borderRadius: 12, padding: 16, border: `2px solid ${accent}` }}>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 28, color: accent }}>{value}</div>
    </div>
  );
}

export default App;

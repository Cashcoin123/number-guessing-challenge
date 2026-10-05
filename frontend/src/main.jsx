import { useEffect, useState } from 'react';

export default function App() {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [secretNumber, setSecretNumber] = useState(Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('Guess a number from 1 to 100.');
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(10);

  useEffect(() => {
    const bonus = localStorage.getItem('dailyBonus');
    if (!bonus) {
      localStorage.setItem('dailyBonus', Date.now().toString());
    }
  }, []);

  const handleGuess = () => {
    const parsedGuess = Number(guess);

    if (!Number.isInteger(parsedGuess) || parsedGuess < 1 || parsedGuess > 100) {
      setMessage('Please enter a valid integer between 1 and 100.');
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (parsedGuess < secretNumber) {
      setMessage('Too low! Try again.');
    } else if (parsedGuess > secretNumber) {
      setMessage('Too high! Try again.');
    } else {
      const points = Math.max(20, 100 - nextAttempts * 8);
      const newScore = score + points;
      const newStreak = streak + 1;
      const newBest = Math.max(bestScore, newScore);

      setScore(newScore);
      setBestScore(newBest);
      setStreak(newStreak);
      setMessage(`Correct! You won ${points} points.`);
      setSecretNumber(Math.floor(Math.random() * 100) + 1);
      setAttempts(0);
      return;
    }

    if (nextAttempts >= maxAttempts) {
      setStreak(0);
      setMessage(`Game over! The secret number was ${secretNumber}.`);
      setAttempts(0);
      setSecretNumber(Math.floor(Math.random() * 100) + 1);
    }
  };

  const claimBonus = () => {
    const lastBonus = Number(localStorage.getItem('dailyBonus') || 0);
    const now = Date.now();

    if (now - lastBonus > 86400000) {
      const bonusScore = score + 50;
      setScore(bonusScore);
      setBestScore((current) => Math.max(current, bonusScore));
      localStorage.setItem('dailyBonus', now.toString());
      setMessage('Daily bonus claimed: +50 points!');
    } else {
      setMessage('Daily bonus already claimed. Try again later.');
    }
  };

  return (
    <div style={{
      maxWidth: 760,
      margin: '40px auto',
      padding: 24,
      background: '#0f172a',
      borderRadius: 20,
      color: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: 20 }}>Number Guessing Challenge</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#111827', padding: 12, borderRadius: 12, flex: 1 }}>Score: {score}</div>
        <div style={{ background: '#111827', padding: 12, borderRadius: 12, flex: 1 }}>Best: {bestScore}</div>
        <div style={{ background: '#111827', padding: 12, borderRadius: 12, flex: 1 }}>Streak: {streak}</div>
      </div>

      <div style={{ background: '#111827', padding: 18, borderRadius: 12, marginBottom: 20 }}>
        <strong>{message}</strong>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Enter a guess"
          style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 10, border: 'none' }}
        />
        <button
          onClick={handleGuess}
          style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
        >
          Guess
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={claimBonus}
          style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}
        >
          Claim Daily Bonus
        </button>
        <button
          onClick={() => setSecretNumber(Math.floor(Math.random() * 100) + 1)}
          style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer' }}
        >
          New Secret
        </button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import XPRing from '../components/XPRing.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import BadgeGrid from '../components/BadgeGrid.jsx';
import WeeklyGoals from '../components/WeeklyGoals.jsx';

export default function DashboardPage() {
  const { profile, refreshProfile } = useAuth();
  const [userChallenges, setUserChallenges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(new Set());
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [weekComparison, setWeekComparison] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [challengesRes, badgesRes, myBadgesRes, streakRes, logsRes] = await Promise.all([
        api.get('/challenges/me'),
        api.get('/badges'),
        api.get('/badges/me'),
        api.get('/logs/streak'),
        api.get('/logs/me?limit=14'),
      ]);
      setUserChallenges(challengesRes.userChallenges || []);
      setAllBadges(badgesRes.badges || []);
      setEarnedBadgeIds(new Set((myBadgesRes.userBadges || []).map((ub) => ub.badges?.id)));
      setStreak(streakRes.streak ?? 0);
      const logs = logsRes.logs || [];
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
      startOfThisWeek.setUTCHours(0,0,0,0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7);
      const thisWeekLogs = logs.filter(l => new Date(l.created_at) >= startOfThisWeek);
      const lastWeekLogs = logs.filter(l => new Date(l.created_at) >= startOfLastWeek && new Date(l.created_at) < startOfThisWeek);

      if (thisWeekLogs.length > 0 && lastWeekLogs.length > 0) {
        const avgScreen = (logs) => logs.reduce((s,l) => s + Number(l.screen_time_hours), 0) / logs.length;
        const avgMood = (logs) => logs.reduce((s,l) => s + l.mood_score, 0) / logs.length;
        const screenDiff = ((avgScreen(thisWeekLogs) - avgScreen(lastWeekLogs)) / avgScreen(lastWeekLogs) * 100).toFixed(0);
        const moodDiff = (avgMood(thisWeekLogs) - avgMood(lastWeekLogs)).toFixed(1);
        setWeekComparison({ screenDiff: Number(screenDiff), moodDiff: Number(moodDiff) });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeChallenges = userChallenges.filter((c) => c.status === 'active');
  const completedToday = userChallenges.filter((c) => c.status === 'completed').length;

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/challenges/generate');
      if (res.userChallenge) {
        setUserChallenges((prev) => [res.userChallenge, ...prev]);
      } else {
        setError(res.message || 'Нема повеќе нови предизвици во моментов.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleComplete(userChallengeId) {
    setCompletingId(userChallengeId);
    setError('');
    try {
      const res = await api.post('/challenges/complete', { userChallengeId });
      setUserChallenges((prev) =>
        prev.map((c) => (c.id === userChallengeId ? { ...c, status: 'completed' } : c))
      );
      await refreshProfile();
      if (res.newBadges?.length) {
        setEarnedBadgeIds((prev) => new Set([...prev, ...res.newBadges.map((b) => b.id)]));
      }
      setCelebration(res);
      setTimeout(() => setCelebration(null), 4500);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p className="eyebrow">Денес</p>
          <h1>Здраво, {profile?.username || 'пријателе'} 👋</h1>
        </div>
        {profile && (
          <XPRing xp={profile.xp_points} level={profile.level} avatarEmoji={profile.avatar_emoji} />
        )}
      </header>

      {error && <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

      {streak !== null && streak > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-accent-soft)' }}>
          <span style={{ fontSize: '2rem', lineHeight: 1 }}>🔥</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
              {streak} {streak === 1 ? 'ден по ред' : streak < 5 ? 'дена по ред' : 'дена по ред'}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
              Продолжи да внесуваш дневен check-in за да го одржиш streak-от!
            </p>
          </div>
        </div>
      )}

      {weekComparison && (
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <p className="eyebrow" style={{ marginBottom: '0.3rem' }}>Screen-time оваа недела</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem',
                color: weekComparison.screenDiff < 0 ? 'var(--color-success)' : 'var(--color-alert)' }}>
                {weekComparison.screenDiff > 0 ? '+' : ''}{weekComparison.screenDiff}% vs минатата недела
                {weekComparison.screenDiff < 0 ? ' 👍' : ' 📱'}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <p className="eyebrow" style={{ marginBottom: '0.3rem' }}>Расположение оваа недела</p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem',
                color: weekComparison.moodDiff >= 0 ? 'var(--color-success)' : 'var(--color-alert)' }}>
                {weekComparison.moodDiff > 0 ? '+' : ''}{weekComparison.moodDiff} vs минатата недела
                {weekComparison.moodDiff >= 0 ? ' 😊' : ' 😕'}
              </p>
            </div>
          </div>
      )}

      {celebration && (
        <div className="notice notice-accent" style={{ marginBottom: '1rem' }}>
          🎉 {celebration.message} +{celebration.xpAwarded} XP
          {celebration.leveledUp ? ` · Стигна до Ниво ${celebration.level}!` : ''}
          {celebration.newBadges?.length
            ? ` · Нов беџ: ${celebration.newBadges.map((b) => `${b.icon_emoji} ${b.title}`).join(', ')}`
            : ''}
        </div>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h2 style={{ margin: 0 }}>Твоите предизвици</h2>
          <button type="button" className="btn btn-accent btn-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Се генерира...' : '+ Нов предизвик'}
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
        ) : activeChallenges.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-ink-muted)' }}>
            Сè уште немаш активен предизвик. Кликни на „+ Нов предизвик“ за да добиеш персонализиран предизвик
            според твоите последни записи.
          </div>
        ) : (
          <div className="grid grid-2">
            {activeChallenges.map((uc) => (
              <ChallengeCard
                key={uc.id}
                userChallenge={uc}
                onComplete={handleComplete}
                completing={completingId === uc.id}
              />
            ))}
          </div>
        )}

        {completedToday > 0 && (
          <p className="mono" style={{ marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
            ✓ {completedToday} завршени предизвици вкупно
          </p>
        )}
        <WeeklyGoals />
      </section>

      <section>
        <h2 style={{ marginBottom: '0.9rem' }}>Беџови</h2>
        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
        ) : (
          <BadgeGrid allBadges={allBadges} earnedBadgeIds={earnedBadgeIds} />
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import MoodEmojiPicker from '../components/MoodEmojiPicker.jsx';
import RangeSlider from '../components/RangeSlider.jsx';

export default function CheckInPage() {
  const { refreshProfile } = useAuth();
  const [mood, setMood] = useState(3);
  const [screenTime, setScreenTime] = useState(3);
  const [offlineTime, setOfflineTime] = useState(2);
  const [sleep, setSleep] = useState(7);
  const [diary, setDiary] = useState('');
  const [sentimentPreview, setSentimentPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [todayLog, setTodayLog] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);

  useEffect(() => {
    api.get('/logs/today')
      .then((res) => {
        const log = res.log;
        if (log) {
          setTodayLog(log);
          setMood(log.mood_score);
          setScreenTime(Number(log.screen_time_hours));
          setOfflineTime(Number(log.offline_activities_hours));
          setSleep(log.sleep_hours != null ? Number(log.sleep_hours) : 7);
          setDiary(log.diary_entry || '');
          if (log.sentiment_label) {
            setSentimentPreview({ stressDetected: log.stress_flag, suggestion: null });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingToday(false));
  }, []);

  async function handleAnalyzePreview() {
    if (!diary.trim()) return;
    setAnalyzing(true);
    try {
      const result = await api.post('/sentiment/analyze', { text: diary });
      setSentimentPreview(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(null);
    try {
      const res = await api.post('/logs', {
        mood_score: mood,
        screen_time_hours: screenTime,
        offline_activities_hours: offlineTime,
        sleep_hours: sleep,
        diary_entry: diary.trim() || null,
      });
      setSaved(res);
      setSentimentPreview(res.sentiment);
      setTodayLog(res.log);
      await refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isUpdate = !!todayLog;

  return (
    <div>
      <header className="page-header">
        <p className="eyebrow">Дневен Check-in</p>
        <h1>Како се чувствуваш денес?</h1>
      </header>

      {!loadingToday && isUpdate && (
        <div className="notice notice-accent" style={{ marginBottom: '1.2rem' }}>
          ✅ Веќе внесе запис денес — прикажани се твоите моментални вредности. Можеш да ги промениш и повторно да зачуваш.
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.9rem' }}>Расположение</h3>
        <MoodEmojiPicker value={mood} onChange={setMood} />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Време пред екран наспроти офлајн</h3>
        <RangeSlider
          label="📱 Време на социјални мрежи / екран"
          value={screenTime}
          onChange={setScreenTime}
          max={12}
          accentColor="var(--color-alert)"
        />
        <RangeSlider
          label="🌳 Офлајн активности"
          value={offlineTime}
          onChange={setOfflineTime}
          max={12}
          accentColor="var(--color-primary)"
        />
        <RangeSlider
          label="😴 Часови сон минатата ноќ"
          value={sleep}
          onChange={setSleep}
          max={12}
          accentColor="var(--color-accent)"
        />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Паметен Дневник</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '0.75rem' }}>
          Запиши неколку реченици за тоа kako помина денот. Целосно е приватно — само ти го гледаш ова.
        </p>
        <textarea
          value={diary}
          onChange={(e) => setDiary(e.target.value)}
          placeholder="Денес се чувствував..."
          rows={5}
          style={{
            width: '100%',
            padding: '0.8em',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-border)',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleAnalyzePreview} disabled={analyzing || !diary.trim()}>
            {analyzing ? 'Се анализира...' : '🔍 Прегледај анализа'}
          </button>
        </div>

        {sentimentPreview?.suggestion && (
          <div
            className={`notice ${sentimentPreview.stressDetected ? 'notice-alert' : 'notice-accent'}`}
            style={{ marginTop: '0.9rem' }}
          >
            {sentimentPreview.suggestion}
          </div>
        )}
      </div>

      {error && <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>{error}</div>}
      {saved && (
        <div className="notice notice-success" style={{ marginBottom: '1rem' }}>
          {isUpdate ? 'Записот е ажуриран!' : 'Записот е зачуван!'}{' '}
          {saved.newBadges?.length ? `Нов беџ: ${saved.newBadges.map((b) => b.icon_emoji).join(' ')}` : ''}
        </div>
      )}

      <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loadingToday} style={{ width: '100%' }}>
        {saving ? 'Се зачувува...' : isUpdate ? '✏️ Ажурирај денешен запис' : 'Зачувај денешен запис'}
      </button>
    </div>
  );
}

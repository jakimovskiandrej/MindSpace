import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../utils/api.js';
import { supabase } from '../supabaseClient.js';

async function downloadReport() {
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const res = await fetch(`${apiUrl}/reports/weekly?days=30`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (!res.ok) { alert('Не успеа генерирањето на извештајот.'); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindspace-izvestaj-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function groupByWeek(logs) {
  const weeks = {};
  logs.forEach((log) => {
    const d = new Date(log.created_at);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { week: key, stressDays: 0, totalDays: 0 };
    weeks[key].totalDays++;
    if (log.stress_flag) weeks[key].stressDays++;
  });
  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
}

const MOOD_COLORS= {
  1: '#D96C4F',
  2: '#E3A23A',
  3: '#8FA99E',
  4: '#2B5F5A',
  5: '#4C9A6A',
};

const MOOD_LABELS = {
  1: 'Многу тешко 😔',
  2: 'Тешко 😕',
  3: 'Неутрално 😐',
  4: 'Добро 🙂',
  5: 'Одлично 😄',
};

function CustomMoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>{label}</p>
        <p style={{ margin: 0, fontWeight: 700, color: MOOD_COLORS[val] || '#5C6E66' }}>{MOOD_LABELS[val] || val}</p>
      </div>
  );
}

function CustomScreenTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>{label}</p>
        <p style={{ margin: 0, fontWeight: 700, color: val > 4 ? '#D96C4F' : '#2B5F5A' }}>
          {val}ч — {val > 4 ? '⚠ над препорачаното' : '✓ во ред'}
        </p>
      </div>
  );
}

function CustomSleepTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>{label}</p>
        <p style={{ margin: 0, fontWeight: 700, color: val < 7 ? '#E3A23A' : '#4C9A6A' }}>
          {val}ч — {val < 7 ? '⚠ недоволно' : val >= 8 ? '✓ одлично' : '✓ во ред'}
        </p>
      </div>
  );
}

export default function AnalyticsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
        .get('/logs/me?limit=28')
        .then((res) => setLogs(res.logs || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
  }, []);

  const dailyData = logs.map((log) => ({
    date: new Date(log.created_at).toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit' }),
    mood: log.mood_score,
    screen: Number(log.screen_time_hours),
    sleep: log.sleep_hours != null ? Number(log.sleep_hours) : null,
  }));

  const stressWeekData = groupByWeek(logs).map((w) => ({
    week: w.week.slice(5),
    normal: w.totalDays - w.stressDays,
    stress: w.stressDays,
  }));

  const avgMood= logs.length ? (logs.reduce((s, l) => s + l.mood_score, 0) / logs.length).toFixed(1) : '—';
  const avgScreen= logs.length ? (logs.reduce((s, l) => s + Number(l.screen_time_hours), 0) / logs.length).toFixed(1) : '—';
  const sleepLogs= logs.filter((l) => l.sleep_hours != null);
  const avgSleep= sleepLogs.length ? (sleepLogs.reduce((s, l) => s + Number(l.sleep_hours), 0) / sleepLogs.length).toFixed(1) : '—';
  const stressDays= logs.filter((l) => l.stress_flag).length;

  async function handleDownload() {
    setDownloading(true);
    try { await downloadReport(); } finally { setDownloading(false); }
  }

  function exportCSV() {
    const header= ['Датум', 'Расположение (1-5)', 'Screen-time (ч)', 'Офлајн активности (ч)', 'Сон (ч)', 'Стрес', 'Sentiment'];
    const rows = logs.map(l => [
      new Date(l.created_at).toLocaleDateString('mk-MK'),
      l.mood_score,
      l.screen_time_hours,
      l.offline_activities_hours,
      l.sleep_hours ?? '',
      l.stress_flag ? 'Да' : 'Не',
      l.sentiment_label ?? '',
    ]);
    const csv= [header, ...rows].map(r => r.join(',')).join('\n');
    const blob= new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url= URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindspace-podatoci-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const axisStyle = { fontSize: 11, fill: 'var(--color-ink-muted)' };
  const gridStyle = { stroke: 'var(--color-border)', strokeDasharray: '3 3' };

  return (
      <div>
        {/* ── Hero header ── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-primary-soft) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <p className="eyebrow" style={{ color: 'var(--color-primary)' }}>Твои податоци · приватно</p>
            <h1 style={{ margin: '0.2rem 0 0.3rem', fontFamily: 'var(--font-display)', fontSize: '1.9rem' }}>
              📊 Аналитика
            </h1>
            <p style={{ color: 'var(--color-ink-muted)', margin: 0, fontSize: '0.9rem' }}>
              Лични трендови — само ти ги гледаш овие податоци
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportCSV} disabled={logs.length === 0}>
              📊 Извези CSV
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Се генерира...' : '📄 PDF извештај'}
            </button>
          </div>
        </div>

        {error && <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
          <MiniStatCard label="Расположение" value={`${avgMood}/5`} icon="😊" color="var(--color-primary)" />
          <MiniStatCard label="Screen-time" value={`${avgScreen}ч`} icon="📱" color="var(--color-alert)" />
          <MiniStatCard label="Сон" value={`${avgSleep}ч`} icon="😴" color="var(--color-accent)" />
          <MiniStatCard label="Стресни денови" value={stressDays} icon="😤" color="var(--color-ink-muted)" />
        </div>

        {loading ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
        ) : logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-ink-muted)', padding: '2.5rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
              Сè уште немаш записи. Оди на Check-in за да го додадеш твојот прв запис.
            </div>
        ) : (
            <>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.2rem' }}>😊 Расположение по ден</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
                  Скала 1–5 · темна лента = добро расположение · светла/корал = лошо
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
                    <CartesianGrid {...gridStyle} vertical={false} />
                    <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomMoodTooltip />} cursor={{ fill: 'var(--color-bg-soft)' }} />
                    <ReferenceLine y={3} stroke="var(--color-border)" strokeDasharray="4 4" label={{ value: 'Неутр.', position: 'right', fontSize: 10, fill: 'var(--color-ink-muted)' }} />
                    <Bar dataKey="mood" radius={[5, 5, 0, 0]} maxBarSize={40}>
                      {dailyData.map((entry, i) => (
                          <Cell key={i} fill={MOOD_COLORS[entry.mood] || '#8FA99E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                  {Object.entries(MOOD_LABELS).map(([k, v]) => (
                      <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: MOOD_COLORS[k], display: 'inline-block' }} />
                        {v}
                </span>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.2rem' }}>📱 Време пред екран по ден</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
                  Во часови · препорачано максимум: <strong>4 часа</strong> · корал = над препораката
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
                    <CartesianGrid {...gridStyle} vertical={false} />
                    <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]} tick={axisStyle} axisLine={false} tickLine={false} unit="ч" />
                    <Tooltip content={<CustomScreenTooltip />} cursor={{ fill: 'var(--color-bg-soft)' }} />
                    <ReferenceLine y={4} stroke="#D96C4F" strokeDasharray="4 4" label={{ value: 'Макс. 4ч', position: 'right', fontSize: 10, fill: '#D96C4F' }} />
                    <Bar dataKey="screen" radius={[5, 5, 0, 0]} maxBarSize={40}>
                      {dailyData.map((entry, i) => (
                          <Cell key={i} fill={entry.screen > 4 ? '#D96C4F' : '#2B5F5A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {dailyData.some((d) => d.sleep !== null) && (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.2rem' }}>😴 Сон по ноќ</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
                      Во часови · препорачано за тинејџери: <strong>8–9 часа</strong> · жолто = недоволно (под 7ч)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={dailyData.filter(d => d.sleep !== null)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
                        <CartesianGrid {...gridStyle} vertical={false} />
                        <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 12]} ticks={[0, 2, 4, 6, 7, 8, 10, 12]} tick={axisStyle} axisLine={false} tickLine={false} unit="ч" />
                        <Tooltip content={<CustomSleepTooltip />} cursor={{ fill: 'var(--color-bg-soft)' }} />
                        <ReferenceLine y={8} stroke="#4C9A6A" strokeDasharray="4 4" label={{ value: 'Идеал. 8ч', position: 'right', fontSize: 10, fill: '#4C9A6A' }} />
                        <ReferenceLine y={7} stroke="#E3A23A" strokeDasharray="4 4" label={{ value: 'Мин. 7ч', position: 'right', fontSize: 10, fill: '#E3A23A' }} />
                        <Bar dataKey="sleep" radius={[5, 5, 0, 0]} maxBarSize={40}>
                          {dailyData.filter(d => d.sleep !== null).map((entry, i) => (
                              <Cell key={i} fill={entry.sleep < 7 ? '#E3A23A' : entry.sleep >= 8 ? '#4C9A6A' : '#2B5F5A'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              )}

              {stressWeekData.length > 0 && (
                  <div className="card">
                    <h3 style={{ marginBottom: '0.2rem' }}>😤 Стресни денови по недела</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
                      Тиркизно = нормални денови · корал = стресни денови (детектирано преку дневникот)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stressWeekData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="30%">
                        <CartesianGrid {...gridStyle} vertical={false} />
                        <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'var(--color-bg-soft)' }}
                            contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }}
                            formatter={(value, name) => [`${value} ден${value === 1 ? '' : 'ови'}`, name]}
                        />
                        <Bar dataKey="normal" stackId="a" name="Нормални денови" fill="#2B5F5A" />
                        <Bar dataKey="stress" stackId="a" name="Стресни денови" fill="#D96C4F" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              )}
            </>
        )}
      </div>
  );
}

function MiniStatCard({ label, value, icon, color }) {
  return (
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1rem',
        borderLeft: `4px solid ${color}`,
        boxShadow: 'var(--shadow-soft)',
      }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '1.3rem' }}>{icon}</p>
        <p className="mono" style={{ margin: '0 0 0.15rem', fontSize: '1.25rem', fontWeight: 700, color }}>{value}</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      </div>
  );
}
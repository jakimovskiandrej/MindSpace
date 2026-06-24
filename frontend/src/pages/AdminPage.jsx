import { useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../utils/api.js';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const initialLoadDone = useRef(false);
  const [wallPosts, setWallPosts] = useState([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [editText, setEditText] = useState('');
  const [wallError, setWallError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Вчитај overview + класови само еднаш
  useEffect(() => {
    Promise.all([api.get('/admin/overview'), api.get('/admin/classes')])
        .then(([overviewRes, classesRes]) => {
          setOverview(overviewRes);
          setClasses(classesRes.classes || []);
        })
        .catch((err) => setError(err.message))
        .finally(() => {
          setLoading(false);
          initialLoadDone.current = true;
        });
  }, []);

  useEffect(() => {
    api.get('/wall')
        .then((res) => setWallPosts(res.posts || []))
        .catch((err) => setWallError(err.message))
        .finally(() => setWallLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    setStatsLoading(true);
    api.get('/admin/stats')
        .then((res) => setStats(res.stats || []))
        .catch((err) => setError(err.message))
        .finally(() => setStatsLoading(false));
  }, [loading]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    setStatsLoading(true);
    setError('');
    const query = selectedClass ? `?classCode=${encodeURIComponent(selectedClass)}` : '';
    api.get(`/admin/stats${query}`)
        .then((res) => setStats(res.stats || []))
        .catch((err) => setError(err.message))
        .finally(() => setStatsLoading(false));
  }, [selectedClass]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/wall/${deleteTarget.id}`);
      setWallPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setWallError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTarget || !editText.trim()) return;
    try {
      const res = await api.patch(`/wall/${editTarget.id}`, { message: editText.trim() });
      setWallPosts((prev) =>
          prev.map((p) => p.id === editTarget.id ? { ...p, message: res.post.message } : p)
      );
      setEditTarget(null);
    } catch (err) {
      setWallError(err.message);
    }
  }

  async function handlePinPost(postId) {
    try {
      const res = await api.post(`/wall/${postId}/pin`, {});
      setWallPosts((prev) =>
          prev.map((p) => p.id === postId ? { ...p, pinned: res.post.pinned } : p)
      );
    } catch (err) {
      setWallError(err.message);
    }
  }

  const chartData = stats.map((s) => ({
    week: new Date(s.week_start).toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit' }),
    'Расположение': Number(s.avg_mood),
    'Screen-time (ч)': Number(s.avg_screen_time),
    'Сон (ч)': Number(s.avg_sleep),
    '% стрес': Number(s.pct_high_stress),
  }));

  return (
      <div>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderTop: '4px solid var(--color-primary-deep)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <p className="eyebrow" style={{ color: 'var(--color-primary-deep)' }}>Институционален преглед</p>
            <h1 style={{ margin: '0.2rem 0 0.3rem', fontFamily: 'var(--font-display)' }}>🧑‍⚕️ Admin Dashboard</h1>
            <p style={{ color: 'var(--color-ink-muted)', margin: 0, fontSize: '0.9rem', maxWidth: 480 }}>
              Агрегирани анонимизирани податоци по клас — индивидуалните записи на учениците се приватни.
            </p>
          </div>
          <div style={{
            background: 'var(--color-bg-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            textAlign: 'right',
            flexShrink: 0,
          }}>
            <p style={{ margin: '0 0 0.2rem', fontWeight: 700, color: 'var(--color-ink)' }}>🔒 Приватност</p>
            <p style={{ margin: 0 }}>Без пристап до дневници</p>
            <p style={{ margin: 0 }}>Само агрегирани метрики</p>
          </div>
        </div>

        {deleteTarget && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(15,26,22,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                padding: '2rem', maxWidth: 420, width: '100%',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
              }}>
                <h3 style={{ marginTop: 0 }}>🗑️ Избриши порака</h3>
                <p style={{ color: 'var(--color-ink-muted)', marginBottom: '0.75rem' }}>
                  Дали сигурно сакаш да ја избришеш оваа порака? Акцијата е неповратна.
                </p>
                <div style={{
                  background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem', marginBottom: '1.5rem',
                  fontSize: '0.9rem', color: 'var(--color-ink)', fontStyle: 'italic',
                }}>
                  „{deleteTarget.message}"
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(null)} disabled={deleting}>
                    Откажи
                  </button>
                  <button type="button" className="btn btn-sm"
                          onClick={handleConfirmDelete} disabled={deleting}
                          style={{ background: 'var(--color-alert)', color: '#fff', border: 'none' }}>
                    {deleting ? 'Се брише...' : 'Да, избриши'}
                  </button>
                </div>
              </div>
            </div>
        )}

        {editTarget && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(15,26,22,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                padding: '2rem', maxWidth: 460, width: '100%',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
              }}>
                <h3 style={{ marginTop: 0 }}>✏️ Уреди порака</h3>
                <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={280}
                    rows={4}
                    style={{
                      width: '100%', padding: '0.8em', borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)', fontFamily: 'inherit',
                      fontSize: '0.95rem', resize: 'vertical', background: 'var(--color-bg)',
                      color: 'var(--color-ink)',
                    }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: '0.3rem 0 1rem' }}>
                  {editText.length}/280
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditTarget(null)}>
                    Откажи
                  </button>
                  <button type="button" className="btn btn-primary btn-sm"
                          onClick={handleSaveEdit} disabled={!editText.trim()}>
                    Зачувај
                  </button>
                </div>
              </div>
            </div>
        )}

        {error && (
            <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>
              {error}
              <button type="button" onClick={() => setError('')}
                      style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            </div>
        )}

        {loading ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
        ) : (
            <>
              {overview?.avgHighStressPct >= 50 && (
                  <div className="notice notice-alert" style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
                    ⚠️ Просечниот % стресни денови е <strong>{overview.avgHighStressPct}%</strong> — над прагот од 50%.
                  </div>
              )}

              <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
                <StatCard label="Класови следени" value={overview?.classesTracked ?? '—'} color="var(--color-primary)" />
                <StatCard
                    label="Просечно расположение"
                    value={overview?.avgMoodAcrossSchool ? `${overview.avgMoodAcrossSchool}/5` : '—'}
                    color="var(--color-accent)"
                />
                <StatCard
                    label="Просечно висок стрес"
                    value={overview?.avgHighStressPct ? `${overview.avgHighStressPct}%` : '—'}
                    color="var(--color-alert)"
                />
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>Неделни трендови</h3>
                  <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      style={{
                        padding: '0.5em 0.8em', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--color-border)', fontFamily: 'inherit',
                        fontSize: '0.88rem', background: 'var(--color-surface)', color: 'var(--color-ink)',
                      }}
                  >
                    <option value="">Сите класови</option>
                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {statsLoading ? (
                    <p style={{ color: 'var(--color-ink-muted)', marginTop: '1rem' }}>Се вчитува...</p>
                ) : chartData.length === 0 ? (
                    <p style={{ color: 'var(--color-ink-muted)', marginTop: '1rem' }}>
                      Сè уште нема доволно податоци. Учениците треба прво да направат check-in.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={300} style={{ marginTop: '1rem' }}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Расположение" stroke="#2B5F5A" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Screen-time (ч)" stroke="#D96C4F" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Сон (ч)" stroke="#E3A23A" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                )}
              </div>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>% ученици со висок стрес по недела</h3>
                {chartData.length === 0 ? (
                    <p style={{ color: 'var(--color-ink-muted)' }}>Нема податоци.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                        <YAxis tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                        <Bar dataKey="% стрес" fill="#D96C4F" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginTop: '0.75rem' }}>
                  Потребни се минимум неколку ученички записи за да се прикаже недела.
                </p>
              </div>

              {classes.length > 1 && chartData.length > 0 && (
                  <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Споредба меѓу класови (последна недела)</h3>
                    {(() => {
                      const latest = {};
                      stats.forEach((s) => {
                        if (!latest[s.class_code] || s.week_start > latest[s.class_code].week_start) {
                          latest[s.class_code] = s;
                        }
                      });
                      const compareData = Object.values(latest).map((s) => ({
                        class: s.class_code,
                        'Расположение': Number(s.avg_mood),
                        '% стрес': Number(s.pct_high_stress),
                        'Сон (ч)': Number(s.avg_sleep),
                      }));
                      return (
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={compareData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                              <XAxis dataKey="class" tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-ink-muted)" />
                              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)' }} />
                              <Legend />
                              <Bar dataKey="Расположение" fill="#2B5F5A" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="% стрес" fill="#D96C4F" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="Сон (ч)" fill="#E3A23A" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                      );
                    })()}
                  </div>
              )}

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>💬 Ѕид на мотивација — Модерација</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                {wallPosts.length} пораки вкупно
              </span>
                </div>

                {wallError && (
                    <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>
                      {wallError}
                      <button type="button" onClick={() => setWallError('')}
                              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        ✕
                      </button>
                    </div>
                )}

                {wallLoading ? (
                    <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
                ) : wallPosts.length === 0 ? (
                    <p style={{ color: 'var(--color-ink-muted)' }}>Нема пораки на ѕидот.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 520, overflowY: 'auto' }}>
                      {[...wallPosts]
                          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                          .map((post) => (
                              <div key={post.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
                                background: post.pinned ? 'var(--color-primary-soft)' : 'var(--color-bg-soft)',
                                border: post.pinned ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {post.pinned && (
                                      <span style={{
                                        fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        marginBottom: '0.3rem', display: 'block',
                                      }}>
                            📌 Пинувано
                          </span>
                                  )}
                                  <p style={{ margin: '0 0 0.3rem', fontSize: '0.9rem', color: 'var(--color-ink)', wordBreak: 'break-word' }}>
                                    {post.message}
                                  </p>
                                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                                    {post.profiles?.username ? `👤 ${post.profiles.username} · ` : '👤 Анонимно · '}
                                    {new Date(post.created_at).toLocaleDateString('mk-MK', {
                                      day: '2-digit', month: '2-digit', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                    {' · '}❤️ {post.reaction_count}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                                  <button type="button" title={post.pinned ? 'Анпинувај' : 'Пинувај'}
                                          onClick={() => handlePinPost(post.id)}
                                          style={{
                                            background: post.pinned ? 'var(--color-primary-soft)' : 'none',
                                            border: 'none', cursor: 'pointer', fontSize: '1rem',
                                            opacity: post.pinned ? 1 : 0.4, padding: '0.25rem 0.4rem',
                                            borderRadius: 'var(--radius-sm)',
                                          }}>
                                    📌
                                  </button>
                                  <button type="button" title="Уреди"
                                          onClick={() => { setEditTarget(post); setEditText(post.message); }}
                                          style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '1rem', padding: '0.25rem 0.4rem',
                                            borderRadius: 'var(--radius-sm)',
                                          }}>
                                    ✏️
                                  </button>
                                  <button type="button" title="Избриши"
                                          onClick={() => setDeleteTarget(post)}
                                          style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '1rem', padding: '0.25rem 0.4rem',
                                            borderRadius: 'var(--radius-sm)',
                                          }}>
                                    🗑️
                                  </button>
                                </div>
                              </div>
                          ))}
                    </div>
                )}
              </div>
            </>
        )}
      </div>
  );
}

function StatCard({ label, value, color }) {
  return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.1rem 1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{
          width: 8, height: 44,
          borderRadius: 'var(--radius-full)',
          background: color,
          flexShrink: 0,
        }} />
        <div>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.75rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </p>
          <p className="mono" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color }}>
            {value}
          </p>
        </div>
      </div>
  );
}
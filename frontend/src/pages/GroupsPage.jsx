import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { supabase } from '../supabaseClient.js';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [leaderboards, setLeaderboards] = useState({});

  async function loadLeaderboard(groupId) {
    try {
      const res = await api.get(`/groups/${groupId}/leaderboard`);
      setLeaderboards((prev) => ({ ...prev, [groupId]: res.entries || [] }));
    } catch {}
  }

  async function loadGroups() {
    setError('');
    try {
      const res = await api.get('/groups/me');
      setGroups(res.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGroups(); }, []);

  useEffect(() => {
    const channel = supabase
        .channel('group_challenge_updates')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_challenges' }, (payload) => {
          if (payload.new?.status === 'completed' && payload.new?.group_id) {
            showToast('🎉 Сосученик од твојата група штотуку заврши предизвик!');
            loadGroups();
          }
        })
        .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    setError('');
    setCreatedGroup(null);
    try {
      const res = await api.post('/groups', { name: newGroupName.trim() });
      setCreatedGroup(res.group);
      setNewGroupName('');
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setError('');
    try {
      await api.post('/groups/join', { joinCode: joinCode.trim() });
      setJoinCode('');
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return;
    setDeleting(true);
    setError('');
    try {
      const res = await api.delete(`/groups/${confirmTarget.id}`);
      setGroups((prev) => prev.filter((g) => g.id !== confirmTarget.id));
      showToast(res.deleted ? '🗑️ Групата е избришана.' : '👋 Ја напуштивте групата.');
      setConfirmTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleCopy(code) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
      <div>
        {confirmTarget && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(30,45,39,0.45)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                padding: '2rem', maxWidth: 400, width: '100%',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  {confirmTarget.memberCount === 1 ? '🗑️ Избриши група' : '👋 Напушти група'}
                </h3>
                <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  {confirmTarget.memberCount === 1
                      ? <>Дали сигурно сакаш да ја избришеш групата <strong>„{confirmTarget.name}"</strong>? Оваа акција е неповратна.</>
                      : <>Дали сигурно сакаш да ја напуштиш групата <strong>„{confirmTarget.name}"</strong>?</>
                  }
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setConfirmTarget(null)}
                      disabled={deleting}
                  >
                    Откажи
                  </button>
                  <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                      style={{ background: 'var(--color-alert)', color: '#fff', border: 'none' }}
                  >
                    {deleting ? 'Се брише...' : confirmTarget.memberCount === 1 ? 'Да, избриши' : 'Да, напушти'}
                  </button>
                </div>
              </div>
            </div>
        )}

        <header className="page-header">
          <p className="eyebrow">Заедно е полесно</p>
          <h1>Групи / Одделение</h1>
          <p style={{ color: 'var(--color-ink-muted)' }}>
            Создади или приклучи се кон група на твоето одделение и следи го заедничкиот напредок.
          </p>
        </header>

        {error && <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>{error}</div>}
        {toast && <div className="notice notice-accent" style={{ marginBottom: '1rem' }}>{toast}</div>}

        {createdGroup && (
            <div className="notice notice-success" style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>✅ Групата „{createdGroup.name}" е создадена!</p>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Сподели го овој код со соучениците:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="mono" style={{
              fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.2em',
              background: 'var(--color-surface)', padding: '0.3em 0.7em',
              borderRadius: 'var(--radius-md)', border: '2px solid var(--color-success)',
            }}>
              {createdGroup.join_code}
            </span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => handleCopy(createdGroup.join_code)}>
                  {copied ? '✓ Копирано!' : '📋 Копирај'}
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setCreatedGroup(null)}
                        style={{ marginLeft: 'auto', color: 'var(--color-ink-muted)' }}>
                  Затвори
                </button>
              </div>
            </div>
        )}

        <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleCreate} className="card">
            <h3 style={{ marginTop: 0 }}>Создади нова група</h3>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.88rem' }}>
              На пр. „VIII-2 2026". По креирање ќе добиеш код за приклучување.
            </p>
            <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                   placeholder="Име на групата" style={inputStyle} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating || !newGroupName.trim()}>
              {creating ? 'Се создава...' : 'Создај група'}
            </button>
          </form>

          <form onSubmit={handleJoin} className="card">
            <h3 style={{ marginTop: 0 }}>Приклучи се со код</h3>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.88rem' }}>
              Внеси го кодот што ти го дал наставникот или соученик.
            </p>
            <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                   placeholder="на пр. A1B2C3" className="mono" style={inputStyle} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={joining || !joinCode.trim()}>
              {joining ? 'Се приклучува...' : 'Приклучи се'}
            </button>
          </form>
        </div>

        <h2 style={{ marginBottom: '0.9rem' }}>Твоите групи</h2>
        {loading ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
        ) : groups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-ink-muted)' }}>
              Сè уште не си во ниту една група. Создади или приклучи се преку формите погоре.
            </div>
        ) : (
            <div className="grid grid-2">
              {groups.map((g) => (
                  <div key={g.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h3 style={{ margin: '0 0 0.2rem' }}>{g.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <span className="mono" style={{
                    fontSize: '0.75rem', background: 'var(--color-bg-soft)',
                    padding: '0.2em 0.6em', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em',
                  }}>
                    {g.join_code}
                  </span>
                        <button type="button" title="Копирај код" onClick={() => handleCopy(g.join_code)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1em 0.3em', color: 'var(--color-ink-muted)' }}>
                          📋
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.88rem', margin: '0.5rem 0 0.9rem' }}>
                      👥 {g.memberCount} член{g.memberCount === 1 ? '' : 'ови'} · ✅ {g.completedCount} завршени
                    </p>
                    <GroupProgressBar completed={g.completedCount} members={g.memberCount} />
                    <LeaderboardSection groupId={g.id} entries={leaderboards[g.id]}
                                        onLoad={() => loadLeaderboard(g.id)} />
                    <button
                        type="button"
                        onClick={() => setConfirmTarget({ id: g.id, name: g.name, memberCount: g.memberCount })}
                        style={{
                          marginTop: '0.9rem', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-ink-muted)', padding: 0,
                        }}
                    >
                      {g.memberCount === 1 ? '🗑️ Избриши група' : '👋 Напушти група'}
                    </button>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

function GroupProgressBar({ completed, members }) {
  const pct = Math.min(100, (completed / Math.max(members * 3, 1)) * 100);
  return (
      <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-soft)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: 'var(--color-accent)',
          borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease',
        }} />
      </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.7em 0.9em', borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-border)', fontFamily: 'inherit', fontSize: '0.95rem', margin: '0.6rem 0 0.9rem',
};

function LeaderboardSection({ groupId, entries, onLoad }) {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((o) => !o);
    if (!entries) onLoad();
  }

  return (
      <div style={{ marginTop: '0.75rem' }}>
        <button type="button" onClick={toggle}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', color: 'var(--color-primary)', padding: 0, fontWeight: 600 }}>
          {open ? '▲ Скриј лидерборд' : '🏆 Прикажи лидерборд'}
        </button>
        {open && (
            <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {!entries ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
              ) : entries.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>Нема доволно членови.</p>
              ) : entries.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                    background: i === 0 ? 'var(--color-accent-soft)' : 'var(--color-bg-soft)',
                  }}>
              <span style={{ fontWeight: 700, width: 20, textAlign: 'center', fontSize: '0.9rem' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                Ниво {e.level}
              </span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                {e.xp} XP
              </span>
                  </div>
              ))}
              <p style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', margin: '0.3rem 0 0' }}>
                Прикажано без имиња — само XP и ниво.
              </p>
            </div>
        )}
      </div>
  );
}
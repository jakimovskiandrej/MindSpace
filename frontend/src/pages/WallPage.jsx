import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function WallPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'popular' | 'mine'
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        api.get('/wall')
            .then((res) => setPosts(res.posts || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));

        const channel = supabase
            .channel('wall_posts_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wall_posts' }, (payload) => {
                setPosts((prev) => {
                    if (prev.some((p) => p.id === payload.new.id)) return prev;
                    const { user_id, ...publicPost } = payload.new;
                    return [publicPost, ...prev];
                });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    async function handlePost(e) {
        e.preventDefault();
        if (!message.trim()) return;
        setPosting(true);
        setError('');
        try {
            const res = await api.post('/wall', { message: message.trim() });
            setPosts((prev) => (prev.some((p) => p.id === res.post.id) ? prev : [{ ...res.post, is_mine: true }, ...prev]));
            setMessage('');
        } catch (err) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    }

    async function handleReact(postId) {
        try {
            const res = await api.post(`/wall/${postId}/react`, { reaction: 'heart' });
            setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reaction_count: res.reaction_count } : p));
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDeleteOwn() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/wall/${deleteTarget.id}/mine`);
            setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    }

    const filtered = posts
        .filter((p) => {
            if (filter === 'popular') return (p.reaction_count || 0) >= 3;
            if (filter === 'mine') return p.is_mine;
            return true;
        })
        .filter((p) => !search.trim() || p.message.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (b.pinned && !a.pinned) return 1;
            if (a.pinned && !b.pinned) return -1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <div>
            {deleteTarget && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(15,26,22,0.6)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                }}>
                    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: 400, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0 }}>🗑️ Избриши порака</h3>
                        <p style={{ color: 'var(--color-ink-muted)', marginBottom: '0.75rem' }}>
                            Дали сигурно сакаш да ја избришеш оваа твоја порака?
                        </p>
                        <div style={{ background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            „{deleteTarget.message}"
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Откажи
                            </button>
                            <button type="button" className="btn btn-sm" onClick={handleDeleteOwn} disabled={deleting}
                                    style={{ background: 'var(--color-alert)', color: '#fff', border: 'none' }}>
                                {deleting ? 'Се брише...' : 'Да, избриши'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="page-header">
                <p className="eyebrow">Анонимно</p>
                <h1>Ѕид на мотивација</h1>
                <p style={{ color: 'var(--color-ink-muted)' }}>
                    Сподели мал успех или позитивна порака. Никој не гледа кој ја објавил.
                </p>
            </header>

            <form onSubmit={handlePost} className="card" style={{ marginBottom: '1.5rem' }}>
        <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Денес успеав да..."
            maxLength={280}
            rows={3}
            style={{
                width: '100%', padding: '0.8em', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)', fontFamily: 'inherit',
                fontSize: '0.95rem', resize: 'vertical', marginBottom: '0.6rem',
                background: 'var(--color-bg)', color: 'var(--color-ink)',
            }}
        />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: message.length > 250 ? 'var(--color-alert)' : 'var(--color-ink-muted)' }}>
            {message.length}/280
          </span>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !message.trim()}>
                        {posting ? 'Се објавува...' : '📣 Објави анонимно'}
                    </button>
                </div>
            </form>

            {error && <div className="notice notice-alert" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Пребарај пораки..."
                    style={{
                        flex: 1, minWidth: 180, padding: '0.6em 0.9em',
                        borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)',
                        fontFamily: 'inherit', fontSize: '0.88rem',
                        background: 'var(--color-bg)', color: 'var(--color-ink)',
                    }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[
                        { key: 'all', label: 'Сите' },
                        { key: 'popular', label: '❤️ Популарни' },
                        { key: 'mine', label: '✍️ Мои' },
                    ].map((f) => (
                        <button key={f.key} type="button"
                                onClick={() => setFilter(f.key)}
                                className={filter === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува...</p>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: 'var(--color-ink-muted)', padding: '2rem' }}>
                    {search ? 'Нема пораки кои одговараат на пребарувањето.' : 'Сè уште нема пораки. Биди прв/а!'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map((post) => (
                        <div key={post.id} className="card" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                            border: post.pinned ? '1.5px solid var(--color-primary)' : undefined,
                            background: post.pinned ? 'var(--color-primary-soft)' : undefined,
                        }}>
                            <div style={{ flex: 1 }}>
                                {post.pinned && (
                                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        📌 Пинувано
                                    </p>
                                )}
                                <p style={{ margin: '0 0 0.4rem' }}>{post.message}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                                    {new Date(post.created_at).toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    {post.is_mine && <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>· твоја порака</span>}
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                                <button type="button" onClick={() => handleReact(post.id)}
                                        className="btn btn-ghost btn-sm">
                                    ❤️ {post.reaction_count || 0}
                                </button>
                                {post.is_mine && (
                                    <button type="button" onClick={() => setDeleteTarget(post)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-ink-muted)', padding: '0.2rem' }}>
                                        🗑️ Избриши
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
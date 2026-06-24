import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { session, loading: authLoading, refreshProfile } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
      } else {
        if (!username.trim()) throw new Error('Внеси корисничко име.');

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.session && data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: username.trim(),
            role,
            class_code: role === 'student' ? classCode.trim() || null : null,
          });
          if (profileError) throw profileError;
          await refreshProfile();
        } else {
          setInfo('Регистрацијата е успешна! Провери го твојот email за потврда, потоа најави се.');
          setMode('login');
        }
      }
    } catch (err) {
      setError(err.message || 'Се случи грешка.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-bg)',
        padding: '1.5rem',
      }}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.2rem' }}>🌿</span>
          <h1 style={{ marginTop: '0.5rem' }}>MindSpace</h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.92rem' }}>
            Баланс. Свест. Поддршка.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('login')}
          >
            Најава
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('register')}
          >
            Регистрација
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Корисничко име"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Лозинка (мин. 6 карактери)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {mode === 'register' && (
            <>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                <option value="student">Ученик/чка</option>
                <option value="teacher">Наставник</option>
                <option value="psychologist">Училишен психолог</option>
              </select>

              {role === 'student' && (
                <input
                  type="text"
                  placeholder="Код на клас (на пр. VII-a) — опционално"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  style={inputStyle}
                />
              )}
            </>
          )}

          {error && <div className="notice notice-alert">{error}</div>}
          {info && <div className="notice notice-success">{info}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Се вчитува...' : mode === 'login' ? 'Најави се' : 'Создај профил'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.7em 0.9em',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-border)',
  fontSize: '0.95rem',
  background: 'var(--color-bg)',
};

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import OnboardingTour from '../components/OnboardingTour.jsx';
import { supabase } from '../supabaseClient.js';

const AVATAR_OPTIONS = ['😊', '🧠', '🌱', '🦋', '⚡', '🌊', '🔥', '🌸', '🎯', '🦄', '🐬', '🌙'];

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('😊');
  const [classCode, setClassCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const [showTour, setShowTour] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatar(profile.avatar_emoji || '😊');
      setClassCode(profile.class_code || '');
    }
  }, [profile]);

  async function handleSave() {
    if (!username.trim()) {
      setError('Корисничкото ime не може да биде празно.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Нема активна сесија.');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_emoji: avatar,
          class_code: classCode.trim() || null,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Не успеа зачувувањето.');
    } finally {
      setSaving(false);
    }
  }

    async function handleChangePassword() {
        if (!newPassword.trim()) return;
        if (newPassword.length < 6) {
            setPwError('Лозинката мора да има барем 6 карактери.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('Лозинките не се совпаѓаат.');
            return;
        }
        setPwSaving(true);
        setPwError('');
        setPwSuccess(false);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPwSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPwSuccess(false), 3500);
        } catch (err) {
            setPwError(err.message || 'Не успеа промената на лозинката.');
        } finally {
            setPwSaving(false);
        }
    }

  if (!profile) {
    return <p style={{ color: 'var(--color-ink-muted)' }}>Се вчитува профилот...</p>;
  }

  return (
      <div style={{maxWidth: 520}}>
          <header className="page-header">
              <p className="eyebrow">Твојот профил</p>
              <h1>Поставки</h1>
          </header>

          <div className="card" style={{marginBottom: '1.5rem'}}>
              <h3 style={{marginTop: 0, marginBottom: '1.2rem'}}>Избери аватар</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.5rem'}}>
                  {AVATAR_OPTIONS.map((emoji) => (
                      <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatar(emoji)}
                          aria-pressed={avatar === emoji}
                          style={{
                              fontSize: '1.6rem',
                              lineHeight: 1,
                              width: 52,
                              height: 52,
                              borderRadius: 'var(--radius-full)',
                              border: avatar === emoji
                                  ? '3px solid var(--color-primary)'
                                  : '2px solid var(--color-border)',
                              background: avatar === emoji ? 'var(--color-primary-soft)' : 'var(--color-bg)',
                              cursor: 'pointer',
                              transition: 'border 0.15s, background 0.15s',
                          }}
                      >
                          {emoji}
                      </button>
                  ))}
              </div>
          </div>

          <div className="card" style={{marginBottom: '1.5rem'}}>
              <h3 style={{marginTop: 0, marginBottom: '1rem'}}>Лични информации</h3>

              <label style={labelStyle}>
                  Корисничко ime
                  <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={40}
                      style={inputStyle}
                      placeholder="на пр. Марко"
                  />
              </label>

              {profile.role === 'student' && (
                  <label style={labelStyle}>
                      Код на одделение / клас
                      <input
                          type="text"
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value)}
                          maxLength={20}
                          style={inputStyle}
                          placeholder="на пр. VIII-в"
                      />
                      <span style={{fontSize: '0.8rem', color: 'var(--color-ink-muted)'}}>
              Се користи за анонимизираните извештаи кон наставниците.
            </span>
                  </label>
              )}

              <label style={{...labelStyle, marginBottom: 0}}>
                  Улога
                  <input
                      type="text"
                      value={profile.role === 'psychologist' ? 'Психолог' : profile.role === 'teacher' ? 'Наставник' : 'Ученик'}
                      disabled
                      style={{
                          ...inputStyle,
                          background: 'var(--color-bg-soft)',
                          color: 'var(--color-ink-muted)',
                          cursor: 'not-allowed'
                      }}
                  />
              </label>
          </div>

          <div className="card" style={{marginBottom: '1.5rem'}}>
              <h3 style={{marginTop: 0, marginBottom: '1rem'}}>Изглед</h3>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div>
                      <p style={{margin: 0, fontWeight: 600}}>Темна тема</p>
                      <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--color-ink-muted)'}}>
                          Погодна за користење навечер
                      </p>
                  </div>
                  <button
                      type="button"
                      onClick={toggleTheme}
                      aria-label="Промени тема"
                      style={{
                          width: 52, height: 28,
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          background: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                      }}
                  >
            <span style={{
                position: 'absolute',
                top: 3, left: theme === 'dark' ? 27 : 3,
                width: 22, height: 22,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                display: 'grid', placeItems: 'center',
                fontSize: '0.7rem',
            }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
                  </button>
              </div>
          </div>

          {error && <div className="notice notice-alert" style={{marginBottom: '1rem'}}>{error}</div>}
          {success &&
              <div className="notice notice-success" style={{marginBottom: '1rem'}}>✅ Поставките се зачувани!</div>}

          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}
                  style={{width: '100%'}}>
              {saving ? 'Се зачувува...' : 'Зачувај поставки'}
          </button>
          <div className="card" style={{marginTop: '1.5rem'}}>
              <h3 style={{marginTop: 0, marginBottom: '1rem'}}>🔐 Промени лозинка</h3>

              <label style={labelStyle}>
                  Нова лозинка
                  <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 карактери"
                      style={inputStyle}
                  />
              </label>

              <label style={{...labelStyle, marginBottom: '1rem'}}>
                  Потврди нова лозинка
                  <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повтори ја лозинката"
                      style={inputStyle}
                  />
              </label>

              {pwError && <div className="notice notice-alert" style={{marginBottom: '0.75rem'}}>{pwError}</div>}
              {pwSuccess &&
                  <div className="notice notice-success" style={{marginBottom: '0.75rem'}}>✅ Лозинката е сменета!</div>}

              <button type="button" className="btn btn-primary btn-sm" onClick={handleChangePassword}
                      disabled={pwSaving || !newPassword || !confirmPassword}>
                  {pwSaving ? 'Се менува...' : 'Зачувај нова лозинка'}
              </button>
          </div>
          {showTour && <OnboardingTour forceShow onClose={() => setShowTour(false)}/>}

          <div className="card" style={{marginTop: '1.5rem'}}>
              <h3 style={{marginTop: 0, marginBottom: '0.5rem'}}>Помош</h3>
              <p style={{fontSize: '0.88rem', color: 'var(--color-ink-muted)', marginBottom: '1rem'}}>
                  Сакаш повторно да го видиш водичот низ апликацијата?
              </p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTour(true)}>
                  🧭 Повтори го водичот
              </button>
          </div>
      </div>
  );
}

const labelStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: '1.1rem',
};

const inputStyle = {
    padding: '0.7em 0.9em',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    background: 'var(--color-surface)',
};

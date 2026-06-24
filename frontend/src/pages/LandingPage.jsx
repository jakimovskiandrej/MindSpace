import { useNavigate } from 'react-router-dom';

const FEATURES = [
    { icon: '📝', title: 'Дневен Check-in', desc: 'Запиши расположение, screen-time и сон за само 2 минути.' },
    { icon: '🧠', title: 'AI Дневник', desc: 'Паметна анализа на текст детектира стрес и дава емпатична поддршка.' },
    { icon: '📊', title: 'Аналитика', desc: 'Следи ги своите трендови со интерактивни графикони.' },
    { icon: '🏆', title: 'Предизвици и XP', desc: 'Персонализирани предизвици, беџови и нивоа за мотивација.' },
    { icon: '👥', title: 'Групи', desc: 'Споделувај предизвици со соучениците — анонимен лидерборд.' },
    { icon: '💬', title: 'Ѕид на мотивација', desc: 'Анонимни позитивни пораки од целото одделение.' },
    { icon: '🫶', title: 'SOS Дишење', desc: 'Вежба за дишење секогаш достапна при момент на стрес.' },
    { icon: '🧑‍⚕️', title: 'Admin Dashboard', desc: 'Анонимизирани податоци за наставници — без пристап до дневники.' },
];

const STATS = [
    { value: '120+', label: 'Предизвици' },
    { value: '15', label: 'Типови беџови' },
    { value: '100%', label: 'Приватност' },
    { value: '0', label: 'Реклами' },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-ink)' }}>

            <nav style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', color: 'var(--color-primary-deep)' }}>
                    <span style={{ fontSize: '1.4rem' }}>🌿</span> MindSpace
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
                        Логирај се
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
                        Започни →
                    </button>
                </div>
            </nav>

            <div style={{
                background: 'linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-accent-soft) 50%, var(--color-bg) 100%)',
                padding: '5rem 2rem 4rem',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Дигитална благосостојба за тинејџери
                </p>
                <h1 style={{
                    fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
                    color: 'var(--color-ink)', marginBottom: '1.2rem', lineHeight: 1.15,
                }}>
                    Баланс. Свест. Поддршка.
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-ink-muted)', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                    MindSpace ти помага да го следиш своето ментално здравје, да управуваш со screen-time и стрес,
                    и да изградиш здрави навики — приватно и безбедно.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}
                            style={{ padding: '0.9em 2em', fontSize: '1rem' }}>
                        Започни бесплатно →
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            style={{ padding: '0.9em 2em', fontSize: '1rem' }}>
                        Дознај повеќе ↓
                    </button>
                </div>
            </div>

            <div style={{ background: 'var(--color-primary)', padding: '2.5rem 2rem' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
                    {STATS.map((s) => (
                        <div key={s.value} style={{ textAlign: 'center' }}>
                            <p className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 0 0.2rem' }}>{s.value}</p>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div id="features" style={{ padding: '4rem 2rem', maxWidth: 960, margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                    Сè што ти треба на едно место
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--color-ink-muted)', marginBottom: '3rem' }}>
                    Осмислено за тинејџери, изградено со почит кон приватноста.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} className="card" style={{ padding: '1.5rem' }}>
                            <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>{f.icon}</p>
                            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>{f.title}</h3>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '3rem 2rem' }}>
                <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</p>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.75rem' }}>
                        Твоите податоци се само твои
                    </h2>
                    <p style={{ color: 'var(--color-ink-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                        Дневничките записи и личните логови се целосно приватни — наставниците и психолозите
                        гледаат само анонимизирани агрегирани статистики по клас. Без реклами. Без продавање на податоци.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {['✓ Без реклами', '✓ Без споделување', '✓ Шифрирано', '✓ GDPR принципи'].map((t) => (
                            <span key={t} style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-deep)',
                                padding: '0.4em 0.9em', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600 }}>
                {t}
              </span>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>
                    Подготвен/а да почнеш?
                </h2>
                <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>
                    Бесплатно, без кредитна картичка, само 2 минути за регистрација.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}
                        style={{ padding: '1em 2.5em', fontSize: '1.05rem' }}>
                    Создај акаунт →
                </button>
            </div>

            <footer style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem 2rem', textAlign: 'center',
                fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                MindSpace · Училишен проект за дигитална благосостојба · {new Date().getFullYear()}
            </footer>
        </div>
    );
}
export default function HelpPage() {
    return (
        <div style={{ maxWidth: 620 }}>
            <header className="page-header">
                <p className="eyebrow">Поддршка</p>
                <h1>Ресурси за помош</h1>
                <p style={{ color: 'var(--color-ink-muted)' }}>
                    Ако се чувствуваш преоптоварено, тажно или ти треба некој со кого да разговараш — ти не си сам. Подолу се корисни ресурси.
                </p>
            </header>

            <div className="notice notice-accent" style={{ marginBottom: '1.5rem' }}>
                🫶 Ако се наоѓаш во криза или имаш итна потреба од помош, јави се на <strong>192</strong> (итна помош) или разговарај со твојот училиштен психолог.
            </div>

            {RESOURCES.map((section) => (
                <div key={section.category} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>{section.category}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {section.items.map((item) => (
                            <div key={item.title} className="card" style={{ padding: '1rem 1.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.2rem', fontWeight: 700 }}>{item.icon} {item.title}</p>
                                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-ink-muted)' }}>{item.desc}</p>
                                    </div>
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noreferrer"
                                           className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                                            Посети →
                                        </a>
                                    )}
                                    {item.phone && (
                                        <a href={`tel:${item.phone}`} className="btn btn-primary btn-sm"
                                           style={{ flexShrink: 0 }}>
                                            📞 {item.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const RESOURCES = [
    {
        category: '📞 Телефонски линии за помош (Македонија)',
        items: [
            {
                icon: '🆘', title: 'Итна помош', phone: '194',
                desc: 'Достапна 24/7 за итни медицински и психолошки ситуации.',
            },
            {
                icon: '💬', title: 'СОС линија за деца', phone: '0800 1 2223',
                desc: 'Бесплатна линија за деца и млади во кризна ситуација. Анонимно и доверливо.',
            },
            {
                icon: '🧠', title: 'Центар за ментално здравје', phone: '02 3130 374',
                desc: 'Психолошка поддршка и советување за млади во Скопје.',
            },
        ],
    },
    {
        category: '🌐 Онлајн ресурси',
        items: [
            {
                icon: '🧘', title: 'Smiling Mind — Медитација',
                desc: 'Бесплатна апликација за mindfulness и медитација специјализирана за млади.',
                link: 'https://www.smilingmind.com.au',
            },
            {
                icon: '📖', title: 'YoungMinds',
                desc: 'Информации и совети за ментално здравје на млади (на англиски).',
                link: 'https://www.youngminds.org.uk',
            },
            {
                icon: '😴', title: 'Sleep Foundation — За тинејџери',
                desc: 'Научни совети за подобрување на квалитетот на сонот кај адолесценти.',
                link: 'https://www.sleepfoundation.org/teens-and-sleep',
            },
            {
                icon: '📱', title: 'Common Sense Media — Дигитална благосостојба',
                desc: 'Практични совети за здраво користење на технологијата.',
                link: 'https://www.commonsense.org/education/digital-citizenship',
            },
        ],
    },
    {
        category: '💡 Совети за секоја ситуација',
        items: [
            {
                icon: '😰', title: 'Кога се чувствуваш под стрес',
                desc: '1) Стани и прошетај 10 мин. 2) Пиј чаша вода. 3) Напиши 3 работи за кои си благодарен. 4) Пробај ја SOS вежбата за дишење (зеленото копче долу десно).',
            },
            {
                icon: '📱', title: 'Кога не можеш да престанеш со телефонот',
                desc: 'Стави го телефонот во друга соба 1 час пред спиење. Исклучи ги нотификациите на социјалните мрежи за 2 часа. Постави физичко ограничување на екранот во Settings на телефонот.',
            },
            {
                icon: '😔', title: 'Кога се чувствуваш осамен',
                desc: 'Разговарај со некој доверлив — пријател, родител или училиштен психолог. Само пораката „Можеме да разговараме?" е доволна за почеток.',
            },
        ],
    },
];
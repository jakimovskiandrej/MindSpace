# MindSpace

MindSpace е веб апликација за дигитална благосостојба на тинејџери. Апликацијата им овозможува на учениците да го следат своето расположение, времето пред екран, квалитетот на сонот и нивото на стрес преку дневен check-in. Врз основа на тие податоци, системот генерира персонализирани предизвици, следи напредок преку XP и беџови, и обезбедува анонимизирани агрегирани статистики за наставниците и психолозите.

Проектот е изграден со тро-слојна архитектура: Supabase (PostgreSQL + Auth + Realtime), Node.js/Express backend и React/Vite frontend.

---

## Содржина

- [Функционалности](#функционалности)
- [Структура на проектот](#структура-на-проектот)
- [Технологии](#технологии)
- [API рути](#api-рути)
- [База на податоци](#база-на-податоци)

---

## Функционалности

### За ученици

**Дневен check-in** — Запишување расположение (скала 1-5), часови пред екран, офлајн активности, сон и дневнички запис. Системот детектира дали денес веќе е внесен запис и го прикажува за уредување наместо повторно внесување.

**AI sentiment анализа** — Дневничкиот запис се анализира серверски преку комбинација на `sentiment` NPM пакет и сопствен речник на македонски клучни зборови (100+ зборови за стрес, позитивни емоции, испити, социјални мрежи, семеен притисок). Системот дава емпатична препорака на македонски јазик прилагодена на типот на стрес.

**Персонализирани предизвици** — Алгоритам ги анализира последните 3 записи и избира категорија на предизвик според најслабата точка: digital_detox (ако screen-time > 4ч), mindfulness (ако расположение < 2.5 или 2+ стресни денови), sleep (ако сон < 6ч), или study_balance/social. Базата содржи 120+ предизвици.

**Гејмификација** — XP поени, нивоа и 15 типови беџови кои се доделуваат автоматски при исполнување на критериуми: streak на расположение, low screen-time, квалитетен сон, број на завршени предизвици, активност на ѕидот.

**Аналитика** — Обоени bar chart-ови за расположение, screen-time и сон со референтни линии (препорачани вредности). Стресни денови по недела во stacked bar chart. PDF извештај и CSV извоз.

**Ѕид на мотивација** — Целосно анонимни пораки (user_id никогаш не се враќа кон клиентот). Realtime ажурирање, пребарување, филтер по популарност, бришење сопствени пораки.

**Групи** — Создавање/приклучување преку 6-цифрен код. Realtime известување кога соученик ќе заврши групен предизвик. Анонимен лидерборд (само XP и ниво, без имиња).

**SOS вежба за дишење** — Box-breathing вежба секогаш достапна преку floating копче: 4 фази по 4 секунди (вдиши, задржи, издиши, задржи).

**Неделни цели** — Ученикот сам поставува цели за screen-time, сон и расположение. Прогресот се следи врз основа на записите за тековната недела.

### За наставници и психолози

**Admin Dashboard** — Анонимизирани агрегирани статистики по клас и недела: просечно расположение, screen-time, сон и процент стресни денови. Податоците доаѓаат исклучиво од `class_weekly_stats` SQL view — никогаш директен пристап до индивидуалните логови.

**Аларм за висок стрес** — Автоматско визуелно предупредување кога процентот на стресни денови надминува 50%.

**Споредба на класови** — Bar chart со паралелна споредба на сите класови.

**Модерација на ѕид** — Бришење, уредување и пинување пораки. Admin го гледа username-от на авторот само за цели на модерација.

---

## Структура на проектот

```
mindspace/
├── README.md
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── supabaseClient.js
│       ├── styles/
│       │   └── index.css
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ThemeContext.jsx
│       ├── utils/
│       │   └── api.js
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── XPRing.jsx
│       │   ├── MoodEmojiPicker.jsx
│       │   ├── RangeSlider.jsx
│       │   ├── SOSBreathingButton.jsx
│       │   ├── ChallengeCard.jsx
│       │   ├── BadgeGrid.jsx
│       │   ├── OnboardingTour.jsx
│       │   ├── NotificationPrompt.jsx
│       │   └── WeeklyGoals.jsx
│       └── pages/
│           ├── LandingPage.jsx
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx
│           ├── CheckInPage.jsx
│           ├── AnalyticsPage.jsx
│           ├── WallPage.jsx
│           ├── GroupsPage.jsx
│           ├── AdminPage.jsx
│           ├── SettingsPage.jsx
│           └── HelpPage.jsx
└── backend/
    ├── .env.example
    ├── package.json
    ├── supabase/
    │   ├── schema.sql
    │   └── migrations/
    │       └── 001_log_date_unique.sql
    ├── scripts/
    │   └── seedTestUsers.js
    └── src/
        ├── index.js
        ├── config/
        │   └── supabaseClient.js
        ├── middleware/
        │   └── auth.js
        ├── services/
        │   ├── sentimentService.js
        │   └── badgeService.js
        ├── controllers/
        │   ├── logsController.js
        │   ├── challengesController.js
        │   ├── badgesController.js
        │   ├── groupsController.js
        │   ├── wallController.js
        │   ├── sentimentController.js
        │   ├── adminController.js
        │   └── reportController.js
        └── routes/
            ├── logs.js
            ├── challenges.js
            ├── badges.js
            ├── groups.js
            ├── wall.js
            ├── sentiment.js
            ├── admin.js
            └── report.js
```

---

## Технологии

**Frontend** — React 18, React Router v6, Recharts, Vite, @supabase/supabase-js

**Backend** — Node.js, Express, @supabase/supabase-js, sentiment, pdfkit, dejavu-fonts-ttf, dotenv, morgan, cors

**Инфраструктура** — Supabase (PostgreSQL, Auth, Row Level Security, Realtime)

## API рути

### Логови
| Метод | Рута | Опис |
|---|---|---|
| POST | /api/logs | Создај или ажурирај дневен запис |
| GET | /api/logs/me | Листа на сопствени записи |
| GET | /api/logs/today | Денешниот запис |
| GET | /api/logs/streak | Тековен check-in streak |

### Предизвици
| Метод | Рута | Опис |
|---|---|---|
| GET | /api/challenges | Сите предизвици |
| GET | /api/challenges/me | Мои предизвици |
| POST | /api/challenges/generate | Генерирај персонализиран предизвик |
| PATCH | /api/challenges/:id/complete | Заврши предизвик |

### Групи
| Метод | Рута | Опис |
|---|---|---|
| POST | /api/groups | Создај група |
| POST | /api/groups/join | Приклучи се со код |
| GET | /api/groups/me | Мои групи |
| DELETE | /api/groups/:id | Напушти или избриши група |
| GET | /api/groups/:id/leaderboard | Анонимен лидерборд |

### Ѕид
| Метод | Рута | Опис |
|---|---|---|
| GET | /api/wall | Листа на пораки |
| POST | /api/wall | Објави анонимна порака |
| POST | /api/wall/:id/react | Додај реакција |
| DELETE | /api/wall/:id/mine | Избриши сопствена порака |
| PATCH | /api/wall/:id | Уреди порака (само admin) |
| DELETE | /api/wall/:id | Избриши порака (само admin) |
| POST | /api/wall/:id/pin | Пинувај порака (само admin) |

### Admin (бара teacher или psychologist улога)
| Метод | Рута | Опис |
|---|---|---|
| GET | /api/admin/overview | Преглед на целото училиште |
| GET | /api/admin/classes | Листа на класови |
| GET | /api/admin/stats | Неделни статистики по клас |

### Останато
| Метод | Рута | Опис |
|---|---|---|
| GET | /api/badges | Сите беџови |
| GET | /api/badges/me | Мои беџови |
| POST | /api/sentiment/analyze | Live sentiment анализа |
| GET | /api/reports/weekly | PDF извештај (?days=30) |

---

## База на податоци

### Табели

| Табела | Опис |
|---|---|
| profiles | Кориснички профили — username, role, class_code, xp_points, level |
| daily_logs | Дневни записи — mood, screen_time, sleep, diary, sentiment, stress_flag |
| challenges | Каталог на предизвици (120+) по категории |
| user_challenges | Доделени предизвици по корисник со статус и group_id |
| badges | Каталог на беџови (15) со criteria_type и criteria_value |
| user_badges | Освоени беџови по корисник |
| groups | Групи со уникатен join_code |
| group_members | Членство во групи |
| wall_posts | Пораки на ѕидот со reaction_count и pinned флаг |
| wall_reactions | Реакции на пораки (unique по post + user) |

### View

`class_weekly_stats` — агрегира daily_logs по class_code и недела и враќа просечни вредности и процент стресни денови. Ова е единствениот извор на податоци за Admin Dashboard.

### Приватност и RLS

Row Level Security е овозможен на сите табели. Клучни правила:

- `daily_logs` се целосно приватни — само сопственикот може да чита и пишува свои записи. Психолозите никогаш немаат директен пристап.
- `wall_posts` се читливи за сите автентицирани корисници, но `user_id` никогаш не се враќа кон обични корисници — само до admin преку серверот.
- `user_challenges` имаат посебна политика која им овозможува на членовите на иста група да го видат само статусот на групните предизвици, без содржина.

---

## Белешки

Проектот користи сопствен CSS дизајн систем наместо компонентна библиотека. Сите бои, типографија и spacing се дефинирани преку CSS custom properties во `frontend/src/styles/index.css`, со целосна поддршка за light и dark mode.

Sentiment анализата работи на серверот и никогаш не ја испраќа содржината на дневникот до надворешни сервиси. Македонскиот речник покрива категории специфични за тинејџерски стресори: испити, социјални мрежи, врсничок притисок, семеен притисок и телесна слика.

create extension if not exists "uuid-ossp";
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'psychologist')),
  class_code text,
  xp_points integer not null default 0,
  level integer not null default 1,
  avatar_emoji text default '🌱',
  created_at timestamptz not null default now()
);

create table if not exists daily_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 5),
  screen_time_hours numeric(4,1) not null default 0,
  offline_activities_hours numeric(4,1) not null default 0,
  sleep_hours numeric(4,1),
  diary_entry text,
  sentiment_label text,
  sentiment_score numeric(5,2),
  stress_flag boolean default false,
  created_at timestamptz not null default now(),
  log_date date generated always as ( (created_at at time zone 'utc')::date ) stored,
  unique (user_id, log_date)
);
create index if not exists idx_daily_logs_user on daily_logs(user_id);
create index if not exists idx_daily_logs_created on daily_logs(created_at);

create table if not exists challenges (
  id integer generated always as identity primary key,
  title text not null,
  description text,
  category text not null default 'digital_detox' check (
    category in ('digital_detox', 'mindfulness', 'sleep', 'social', 'study_balance')
  ),
  xp_reward integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists user_challenges (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  challenge_id integer not null references challenges(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed')),
  group_id uuid,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists badges (
  id integer generated always as identity primary key,
  code text unique not null,
  title text not null,
  description text,
  icon_emoji text not null default '🏅',
  criteria_type text not null,
  criteria_value integer not null
);

create table if not exists user_badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id integer not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  join_code text unique not null,
  created_at timestamptz not null default now()
);

alter table user_challenges
  add constraint user_challenges_group_fk
  foreign key (group_id) references groups(id) on delete set null;

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists wall_posts (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  message text not null check (char_length(message) <= 280),
  reaction_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists wall_reactions (
  post_id bigint not null references wall_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction text not null default 'heart' check (reaction in ('heart', 'support', 'clap')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table challenges enable row level security;
alter table user_challenges enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table wall_posts enable row level security;
alter table wall_reactions enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "logs_select_own" on daily_logs for select using (auth.uid() = user_id);
create policy "logs_insert_own" on daily_logs for insert with check (auth.uid() = user_id);
create policy "logs_update_own" on daily_logs for update using (auth.uid() = user_id);
create policy "challenges_select_all" on challenges for select using (auth.role() = 'authenticated');
create policy "user_challenges_select_own" on user_challenges for select using (auth.uid() = user_id);
create policy "user_challenges_insert_own" on user_challenges for insert with check (auth.uid() = user_id);
create policy "user_challenges_update_own" on user_challenges for update using (auth.uid() = user_id);
create policy "user_challenges_select_groupmates" on user_challenges for select using (
  group_id is not null
  and group_id in (select group_id from group_members where user_id = auth.uid())
);

create policy "badges_select_all" on badges for select using (auth.role() = 'authenticated');
create policy "user_badges_select_own" on user_badges for select using (auth.uid() = user_id);
create policy "groups_select_all" on groups for select using (auth.role() = 'authenticated');
create policy "group_members_select_own_group" on group_members for select using (
  user_id = auth.uid() or group_id in (select group_id from group_members where user_id = auth.uid())
);
create policy "group_members_insert_own" on group_members for insert with check (auth.uid() = user_id);
create policy "wall_posts_select_all" on wall_posts for select using (auth.role() = 'authenticated');
create policy "wall_posts_insert_own" on wall_posts for insert with check (auth.uid() = user_id);
create policy "wall_reactions_select_all" on wall_reactions for select using (auth.role() = 'authenticated');
create policy "wall_reactions_insert_own" on wall_reactions for insert with check (auth.uid() = user_id);

create or replace view class_weekly_stats as
select
  p.class_code,
  date_trunc('week', dl.created_at) as week_start,
  count(distinct dl.user_id) as students_logged,
  round(avg(dl.mood_score)::numeric, 2) as avg_mood,
  round(avg(dl.screen_time_hours)::numeric, 2) as avg_screen_time,
  round(avg(dl.sleep_hours)::numeric, 2) as avg_sleep,
  round(
    100.0 * count(*) filter (where dl.stress_flag) / nullif(count(*), 0), 1
  ) as pct_high_stress
from daily_logs dl
join profiles p on p.id = dl.user_id
group by p.class_code, date_trunc('week', dl.created_at);

insert into challenges (title, description, category, xp_reward) values
  ('5-минутна пауза за дишење', 'Направи box-breathing вежба од 5 минути пред да продолжиш со учење.', 'mindfulness', 10),
  ('2 часа офлајн по училиште', 'Остави го телефонот настрана 2 часа веднаш по училиште.', 'digital_detox', 20),
  ('Дигитален детокс довечер', 'Без екрани 1 час пред спиење.', 'sleep', 15),
  ('Прошетка без телефон', 'Излези на 20-минутна прошетка без телефон во рака.', 'digital_detox', 15),
  ('Запиши 3 добри работи', 'Во дневникот запиши 3 добри работи што ти се случија денес.', 'mindfulness', 10),
  ('Помогни на соученик', 'Направи мал гест на поддршка кон некој соученик денес.', 'social', 15),
  ('Распоред за учење без прекини', '25 минути фокусирано учење без прекинување од телефон (Pomodoro).', 'study_balance', 15)
on conflict do nothing;

insert into badges (code, title, description, icon_emoji, criteria_type, criteria_value) values
  ('zen_master', 'Zen Master', '5 последователни денови со одлично расположение (4-5).', '🧘', 'mood_streak', 5),
  ('digital_nomad', 'Digital Nomad', 'Screen-time под 2 часа во тек на 3 последователни денови.', '📵', 'screen_time_streak', 3),
  ('early_bird', 'Early Bird', 'Квалитетен сон (7+ часа) 3 дена по ред.', '🌅', 'sleep_streak', 3),
  ('challenge_starter', 'Challenge Starter', 'Заврши ги твоите први 3 предизвици.', '🚀', 'challenges_completed', 3),
  ('challenge_champion', 'Challenge Champion', 'Заврши 15 предизвици вкупно.', '🏆', 'challenges_completed', 15)
on conflict do nothing;

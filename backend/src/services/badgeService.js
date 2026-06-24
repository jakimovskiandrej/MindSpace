import { supabaseAdmin } from '../config/supabaseClient.js';

export async function checkAndAwardBadges(userId) {
  const newlyAwarded = [];

  const { data: badges, error: badgesError } = await supabaseAdmin
      .from('badges').select('*');
  if (badgesError) {
    console.error('[checkAndAwardBadges] failed to load badges:', badgesError);
    return newlyAwarded;
  }

  const { data: alreadyEarned } = await supabaseAdmin
      .from('user_badges').select('badge_id').eq('user_id', userId);
  const earnedIds = new Set((alreadyEarned || []).map((b) => b.badge_id));

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    const qualifies = await evaluateCriteria(userId, badge);
    if (qualifies) {
      const { error: insertError } = await supabaseAdmin
          .from('user_badges').insert({ user_id: userId, badge_id: badge.id });
      if (!insertError) newlyAwarded.push(badge);
    }
  }

  return newlyAwarded;
}

async function evaluateCriteria(userId, badge) {
  switch (badge.criteria_type) {
    case 'mood_streak':
      return await hasMoodStreak(userId, badge.criteria_value, (s) => s >= 4);
    case 'screen_time_streak':
      return await hasScreenTimeStreak(userId, badge.criteria_value);
    case 'sleep_streak':
      return await hasSleepStreak(userId, badge.criteria_value);
    case 'challenges_completed':
      return await hasCompletedChallenges(userId, badge.criteria_value);
    case 'checkin_streak':
      return await hasCheckinStreak(userId, badge.criteria_value);
    case 'wall_posts_count':
      return await hasWallPostsCount(userId, badge.criteria_value);
    case 'no_stress_streak':
      return await hasNoStressStreak(userId, badge.criteria_value);
    default:
      return false;
  }
}

async function getRecentLogs(userId, limit) {
  const { data, error } = await supabaseAdmin
      .from('daily_logs')
      .select('mood_score, screen_time_hours, sleep_hours, stress_flag, log_date')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit);
  if (error) { console.error('[badgeService] getRecentLogs error:', error); return []; }
  return data || [];
}

async function hasMoodStreak(userId, streakLength, predicate) {
  const logs = await getRecentLogs(userId, streakLength);
  if (logs.length < streakLength) return false;
  return logs.every((log) => predicate(log.mood_score));
}

async function hasScreenTimeStreak(userId, streakLength) {
  const logs = await getRecentLogs(userId, streakLength);
  if (logs.length < streakLength) return false;
  return logs.every((log) => Number(log.screen_time_hours) < 2);
}

async function hasSleepStreak(userId, streakLength) {
  const logs = await getRecentLogs(userId, streakLength);
  if (logs.length < streakLength) return false;
  return logs.every((log) => log.sleep_hours != null && Number(log.sleep_hours) >= 7);
}

async function hasCompletedChallenges(userId, count) {
  const { count: completedCount, error } = await supabaseAdmin
      .from('user_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'completed');
  if (error) return false;
  return (completedCount || 0) >= count;
}

async function hasCheckinStreak(userId, streakLength) {
  const logs = await getRecentLogs(userId, streakLength);
  if (logs.length < streakLength) return false;
  for (let i = 0; i < logs.length - 1; i++) {
    const a = new Date(logs[i].log_date);
    const b = new Date(logs[i + 1].log_date);
    const diff = (a - b) / (1000 * 60 * 60 * 24);
    if (diff !== 1) return false;
  }
  return true;
}

async function hasWallPostsCount(userId, count) {
  const { count: postsCount, error } = await supabaseAdmin
      .from('wall_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
  if (error) return false;
  return (postsCount || 0) >= count;
}

async function hasNoStressStreak(userId, streakLength) {
  const logs = await getRecentLogs(userId, streakLength);
  if (logs.length < streakLength) return false;
  return logs.every((log) => !log.stress_flag);
}
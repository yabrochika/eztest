import type {
  DashboardData,
  DashboardProject,
  InProgressRun,
  PieStatusCounts,
  ResultStatusCounts,
} from './types';
import { PIE_STATUSES } from './types';
import { pieTotal, totalCounts } from './resultStatus';

export const XP_BY_STATUS = {
  PASSED: 10,
  FAILED: 4,
  BLOCKED: 2,
  RETEST: 5,
  SKIPPED: 1,
  NOT_STARTED: 0,
} as const;

export type AchievementId =
  | 'first-hit'
  | 'bug-hunter'
  | 'party'
  | 'questing'
  | 'streak-3'
  | 'perfect-clear'
  | 'volume-50'
  | 'shortcut-link'
  | 'raid-master'
  | 'combo-hot';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  hint: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-hit', name: '初撃', hint: 'PASSED が 1 件以上', rarity: 'common' },
  { id: 'bug-hunter', name: 'バグ検出', hint: 'FAILED が 1 件以上', rarity: 'common' },
  { id: 'party', name: '複数人実施', hint: '実行者が 2 人以上の進行中ラン', rarity: 'rare' },
  { id: 'questing', name: '進行中', hint: '進行中のテストランがある', rarity: 'common' },
  { id: 'streak-3', name: '3日連続', hint: '実施のある日が 3 日連続', rarity: 'rare' },
  { id: 'perfect-clear', name: 'パーフェクト', hint: '失敗なしで実施済みのラン', rarity: 'epic' },
  { id: 'volume-50', name: '大量実施', hint: '実施 50 件以上', rarity: 'epic' },
  { id: 'shortcut-link', name: 'Shortcut 連携', hint: 'Shortcut が作業に紐づいている', rarity: 'rare' },
  { id: 'raid-master', name: '同時進行', hint: '進行中ランが 3 件以上', rarity: 'legendary' },
  { id: 'combo-hot', name: 'HOT COMBO', hint: '直近日の成功が失敗より多い', rarity: 'epic' },
];

export const RARITY_CLASS: Record<AchievementDef['rarity'], string> = {
  common: 'border-white/20 bg-white/5 text-white/70',
  rare: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  epic: 'border-purple-400/40 bg-purple-400/10 text-purple-200',
  legendary: 'border-amber-400/50 bg-amber-400/15 text-amber-200',
};

export interface LevelProgress {
  level: number;
  xp: number;
  current: number;
  next: number;
}

export interface GameQuest {
  id: string;
  title: string;
  detail: string;
  current: number;
  target: number;
  unit: string;
}

export interface PartyMember {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  resultCounts: PieStatusCounts;
  lastExecutedAt: string | null;
}

export interface RunBattle {
  clearRate: number;
  remaining: number;
  executed: number;
  total: number;
  comboLabel: string;
  danger: boolean;
  perfect: boolean;
}

export function xpFromCounts(counts?: PieStatusCounts | ResultStatusCounts | null): number {
  if (!counts) return 0;
  const pie = counts as PieStatusCounts;
  return (
    (pie.PASSED || 0) * XP_BY_STATUS.PASSED +
    (pie.FAILED || 0) * XP_BY_STATUS.FAILED +
    (pie.BLOCKED || 0) * XP_BY_STATUS.BLOCKED +
    (pie.RETEST || 0) * XP_BY_STATUS.RETEST +
    (pie.SKIPPED || 0) * XP_BY_STATUS.SKIPPED
  );
}

export function levelFromXp(xp: number): LevelProgress {
  let level = 1;
  let remaining = Math.max(0, xp);
  let need = 100;
  while (remaining >= need && level < 99) {
    remaining -= need;
    level += 1;
    need = 100 * level;
  }
  return {
    level,
    xp,
    current: remaining,
    next: need,
  };
}

export function todayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function activityStreak(days: Array<{ date: string; counts: ResultStatusCounts }>): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (totalCounts(days[i].counts) > 0) streak += 1;
    else if (streak > 0) break;
  }
  return streak;
}

export function comboDays(days: Array<{ date: string; counts: ResultStatusCounts }>): number {
  let combo = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const passed = days[i].counts.PASSED || 0;
    const failed = days[i].counts.FAILED || 0;
    if (passed > 0 && passed >= failed) combo += 1;
    else if (combo > 0) break;
  }
  return combo;
}

export function mergeParty(projects: DashboardProject[]): PartyMember[] {
  const map = new Map<string, PartyMember>();
  for (const project of projects) {
    for (const executor of project.executors ?? []) {
      const xp = xpFromCounts(executor.resultCounts);
      const existing = map.get(executor.id);
      if (!existing) {
        const progress = levelFromXp(xp);
        map.set(executor.id, {
          id: executor.id,
          name: executor.name,
          email: executor.email,
          xp,
          level: progress.level,
          resultCounts: { ...executor.resultCounts },
          lastExecutedAt: executor.lastExecutedAt,
        });
        continue;
      }
      for (const status of PIE_STATUSES) {
        existing.resultCounts[status] = (existing.resultCounts[status] || 0) + (executor.resultCounts[status] || 0);
      }
      existing.xp = xpFromCounts(existing.resultCounts);
      const progress = levelFromXp(existing.xp);
      existing.level = progress.level;
      if ((executor.lastExecutedAt || '') > (existing.lastExecutedAt || '')) {
        existing.lastExecutedAt = executor.lastExecutedAt;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'ja'));
}

export function runBattle(counts: PieStatusCounts): RunBattle {
  const total = pieTotal(counts);
  const remaining = counts.NOT_STARTED || 0;
  const executed = total - remaining;
  const clearRate = total === 0 ? 0 : executed / total;
  const passed = counts.PASSED || 0;
  const failed = counts.FAILED || 0;
  const perfect = executed > 0 && failed === 0 && remaining === 0;
  const danger = failed > passed && executed > 0;
  let comboLabel = '準備中';
  if (executed === 0) comboLabel = '未開戦';
  else if (perfect) comboLabel = 'PERFECT';
  else if (passed > 0 && passed >= failed * 2) comboLabel = 'HOT';
  else if (danger) comboLabel = 'ピンチ';
  else comboLabel = '進行中';
  return { clearRate, remaining, executed, total, comboLabel, danger, perfect };
}

export function defectDifficulty(priority: string): { label: string; className: string } {
  const value = priority.toUpperCase();
  if (value === 'CRITICAL' || value === 'BLOCKER') {
    return { label: 'S', className: 'border-red-400/50 bg-red-500/15 text-red-200' };
  }
  if (value === 'HIGH') {
    return { label: 'A', className: 'border-orange-400/40 bg-orange-400/10 text-orange-200' };
  }
  if (value === 'LOW') {
    return { label: 'C', className: 'border-white/15 bg-white/5 text-white/55' };
  }
  return { label: 'B', className: 'border-amber-400/30 bg-amber-400/10 text-amber-100' };
}

function hasPerfectRun(projects: DashboardProject[], runs: InProgressRun[]): boolean {
  const check = (counts: PieStatusCounts) => {
    const battle = runBattle(counts);
    return battle.perfect;
  };
  if (runs.some((run) => check(run.resultCounts))) return true;
  return projects.some((project) => (project.recentRuns ?? []).some((run) => check(run.resultCounts)));
}

export function buildGameState(dashboard: DashboardData, userId?: string | null) {
  const party = mergeParty(dashboard.projects);
  const me = userId ? party.find((member) => member.id === userId) ?? null : null;
  const teamXp = dashboard.projects.reduce((sum, project) => sum + xpFromCounts(project.resultCounts), 0);
  const focusXp = me?.xp ?? teamXp;
  const progress = me ?? levelFromXp(teamXp);
  const streak = activityStreak(dashboard.activity.days);
  const combo = comboDays(dashboard.activity.days);
  const today = dashboard.activity.days.find((day) => day.date === todayKey());
  const todayCount = today ? totalCounts(today.counts) : 0;
  const runTotals = dashboard.inProgressRuns.reduce(
    (acc, run) => {
      const battle = runBattle(run.resultCounts);
      acc.executed += battle.executed;
      acc.total += battle.total;
      return acc;
    },
    { executed: 0, total: 0 }
  );
  const passed = dashboard.activity.totals.PASSED || 0;
  const failed = dashboard.activity.totals.FAILED || 0;
  const executedAll = dashboard.projects.reduce((sum, project) => {
    return sum + totalCounts(project.resultCounts);
  }, 0);

  const unlocked = new Set<AchievementId>();
  if (passed > 0) unlocked.add('first-hit');
  if (failed > 0) unlocked.add('bug-hunter');
  if (dashboard.inProgressRuns.some((run) => (run.executors ?? []).length >= 2)) unlocked.add('party');
  if (dashboard.inProgressRuns.length > 0) unlocked.add('questing');
  if (streak >= 3) unlocked.add('streak-3');
  if (hasPerfectRun(dashboard.projects, dashboard.inProgressRuns)) unlocked.add('perfect-clear');
  if (executedAll >= 50) unlocked.add('volume-50');
  if ((dashboard.shortcuts ?? []).length > 0) unlocked.add('shortcut-link');
  if (dashboard.inProgressRuns.length >= 3) unlocked.add('raid-master');
  if (combo >= 1 && passed > failed) unlocked.add('combo-hot');

  const quests: GameQuest[] = [
    {
      id: 'daily',
      title: '今日の実施',
      detail: 'デイリー目標 5 件',
      current: todayCount,
      target: 5,
      unit: '件',
    },
    {
      id: 'raid',
      title: '進行中ラン攻略',
      detail: runTotals.total === 0 ? '進行中ランはない' : '未実施を減らす',
      current: runTotals.total === 0 ? 1 : runTotals.executed,
      target: Math.max(runTotals.total, 1),
      unit: runTotals.total === 0 ? '' : '件',
    },
    {
      id: 'defect',
      title: 'Defect 処理',
      detail:
        dashboard.todos.defects.length === 0
          ? '担当 Defect はゼロ'
          : `担当 ${dashboard.todos.defects.length} 件が残っている`,
      current: dashboard.todos.defects.length === 0 ? 1 : 0,
      target: 1,
      unit: '',
    },
  ];

  return {
    me,
    party,
    progress: {
      ...levelFromXp(focusXp),
      usingPersonal: !!me,
    },
    teamProgress: levelFromXp(teamXp),
    streak,
    combo,
    todayCount,
    quests,
    unlocked,
    teamXp,
    executedAll,
    inProgressCount: dashboard.inProgressRuns.length,
    todoCount: dashboard.todos.testRuns.length + dashboard.todos.defects.length,
  };
}

export type GameState = ReturnType<typeof buildGameState>;

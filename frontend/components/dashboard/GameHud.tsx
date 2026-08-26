'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Flame,
  Gem,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { PanelHeading } from './PanelHeading';
import { StatBar } from './StatBar';
import {
  ACHIEVEMENTS,
  RARITY_CLASS,
  buildGameState,
} from './gameStats';
import type { DashboardData } from './types';

interface GameHudProps {
  dashboard: DashboardData;
}

export function GameHud({ dashboard }: GameHudProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userName = session?.user?.name || 'ユーザー';
  const game = useMemo(() => buildGameState(dashboard, userId), [dashboard, userId]);
  const unlockedCount = game.unlocked.size;

  return (
    <GlassPanel
      heading={<PanelHeading icon={Trophy}>ステータス</PanelHeading>}
      subheading={
        game.progress.usingPersonal
          ? `${userName} の実施結果から算出`
          : 'チーム全体の実施結果から算出（個人の実施がまだない場合）'
      }
      contentClassName="space-y-4"
      className="game-hud overflow-hidden"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-transparent to-sky-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 font-mono text-xs text-amber-200">
              Lv.{game.progress.level}
            </span>
            <span className="text-sm text-white/55">{userName}</span>
          </div>
          <StatBar
            className="mt-3"
            label={<span className="inline-flex items-center gap-1"><Gem className="h-3.5 w-3.5 text-amber-300" />XP</span>}
            value={game.progress.current}
            max={game.progress.next}
            barClassName="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400"
          />
          <p className="mt-1 text-[11px] text-white/40">
            累計 {game.progress.xp} XP · PASSED +10 / FAILED +4 / RETEST +5
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-[11px] text-orange-200">
              <Flame className="h-3.5 w-3.5" />
              連続 {game.streak} 日
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
              <Zap className="h-3.5 w-3.5" />
              COMBO x{Math.max(game.combo, 1)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
              <Trophy className="h-3.5 w-3.5" />
              実績 {unlockedCount}/{ACHIEVEMENTS.length}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              <PlayCircle className="h-3.5 w-3.5" />
              進行中 {game.inProgressCount}
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <Target className="h-4 w-4 text-primary" />
            今日の目標
          </h3>
          <div className="space-y-2.5">
            {game.quests.map((quest) => (
              <div key={quest.id} className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <p className="truncate text-sm text-white">{quest.title}</p>
                <p className="text-[11px] text-white/40">{quest.detail}</p>
                <StatBar
                  className="mt-1.5"
                  label={quest.unit ? `${quest.current}${quest.unit}` : quest.detail}
                  value={quest.current}
                  max={quest.target}
                  barClassName={
                    quest.current >= quest.target
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-sky-400 to-cyan-300'
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-primary" />
          実績
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = game.unlocked.has(achievement.id);
            return (
              <span
                key={achievement.id}
                title={achievement.hint}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                  unlocked ? RARITY_CLASS[achievement.rarity] : 'border-white/10 bg-black/30 text-white/25'
                }`}
              >
                <Trophy className="h-3 w-3" />
                {achievement.name}
              </span>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}

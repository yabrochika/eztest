'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Link2 } from 'lucide-react';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { UserInfoSection } from '@/frontend/reusable-components/data/UserInfoSection';
import { StatisticsSection } from '@/frontend/reusable-components/data/StatisticsSection';
import { DateInfoSection } from '@/frontend/reusable-components/data/DateInfoSection';
import { Defect } from '../types';
import { ShortcutEpicPickerDialog } from './ShortcutEpicPickerDialog';
import { ShortcutStoryPickerDialog } from './ShortcutStoryPickerDialog';
import { extractEpicId, extractEpicIdFromString } from './shortcutEpicDetect';

interface DefectInfoCardProps {
  defect: Defect;
  onChanged?: () => void;
}

export function DefectInfoCard({ defect, onChanged }: DefectInfoCardProps) {
  const [epicPickerOpen, setEpicPickerOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  // When no epic-XXX is detected (or a detected id resolves to something
  // other than an epic), we remember the epic the user picks in memory.
  const [manualEpic, setManualEpic] = useState<{ id: number; name: string | null } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Pick the first suite whose title/name carries an epic id (either an
  // explicit `epic-XXX` token or a leading numeric prefix like `2488-foo`).
  // This drives both the Epic id detection and the "タイトル" badge so they
  // stay in sync and we never show multiple competing epics.
  const primaryEpicSuite = useMemo(() => {
    return (
      (defect.linkedTestSuites ?? []).find(
        (s) =>
          extractEpicIdFromString(s.title) !== null ||
          extractEpicIdFromString(s.name) !== null
      ) ?? null
    );
  }, [defect.linkedTestSuites]);

  const detectedEpicId = useMemo(() => {
    return extractEpicId(
      defect.title,
      defect.testRun?.name,
      primaryEpicSuite?.title,
      primaryEpicSuite?.name,
      defect.description
    );
  }, [defect, primaryEpicSuite]);

  const activeEpicId = manualEpic?.id ?? detectedEpicId ?? null;
  const activeEpicName = manualEpic?.name ?? null;

  const handleChooseStory = async () => {
    setResolveError(null);
    // Nothing detected: go straight to the Epic picker.
    if (!detectedEpicId && !manualEpic) {
      setEpicPickerOpen(true);
      return;
    }

    // Already resolved manually (epic picked earlier): just open stories.
    if (manualEpic) {
      setStoryDialogOpen(true);
      return;
    }

    // Detected from the title — verify it's a real epic in Shortcut.
    try {
      setResolving(true);
      const res = await fetch(`/api/shortcut/resolve/${detectedEpicId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `Failed to resolve id ${detectedEpicId}`);
      }
      const resolved: {
        kind: 'epic' | 'story' | 'unknown';
        epicId: number | null;
        epicName: string | null;
        storyId: number | null;
        storyName: string | null;
      } = data?.data;

      if (resolved.kind === 'epic' && resolved.epicId) {
        setManualEpic({ id: resolved.epicId, name: resolved.epicName });
        setStoryDialogOpen(true);
        return;
      }
      if (resolved.kind === 'story' && resolved.epicId) {
        setManualEpic({ id: resolved.epicId, name: resolved.epicName });
        setStoryDialogOpen(true);
        return;
      }
      if (resolved.kind === 'story' && !resolved.epicId) {
        setResolveError(
          `Story #${resolved.storyId} は Epic に紐付いていません。手動で Epic を選択してください。`
        );
        setEpicPickerOpen(true);
        return;
      }
      setResolveError(
        `id=${detectedEpicId} に該当する Epic/Story が見つかりません。手動で Epic を選択してください。`
      );
      setEpicPickerOpen(true);
    } catch (e) {
      setResolveError(e instanceof Error ? e.message : String(e));
      setEpicPickerOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const handleEpicPicked = (epic: { id: number; name: string }) => {
    setManualEpic(epic);
    setEpicPickerOpen(false);
    setStoryDialogOpen(true);
  };

  return (
    <DetailCard title="情報" contentClassName="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-white/60 mb-1">Defect ID</h4>
        <p className="text-white/90 text-sm font-mono">{defect.defectId}</p>
      </div>

      <UserInfoSection
        label="作成者"
        user={{
          name: defect.createdBy.name,
          email: defect.createdBy.email,
        }}
      />

      {defect.assignedTo && (
        <UserInfoSection
          label="担当者"
          user={{
            name: defect.assignedTo.name,
            email: defect.assignedTo.email,
          }}
          avatarGradient="from-green-500 to-teal-500"
        />
      )}

      {defect.testCases && defect.testCases.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-1">
            関連テストケース
          </h4>
          <div className="space-y-2">
            {defect.testCases.map((tc) => (
              <div key={tc.id}>
                <Badge variant="outline" className="font-mono">
                  {tc.testCase.tcId}
                </Badge>
                <p className="text-white/70 text-xs mt-1">{tc.testCase.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-white/60 mb-1">テスト実行</h4>
        {defect.testRun ? (
          <Badge variant="outline">{defect.testRun.name}</Badge>
        ) : (
          <p className="text-white/50 text-xs">未設定</p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-white/60 mb-1">テストスイート名</h4>
        {primaryEpicSuite ? (
          <Badge
            variant="outline"
            className="mr-2 mb-1 max-w-full"
            title={primaryEpicSuite.title || primaryEpicSuite.name}
          >
            <span className="truncate block">
              {primaryEpicSuite.title || primaryEpicSuite.name}
            </span>
          </Badge>
        ) : (
          <p className="text-white/50 text-xs">
            Epic に紐づくテストスイートがありません
          </p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-white/60 mb-1">Shortcut Epic</h4>
        {activeEpicId ? (
          <div className="font-mono text-xs text-blue-300 mb-2">
            epic-{activeEpicId}
            <span className="ml-2 text-[10px] text-white/40">
              {detectedEpicId ? '（タイトルから自動検出）' : '（手動選択）'}
            </span>
            {activeEpicName && (
              <div className="text-sm text-white/80 font-sans mt-0.5 truncate">
                {activeEpicName}
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-xs mb-2">
            タイトルに <span className="font-mono">epic-XXX</span> が含まれていない場合は選択画面が開きます
          </p>
        )}
        <button
          type="button"
          onClick={handleChooseStory}
          disabled={resolving}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/50 border border-white/20 rounded-md px-3 py-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <Link2 className="w-3.5 h-3.5" />
          {resolving ? '解決中...' : 'ストーリーを選択'}
        </button>
        {resolveError && (
          <p className="text-[11px] text-red-300 mt-1.5">{resolveError}</p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-white/60 mb-1">Shortcut Story</h4>
        {defect.shortcutStoryUrl ? (
          <a
            href={defect.shortcutStoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Story {defect.shortcutStoryId ? `#${defect.shortcutStoryId}` : ''}
          </a>
        ) : (
          <p className="text-white/50 text-xs">未送信</p>
        )}
      </div>

      {defect.executedTestSuites.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-1">
            実行テストスイート
          </h4>
          <div className="flex flex-wrap gap-1">
            {defect.executedTestSuites.map((suite) => (
              <Badge key={suite.id} variant="outline">
                {suite.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <StatisticsSection
        statistics={[
          { label: 'コメント', value: defect.comments.length },
          {
            label: '添付',
            value:
              defect.attachments.length +
              defect.comments.reduce(
                (sum, c) => sum + (c.attachments?.length ?? 0),
                0
              ),
          },
        ]}
      />

      <DateInfoSection label="作成日時" date={defect.createdAt} />
      <DateInfoSection label="最終更新" date={defect.updatedAt} />
      {defect.resolvedAt && (
        <DateInfoSection label="解決日時" date={defect.resolvedAt} />
      )}
      {defect.closedAt && (
        <DateInfoSection label="クローズ日時" date={defect.closedAt} />
      )}

      <ShortcutEpicPickerDialog
        projectId={defect.projectId}
        defectId={defect.id}
        open={epicPickerOpen}
        onOpenChange={setEpicPickerOpen}
        onLinked={handleEpicPicked}
        persistToDefect={false}
      />

      {activeEpicId && (
        <ShortcutStoryPickerDialog
          projectId={defect.projectId}
          defectId={defect.id}
          epicId={activeEpicId}
          epicName={activeEpicName}
          open={storyDialogOpen}
          onOpenChange={setStoryDialogOpen}
          onAttached={() => onChanged?.()}
        />
      )}
    </DetailCard>
  );
}

'use client';

import { CircleDot, FileText, Folder, Layers, Play } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import type { DashboardProject } from './types';
import { PanelHeading } from './PanelHeading';
import { StatBar } from './StatBar';
import { levelFromXp, xpFromCounts } from './gameStats';
import { totalCounts } from './resultStatus';

interface ProjectSidebarProps {
  projects: Array<Pick<DashboardProject, 'id' | 'name' | 'key' | 'description' | 'openTestRuns' | '_count' | 'tags' | 'resultCounts'>>;
  onNavigate: (path: string) => void;
}

export function ProjectSidebar({ projects, onNavigate }: ProjectSidebarProps) {
  return (
    <GlassPanel
      heading={<PanelHeading icon={Folder}>プロジェクト一覧</PanelHeading>}
      subheading={projects.length > 0 ? `${projects.length} 件` : 'プロジェクトはありません'}
      contentClassName="pt-2"
    >
      {projects.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/45">表示できるプロジェクトはありません</p>
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto">
          {projects.map((project) => {
            const xp = xpFromCounts(project.resultCounts);
            const progress = levelFromXp(xp);
            const executed = totalCounts(project.resultCounts);
            return (
            <button
              key={project.id}
              type="button"
              onClick={() => onNavigate(`/projects/${project.id}`)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.06]"
            >
              <p className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-primary/80">
                <Folder className="h-3 w-3" />
                PROJECT · {project.key}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{project.name}</p>
              <p className="mt-0.5 text-[11px] text-amber-200/80">Lv.{progress.level} · {xp} XP</p>
              {project.description ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                  {project.description}
                </p>
              ) : null}
              {project.tags && project.tags.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] border-accent/40 bg-accent/10 text-accent"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <StatBar
                className="mt-2"
                label="XP"
                value={progress.current}
                max={progress.next}
                barClassName="bg-gradient-to-r from-amber-300 to-orange-400"
              />
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/40">
                <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />TC {project._count?.testCases ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />スイート {project._count?.testSuites ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Play className="h-3 w-3" />ラン {project._count?.testRuns ?? 0}</span>
                <span className="inline-flex items-center gap-1"><CircleDot className="h-3 w-3" />未完了 {project.openTestRuns}</span>
                <span className="tabular-nums">実施 {executed}</span>
              </p>
            </button>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}

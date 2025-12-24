'use client';

import { TopBar } from '@/frontend/reusable-components/layout/TopBar';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import { Project } from '../types';

interface SettingsHeaderProps {
  project: Project;
  projectId?: string;
}

export function SettingsHeader({ project, projectId }: SettingsHeaderProps) {
  const pid = projectId || project.id;

  return (
    <>
      {/* Top Bar */}
      <TopBar
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${pid}` },
          { label: 'Settings' },
        ]}
      />

      <div className="px-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <PageHeaderWithBadge
            badge={project.key}
            title="Project Settings"
            description={`Manage project information and settings for ${project.name}`}
            className="mb-6"
          />
        </div>
      </div>
    </>
  );
}

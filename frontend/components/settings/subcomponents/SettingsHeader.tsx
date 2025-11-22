'use client';

import { Button } from '@/elements/button';
import { Breadcrumbs } from '@/components/design/Breadcrumbs';
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
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumbs
              items={[
                { label: 'Projects', href: '/projects' },
                { label: project.name, href: `/projects/${pid}` },
                { label: 'Settings' },
              ]}
            />
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="glass-destructive" size="sm" className="px-5">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Project Settings</h1>
          <p className="text-white/70 text-sm">
            Manage project information and settings for{' '}
            <span className="font-semibold text-white">{project.name}</span>
          </p>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestTube2, Play, FileText, Folder } from 'lucide-react';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { TopBar } from '@/frontend/reusable-components/layout/TopBar';
import { ResponsiveGrid } from '@/frontend/reusable-components/layout/ResponsiveGrid';
import { ClickableStatCard } from '@/frontend/reusable-components/cards/ClickableStatCard';
import { NotFoundState } from '@/frontend/reusable-components/errors/NotFoundState';
import { ProjectHeader } from './subcomponents/ProjectHeader';

interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }>;
  _count: {
    testCases: number;
    testRuns: number;
    testSuites: number;
    requirements: number;
  };
}

interface ProjectDetailProps {
  projectId: string;
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (project) {
      document.title = `${project.name} | EZTest`;
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}?stats=true`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.data);
      } else if (response.status === 404 || response.status === 403) {
        // Project not found or no access - redirect after showing message
        setTimeout(() => {
          router.push('/projects');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading project..." />;
  }

  if (!project) {
    return (
      <NotFoundState
        title="Project Not Found"
        message="The project you&apos;re looking for doesn&apos;t exist or has been deleted."
        icon={Folder}
        redirectingMessage="Redirecting to projects page..."
        showRedirecting={true}
      />
    );
  }

  return (
    <>
      <TopBar 
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: project.name, href: `/projects/${projectId}` }
        ]}
      />
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <ProjectHeader project={project} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <ResponsiveGrid
          columns={{ default: 1, md: 4 }}
          gap="lg"
          className="mb-8"
        >
          <ClickableStatCard
            icon={<TestTube2 className="w-4 h-4" />}
            label="Test Cases"
            value={project._count.testCases}
            borderColor="border-l-primary/30"
            hoverColor="group-hover:bg-primary/10"
            onClick={() => router.push(`/projects/${projectId}/testcases`)}
          />
          <ClickableStatCard
            icon={<Play className="w-4 h-4" />}
            label="Test Runs"
            value={project._count.testRuns}
            borderColor="border-l-accent/30"
            hoverColor="group-hover:bg-accent/10"
            onClick={() => router.push(`/projects/${projectId}/testruns`)}
          />
          <ClickableStatCard
            icon={<FileText className="w-4 h-4" />}
            label="Test Suites"
            value={project._count.testSuites}
            borderColor="border-l-purple-400/30"
            hoverColor="group-hover:bg-purple-400/10"
            onClick={() => router.push(`/projects/${projectId}/testsuites`)}
          />
          <ClickableStatCard
            icon={<Folder className="w-4 h-4" />}
            label="Members"
            value={project.members?.length || 0}
            borderColor="border-l-green-400/30"
            hoverColor="group-hover:bg-green-400/10"
            onClick={() => router.push(`/projects/${projectId}/members`)}
          />
        </ResponsiveGrid>
      </div>
    </>
  );
}

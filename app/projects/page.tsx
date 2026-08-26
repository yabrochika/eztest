import ProjectList from '@/frontend/components/project/ProjectList';
import CONFIG_SEO from '@/config/seo.config';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: CONFIG_SEO.Dashboard.title,
  description: CONFIG_SEO.Dashboard.description,
};

const ProjectsPage = () => {
  return <ProjectList />;
};

export default ProjectsPage;

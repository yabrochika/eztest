export interface TestRun {
  id: string;
  name: string;
  description?: string;
  executionType?: 'MANUAL' | 'AUTOMATION' | string;
  version?: string;
  status: 'NOT_STARTED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  environment?: string;
  platform?: string;
  device?: string;
  assignedToIds?: string[];
  assignedToList?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  results: Array<{
    status: string;
  }>;
  _count: {
    results: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
}

export interface TestRunFormData {
  name: string;
  description: string;
  environment: string;
  platform: string;
  device: string;
  assignedToId: string;
}

export interface TestRunFilters {
  searchQuery: string;
  statusFilter: string;
  environmentFilter: string;
  platformFilter: string;
  deviceFilter: string;
  assignedToFilter: string;
}

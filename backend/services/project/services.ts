import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
  createdById: string;
  tags?: string[];
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  tags?: string[];
}

// Shape of the tags relation when included via Prisma
type ProjectWithTags = { tags?: Array<{ tag: { name: string } }> };

/**
 * Normalize a free-form tag list: trim, drop empties, de-duplicate
 * case-insensitively while preserving the first-seen casing.
 */
function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    result.push(name);
  }
  return result;
}

/**
 * Flatten the included `tags` relation into a simple string[] of tag names.
 */
function flattenTags<T extends ProjectWithTags>(project: T): Omit<T, 'tags'> & { tags: string[] } {
  const { tags, ...rest } = project;
  return {
    ...rest,
    tags: (tags ?? []).map((pt) => pt.tag.name),
  };
}

/**
 * Replace a project's tags with the given list within a transaction.
 * Upserts Tag rows and rewrites the ProjectTag join entries.
 */
async function syncProjectTags(
  tx: Prisma.TransactionClient,
  projectId: string,
  tags: string[]
): Promise<void> {
  const normalized = normalizeTags(tags);

  await tx.projectTag.deleteMany({ where: { projectId } });

  if (normalized.length === 0) return;

  const tagRecords = await Promise.all(
    normalized.map((name) =>
      tx.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );

  await tx.projectTag.createMany({
    data: tagRecords.map((tag) => ({ projectId, tagId: tag.id })),
    skipDuplicates: true,
  });
}

interface AddMemberInput {
  userId?: string; // Optional, for backward compatibility
  email?: string; // Email address of the user to add
}

interface CreateMemberGroupInput {
  name: string;
  memberIds: string[];
  createdById: string;
}

export class ProjectService {
  /**
   * Get all projects accessible to a user
   * Scope-based filtering:
   * - 'all': All projects (admin access)
   * - 'project': Projects user is a member of
   */
  async getAllProjects(userId: string, scope: string) {
    const baseInclude = {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          testCases: true,
          testRuns: true,
          testSuites: true,
        },
      },
    };

    // Build where clause based on scope
    let whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    if (scope === 'project') {
      // Only projects user is a member of
      whereClause = {
        ...whereClause,
        members: {
          some: {
            userId: userId,
          },
        },
      };
    }
    // 'all' scope: no additional filtering (admin access)

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: baseInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get defect counts for all projects (non-closed defects only)
    if (projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      const defectCounts = await prisma.defect.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          status: { not: 'CLOSED' },
        },
        _count: {
          id: true,
        },
      });

      // Create a map of projectId -> defect count
      const defectCountMap = new Map(
        defectCounts.map(dc => [dc.projectId, dc._count.id])
      );

      // Add defect counts to each project's _count
      return projects.map(project => ({
        ...flattenTags(project),
        _count: {
          ...project._count,
          defects: defectCountMap.get(project.id) || 0,
        },
      }));
    }

    return projects.map(flattenTags);
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectInput) {
    // Check if project key already exists (including soft-deleted projects)
    const existingProject = await prisma.project.findUnique({
      where: { key: data.key },
    });

    if (existingProject && !existingProject.isDeleted) {
      throw new Error('Project key already exists');
    }

    // If a soft-deleted project with this key exists, we could either:
    // 1. Prevent creating a new one with the same key
    // 2. Update the key to be unique (e.g., append timestamp)
    // For now, we'll prevent it to maintain key uniqueness
    if (existingProject && existingProject.isDeleted) {
      throw new Error('Project key already exists (in deleted projects). Please choose a different key.');
    }

    // Create project, add creator as member, and attach tags atomically
    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: data.name,
          key: data.key.toUpperCase(),
          description: data.description,
          createdById: data.createdById,
          members: {
            create: {
              userId: data.createdById,
            },
          },
        },
      });

      await syncProjectTags(tx, created.id, data.tags ?? []);

      return tx.project.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return flattenTags(project);
  }

  /**
   * Get project by ID with optional stats
   * Scope filtering applied in query
   */
  async getProjectById(projectId: string, userId: string, scope: string, includeStats: boolean = false) {
    // Build where clause based on scope
    let whereClause: Record<string, unknown> = { 
      id: projectId,
      isDeleted: false,
    };

    if (scope === 'project') {
      whereClause = {
        ...whereClause,
        members: {
          some: {
            userId: userId,
          },
        },
      };
    }
    // 'all' scope: no additional filtering

    const project = await prisma.project.findFirst({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        ...(includeStats && {
          _count: {
            select: {
              testCases: true,
              testRuns: true,
              testSuites: true,
              requirements: true,
            },
          },
        }),
      },
    });

    if (!project) {
      return project;
    }

    // Add defect count if stats are included
    if (includeStats && project._count) {
      const defectCount = await prisma.defect.count({
        where: {
          projectId: project.id,
          status: { not: 'CLOSED' },
        },
      });

      return {
        ...flattenTags(project),
        _count: {
          ...project._count,
          defects: defectCount,
        },
      };
    }

    return flattenTags(project);
  }

  /**
   * Update project information
   */
  async updateProject(projectId: string, data: UpdateProjectInput) {
    // First check if project exists and is not deleted
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
      },
    });

    if (!project) {
      throw new Error('Project not found or has been deleted');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: {
          id: projectId,
        },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      // Only rewrite tags when the caller explicitly provided them
      if (data.tags !== undefined) {
        await syncProjectTags(tx, projectId, data.tags);
      }

      return tx.project.findUniqueOrThrow({
        where: { id: projectId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return flattenTags(updated);
  }

  /**
   * Soft delete a project (set isDeleted to true)
   * Scope filtering: only allow deletion if user has appropriate scope
   */
  async deleteProject(projectId: string, userId: string, scope: string) {
    // Build where clause based on scope
    let whereClause: Record<string, unknown> = { 
      id: projectId,
      isDeleted: false,
    };

    if (scope === 'project') {
      // User must be a member to delete (though only ADMIN has this permission)
      whereClause = {
        ...whereClause,
        members: {
          some: {
            userId: userId,
          },
        },
      };
    }
    // 'all' scope: no additional filtering (admin can delete any)

    // Verify project exists and user has access based on scope
    const project = await prisma.project.findFirst({
      where: whereClause,
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        isDeleted: true,
      },
    });
  }

  /**
   * Get project members
   */
  async getProjectMembers(projectId: string) {
    return await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  /**
   * Get project member groups
   */
  async getProjectMemberGroups(projectId: string) {
    return await prisma.projectMemberGroup.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            projectMember: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Add member to project
   */
  async addProjectMember(projectId: string, data: AddMemberInput) {
    // Find user by email or userId
    let user;
    
    if (data.email) {
      // Find user by email
      user = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (!user) {
        throw new Error('User with this email not found');
      }
    } else if (data.userId) {
      // Find user by ID (fallback for backward compatibility)
      user = await prisma.user.findUnique({
        where: { id: data.userId },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
    } else {
      throw new Error('Either email or userId is required');
    }

    // Check if member already exists
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    return await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Create project member group
   */
  async createProjectMemberGroup(projectId: string, data: CreateMemberGroupInput) {
    const normalizedName = data.name.trim();

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        id: { in: data.memberIds },
      },
      select: { id: true },
    });

    if (members.length !== data.memberIds.length) {
      throw new Error('Some members do not belong to this project');
    }

    try {
      return await prisma.projectMemberGroup.create({
        data: {
          projectId,
          name: normalizedName,
          createdById: data.createdById,
          members: {
            create: members.map((member) => ({
              projectMemberId: member.id,
            })),
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              projectMember: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatar: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new Error('Group name already exists');
      }
      throw error;
    }
  }

  /**
   * Remove member from project
   */
  async removeProjectMember(projectId: string, memberId: string) {
    // Check if member exists
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.projectId !== projectId) {
      throw new Error('Member not found in this project');
    }

    // Check if this is the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });

    if (project?.createdById === member.userId) {
      const memberCount = await prisma.projectMember.count({
        where: { projectId },
      });

      if (memberCount <= 1) {
        throw new Error('Cannot remove the project creator when they are the only member');
      }
    }

    // Store userId before deletion for email notification
    const removedUserId = member.userId;

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Return the removed user's ID for email notification
    return { removedUserId };
  }

  /**
   * Check if user is a member of a project
   * Used for internal checks and member management
   */
  async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        project: {
          isDeleted: false, // Only non-deleted projects
        },
      },
    });

    return !!membership;
  }
}

export const projectService = new ProjectService();

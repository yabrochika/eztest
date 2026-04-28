import { prisma } from '@/lib/prisma';
import { s3Client, getS3Bucket, isS3Configured, isUploadLocalRelativePath } from '@/lib/s3-client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import path from 'path';
import {
  createStory,
  findMemberIdByEmail,
  getShortcutConfig,
  ShortcutError,
  listEpics,
  getEpic,
  listStoriesForEpic,
  ensureLabel,
  uploadFile,
  addStoryComment,
  getStory,
  getWorkflow,
} from '@/lib/shortcut/client';

interface CreateDefectInput {
  projectId: string;
  testRunId?: string | null;
  defectId?: string | null; // Optional: if provided, use it; otherwise auto-generate
  title: string;
  description?: string | null;
  severity: string;
  priority: string;
  status?: string;
  assignedToId?: string | null;
  createdById: string;
  environment?: string | null;
  platform?: string | null;
  device?: string | null;
  dueDate?: string | null;
  progressPercentage?: number | null;
  testCaseIds?: string[];
}

interface UpdateDefectInput {
  title?: string;
  description?: string | null;
  severity?: string;
  priority?: string;
  status?: string;
  assignedToId?: string | null;
  environment?: string | null;
  testRunId?: string | null;
  dueDate?: string | null;
  progressPercentage?: number | null;
}

interface DefectFilters {
  severity?: string[];
  priority?: string[];
  status?: string[];
  assignedToId?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class DefectService {
  /**
   * Generate next defect ID for a project (e.g., DEF-1, DEF-2, DEF-3...)
   * Finds the highest DEF-X number and generates the next sequential number
   */
  private async generateDefectId(projectId: string): Promise<string> {
    // Get all existing defects to find the highest DEF-X number
    const existingDefects = await prisma.defect.findMany({
      where: { projectId },
      select: { defectId: true },
    });
    
    // Find the highest DEF-X number (only consider DEF-X format, not custom formats)
    let maxDefectNumber = 0;
    const defectNumberPattern = /^DEF-(\d+)$/;
    
    for (const defect of existingDefects) {
      const match = defect.defectId.match(defectNumberPattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxDefectNumber) {
          maxDefectNumber = number;
        }
      }
    }
    
    // Generate next sequential number
    let defectNumber = maxDefectNumber + 1;
    let defectId = `DEF-${defectNumber}`;
    
    // Double-check it doesn't exist (in case of race condition or custom formats)
    let exists = await prisma.defect.findFirst({
      where: {
        projectId,
        defectId,
      },
    });
    
    while (exists) {
      defectNumber++;
      defectId = `DEF-${defectNumber}`;
      exists = await prisma.defect.findFirst({
        where: {
          projectId,
          defectId,
        },
      });
    }
    
    return defectId;
  }

  /**
   * Get all defects for a project with optional filters
   */
  async getProjectDefects(
    projectId: string,
    filters?: DefectFilters
  ) {
    const where: Record<string, unknown> = {
      projectId,
    };

    if (filters?.severity && filters.severity.length > 0) {
      where.severity = { in: filters.severity };
    }

    if (filters?.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters?.assignedToId && filters.assignedToId.length > 0) {
      if (filters.assignedToId.includes('unassigned')) {
        where.OR = [
          { assignedToId: { in: filters.assignedToId.filter(id => id !== 'unassigned') } },
          { assignedToId: null }
        ];
      } else {
        where.assignedToId = { in: filters.assignedToId };
      }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { defectId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.dateFrom) {
      where.createdAt = {
        ...(typeof where.createdAt === 'object' ? where.createdAt : {}),
        gte: new Date(filters.dateFrom),
      };
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        ...(typeof where.createdAt === 'object' ? where.createdAt : {}),
        lte: toDate,
      };
    }

    const defects = await prisma.defect.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                tcId: true,
                title: true,
                suite: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                testCaseSuites: {
                  select: {
                    testSuite: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testRun: {
          select: {
            id: true,
            name: true,
            suites: {
              select: {
                testSuite: {
                  select: {
                    id: true,
                    name: true,
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

    return defects;
  }

  /**
   * Create a new defect
   */
  async createDefect(data: CreateDefectInput) {
    // Use provided defectId or auto-generate one
    let defectId: string;
    
    if (data.defectId && data.defectId.trim()) {
      // User provided defect ID - validate it doesn't already exist
      // Accept any value as defect ID (no format restriction)
      // Examples: DEF-1, BUG-123, na, ISSUE-001, any-text, etc.
      const providedDefectId = data.defectId.trim(); // Preserve original case
      
      // Check if already exists in the project (case-sensitive)
      const existingDefect = await prisma.defect.findFirst({
        where: {
          projectId: data.projectId,
          defectId: providedDefectId,
        },
      });
      
      if (existingDefect) {
        throw new Error(`Defect ID already exists in this project: ${providedDefectId}`);
      }
      
      defectId = providedDefectId;
    } else {
      // Auto-generate defect ID
      defectId = await this.generateDefectId(data.projectId);
    }

    let assignedToId = data.assignedToId ?? null;
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true },
      });
      if (!assignee) {
        console.warn(`Invalid assignedToId detected and ignored: ${assignedToId}`);
        assignedToId = null;
      }
    }

    const defect = await prisma.defect.create({
      data: {
        defectId,
        projectId: data.projectId,
        testRunId: data.testRunId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        priority: data.priority,
        status: data.status || 'NEW',
        assignedToId,
        createdById: data.createdById,
        environment: data.environment,
        platform: data.platform,
        device: data.device,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        progressPercentage: data.progressPercentage,
        // Create DefectTestCase links if testCaseIds provided
        testCases: data.testCaseIds && data.testCaseIds.length > 0 ? {
          create: data.testCaseIds.map(testCaseId => ({
            testCaseId,
          })),
        } : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                tcId: true,
                title: true,
              },
            },
          },
        },
        testRun: {
          select: {
            id: true,
            name: true,
            suites: {
              select: {
                testSuite: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Auto-link test cases that have this defect ID in their pendingDefectIds field
    // Find all test cases in the same project with this defect ID in pendingDefectIds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testCasesWithPendingDefect = await (prisma.testCase.findMany as any)({
      where: {
        projectId: data.projectId,
        pendingDefectIds: {
          not: null,
        },
      },
      select: {
        id: true,
        pendingDefectIds: true,
      },
    });

    // Filter test cases that have this defect ID in their pending list
    // Case-sensitive matching - exact match required
    const testCasesToLink: Array<{ id: string; remainingPendingIds: string | null }> = [];

    for (const testCase of testCasesWithPendingDefect) {
      if (!testCase.pendingDefectIds) continue;

      // Parse comma-separated defect IDs (preserve original case)
      const pendingIds = (testCase.pendingDefectIds || '')
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);

      // Check if this defect ID is in the pending list (case-sensitive match)
      if (pendingIds.includes(defectId)) {
        // Remove this defect ID from pending list
        const remainingPendingIds = pendingIds
          .filter((id: string) => id !== defectId)
          .join(', ');

        testCasesToLink.push({
          id: testCase.id,
          remainingPendingIds: remainingPendingIds.length > 0 ? remainingPendingIds : null,
        });
      }
    }

    // Link test cases and update their pendingDefectIds
    if (testCasesToLink.length > 0) {
      await Promise.all(
        testCasesToLink.map(async ({ id: testCaseId, remainingPendingIds }) => {
          // Create link (ignore if already exists)
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (prisma as any).testCaseDefect.create({
              data: {
                testCaseId,
                defectId: defect.id,
              },
            });
          } catch {
            // Link might already exist, that's okay
            console.warn(`Defect ${defectId} already linked to test case ${testCaseId}`);
          }

          // Update pendingDefectIds to remove the linked defect ID
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma.testCase.update as any)({
            where: { id: testCaseId },
            data: { pendingDefectIds: remainingPendingIds },
          });
        })
      );
    }

    return defect;
  }

  /**
   * Get defect by ID
   */
  async getDefectById(defectId: string) {
    const defect = await prisma.defect.findUnique({
      where: { id: defectId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                tcId: true,
                title: true,
                testCaseSuites: {
                  select: {
                    testSuite: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testRun: {
          select: {
            id: true,
            name: true,
            suites: {
              select: {
                testSuite: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!defect) {
      return null;
    }

    // console.log('🔍 Backend - Raw testCases from DB:', defect.testCases);
    // console.log('🔍 Backend - testCases count:', defect.testCases.length);

    // Get failure count for each linked test case
    const testCasesWithFailureCount = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      defect.testCases.map(async (tc: any) => {
        const failureCount = await prisma.testResult.count({
          where: {
            testCaseId: tc.testCase.id,
            status: 'FAILED',
          },
        });

        return {
          ...tc,
          failureCount,
        };
      })
    );

    const uniqueSuites = new Map<string, { id: string; name: string }>();

    defect.testRun?.suites.forEach((suiteLink) => {
      uniqueSuites.set(suiteLink.testSuite.id, {
        id: suiteLink.testSuite.id,
        name: suiteLink.testSuite.name,
      });
    });

    testCasesWithFailureCount.forEach((tc) => {
      const legacySuite = (tc.testCase as any).suite;
      if (legacySuite) {
        uniqueSuites.set(legacySuite.id, {
          id: legacySuite.id,
          name: legacySuite.name,
        });
      }

      tc.testCase.testCaseSuites?.forEach((suiteLink: { testSuite: { id: string; name: string } }) => {
        uniqueSuites.set(suiteLink.testSuite.id, {
          id: suiteLink.testSuite.id,
          name: suiteLink.testSuite.name,
        });
      });
    });

    const executedTestSuites = Array.from(uniqueSuites.values());
    const linkedTestSuites = executedTestSuites.map((s) => ({
      id: s.id,
      name: s.name,
      title: s.name,
    }));

    return {
      ...defect,
      testCases: testCasesWithFailureCount,
      executedTestSuites,
      linkedTestSuites,
    };
  }

  /**
   * Update defect
   */
  async updateDefect(defectId: string, data: UpdateDefectInput) {
    const defect = await prisma.defect.update({
      where: { id: defectId },
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        priority: data.priority,
        status: data.status,
        assignedToId: data.assignedToId,
        environment: data.environment,
        testRunId: data.testRunId,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        progressPercentage: data.progressPercentage,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        testCases: {
          include: {
            testCase: {
              select: {
                id: true,
                tcId: true,
                title: true,
              },
            },
          },
        },
        testRun: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return defect;
  }

  /**
   * Delete defect
   */
  async deleteDefect(defectId: string) {
    // Fetch all attachments before deletion to clean up files
    const [defectAttachments, commentAttachments] = await Promise.all([
      prisma.defectAttachment.findMany({
        where: { defectId: defectId },
      }),
      prisma.commentAttachment.findMany({
        where: {
          comment: {
            defectId: defectId,
          },
        },
      }),
    ]);

    // Delete defect (comments, attachments, and comment attachments will cascade)
    await prisma.defect.delete({
      where: { id: defectId },
    });

    // Combine all attachments for cleanup
    const allAttachments = [
      ...defectAttachments.map(a => a.path),
      ...commentAttachments.map(a => a.path),
    ];

    // Delete files from storage (fire and forget)
    if (allAttachments.length > 0 && isS3Configured()) {
      Promise.all([
        import('@/lib/s3-client'),
        import('@aws-sdk/client-s3')
      ]).then(([{ s3Client, getS3Bucket }, { DeleteObjectCommand }]) => {
        const bucket = getS3Bucket();
        Promise.all(
          allAttachments.map(path =>
            s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: path,
              })
            ).catch((error: Error) => {
              console.error(`Failed to delete S3 file ${path}:`, error);
            })
          )
        );
      });
    }
  }

  /**
   * Assign defect to a user and send notification email
   * This is used when assigning via UI to automatically send email
   */
  async assignDefectWithEmail(
    defectId: string,
    assigneeId: string | null,
    assignedByUserId: string,
    appUrl: string = 'http://localhost:3000'
  ) {
    // Update the defect assignment
    const defect = await this.updateDefect(defectId, { assignedToId: assigneeId });

    // Send email if assignee is provided
    if (assigneeId) {
      try {
        // Dynamically import emailService to avoid circular dependency
        const { emailService } = await import('@/backend/services/email/services');
        
        // Send email asynchronously (don't wait for it)
        emailService.sendDefectAssignmentEmail({
          defectId,
          assigneeId,
          assignedByUserId,
          appUrl,
        }).catch(error => {
          console.error('Failed to send defect assignment email:', error);
          // Don't throw - assignment succeeded even if email failed
        });
      } catch (error) {
        console.error('Error in assignDefectWithEmail:', error);
        // Don't throw - assignment succeeded even if email service unavailable
      }
    }

    return defect;
  }

  /**
   * Get defect statistics for a project
   */
  async getDefectStatistics(projectId: string) {
    const [total, bySeverity, byStatus, byPriority] = await Promise.all([
      prisma.defect.count({ where: { projectId } }),
      prisma.defect.groupBy({
        by: ['severity'],
        where: { projectId },
        _count: true,
      }),
      prisma.defect.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.defect.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: true,
      }),
    ]);

    return {
      total,
      bySeverity,
      byStatus,
      byPriority,
    };
  }

  /**
   * Get all comments for a defect
   */
  async getDefectComments(defectId: string) {
    const comments = await prisma.defectComment.findMany({
      where: { defectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  /**
   * Add a comment to a defect
   */
  async addDefectComment(defectId: string, userId: string, content: string) {
    const comment = await prisma.defectComment.create({
      data: {
        defectId,
        userId,
        content,
      },
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
    });

    return comment;
  }

  /**
   * Add a comment to a defect and send notification emails to other involved users
   * This is used when adding comments via UI to automatically send emails
   */
  async addDefectCommentWithEmail(
    defectId: string,
    userId: string,
    content: string,
    appUrl: string = 'http://localhost:3000'
  ) {
    // First add the comment
    const comment = await this.addDefectComment(defectId, userId, content);

    // Then send notification emails asynchronously (don't block the comment creation)
    const { emailService } = await import('@/backend/services/email/services');
    emailService
      .sendDefectCommentEmail({
        defectId,
        commentContent: content,
        commentAuthorId: userId,
        appUrl,
      })
      .catch((error) => {
        console.error('Failed to send defect comment notification emails:', error);
      });

    return comment;
  }

  /**
   * Associate S3 attachments with a defect
   */
  async associateAttachments(
    defectId: string, 
    attachments: Array<{ id: string; fieldName?: string }>,
    userId: string
  ) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify defect exists
    const defect = await prisma.defect.findUnique({
      where: { id: defectId },
    });

    if (!defect) {
      throw new Error('Defect not found');
    }

    // Link existing attachments by updating their defectId
    const linkedAttachments = await Promise.all(
      attachments.map(async (att) => {
        try {
          // First, get the attachment from the Attachment table
          const attachment = await prisma.attachment.findUnique({
            where: { id: att.id },
          });
          
          if (!attachment) {
            throw new Error(`Attachment ${att.id} not found`);
          }
          
          // Create a DefectAttachment record
          return await prisma.defectAttachment.create({
            data: {
              filename: attachment.filename,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              size: attachment.size,
              path: attachment.path,
              fieldName: att.fieldName || 'description',
              defectId: defectId,
              uploadedById: userId,
            },
          });
        } catch (err) {
          console.error('Failed to create attachment:', err);
          throw err;
        }
      })
    );

    return linkedAttachments;
  }

  /**
   * Get all attachments for a defect
   */
  async getDefectAttachments(defectId: string) {
    // Verify defect exists
    const defect = await prisma.defect.findUnique({
      where: { id: defectId },
    });

    if (!defect) {
      throw new Error('Defect not found');
    }

    const attachments = await prisma.defectAttachment.findMany({
      where: { defectId },
      orderBy: { uploadedAt: 'desc' },
    });

    return attachments;
  }

  /**
   * Delete an attachment from a defect
   */
  async deleteAttachment(defectId: string, attachmentId: string) {
    // Verify defect exists
    const defect = await prisma.defect.findUnique({
      where: { id: defectId },
    });

    if (!defect) {
      throw new Error('Defect not found');
    }

    // Verify attachment exists and belongs to this defect
    const attachment = await prisma.defectAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.defectId !== defectId) {
      throw new Error('Attachment not found');
    }

    // Delete attachment from database
    const deleted = await prisma.defectAttachment.delete({
      where: { id: attachmentId },
    });

    // Delete file from S3 (fire and forget to avoid blocking)
    if (attachment.path && isS3Configured()) {
      Promise.all([
        import('@/lib/s3-client'),
        import('@aws-sdk/client-s3')
      ]).then(([{ s3Client, getS3Bucket }, { DeleteObjectCommand }]) => {
        const bucket = getS3Bucket();
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: attachment.path,
          })
        ).catch((error: Error) => {
          console.error(`Failed to delete S3 file ${attachment.path}:`, error);
        });
      });
    }

    return deleted;
  }

  async getDefectAttachmentDownloadUrl(attachmentId: string) {
    // Fetch defect attachment from database
    const attachment = await prisma.defectAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        defect: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new Error('Defect attachment not found');
    }

    // Determine if file should be previewed or downloaded
    const isPreviewable =
      attachment.mimeType.startsWith('image/') ||
      attachment.mimeType.startsWith('video/') ||
      attachment.mimeType === 'application/pdf';

    let signedUrl: string;
    if (isS3Configured() && !isUploadLocalRelativePath(attachment.path)) {
      const bucket = getS3Bucket();
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: attachment.path,
        ResponseContentDisposition: isPreviewable
          ? 'inline'
          : `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
        ResponseContentType: attachment.mimeType,
      });
      signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } else {
      signedUrl = `/api/attachments/local/${attachment.path}`;
    }

    return {
      url: signedUrl,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }

  async deleteDefectAttachment(attachmentId: string, step: string | null) {
    // Fetch attachment from database
    const attachment = await prisma.defectAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new Error('Defect attachment not found');
    }

    if (step === 'prepare') {
      if (isS3Configured() && !isUploadLocalRelativePath(attachment.path)) {
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
          Bucket: getS3Bucket(),
          Key: attachment.path,
        });
        const deleteUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { deleteUrl };
      } else {
        return { deleteUrl: null };
      }
    } else if (step === 'confirm') {
      // Step 2: Remove from database after S3 deletion
      await prisma.defectAttachment.delete({
        where: { id: attachmentId },
      });

      return { success: true };
    } else {
      throw new Error('Invalid step parameter. Use step=prepare or step=confirm');
    }
  }

  /**
   * Send defect to Shortcut as a new story and persist the link back to the defect.
   */
  async sendToShortcut(defectId: string, appBaseUrl: string | null = null) {
    const config = getShortcutConfig();
    if (!config) {
      throw new Error('Shortcut integration is not configured (SHORTCUT_API_TOKEN missing)');
    }

    const defect = await this.getDefectById(defectId);
    if (!defect) {
      throw new Error('Defect not found');
    }
    if ((defect as { shortcutStoryId?: number | null }).shortcutStoryId) {
      throw new Error('This defect has already been sent to Shortcut');
    }

    const ownerId = await findMemberIdByEmail(config, defect.assignedTo?.email ?? null).catch(
      () => null
    );

    const linkedTestSuites = (defect as { linkedTestSuites?: { name: string }[] }).linkedTestSuites;
    const description = buildShortcutDescription(defect, linkedTestSuites, appBaseUrl);
    const externalLinks = appBaseUrl
      ? [`${appBaseUrl}/projects/${defect.projectId}/defects/${defect.id}`]
      : undefined;

    try {
      const story = await createStory(config, {
        name: `[${defect.defectId}] ${defect.title}`,
        description,
        storyType: 'bug',
        ownerIds: ownerId ? [ownerId] : undefined,
        externalLinks,
      });

      const updated = await prisma.defect.update({
        where: { id: defect.id },
        data: {
          shortcutStoryId: story.id,
          shortcutStoryUrl: story.app_url,
        },
        select: {
          id: true,
          shortcutStoryId: true,
          shortcutStoryUrl: true,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof ShortcutError) {
        const reason = typeof error.body === 'object' ? JSON.stringify(error.body) : String(error.body);
        throw new Error(`Failed to create Shortcut story (HTTP ${error.status}): ${reason}`);
      }
      throw error;
    }
  }
}

function buildShortcutDescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defect: any,
  linkedTestSuites: { name: string }[] | undefined,
  appBaseUrl: string | null
): string {
  const lines: string[] = [];
  lines.push(`**EZTest Defect:** \`${defect.defectId}\``);
  if (appBaseUrl) {
    lines.push(`**Defect URL:** ${appBaseUrl}/projects/${defect.projectId}/defects/${defect.id}`);
  }
  lines.push('');
  lines.push(`**Project:** ${defect.project?.name ?? '-'}`);
  lines.push(`**Severity:** ${defect.severity} / **Priority:** ${defect.priority} / **Status:** ${defect.status}`);
  if (defect.environment) lines.push(`**Environment:** ${defect.environment}`);
  if (defect.assignedTo) {
    lines.push(`**Assignee (EZTest):** ${defect.assignedTo.name} <${defect.assignedTo.email}>`);
  }
  if (defect.testRun) {
    lines.push(`**Test Run:** ${defect.testRun.name}`);
  }
  if (linkedTestSuites && linkedTestSuites.length > 0) {
    lines.push(`**Test Suites:** ${linkedTestSuites.map((s) => s.name).join(', ')}`);
  }
  if (Array.isArray(defect.testCases) && defect.testCases.length > 0) {
    lines.push('**Linked Test Cases:**');
    for (const tc of defect.testCases) {
      lines.push(`- ${tc.testCase.tcId} ${tc.testCase.title}`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(defect.description || '_No description provided._');
  return lines.join('\n');
}

async function readAttachmentBuffer(storedPath: string): Promise<Buffer | null> {
  try {
    if (isS3Configured() && !isUploadLocalRelativePath(storedPath)) {
      const res = await s3Client.send(
        new GetObjectCommand({ Bucket: getS3Bucket(), Key: storedPath })
      );
      const chunks: Buffer[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of res.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
    const full = path.join(process.cwd(), 'uploads', storedPath);
    return await readFile(full);
  } catch (err) {
    console.warn('[shortcut] failed to read attachment', storedPath, err);
    return null;
  }
}

export const defectService = new DefectService();

export const shortcutService = {
  async resolveId(id: number) {
    const config = getShortcutConfig();
    if (!config) throw new Error('Shortcut integration is not configured');

    try {
      const epic = await getEpic(config, id);
      return {
        kind: 'epic' as const,
        epicId: epic.id,
        epicName: epic.name,
        storyId: null as number | null,
        storyName: null as string | null,
        appUrl: epic.app_url ?? null,
      };
    } catch (e) {
      if (!(e instanceof ShortcutError) || e.status !== 404) {
        throw e;
      }
    }

    try {
      const story = await getStory(config, id);
      let epicName: string | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const epicId: number | null = (story as any).epic_id ?? null;
      if (epicId) {
        try {
          const epic = await getEpic(config, epicId);
          epicName = epic.name;
        } catch {
          // ignore
        }
      }
      return {
        kind: 'story' as const,
        epicId,
        epicName,
        storyId: story.id,
        storyName: story.name,
        appUrl: story.app_url ?? null,
      };
    } catch (e) {
      if (e instanceof ShortcutError && e.status === 404) {
        return {
          kind: 'unknown' as const,
          epicId: null as number | null,
          epicName: null as string | null,
          storyId: null as number | null,
          storyName: null as string | null,
          appUrl: null as string | null,
        };
      }
      throw e;
    }
  },

  async listEpics() {
    const config = getShortcutConfig();
    if (!config) throw new Error('Shortcut integration is not configured');
    const epics = await listEpics(config);
    return epics.map((e) => ({
      id: e.id,
      name: e.name,
      state: e.state,
      app_url: e.app_url,
      archived: !!e.archived,
      completed: !!e.completed,
      started: !!e.started,
    }));
  },

  async listStoriesForEpic(epicId: number) {
    const config = getShortcutConfig();
    if (!config) throw new Error('Shortcut integration is not configured');
    const stories = await listStoriesForEpic(config, epicId);
    // Only return top-level stories. Sub-tasks (stories with a parent_story_id)
    // are not valid as parents for a new Defect sub-task, and previously
    // imported Defects would otherwise pollute the picker.
    return stories
      .filter((s) => !s.parent_story_id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        story_type: s.story_type,
        app_url: s.app_url,
        archived: !!s.archived,
        completed: !!s.completed,
      }));
  },

  async setDefectEpic(defectId: string, epicId: number | null) {
    const config = getShortcutConfig();
    if (!config && epicId !== null) {
      throw new Error('Shortcut integration is not configured');
    }

    let epicName: string | null = null;
    if (epicId !== null && config) {
      const epic = await getEpic(config, epicId);
      epicName = epic.name;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.defect as any).update({
      where: { id: defectId },
      data: {
        shortcutEpicId: epicId,
        shortcutEpicName: epicName,
      },
      select: {
        id: true,
        shortcutEpicId: true,
        shortcutEpicName: true,
      },
    });
    return updated;
  },

  async attachDefectToStory(
    defectId: string,
    storyId: number,
    appBaseUrl: string | null = null
  ) {
    const config = getShortcutConfig();
    if (!config) throw new Error('Shortcut integration is not configured');

    const defect = await defectService.getDefectById(defectId);
    if (!defect) throw new Error('Defect not found');

    try {
      const label = await ensureLabel(config, 'Bug', '#E44');

      const linkedTestSuites = (defect as { linkedTestSuites?: { name: string }[] }).linkedTestSuites;
      const description = buildShortcutDescription(defect, linkedTestSuites, appBaseUrl);

      type UploadedAttachment = {
        id: number;
        name: string;
        url: string | null;
        mimeType: string;
        source: 'defect' | 'comment';
        commentId?: string;
      };

      const uploaded: UploadedAttachment[] = [];
      const uploadFailures: string[] = [];

      const uploadOne = async (
        att: { path: string; originalName: string; mimeType: string },
        source: 'defect' | 'comment',
        commentId?: string
      ) => {
        const buffer = await readAttachmentBuffer(att.path);
        if (!buffer) {
          uploadFailures.push(`${att.originalName} (読み込み失敗)`);
          return;
        }
        try {
          const up = await uploadFile(config, {
            buffer,
            filename: att.originalName,
            contentType: att.mimeType || 'application/octet-stream',
          });
          uploaded.push({
            id: up.id,
            name: up.name || att.originalName,
            url: up.url ?? null,
            mimeType: att.mimeType || 'application/octet-stream',
            source,
            commentId,
          });
        } catch (e) {
          console.warn('[shortcut] upload failed', att.originalName, e);
          uploadFailures.push(
            `${att.originalName} (${e instanceof Error ? e.message : String(e)})`
          );
        }
      };

      // 1) Defect-level attachments
      const defectAttachments = (defect.attachments || []) as Array<{
        path: string;
        originalName: string;
        mimeType: string;
      }>;
      for (const att of defectAttachments) {
        await uploadOne(att, 'defect');
      }

      // 2) Attachments embedded in defect comments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defectComments = ((defect as any).comments || []) as Array<{
        id: string;
        content: string;
        createdAt: Date | string;
        user?: { name?: string | null; email?: string | null } | null;
        attachments?: Array<{
          path: string;
          originalName: string;
          mimeType: string;
        }>;
      }>;
      for (const c of defectComments) {
        for (const att of c.attachments || []) {
          await uploadOne(att, 'comment', c.id);
        }
      }

      // Note: Shortcut's file upload URL (/api/private/files/:id) requires an
      // authenticated session to view, so we expose clickable links instead of
      // inlining images. The files are also attached via `file_ids`, which makes
      // them appear in the story's Files panel.
      const renderFileLink = (u: UploadedAttachment) => {
        const icon = u.mimeType.startsWith('image/')
          ? '🖼'
          : u.mimeType.startsWith('video/')
            ? '🎞'
            : '📎';
        return u.url
          ? `- ${icon} [${u.name}](${u.url})`
          : `- ${icon} ${u.name} (file id: ${u.id})`;
      };

      const defectFileBlock = (() => {
        const items = uploaded.filter((u) => u.source === 'defect');
        if (items.length === 0) return '';
        return ['', '---', '', '### Attachments', '', ...items.map(renderFileLink)].join('\n');
      })();

      const commentsBlock = (() => {
        if (defectComments.length === 0) return '';
        const blocks: string[] = ['', '---', '', '### EZTest Comments', ''];
        // Oldest-first is more readable when porting to a fresh story.
        const sorted = [...defectComments].sort((a, b) => {
          const ta = new Date(a.createdAt).getTime();
          const tb = new Date(b.createdAt).getTime();
          return ta - tb;
        });
        for (const c of sorted) {
          const who = c.user?.name || c.user?.email || 'unknown';
          const when = new Date(c.createdAt).toISOString();
          blocks.push(`**${who}** — ${when}`);
          blocks.push('');
          blocks.push((c.content || '').trim() || '_(empty)_');
          const files = uploaded.filter((u) => u.source === 'comment' && u.commentId === c.id);
          if (files.length > 0) {
            blocks.push('');
            for (const f of files) blocks.push(renderFileLink(f));
          }
          blocks.push('');
        }
        return blocks.join('\n');
      })();

      const failureMarkdown =
        uploadFailures.length > 0
          ? `\n\n> ⚠️ 以下の添付はアップロードに失敗しました:\n${uploadFailures.map((f) => `> - ${f}`).join('\n')}`
          : '';

      const enrichedDescription = `${description}${defectFileBlock}${commentsBlock}${failureMarkdown}`;
      const uploadedFileIds = uploaded.map((u) => u.id);

      // Fetch the parent story so the sub-task inherits epic/group.
      let parentStory: Awaited<ReturnType<typeof getStory>> | null = null;
      try {
        parentStory = await getStory(config, storyId);
      } catch {
        // ignore
      }

      // Resolve an "Unstarted" workflow state so the sub-task is NOT auto-completed
      // (otherwise it inherits whatever state the parent is in, e.g. Done).
      let unstartedStateId: number | undefined;
      const workflowId = parentStory?.workflow_id ?? config.workflowId;
      if (workflowId) {
        try {
          const wf = await getWorkflow(config, workflowId);
          const unstarted = wf.states.find((s) => s.type === 'unstarted');
          unstartedStateId = unstarted?.id ?? wf.default_state_id;
        } catch {
          // ignore
        }
      }

      // Map EZTest assignee / reporter to Shortcut owners when possible.
      const ownerIds: string[] = [];
      try {
        const ownerEmail =
          (defect as { assignedTo?: { email?: string | null } | null }).assignedTo?.email ??
          (defect as { createdBy?: { email?: string | null } | null }).createdBy?.email ??
          null;
        const memberId = await findMemberIdByEmail(config, ownerEmail);
        if (memberId) ownerIds.push(memberId);
      } catch {
        // ignore owner resolution errors
      }

      const subtaskName = `[${defect.defectId}] ${defect.title}`.slice(0, 250);

      const created = await createStory(config, {
        name: subtaskName,
        description: enrichedDescription,
        storyType: 'bug',
        parentStoryId: storyId,
        epicId: parentStory?.epic_id ?? undefined,
        groupId: parentStory?.group_id ?? undefined,
        workflowStateId: unstartedStateId,
        workflowId: unstartedStateId ? undefined : (parentStory?.workflow_id ?? undefined),
        ownerIds: ownerIds.length > 0 ? ownerIds : undefined,
        labels: [{ name: label.name, color: label.color ?? '#E44' }],
        fileIds: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
      });

      const commentText = [
        `## EZTest Defect \`${defect.defectId}\` を Sub-task として取り込みました`,
        '',
        enrichedDescription,
      ].join('\n');
      // Let errors propagate so the UI can surface them; a silently-missing comment
      // was previously indistinguishable from success.
      await addStoryComment(config, created.id, commentText);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (prisma.defect as any).update({
        where: { id: defect.id },
        data: {
          shortcutStoryId: created.id,
          shortcutStoryUrl: created.app_url,
        },
        select: {
          id: true,
          shortcutStoryId: true,
          shortcutStoryUrl: true,
          shortcutEpicId: true,
          shortcutEpicName: true,
        },
      });
      return updated;
    } catch (error) {
      if (error instanceof ShortcutError) {
        const reason =
          typeof error.body === 'object' ? JSON.stringify(error.body) : String(error.body);
        throw new Error(`Shortcut API error (HTTP ${error.status}): ${reason}`);
      }
      throw error;
    }
  },
};

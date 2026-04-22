import { z } from 'zod';

/**
 * Project Creation Schema
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must not exceed 255 characters')
    .trim(),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must not exceed 10 characters')
    .regex(/^[A-Z0-9]+$/i, 'Key can only contain letters and numbers')
    .transform((val: string) => val.toUpperCase()),
  description: z.string().optional(),
});

/**
 * Project Update Schema
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must not exceed 255 characters')
    .trim()
    .optional(),
  description: z.string().nullish(),
});

/**
 * Add Project Member Schema
 */
export const addProjectMemberSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID format').optional(),
    email: z.string().email('Invalid email format').optional(),
  })
  .refine((data: { userId?: string; email?: string }) => data.userId || data.email, {
    message: 'Either userId or email is required',
    path: ['userId'],
  });

/**
 * Create Project Member Group Schema
 */
export const createProjectMemberGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  memberIds: z
    .array(z.string().min(1, 'Invalid member ID'))
    .min(1, 'At least one member is required')
    .max(100, 'A group can contain up to 100 members'),
});

/**
 * Project Query Parameters Schema
 */
export const projectQuerySchema = z.object({
  includeStats: z
    .string()
    .optional()
    .transform((val: string | undefined) => val === 'true'),
});

/**
 * Type exports
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type CreateProjectMemberGroupInput = z.infer<typeof createProjectMemberGroupSchema>;
export type ProjectQueryParams = z.infer<typeof projectQuerySchema>;

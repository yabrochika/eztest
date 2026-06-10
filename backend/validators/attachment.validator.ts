import { z } from 'zod';

/**
 * Entity Types for attachments
 */
export const entityTypeEnum = z.enum(['testcase', 'teststep', 'defect', 'comment', 'testresult', 'unassigned']);

/**
 * File upload initialization schema
 */
export const initializeUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive').max(500 * 1024 * 1024, 'File size exceeds 500MB limit'),
  fileType: z.string().min(1, 'File type is required'),
  fieldName: z.string().optional(),
  entityType: entityTypeEnum.refine((val) => val !== undefined, {
    message: 'Entity type is required (testcase, teststep, defect, comment, testresult, or unassigned)',
  }),
  entityId: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
});

/**
 * Multipart の各パート。
 * S3 SDK は PascalCase (PartNumber / ETag) を要求するが、API 利用者の利便性のため
 * camelCase (partNumber / etag) でも受け付け、PascalCase に正規化する（#10）。
 */
const uploadPartSchema = z
  .object({
    PartNumber: z.number().int().positive().optional(),
    ETag: z.string().min(1).optional(),
    partNumber: z.number().int().positive().optional(),
    etag: z.string().min(1).optional(),
  })
  .transform((part, ctx) => {
    const partNumber = part.PartNumber ?? part.partNumber;
    const etag = part.ETag ?? part.etag;
    if (partNumber === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PartNumber (or partNumber) is required for each part',
      });
      return z.NEVER;
    }
    if (etag === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ETag (or etag) is required for each part',
      });
      return z.NEVER;
    }
    return { PartNumber: partNumber, ETag: etag };
  });

/**
 * Complete upload schema
 */
export const completeUploadSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  parts: z.array(uploadPartSchema).min(1, 'At least one part is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  fieldName: z.string().optional(),
  testCaseId: z.string().nullable().optional(),
  testStepId: z.string().nullable().optional(),
});

/**
 * Abort upload schema
 */
export const abortUploadSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  fileKey: z.string().min(1, 'File key is required'),
});

/**
 * Link attachments schema
 */
export const linkAttachmentsSchema = z.object({
  attachments: z.array(z.object({
    id: z.string().min(1, 'Attachment ID is required'),
    fieldName: z.string().optional(),
  })).min(1, 'At least one attachment is required'),
});

export type InitializeUploadInput = z.infer<typeof initializeUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type AbortUploadInput = z.infer<typeof abortUploadSchema>;
export type LinkAttachmentsInput = z.infer<typeof linkAttachmentsSchema>;

import { attachmentController } from '@/backend/controllers/attachment/controller';
import { authenticateRequest } from '@/lib/auth/apiKeyAuth';
import type { NextRequest } from 'next/server';

/**
 * POST /api/attachments/upload/complete
 * Complete multipart upload and save attachment metadata
 * Purpose: Finalize S3 multipart upload and persist attachment record to database
 * Request body: uploadId, s3Key, parts, fileName, fileSize, fileType, testCaseId, fieldName
 * Returns: success boolean and attachment metadata
 *
 * 認証: セッション(Cookie) または APIキー(Authorization: Bearer <key>)。
 */
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request as unknown as NextRequest);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await attachmentController.completeUpload(request as unknown as { url: string; json: () => Promise<Record<string, unknown>> });
    return Response.json(result.data, { status: result.statusCode });
  } catch (error: unknown) {
    console.error('Error completing upload:', error);
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Failed to complete upload';
    return Response.json(
      { error: message },
      { status: statusCode }
    );
  }
}


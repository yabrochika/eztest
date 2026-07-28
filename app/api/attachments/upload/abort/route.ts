import { attachmentController } from '@/backend/controllers/attachment/controller';
import { authenticateRequest } from '@/lib/auth/apiKeyAuth';
import type { NextRequest } from 'next/server';

/**
 * DELETE /api/attachments/upload/abort
 * Abort an in-progress multipart upload
 * Purpose: Cancel S3 multipart upload and free resources if user cancels upload
 * Query params: uploadId, fileKey
 * NOTE: Should be POST not DELETE for semantic correctness (state-changing operation)
 * Returns: success message
 *
 * 認証: セッション(Cookie) または APIキー(Authorization: Bearer <key>)。
 */
export async function DELETE(request: Request) {
  try {
    const user = await authenticateRequest(request as unknown as NextRequest);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await attachmentController.abortUpload(request as unknown as { url: string; json: () => Promise<Record<string, unknown>> });
    return Response.json(result.data, { status: result.statusCode });
  } catch (error: unknown) {
    console.error('Error aborting upload:', error);
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Failed to abort upload';
    return Response.json(
      { error: message },
      { status: statusCode }
    );
  }
}

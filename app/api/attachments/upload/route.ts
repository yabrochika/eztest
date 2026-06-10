import { attachmentController } from '@/backend/controllers/attachment/controller';
import { authenticateRequest } from '@/lib/auth/apiKeyAuth';
import type { NextRequest } from 'next/server';

/**
 * POST /api/attachments/upload
 * Initialize multipart upload and generate presigned URLs
 * Purpose: Start S3 multipart upload process and provide presigned URLs for chunk uploads
 * Request body: fileName, fileSize, fileType, fieldName, entityType, entityId
 * Returns: uploadId, s3Key, presignedUrls array for browser-based chunk uploads
 *
 * 認証: セッション(Cookie) または APIキー(Authorization: Bearer <key>)。
 * 結果記録(POST results)と同一のAPIキーで「記録→添付」を一気通貫で自動化できるようにする。
 */
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request as unknown as NextRequest);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await attachmentController.initializeUpload(request as unknown as { url: string; json: () => Promise<Record<string, unknown>> });
    return Response.json(result.data, { status: result.statusCode });
  } catch (error: unknown) {
    console.error('Error initializing upload:', error);
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = error instanceof Error ? error.message : 'Failed to initialize upload';
    return Response.json(
      { error: message },
      { status: statusCode }
    );
  }
}

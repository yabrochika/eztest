import { attachmentController } from '@/backend/controllers/attachment/controller';
import { authenticateRequest } from '@/lib/auth/apiKeyAuth';
import type { NextRequest } from 'next/server';

/**
 * GET /api/attachments/[id]
 * Get attachment download URL with presigned access
 * Purpose: Generate time-limited presigned URL for secure file downloads
 * No permission check - presigned URLs are self-secured with time expiration
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attachmentId } = await params;
    const result = await attachmentController.getDownloadUrl(
      { url: request.url, json: () => request.json() },
      attachmentId
    );
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return Response.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    return Response.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/attachments/[id]
 * Update attachment metadata (link to entity)
 * Purpose: Link or unlink attachments to/from test cases, test steps, or test results
 * Updates: testCaseId, testStepId, testResultId fields
 *
 * 認証: セッション(Cookie) または APIキー(Authorization: Bearer <key>)。
 * エビデンス添付を結果に紐付ける際もAPIキーで完結できるようにする。
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request as unknown as NextRequest);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: attachmentId } = await params;
    const result = await attachmentController.updateAttachment(
      { url: request.url, json: () => request.json() },
      attachmentId
    );

    return Response.json({
      message: 'Attachment updated successfully',
      attachment: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return Response.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    return Response.json(
      { error: 'Failed to update attachment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attachments/[id]
 * Delete attachment with two-phase confirmation
 * Purpose: Remove attachment from S3 and database with safety confirmation
 * Query params: step ('prepare' or 'confirm')
 * - prepare: Generate presigned DELETE URL for S3
 * - confirm: Delete database record after S3 deletion
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request as unknown as NextRequest);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: attachmentId } = await params;
    const url = new URL(request.url);
    const step = url.searchParams.get('step'); // 'prepare' or 'confirm'

    if (step === 'prepare') {
      const result = await attachmentController.prepareDelete(
        { url: request.url, json: () => request.json() },
        attachmentId
      );
      return Response.json(result);
    } else if (step === 'confirm') {
      const result = await attachmentController.confirmDelete(
        { url: request.url, json: () => request.json() },
        attachmentId
      );
      return Response.json(result);
    } else {
      return Response.json(
        { error: 'Invalid step parameter. Use step=prepare or step=confirm' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return Response.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }
    return Response.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}


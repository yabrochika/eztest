-- Add optional commentId column to Attachment so testcase comments can have inline attachments
ALTER TABLE "Attachment" ADD COLUMN "commentId" TEXT;

-- Foreign key with cascade delete to keep attachment lifecycle tied to the comment
ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Attachment_commentId_idx" ON "Attachment"("commentId");

-- CreateTable
CREATE TABLE "ProjectMemberGroup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMemberGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMemberGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "projectMemberId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMemberGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberGroup_projectId_name_key" ON "ProjectMemberGroup"("projectId", "name");

-- CreateIndex
CREATE INDEX "ProjectMemberGroup_projectId_idx" ON "ProjectMemberGroup"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMemberGroup_createdById_idx" ON "ProjectMemberGroup"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMemberGroupMember_groupId_projectMemberId_key" ON "ProjectMemberGroupMember"("groupId", "projectMemberId");

-- CreateIndex
CREATE INDEX "ProjectMemberGroupMember_groupId_idx" ON "ProjectMemberGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "ProjectMemberGroupMember_projectMemberId_idx" ON "ProjectMemberGroupMember"("projectMemberId");

-- AddForeignKey
ALTER TABLE "ProjectMemberGroup" ADD CONSTRAINT "ProjectMemberGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberGroup" ADD CONSTRAINT "ProjectMemberGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberGroupMember" ADD CONSTRAINT "ProjectMemberGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProjectMemberGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMemberGroupMember" ADD CONSTRAINT "ProjectMemberGroupMember_projectMemberId_fkey" FOREIGN KEY ("projectMemberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

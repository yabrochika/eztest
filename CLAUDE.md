# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

EZTest is a self-hosted test management platform (Next.js 15 full-stack app) for managing test cases, test runs, defects, and requirements with team collaboration features.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

# Database (Prisma)
npx prisma generate                          # Regenerate client after schema changes
npx prisma migrate dev --name <description>  # Create and apply new migration
npx prisma migrate deploy                    # Apply migrations in production
npx prisma db seed                           # Seed initial data
npx prisma studio                            # GUI DB editor (port 5555)

# Docker (Development)
docker-compose -f docker-compose.dev.yml up -d

# Docker (Production)
docker-compose up -d
```

There are no automated tests. Linting is the only automated code check.

Default admin credentials after seed: `admin@eztest.local` / `Admin@123456`

## Architecture

### Directory Layout

- `app/` — Next.js App Router pages and API route handlers
- `app/api/` — All REST API endpoints (Next.js Route Handlers)
- `frontend/components/` — Feature-organized React components (project, testcase, testrun, defect, testsuite, defect, admin, etc.)
- `frontend/reusable-elements/` — Atomic UI components (buttons, cards, selects, modals)
- `lib/` — Server-side utilities: `prisma.ts`, `auth.ts` (NextAuth config), `email-service.ts`, `rbac/`, `s3/`
- `hooks/` — Custom React hooks (`useAttachments`, `usePermissions`, `useAnalytics`, etc.)
- `prisma/` — `schema.prisma` and migration history

### API Conventions

All API routes live under `app/api/` with this structure:
```
/api/projects/[id]/testcases/[tcId]/...
/api/projects/[id]/testruns/[testrunId]/...
/api/projects/[id]/defects/[defectId]/...
```

Response format:
- Success: `{ data: {...}, message: "..." }`
- Error: `{ error: "...", details?: {...} }`

### Authentication & Authorization

- **NextAuth.js** with email/password credentials
- **RBAC** with 27 granular permissions defined in `lib/rbac/`
- **API key auth** for programmatic access (checked alongside session auth)
- Route protection via `middleware.ts`
- Check permissions using `hasPermission()` from `lib/rbac/`

### Database

PostgreSQL 16 via Prisma ORM. Key domain models:
- `User` + `Role` + `Permission` — RBAC
- `Project` + `ProjectMember` + `Module` — Project organization
- `TestCase` + `TestStep` + `TestSuite` — Test hierarchy
- `TestRun` + `TestResult` — Execution tracking
- `Defect` + `DefectComment` — Issue tracking
- `Attachment` / `DefectAttachment` / `CommentAttachment` — File storage
- `DropdownOption` — Dynamic field values configurable per entity/field

Many entities use soft deletes (`deletedAt` / `isDeleted` flags).

### File Storage

- Primary: AWS S3 with multipart upload via presigned URLs (`lib/s3/`)
- Fallback: Local filesystem at `/app/uploads`
- Upload flow: `POST /api/attachments/upload` (initiate) → upload parts → `POST /api/attachments/upload/complete`

### Key Tech

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Radix UI |
| Validation | Zod |
| ORM | Prisma 5 |
| Auth | NextAuth.js 4 |
| Email | Nodemailer (SMTP) |
| Storage | AWS S3 / local |
| Analytics | Firebase (optional, server-configured) |

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

/**
 * DELETE /api/users/account
 * Soft delete user account (archive for 30 days before permanent deletion)
 * Requires password confirmation for security
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required to confirm account deletion' },
        { status: 400 }
      );
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Soft delete: set deletedAt timestamp (30 days from now for archive period)
    const deletionDate = new Date();
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        deletedAt: deletionDate,
      },
    });

    return NextResponse.json({
      message:
        'Your account has been marked for deletion. It will be permanently deleted in 30 days. You can contact support to restore your account.',
      deleteDate: new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
  } catch (error) {
    console.error('DELETE /api/users/account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/account
 * Check if user account is marked for deletion
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        isMarkedForDeletion: user.deletedAt !== null,
        markedAt: user.deletedAt,
        permanentDeleteDate: user.deletedAt
          ? new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  } catch (error) {
    console.error('GET /api/users/account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

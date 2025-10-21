import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/auth-utils';
import { sendPasswordResetEmail } from '@/lib/email-service';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json({
        message: 'If the email exists, password reset instructions have been sent.',
      });
    }

    // Check if user account is deleted
    if (user.deletedAt) {
      return NextResponse.json({
        message: 'If the email exists, password reset instructions have been sent.',
      });
    }

    // Generate reset token (random string)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Create password reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Prepare reset link
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      email,
      resetLink,
      user.name || 'User'
    );

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}, but token was created`);
      // Note: We still return success here to avoid leaking information about email delivery
      // In a production system, you might want to log this for monitoring/alerts
    } else {
      console.log(`Password reset email sent to ${email}`);
    }

    return NextResponse.json({
      message: 'If the email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

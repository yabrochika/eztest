'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './subcomponents/LoginForm';
import { OtpVerification } from '@/frontend/reusable-components/auth/OtpVerification';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPageComponent() {
  const router = useRouter();
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [formData, setFormData, clearFormData] = useFormPersistence('login-form', {
    email: '',
    password: '',
  }, {
    excludeFields: ['password'],
    expiryMs: 24 * 60 * 60 * 1000,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/config/features')
      .then((r) => r.json())
      .then((data) => setGoogleAuthEnabled(!!data.googleAuthEnabled))
      .catch(() => {});
  }, []);

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldBlur = (field: 'email' | 'password') => {
    const errors = { ...fieldErrors };

    if (field === 'email') {
      const error = validateEmail(formData.email);
      if (error) {
        errors.email = error;
        setAlert({ type: 'error', title: 'Validation Error', message: error });
      } else {
        delete errors.email;
      }
    } else if (field === 'password') {
      const error = validatePassword(formData.password);
      if (error) {
        errors.password = error;
        setAlert({ type: 'error', title: 'Validation Error', message: error });
      } else {
        delete errors.password;
      }
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the validation errors before submitting',
      });
      return;
    }

    setIsLoading(true);

    try {
      const otpResponse = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          type: 'login',
          password: formData.password,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpData.success) {
        setAlert({
          type: 'error',
          title: 'Error',
          message: otpData.message || 'Failed to send OTP',
        });
        setIsLoading(false);
        return;
      }

      if (otpData.smtpDisabled) {
        await handleOtpVerified();
        return;
      }

      setAlert({
        type: 'success',
        title: 'OTP Sent',
        message: 'Please check your email for the verification code',
      });
      setIsLoading(false);
      setShowOtpVerification(true);
    } catch {
      setAlert({ type: 'error', title: 'Error', message: 'An unexpected error occurred' });
      setIsLoading(false);
    }
  };

  const handleOtpVerified = async () => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setAlert({ type: 'error', title: 'Login Failed', message: 'Invalid email or password' });
        setShowOtpVerification(false);
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        clearFormData();
        setAlert({ type: 'success', title: 'Success', message: 'Login successful! Redirecting...' });
        router.push('/projects');
        router.refresh();
      }
    } catch {
      setAlert({ type: 'error', title: 'Error', message: 'An unexpected error occurred' });
      setShowOtpVerification(false);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/projects' });
  };

  const handleOtpCancel = () => {
    setShowOtpVerification(false);
    setIsLoading(false);
  };

  if (showOtpVerification) {
    return (
      <>
        <FloatingAlert alert={alert} onClose={() => setAlert(null)} />
        <OtpVerification
          email={formData.email}
          type="login"
          onVerified={handleOtpVerified}
          onCancel={handleOtpCancel}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🧪</span>
          <h1 className="text-2xl font-bold text-white mt-2">EZTest</h1>
        </div>
        <LoginForm
          formData={formData}
          fieldErrors={fieldErrors}
          isLoading={isLoading}
          onFormDataChange={setFormData}
          onFieldBlur={handleFieldBlur}
          onSubmit={handleSubmit}
          googleAuthEnabled={googleAuthEnabled}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </div>
    </div>
  );
}

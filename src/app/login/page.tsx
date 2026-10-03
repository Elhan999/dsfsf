'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiLock, FiMail } from 'react-icons/fi';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api';
import { loginSchema, LoginValues } from '@/schemas/auth';

/** Only allow same-site relative redirects. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      router.replace(next);
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue building with your team."
      footer={
        <>
          New to Team Finder? <Link href="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Input label="Email" type="email" autoComplete="email" icon={<FiMail />} placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" icon={<FiLock />} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        {errors.root && (
          <p role="alert" style={{ color: '#fb7185', fontSize: 14 }}>
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

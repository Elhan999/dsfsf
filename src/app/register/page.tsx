'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FiAtSign, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/api';
import { registerSchema, RegisterValues } from '@/schemas/auth';

export default function RegisterPage() {
  const { register: signUp, status } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const signingUp = useRef(false);

  // Already logged in? Skip the form (but not while our own sign-up is redirecting).
  useEffect(() => {
    if (status === 'authenticated' && !signingUp.current) router.replace('/');
  }, [status, router]);

  const onSubmit = handleSubmit(async (values) => {
    signingUp.current = true;
    try {
      await signUp({ ...values, username: values.username.toLowerCase() });
      // Next step of onboarding: fill in the profile and skills.
      router.replace('/settings?welcome=1');
    } catch (error) {
      signingUp.current = false;
      const message = getErrorMessage(error);
      if (/email/i.test(message)) setError('email', { message });
      else if (/username/i.test(message)) setError('username', { message });
      else setError('root', { message });
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Find the people to build with."
      footer={
        <>
          Already have an account? <Link href="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Input label="Name" autoComplete="name" icon={<FiUser />} placeholder="Timur" error={errors.name?.message} {...register('name')} />
        <Input label="Username" autoComplete="username" icon={<FiAtSign />} placeholder="timur" error={errors.username?.message} {...register('username')} />
        <Input label="Email" type="email" autoComplete="email" icon={<FiMail />} placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" icon={<FiLock />} placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        {errors.root && (
          <p role="alert" style={{ color: '#fb7185', fontSize: 14 }}>
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" block loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

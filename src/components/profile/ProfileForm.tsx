'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FaGithub, FaLinkedin, FaTelegramPlane } from 'react-icons/fa';
import { FiSave } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useUpdateProfile } from '@/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { profileSchema, ProfileValues } from '@/schemas/profile';
import type { UserProfile } from '@/types/api';
import styles from './ProfileForm.module.scss';

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const update = useUpdateProfile();
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      username: profile.username,
      jobTitle: profile.jobTitle ?? '',
      bio: profile.bio ?? '',
      avatar: profile.avatar ?? '',
      githubUrl: profile.githubUrl ?? '',
      telegramUrl: profile.telegramUrl ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      experience: profile.experience ?? '',
      availability: profile.availability,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync({
        name: v.name,
        username: v.username.toLowerCase(),
        jobTitle: v.jobTitle || null,
        bio: v.bio || null,
        avatar: v.avatar || null,
        githubUrl: v.githubUrl || null,
        telegramUrl: v.telegramUrl || null,
        linkedinUrl: v.linkedinUrl || null,
        experience: v.experience || null,
        availability: v.availability,
      });
      reset({ ...v, username: saved.username });
      success('Profile saved');
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('username')) setError('username', { message });
      else setError('root', { message });
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.grid}>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Username" error={errors.username?.message} {...register('username')} />
        <Input label="Job title" placeholder="Frontend Developer" error={errors.jobTitle?.message} {...register('jobTitle')} />
        <Input label="Avatar URL" placeholder="https://…" error={errors.avatar?.message} {...register('avatar')} />
        <Select label="Experience" error={errors.experience?.message} {...register('experience')}>
          <option value="">Not specified</option>
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </Select>
        <Select label="Availability" error={errors.availability?.message} {...register('availability')}>
          <option value="available">Available</option>
          <option value="part_time">Part-time</option>
          <option value="busy">Busy</option>
        </Select>
      </div>
      <Textarea label="Bio" rows={4} placeholder="What do you love building?" error={errors.bio?.message} {...register('bio')} />
      <div className={styles.grid3}>
        <Input label="GitHub" icon={<FaGithub />} placeholder="https://github.com/you" error={errors.githubUrl?.message} {...register('githubUrl')} />
        <Input label="Telegram" icon={<FaTelegramPlane />} placeholder="https://t.me/you" error={errors.telegramUrl?.message} {...register('telegramUrl')} />
        <Input label="LinkedIn" icon={<FaLinkedin />} placeholder="https://linkedin.com/in/you" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
      </div>
      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}
      <div className={styles.footer}>
        <Button type="submit" loading={update.isPending} disabled={!isDirty} icon={<FiSave />}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

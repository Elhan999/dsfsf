'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiArrowLeft, FiArrowRight, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { useAuth } from '@/hooks/useAuth';
import { cx } from '@/lib/format';
import { PROJECT_CATEGORIES, projectFormSchema, ProjectFormValues } from '@/schemas/project';
import type { Project, ProjectInput } from '@/types/api';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectForm.module.scss';

const STEPS = ['Project', 'Roles', 'Skills', 'Preview', 'Publish'] as const;

const STEP_FIELDS: Record<number, (keyof ProjectFormValues)[]> = {
  0: ['name', 'description', 'category', 'image', 'status'],
  1: ['roles'],
  2: ['roles'],
};

interface ProjectFormProps {
  initialValues?: ProjectFormValues;
  mode: 'create' | 'edit';
  submitting: boolean;
  error?: string | null;
  onSubmit: (input: ProjectInput) => void;
}

const EMPTY: ProjectFormValues = {
  name: '',
  description: '',
  category: '',
  image: '',
  status: 'recruiting',
  roles: [{ name: '', description: '', requiredCount: 1, skills: [] }],
};

export function ProjectForm({ initialValues, mode, submitting, error, onSubmit }: ProjectFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialValues ?? EMPTY,
    mode: 'onTouched',
  });
  const roles = useFieldArray({ control, name: 'roles' });
  const values = watch();

  const next = async () => {
    const fields = STEP_FIELDS[step];
    if (fields && !(await trigger(fields))) return;
    if (step === 2) {
      const hasSkills = values.roles.some((r) => r.skills.length > 0);
      if (!hasSkills) {
        setError('roles', { message: 'Add at least one skill so the right people can find your project.' });
        return;
      }
      clearErrors('roles');
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = handleSubmit((v) =>
    onSubmit({
      name: v.name,
      description: v.description,
      category: v.category,
      image: v.image || null,
      status: v.status,
      roles: v.roles.map((r) => ({
        ...(r.id && { id: r.id }),
        name: r.name,
        description: r.description || null,
        requiredCount: r.requiredCount,
        skills: r.skills,
      })),
    }),
  );

  const preview: Project = {
    id: 0,
    name: values.name || 'Untitled project',
    description: values.description || 'No description yet.',
    category: values.category || 'Category',
    image: values.image || null,
    status: values.status,
    progress: 0,
    owner: { id: user?.id ?? 0, name: user?.name ?? 'You', username: user?.username ?? '', avatar: user?.avatar ?? null, jobTitle: null },
    roles: values.roles.map((r, i) => ({
      id: i + 1,
      name: r.name || 'Role',
      description: r.description,
      requiredCount: r.requiredCount || 1,
      filledCount: 0,
      skills: r.skills,
    })),
    skills: [...new Set(values.roles.flatMap((r) => r.skills))],
    membersCount: 1,
    teamSize: 1 + values.roles.reduce((s, r) => s + (Number(r.requiredCount) || 0), 0),
    openPositions: values.roles.reduce((s, r) => s + (Number(r.requiredCount) || 0), 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className={styles.wrap}>
      <ol className={styles.steps} aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className={cx(styles.step, i === step && styles.current, i < step && styles.done)}>
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined}>
              <span className={styles.stepIndex}>{i < step ? <FiCheck /> : i + 1}</span>
              <span className={styles.stepLabel}>{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <form className={styles.panel} onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 0 && (
          <div className={styles.fields}>
            <StepIntro title="Tell us about the project" text="A clear name and pitch get far more applications." />
            <Input label="Project name" placeholder="AI Study Platform" error={errors.name?.message} {...register('name')} />
            <Textarea
              label="Description"
              placeholder="What are you building, for whom, and what stage is it at?"
              rows={5}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className={styles.row}>
              <Select label="Category" error={errors.category?.message} {...register('category')}>
                <option value="" disabled>
                  Select a category
                </option>
                {[...PROJECT_CATEGORIES, ...(initialValues?.category && !(PROJECT_CATEGORIES as readonly string[]).includes(initialValues.category) ? [initialValues.category] : [])].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select label="Status" error={errors.status?.message} {...register('status')}>
                <option value="recruiting">Recruiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </Select>
            </div>
            <Input
              label="Cover image URL"
              placeholder="https://images.unsplash.com/…"
              hint="Optional. Paste a link to an image."
              error={errors.image?.message}
              {...register('image')}
            />
          </div>
        )}

        {step === 1 && (
          <div className={styles.fields}>
            <StepIntro title="Who do you need?" text="Add each role you're hiring for and how many people." />
            {roles.fields.map((field, index) => (
              <div key={field.id} className={styles.roleCard}>
                <div className={styles.roleHead}>
                  <span>Role {index + 1}</span>
                  {roles.fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" icon={<FiTrash2 />} onClick={() => roles.remove(index)}>
                      Remove
                    </Button>
                  )}
                </div>
                <div className={styles.rowWide}>
                  <Input
                    label="Role name"
                    placeholder="Frontend Developer"
                    error={errors.roles?.[index]?.name?.message}
                    {...register(`roles.${index}.name`)}
                  />
                  <Input
                    label="People"
                    type="number"
                    min={1}
                    max={20}
                    error={errors.roles?.[index]?.requiredCount?.message}
                    {...register(`roles.${index}.requiredCount`, { valueAsNumber: true })}
                  />
                </div>
                <Input
                  label="What will they do?"
                  placeholder="Build the dashboard and component library"
                  error={errors.roles?.[index]?.description?.message}
                  {...register(`roles.${index}.description`)}
                />
              </div>
            ))}
            {errors.roles?.message && <p className={styles.error}>{errors.roles.message}</p>}
            <Button
              type="button"
              variant="secondary"
              icon={<FiPlus />}
              onClick={() => roles.append({ name: '', description: '', requiredCount: 1, skills: [] })}
              disabled={roles.fields.length >= 15}
            >
              Add role
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.fields}>
            <StepIntro title="Which skills matter?" text="Skills power search and AI matching. Pick existing ones or type your own." />
            {roles.fields.map((field, index) => (
              <div key={field.id} className={styles.roleCard}>
                <div className={styles.roleHead}>
                  <span>{values.roles[index]?.name || `Role ${index + 1}`}</span>
                </div>
                <Controller
                  control={control}
                  name={`roles.${index}.skills`}
                  render={({ field: f }) => <SkillPicker value={f.value} onChange={f.onChange} placeholder="React, Figma, PostgreSQL…" />}
                />
              </div>
            ))}
            {errors.roles?.message && <p className={styles.error}>{errors.roles.message}</p>}
          </div>
        )}

        {step === 3 && (
          <div className={styles.fields}>
            <StepIntro title="Preview" text="This is how your project will appear in Discover." />
            <div className={styles.preview}>
              <ProjectCard project={preview} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.fields}>
            <StepIntro
              title={mode === 'create' ? 'Ready to publish?' : 'Save your changes?'}
              text={
                mode === 'create'
                  ? "Your project goes live immediately. You'll be notified as soon as someone applies."
                  : 'Changes are visible to everyone right away.'
              }
            />
            <dl className={styles.summary}>
              <div>
                <dt>Project</dt>
                <dd>{values.name}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{values.category}</dd>
              </div>
              <div>
                <dt>Roles</dt>
                <dd>{values.roles.map((r) => `${r.name} ×${r.requiredCount}`).join(', ')}</dd>
              </div>
              <div>
                <dt>Skills</dt>
                <dd>{preview.skills.join(', ') || '—'}</dd>
              </div>
            </dl>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        <footer className={styles.footer}>
          {step > 0 ? (
            <Button type="button" variant="ghost" icon={<FiArrowLeft />} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} iconRight={<FiArrowRight />}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} loading={submitting} icon={<FiCheck />}>
              {mode === 'create' ? 'Publish project' : 'Save changes'}
            </Button>
          )}
        </footer>
      </form>
    </div>
  );
}

function StepIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.intro}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

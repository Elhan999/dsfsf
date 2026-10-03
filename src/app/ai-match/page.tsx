'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { FiCheck, FiCpu, FiSearch, FiX } from 'react-icons/fi';
import { Page } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button, LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAiMatch } from '@/hooks/useAiMatch';
import { useSocket } from '@/hooks/useSocket';
import { aiMatchSchema } from '@/schemas/application';
import type { AiMatch } from '@/types/api';
import styles from './ai.module.scss';

const EXAMPLES = [
  'I need a React developer who knows TypeScript and Node.js.',
  'Looking for a UI/UX designer comfortable with Figma.',
  'Backend engineer with PostgreSQL, Docker and FastAPI experience.',
];

function MatchCard({ match }: { match: AiMatch }) {
  const { isOnline } = useSocket();
  const tone = match.matchPercent >= 80 ? styles.high : match.matchPercent >= 50 ? styles.mid : styles.low;
  return (
    <article className={styles.match}>
      <header>
        <Avatar name={match.user.name} src={match.user.avatar} size={48} online={isOnline(match.userId, match.user.isOnline)} />
        <div className={styles.who}>
          <h3>{match.user.name}</h3>
          <p>{match.user.jobTitle ?? `@${match.user.username}`}</p>
        </div>
        <div className={`${styles.percent} ${tone}`}>
          <strong>{match.matchPercent}%</strong>
          <span>Match</span>
        </div>
      </header>
      <div className={styles.bar}>
        <span className={tone} style={{ width: `${match.matchPercent}%` }} />
      </div>
      <ul className={styles.checks}>
        {match.matchedSkills.map((s) => (
          <li key={s} className={styles.ok}>
            <FiCheck aria-label="has" /> {s}
          </li>
        ))}
        {match.missingSkills.map((s) => (
          <li key={s} className={styles.miss}>
            <FiX aria-label="missing" /> {s}
          </li>
        ))}
      </ul>
      <LinkButton href={`/profile/${match.userId}`} variant="secondary" size="sm" block>
        View Profile
      </LinkButton>
    </article>
  );
}

function AiMatchPage() {
  const match = useAiMatch();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<{ description: string }>({ resolver: zodResolver(aiMatchSchema), defaultValues: { description: '' } });

  const onSubmit = handleSubmit(({ description }) => match.mutate(description));
  const result = match.data;

  return (
    <Page>
      <section className={styles.hero}>
        <span className={styles.badge}>
          <FiCpu aria-hidden /> AI Matching
        </span>
        <h1>Find your perfect teammate.</h1>
        <p>Describe who you need in plain words. We&apos;ll extract the skills and rank everyone on Team Finder by fit.</p>
      </section>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <textarea
          {...register('description')}
          placeholder="Describe what kind of teammate you need..."
          rows={5}
          aria-label="Describe the teammate you need"
          aria-invalid={!!errors.description}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
          }}
        />
        <div className={styles.formFooter}>
          <div className={styles.examples}>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setValue('description', ex, { shouldValidate: true })}>
                {ex}
              </button>
            ))}
          </div>
          <Button type="submit" size="lg" icon={<FiSearch />} loading={match.isPending}>
            Find matches
          </Button>
        </div>
        {errors.description && <p className={styles.error}>{errors.description.message}</p>}
      </form>

      <div className={styles.results} aria-live="polite">
        {match.isPending ? (
          <>
            <p className={styles.status}>Analyzing your description…</p>
            <div className={styles.grid}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={220} radius={16} />
              ))}
            </div>
          </>
        ) : match.isError ? (
          <ErrorState error={match.error} onRetry={onSubmit} />
        ) : result ? (
          <>
            <div className={styles.requirements}>
              <h2>Required skills:</h2>
              {result.requirements.length ? (
                <ul>
                  {result.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.status}>We couldn&apos;t detect specific skills. Try naming technologies or tools.</p>
              )}
              <span className={styles.source}>{result.source === 'ai' ? 'Extracted by AI' : 'Keyword matching'}</span>
            </div>
            {result.matches.length ? (
              <div className={styles.grid}>
                {result.matches.map((m) => (
                  <MatchCard key={m.userId} match={m} />
                ))}
              </div>
            ) : (
              result.requirements.length > 0 && (
                <EmptyState title="No matches yet" description="Nobody has these skills on their profile yet. Try fewer or broader skills." action={<Link href="/teammates">Browse all teammates →</Link>} />
              )
            )}
          </>
        ) : null}
      </div>
    </Page>
  );
}

export default function Page_() {
  return (
    <RequireAuth>
      <AiMatchPage />
    </RequireAuth>
  );
}

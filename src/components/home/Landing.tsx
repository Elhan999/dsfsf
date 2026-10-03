'use client';

import Link from 'next/link';
import { FiArrowRight, FiCheck, FiCpu, FiMessageSquare, FiSearch, FiUserCheck, FiUsers } from 'react-icons/fi';
import { ProjectCard, ProjectCardSkeleton, ProjectGrid } from '@/components/project/ProjectCard';
import { UserCard, UserCardSkeleton, UserGrid } from '@/components/profile/UserCard';
import { Avatar } from '@/components/ui/Avatar';
import { LinkButton } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ErrorState } from '@/components/ui/States';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';
import styles from './Landing.module.scss';

const STEPS = [
  { icon: FiUserCheck, title: 'Create your profile', text: 'Add your role, skills and links. It takes two minutes.' },
  { icon: FiSearch, title: 'Discover or post', text: 'Browse projects that need you, or publish your own idea with open roles.' },
  { icon: FiUsers, title: 'Apply & get accepted', text: 'Send a short note. Owners accept with one click and you join the team.' },
  { icon: FiMessageSquare, title: 'Build together', text: 'Your team workspace has real-time chat, members and progress.' },
];

export function Landing() {
  const projects = useProjects({ status: 'recruiting', limit: 3 });
  const people = useUsers({ limit: 3 });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <nav className={styles.headerNav}>
          <Link href="/discover">Discover</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/teammates">Teammates</Link>
        </nav>
        <div className={styles.headerActions}>
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/register" size="sm">
            Sign up
          </LinkButton>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.grid} aria-hidden />
        <p className={styles.pill}>
          <span>New</span> AI teammate matching is live <FiArrowRight aria-hidden />
        </p>
        <h1 className="fade-up">
          Find the people
          <br />
          <span className={styles.gradient}>to build with.</span>
        </h1>
        <p className={styles.lead}>
          Team Finder connects developers, designers and makers with projects that need them. Discover a team, apply in one click, and start building in a real-time workspace.
        </p>
        <div className={styles.ctas}>
          <LinkButton href="/discover" size="lg" iconRight={<FiArrowRight />}>
            Find your team
          </LinkButton>
          <LinkButton href="/projects/create" size="lg" variant="secondary">
            Create a project
          </LinkButton>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Featured projects</p>
            <h2>Teams looking for people right now</h2>
          </div>
          <Link href="/projects" className={styles.more}>
            All projects <FiArrowRight />
          </Link>
        </div>
        {projects.isError ? (
          <ErrorState error={projects.error} onRetry={() => projects.refetch()} />
        ) : (
          <ProjectGrid>
            {projects.isLoading
              ? [0, 1, 2].map((i) => <ProjectCardSkeleton key={i} />)
              : projects.data?.data.map((p) => <ProjectCard key={p.id} project={p} />)}
          </ProjectGrid>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Featured teammates</p>
            <h2>People ready to build</h2>
          </div>
          <Link href="/teammates" className={styles.more}>
            All teammates <FiArrowRight />
          </Link>
        </div>
        {people.isError ? (
          <ErrorState error={people.error} onRetry={() => people.refetch()} />
        ) : (
          <UserGrid>
            {people.isLoading
              ? [0, 1, 2].map((i) => <UserCardSkeleton key={i} />)
              : people.data?.data.map((u) => <UserCard key={u.id} user={u} />)}
          </UserGrid>
        )}
      </section>

      <section className={`${styles.section} ${styles.ai}`}>
        <div className={styles.aiText}>
          <p className={styles.eyebrow}>
            <FiCpu aria-hidden /> AI Matching
          </p>
          <h2>Describe who you need. We&apos;ll find them.</h2>
          <p>
            Write what you are looking for in plain language. Our AI extracts the skills, searches every profile and ranks people by how well they match.
          </p>
          <LinkButton href="/ai-match" variant="secondary" iconRight={<FiArrowRight />}>
            Try AI matching
          </LinkButton>
        </div>
        <div className={styles.aiDemo} aria-hidden>
          <div className={styles.prompt}>“I need a React developer who knows TypeScript and Node.js.”</div>
          <div className={styles.req}>
            <span>Required skills</span>
            <div>
              <em>React</em>
              <em>TypeScript</em>
              <em>Node.js</em>
            </div>
          </div>
          <div className={styles.match}>
            <Avatar name="Daniel" size={40} />
            <div>
              <strong>Daniel</strong>
              <small>Full Stack Developer</small>
            </div>
            <span className={styles.percent}>100%</span>
          </div>
          <ul className={styles.checks}>
            <li>
              <FiCheck /> React
            </li>
            <li>
              <FiCheck /> TypeScript
            </li>
            <li>
              <FiCheck /> Node.js
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>How it works</p>
            <h2>From idea to team in four steps</h2>
          </div>
        </div>
        <ol className={styles.steps}>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <span className={styles.stepIcon}>
                <Icon aria-hidden />
              </span>
              <span className={styles.stepNo}>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.cta}>
        <h2>Your next team is already here.</h2>
        <p>Join Team Finder for free and start building this week.</p>
        <LinkButton href="/register" size="lg" iconRight={<FiArrowRight />}>
          Get started
        </LinkButton>
      </section>

      <footer className={styles.footer}>
        <div>
          <Logo />
          <p>Find the people to build with.</p>
        </div>
        <nav>
          <div>
            <strong>Product</strong>
            <Link href="/discover">Discover</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/teammates">Teammates</Link>
            <Link href="/ai-match">AI Matching</Link>
          </div>
          <div>
            <strong>Account</strong>
            <Link href="/login">Log in</Link>
            <Link href="/register">Sign up</Link>
          </div>
        </nav>
        <p className={styles.copy}>© {new Date().getFullYear()} Team Finder</p>
      </footer>
    </div>
  );
}

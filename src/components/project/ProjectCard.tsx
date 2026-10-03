import Link from 'next/link';
import { FiArrowUpRight, FiUsers } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { SkillList, StatusBadge } from '@/components/ui/Badge';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import type { Project } from '@/types/api';
import styles from './ProjectCard.module.scss';

export function ProjectCard({ project }: { project: Project }) {
  const openRoles = project.roles.filter((r) => r.filledCount < r.requiredCount);
  return (
    <article className={styles.card}>
      <Link href={`/projects/${project.id}`} className={styles.cover} tabIndex={-1} aria-hidden>
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt="" loading="lazy" />
        ) : (
          <span className={styles.placeholder}>{project.name[0]}</span>
        )}
        <span className={styles.status}>
          <StatusBadge status={project.status} />
        </span>
      </Link>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.category}>{project.category}</span>
          <h3>
            <Link href={`/projects/${project.id}`}>{project.name}</Link>
          </h3>
          <p className={styles.description}>{project.description}</p>
        </div>

        {openRoles.length > 0 && (
          <div className={styles.roles}>
            <span className={styles.label}>Looking for</span>
            <ul>
              {openRoles.slice(0, 3).map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
              {openRoles.length > 3 && <li className={styles.moreRoles}>+{openRoles.length - 3} more</li>}
            </ul>
          </div>
        )}

        {project.skills.length > 0 && <SkillList skills={project.skills} max={4} />}

        <footer className={styles.footer}>
          <Link href={`/profile/${project.owner.id}`} className={styles.owner}>
            <Avatar name={project.owner.name} src={project.owner.avatar} size={24} />
            <span>{project.owner.name}</span>
          </Link>
          <span className={styles.members} title="Team size">
            <FiUsers aria-hidden />
            {project.membersCount} / {project.teamSize} members
          </span>
        </footer>
        <Link href={`/projects/${project.id}`} className={styles.view}>
          View Project <FiArrowUpRight aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <Skeleton height={148} radius={0} />
      <div className={styles.body}>
        <Skeleton width={70} height={12} />
        <Skeleton width="70%" height={20} />
        <SkeletonText lines={2} />
        <div style={{ display: 'flex', gap: 6 }}>
          <Skeleton width={60} height={24} />
          <Skeleton width={80} height={24} />
          <Skeleton width={56} height={24} />
        </div>
      </div>
    </div>
  );
}

export function ProjectGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

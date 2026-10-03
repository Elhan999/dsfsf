import { FaGithub, FaLinkedin, FaTelegramPlane } from 'react-icons/fa';
import styles from './UserCard.module.scss';

export function SocialLinks({ githubUrl, telegramUrl, linkedinUrl }: { githubUrl: string | null; telegramUrl: string | null; linkedinUrl?: string | null }) {
  const links = [
    { href: githubUrl, label: 'GitHub', icon: FaGithub },
    { href: telegramUrl, label: 'Telegram', icon: FaTelegramPlane },
    { href: linkedinUrl, label: 'LinkedIn', icon: FaLinkedin },
  ].filter((l) => l.href);
  if (!links.length) return null;
  return (
    <div className={styles.socials}>
      {links.map(({ href, label, icon: Icon }) => (
        <a key={label} href={href!} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <Icon />
        </a>
      ))}
    </div>
  );
}

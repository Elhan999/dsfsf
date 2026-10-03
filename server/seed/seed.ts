import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import { pool } from '../src/db/pool';

/** Development seed. Every user's password is `password123`. Safe to re-run: it wipes app data first. */

const SKILLS = [
  'React', 'TypeScript', 'Next.js', 'JavaScript', 'Node.js', 'Express', 'PostgreSQL',
  'Python', 'FastAPI', 'Figma', 'UI/UX', 'Docker', 'Git',
];

const USERS = [
  {
    key: 'timur', name: 'Timur', username: 'timur', email: 'timur@teamfinder.dev',
    jobTitle: 'Junior Frontend Developer', experience: 'junior', availability: 'available',
    bio: 'Frontend developer who loves clean interfaces and fast feedback loops. Looking for a first serious product team.',
    skills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'Git'],
    github: 'https://github.com/timur', telegram: 'https://t.me/timur_dev', linkedin: null,
  },
  {
    key: 'aida', name: 'Aida', username: 'aida', email: 'aida@teamfinder.dev',
    jobTitle: 'UI/UX Designer', experience: 'middle', availability: 'part_time',
    bio: 'Designing calm, accessible products. Research first, pixels second.',
    skills: ['Figma', 'UI/UX'],
    github: null, telegram: 'https://t.me/aida_design', linkedin: 'https://linkedin.com/in/aida',
  },
  {
    key: 'bek', name: 'Bek', username: 'bek', email: 'bek@teamfinder.dev',
    jobTitle: 'Backend Developer', experience: 'middle', availability: 'available',
    bio: 'APIs, databases and the boring infrastructure that keeps products alive.',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Python', 'FastAPI', 'Git'],
    github: 'https://github.com/bek', telegram: 'https://t.me/bek_backend', linkedin: null,
  },
  {
    key: 'daniel', name: 'Daniel', username: 'daniel', email: 'daniel@teamfinder.dev',
    jobTitle: 'Full Stack Developer', experience: 'senior', availability: 'busy',
    bio: 'Shipped 10+ products end to end. Happy to mentor and to build fast.',
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Next.js', 'Docker', 'Git'],
    github: 'https://github.com/daniel', telegram: null, linkedin: 'https://linkedin.com/in/daniel',
  },
  {
    key: 'maya', name: 'Maya', username: 'maya', email: 'maya@teamfinder.dev',
    jobTitle: 'Product Designer', experience: 'senior', availability: 'available',
    bio: 'Product designer bridging research, UX and front-end prototypes.',
    skills: ['Figma', 'UI/UX', 'JavaScript'],
    github: null, telegram: 'https://t.me/maya_pd', linkedin: 'https://linkedin.com/in/maya',
  },
] as const;

type UserKey = (typeof USERS)[number]['key'];

interface SeedProject {
  owner: UserKey;
  name: string;
  description: string;
  category: string;
  status: 'recruiting' | 'active' | 'completed' | 'closed';
  progress: number;
  image: string;
  roles: { name: string; description: string; requiredCount: number; skills: string[] }[];
  members: { user: UserKey; role: string }[];
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const PROJECTS: SeedProject[] = [
  {
    owner: 'daniel', name: 'AI Study Platform', category: 'EdTech', status: 'recruiting', progress: 35,
    description: 'AI-powered learning platform that turns lecture notes into spaced-repetition flashcards and personal study plans.',
    image: img('photo-1522202176988-66273c2fd55f'),
    roles: [
      { name: 'Frontend Developer', description: 'Build the study dashboard and flashcard player.', requiredCount: 2, skills: ['React', 'TypeScript', 'Next.js'] },
      { name: 'UI/UX Designer', description: 'Own the learning experience end to end.', requiredCount: 1, skills: ['Figma', 'UI/UX'] },
      { name: 'Backend Developer', description: 'APIs, auth and AI pipeline.', requiredCount: 1, skills: ['Node.js', 'PostgreSQL'] },
    ],
    members: [{ user: 'bek', role: 'Backend Developer' }],
  },
  {
    owner: 'bek', name: 'Football Manager', category: 'Sports', status: 'active', progress: 60,
    description: 'Manage amateur football leagues: fixtures, live scores, player stats and team chat in one place.',
    image: img('photo-1574629810360-7efbbe195018'),
    roles: [
      { name: 'Frontend Developer', description: 'Live match center and league tables.', requiredCount: 1, skills: ['React', 'JavaScript'] },
      { name: 'Data Engineer', description: 'Stats ingestion and analytics.', requiredCount: 1, skills: ['Python', 'FastAPI', 'PostgreSQL'] },
    ],
    members: [{ user: 'timur', role: 'Frontend Developer' }],
  },
  {
    owner: 'maya', name: 'Startup Landing', category: 'Marketing', status: 'recruiting', progress: 10,
    description: 'A landing page kit for early-stage startups with ready-made sections, A/B testing and analytics.',
    image: img('photo-1460925895917-afdab827c52f'),
    roles: [
      { name: 'Frontend Developer', description: 'Implement sections as reusable components.', requiredCount: 1, skills: ['Next.js', 'TypeScript'] },
      { name: 'Designer', description: 'Visual system and illustrations.', requiredCount: 1, skills: ['Figma'] },
    ],
    members: [],
  },
  {
    owner: 'timur', name: 'Open Source Dashboard', category: 'Developer Tools', status: 'recruiting', progress: 20,
    description: 'An open-source dashboard for tracking GitHub repositories, issues and contributor activity.',
    image: img('photo-1551288049-bebda4e38f71'),
    roles: [
      { name: 'Backend Developer', description: 'GitHub API sync and caching.', requiredCount: 1, skills: ['Node.js', 'Express', 'Docker'] },
      { name: 'UI/UX Designer', description: 'Dashboard layout and charts.', requiredCount: 1, skills: ['Figma', 'UI/UX'] },
    ],
    members: [{ user: 'aida', role: 'UI/UX Designer' }],
  },
  {
    owner: 'aida', name: 'Fitness Tracker', category: 'Health', status: 'completed', progress: 100,
    description: 'A minimalist fitness tracker with workout plans, habit streaks and progress photos.',
    image: img('photo-1517836357463-d25dfeac3438'),
    roles: [
      { name: 'Full Stack Developer', description: 'Build the MVP.', requiredCount: 1, skills: ['React', 'Node.js', 'PostgreSQL'] },
    ],
    members: [{ user: 'daniel', role: 'Full Stack Developer' }],
  },
];

const MESSAGES: { project: string; from: UserKey; content: string; minutesAgo: number }[] = [
  { project: 'AI Study Platform', from: 'daniel', content: 'Welcome aboard, Bek! Schema draft is in the repo.', minutesAgo: 300 },
  { project: 'AI Study Platform', from: 'bek', content: 'Thanks! I will set up migrations and the auth endpoints today.', minutesAgo: 290 },
  { project: 'AI Study Platform', from: 'daniel', content: 'Perfect. We still need a frontend dev — a couple of applications came in.', minutesAgo: 60 },
  { project: 'Football Manager', from: 'bek', content: 'Match center API is live on staging 🚀', minutesAgo: 180 },
  { project: 'Football Manager', from: 'timur', content: 'Nice, wiring up the live scores component now.', minutesAgo: 170 },
  { project: 'Open Source Dashboard', from: 'aida', content: 'First wireframes are ready in Figma, take a look.', minutesAgo: 90 },
  { project: 'Open Source Dashboard', from: 'timur', content: 'Love the sidebar. Let us go with the dark variant.', minutesAgo: 80 },
];

async function seed(client: PoolClient) {
  await client.query(`TRUNCATE notifications, messages, invitations, applications, project_members, role_skills,
    project_roles, projects, user_skills, skills, refresh_tokens, users RESTART IDENTITY CASCADE`);

  const skillIds = new Map<string, number>();
  for (const name of SKILLS) {
    const { rows } = await client.query<{ id: number }>('INSERT INTO skills (name) VALUES ($1) RETURNING id', [name]);
    skillIds.set(name, rows[0].id);
  }

  const passwordHash = await bcrypt.hash('password123', 12);
  const userIds = new Map<UserKey, number>();
  for (const u of USERS) {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO users (name, username, email, password_hash, job_title, bio, github_url, telegram_url,
                          linkedin_url, experience, availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [u.name, u.username, u.email, passwordHash, u.jobTitle, u.bio, u.github, u.telegram, u.linkedin, u.experience, u.availability],
    );
    userIds.set(u.key, rows[0].id);
    for (const skill of u.skills) {
      await client.query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2)', [rows[0].id, skillIds.get(skill)]);
    }
  }

  const projectIds = new Map<string, number>();
  const roleIds = new Map<string, number>(); // "Project/Role" → id
  for (const p of PROJECTS) {
    const ownerId = userIds.get(p.owner)!;
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO projects (owner_id, name, description, category, image, status, progress, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - ($8 || ' days')::interval) RETURNING id`,
      [ownerId, p.name, p.description, p.category, p.image, p.status, p.progress, String(PROJECTS.indexOf(p) * 3)],
    );
    const projectId = rows[0].id;
    projectIds.set(p.name, projectId);
    await client.query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)', [projectId, ownerId]);

    for (const role of p.roles) {
      const { rows: roleRows } = await client.query<{ id: number }>(
        'INSERT INTO project_roles (project_id, name, description, required_count) VALUES ($1, $2, $3, $4) RETURNING id',
        [projectId, role.name, role.description, role.requiredCount],
      );
      roleIds.set(`${p.name}/${role.name}`, roleRows[0].id);
      for (const skill of role.skills) {
        await client.query('INSERT INTO role_skills (role_id, skill_id) VALUES ($1, $2)', [roleRows[0].id, skillIds.get(skill)]);
      }
    }
    for (const m of p.members) {
      await client.query('INSERT INTO project_members (project_id, user_id, role_id) VALUES ($1, $2, $3)', [
        projectId, userIds.get(m.user), roleIds.get(`${p.name}/${m.role}`),
      ]);
    }
  }

  const U = (k: UserKey) => userIds.get(k)!;
  const P = (name: string) => projectIds.get(name)!;
  const R = (project: string, role: string) => roleIds.get(`${project}/${role}`)!;

  // Applications
  const applications: [UserKey, string, string, string, string][] = [
    ['timur', 'AI Study Platform', 'Frontend Developer', 'I have been building with React and Next.js for a year and would love to work on an EdTech product.', 'pending'],
    ['maya', 'AI Study Platform', 'UI/UX Designer', 'Learning products are my favourite kind of design problem. Portfolio on LinkedIn.', 'pending'],
    ['daniel', 'Startup Landing', 'Frontend Developer', 'Can ship the whole component library in two weeks.', 'rejected'],
    ['bek', 'Open Source Dashboard', 'Backend Developer', 'GitHub API + Redis cache is exactly my thing.', 'pending'],
  ];
  for (const [user, project, role, message, status] of applications) {
    await client.query(
      'INSERT INTO applications (project_id, user_id, role_id, message, status) VALUES ($1, $2, $3, $4, $5)',
      [P(project), U(user), R(project, role), message, status],
    );
  }

  // Invitation: Maya invites Timur to Startup Landing
  await client.query('INSERT INTO invitations (project_id, sender_id, receiver_id, role_id) VALUES ($1, $2, $3, $4)', [
    P('Startup Landing'), U('maya'), U('timur'), R('Startup Landing', 'Frontend Developer'),
  ]);

  for (const m of MESSAGES) {
    await client.query(
      `INSERT INTO messages (project_id, sender_id, content, created_at)
       VALUES ($1, $2, $3, NOW() - ($4 || ' minutes')::interval)`,
      [P(m.project), U(m.from), m.content, String(m.minutesAgo)],
    );
  }

  const notifications: [UserKey, string, string, string | null, string, UserKey, boolean][] = [
    ['daniel', 'NEW_APPLICATION', 'New application to AI Study Platform', 'Timur applied as Frontend Developer.', 'AI Study Platform', 'timur', false],
    ['daniel', 'NEW_APPLICATION', 'New application to AI Study Platform', 'Maya applied as UI/UX Designer.', 'AI Study Platform', 'maya', false],
    ['timur', 'NEW_APPLICATION', 'New application to Open Source Dashboard', 'Bek applied as Backend Developer.', 'Open Source Dashboard', 'bek', false],
    ['timur', 'NEW_INVITATION', 'Maya invited you to Startup Landing', 'Role: Frontend Developer', 'Startup Landing', 'maya', false],
    ['timur', 'APPLICATION_ACCEPTED', 'You joined Football Manager', 'Welcome to the team as Frontend Developer!', 'Football Manager', 'bek', true],
    ['daniel', 'APPLICATION_REJECTED', 'Your application to Startup Landing was declined', null, 'Startup Landing', 'maya', true],
    ['bek', 'APPLICATION_ACCEPTED', 'You joined AI Study Platform', 'Welcome to the team as Backend Developer!', 'AI Study Platform', 'daniel', true],
  ];
  for (const [user, type, title, message, project, actor, isRead] of notifications) {
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, project_id, actor_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [U(user), type, title, message, P(project), U(actor), isRead],
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seed(client);
    await client.query('COMMIT');
    console.log('Seeded 5 users, 5 projects, 13 skills. Log in with timur@teamfinder.dev / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

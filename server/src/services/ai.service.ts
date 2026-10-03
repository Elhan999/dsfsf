import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { query } from '../db/pool';
import { config } from '../utils/config';
import { UserCard, usersService } from './users.service';

const client = config.aiApiKey ? new Anthropic({ apiKey: config.aiApiKey, timeout: 20_000, maxRetries: 1 }) : null;

const RequirementsSchema = z.object({
  skills: z.array(z.string()).describe('Concrete technical or design skills the teammate must have.'),
});

/** Common shorthand → canonical skill name, used by the keyword fallback. */
const ALIASES: Record<string, string> = {
  'react.js': 'react',
  reactjs: 'react',
  ts: 'typescript',
  js: 'javascript',
  node: 'node.js',
  nodejs: 'node.js',
  next: 'next.js',
  nextjs: 'next.js',
  postgres: 'postgresql',
  pg: 'postgresql',
  ux: 'ui/ux',
  ui: 'ui/ux',
  'ux/ui': 'ui/ux',
  github: 'git',
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

async function knownSkillNames(): Promise<string[]> {
  const rows = await query<{ name: string }>('SELECT name FROM skills ORDER BY name');
  return rows.map((r) => r.name);
}

/** Maps free-form names onto existing skills (case-insensitive, alias-aware); keeps unknown ones as-is. */
function canonicalize(names: string[], known: string[]): string[] {
  const byLower = new Map(known.map((k) => [k.toLowerCase(), k]));
  const result = new Map<string, string>();
  for (const raw of names) {
    const lower = raw.trim().toLowerCase();
    if (!lower) continue;
    const canonical = byLower.get(lower) ?? byLower.get(ALIASES[lower] ?? '') ?? raw.trim();
    result.set(canonical.toLowerCase(), canonical);
  }
  return [...result.values()];
}

/**
 * PostgreSQL-backed fallback: find known skill names (and aliases) mentioned in the text.
 * Longer names match first and consume their span, so "Node.js" never also yields "js".
 * Results keep the order in which skills appear in the description.
 */
function extractByKeywords(description: string, known: string[]): string[] {
  let text = description.toLowerCase();
  const found: { name: string; index: number }[] = [];
  const candidates = [...known, ...Object.keys(ALIASES)].sort((a, b) => b.length - a.length);
  for (const name of candidates) {
    const pattern = new RegExp(`(^|[^a-z0-9.])(${escapeRegex(name.toLowerCase())})(?![a-z0-9])`, 'g');
    for (const match of text.matchAll(pattern)) {
      const start = match.index + match[1].length;
      found.push({ name, index: start });
      text = text.slice(0, start) + ' '.repeat(match[2].length) + text.slice(start + match[2].length);
    }
  }
  return canonicalize(found.sort((a, b) => a.index - b.index).map((f) => f.name), known);
}

async function extractWithAI(description: string, known: string[]): Promise<string[]> {
  if (!client) throw new Error('AI is not configured');
  const response = await client.messages.parse({
    model: config.aiModel,
    max_tokens: 1024,
    system:
      'You extract hiring requirements for a team-finder app. Return the concrete skills (languages, ' +
      'frameworks, tools, design disciplines) the described teammate needs. Use names from the known-skills ' +
      'list when one matches, otherwise the common name of the skill. Do not include soft skills or seniority.',
    messages: [
      {
        role: 'user',
        content: `Known skills: ${known.join(', ')}\n\nTeammate description:\n${description}`,
      },
    ],
    output_config: { format: zodOutputFormat(RequirementsSchema), effort: 'low' },
  });
  if (response.stop_reason === 'refusal' || !response.parsed_output) throw new Error('AI returned no result');
  return canonicalize(response.parsed_output.skills, known);
}

export interface AiMatch {
  userId: number;
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  user: UserCard;
}

export const aiService = {
  async match(description: string, viewerId: number, limit: number) {
    const known = await knownSkillNames();
    let requirements: string[] = [];
    let source: 'ai' | 'keywords' = 'keywords';

    if (client) {
      try {
        requirements = await extractWithAI(description, known);
        source = 'ai';
      } catch (error) {
        console.warn('AI extraction failed, falling back to keyword matching:', (error as Error).message);
      }
    }
    if (source === 'keywords') requirements = extractByKeywords(description, known);

    if (requirements.length === 0) return { requirements, matches: [] as AiMatch[], source };

    const rows = await query<{ user_id: number; matched: string[] }>(
      `SELECT us.user_id, array_agg(s.name ORDER BY s.name) AS matched
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE LOWER(s.name) = ANY($1::text[]) AND us.user_id <> $2
       GROUP BY us.user_id
       ORDER BY COUNT(*) DESC, us.user_id
       LIMIT $3`,
      [requirements.map((r) => r.toLowerCase()), viewerId, limit],
    );
    const cards = new Map((await usersService.getCardsByIds(rows.map((r) => r.user_id))).map((c) => [c.id, c]));

    const matches: AiMatch[] = rows.map((row) => {
      const matchedLower = new Set(row.matched.map((m) => m.toLowerCase()));
      return {
        userId: row.user_id,
        matchPercent: Math.round((row.matched.length / requirements.length) * 100),
        matchedSkills: requirements.filter((r) => matchedLower.has(r.toLowerCase())),
        missingSkills: requirements.filter((r) => !matchedLower.has(r.toLowerCase())),
        user: cards.get(row.user_id)!,
      };
    });
    return { requirements, matches, source };
  },
};

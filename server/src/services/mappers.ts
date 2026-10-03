/** Row → API shape helpers. Keep API field names camelCase and never leak password_hash. */

export interface UserSummary {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  jobTitle: string | null;
}

/** SQL fragment building a UserSummary JSON object from a users alias. */
export const userSummaryJson = (alias: string) =>
  `json_build_object('id', ${alias}.id, 'name', ${alias}.name, 'username', ${alias}.username,` +
  ` 'avatar', ${alias}.avatar, 'jobTitle', ${alias}.job_title)`;

/** SQL fragment: JSON array of {id, name} skills for a users alias. */
export const userSkillsJson = (alias: string) =>
  `COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name)
     FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = ${alias}.id), '[]'::json)`;

export const iso = (value: Date | string | null) =>
  value === null ? null : value instanceof Date ? value.toISOString() : value;

/**
 * API contract types. These mirror the backend response shapes exactly —
 * the frontend never sees database column names.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiList<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
}

export interface Skill {
  id: number;
  name: string;
}

export interface UserSummary {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  jobTitle: string | null;
}

export type Experience = 'junior' | 'middle' | 'senior' | 'lead';
export type Availability = 'available' | 'part_time' | 'busy';

export interface UserCard extends UserSummary {
  bio: string | null;
  skills: Skill[];
  projectsCount: number;
  githubUrl: string | null;
  telegramUrl: string | null;
  linkedinUrl: string | null;
  experience: Experience | null;
  availability: Availability;
  isOnline: boolean;
  createdAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  image: string | null;
  status: ProjectStatus;
  isOwner: boolean;
  role: { id: number; name: string } | null;
}

export interface UserProfile extends UserCard {
  email?: string;
  teams: UserTeam[];
}

export type ProjectStatus = 'recruiting' | 'active' | 'completed' | 'closed';

export interface ProjectRole {
  id: number;
  name: string;
  description: string | null;
  requiredCount: number;
  filledCount: number;
  skills: string[];
}

export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string | null;
  status: ProjectStatus;
  progress: number;
  owner: UserSummary;
  roles: ProjectRole[];
  skills: string[];
  membersCount: number;
  teamSize: number;
  openPositions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: UserSummary & { isOnline: boolean };
  role: { id: number; name: string } | null;
  isOwner: boolean;
  joinedAt: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  viewer: {
    isOwner: boolean;
    isMember: boolean;
    application: { id: number; status: ApplicationStatus; roleId: number | null } | null;
    invitation: { id: number; status: InvitationStatus; roleId: number | null } | null;
  } | null;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Application {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  project: { id: number; name: string; image: string | null; ownerId: number };
  role: { id: number; name: string } | null;
  user: UserSummary & { skills: Skill[] };
  createdAt: string;
  updatedAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface Invitation {
  id: number;
  status: InvitationStatus;
  project: { id: number; name: string; image: string | null; description: string };
  role: { id: number; name: string } | null;
  sender: UserSummary;
  receiver: UserSummary;
  createdAt: string;
}

export type NotificationType =
  | 'NEW_APPLICATION'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'NEW_INVITATION'
  | 'NEW_MESSAGE'
  | 'PROJECT_UPDATE';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  project: { id: number; name: string } | null;
  actor: UserSummary | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList extends ApiList<Notification> {
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  projectId: number;
  sender: UserSummary;
  content: string;
  createdAt: string;
  /** Client-only: optimistic message awaiting server echo. */
  pending?: boolean;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
}

export interface AiMatch {
  userId: number;
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  user: UserCard;
}

export interface AiMatchResult {
  requirements: string[];
  matches: AiMatch[];
  source: 'ai' | 'keywords';
}

export interface Recommendations {
  projects: Project[];
  users: UserCard[];
}

// ---- request payloads ----

export interface ProjectFilters {
  search?: string;
  category?: string;
  status?: ProjectStatus;
  skills?: string[];
  role?: string;
  ownerId?: number;
  memberId?: number;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  skills?: string[];
  role?: string;
  experience?: Experience;
  availability?: Availability;
  page?: number;
  limit?: number;
}

export interface RoleInput {
  id?: number;
  name: string;
  description?: string | null;
  requiredCount: number;
  skills: string[];
}

export interface ProjectInput {
  name: string;
  description: string;
  category: string;
  image?: string | null;
  status?: ProjectStatus;
  progress?: number;
  roles: RoleInput[];
}

export interface ProfileInput {
  name?: string;
  username?: string;
  avatar?: string | null;
  bio?: string | null;
  jobTitle?: string | null;
  githubUrl?: string | null;
  telegramUrl?: string | null;
  linkedinUrl?: string | null;
  experience?: Experience | null;
  availability?: Availability;
}

// ---- WebSocket events (server → client) ----

export type ServerEvent =
  | { type: 'connected'; userId: number }
  | { type: 'joined_project'; projectId: number; onlineUserIds: number[] }
  | { type: 'new_message'; data: ChatMessage }
  | { type: 'typing_start' | 'typing_stop'; projectId: number; user: { id: number; name: string } }
  | { type: 'user_online' | 'user_offline'; userId: number }
  | { type: 'new_notification'; data: Notification; unreadCount: number }
  | { type: 'member_left'; projectId: number; userId: number }
  | { type: 'removed_from_project'; projectId: number }
  | { type: 'error'; message: string; event?: string; projectId?: number }
  | { type: 'pong' };

export type ClientEvent =
  | { type: 'join_project' | 'leave_project' | 'typing_start' | 'typing_stop'; projectId: number }
  | { type: 'send_message'; projectId: number; content: string }
  | { type: 'ping' };

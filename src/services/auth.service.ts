import { api, unwrap } from '@/lib/api';
import type { AuthSession, UserProfile } from '@/types/api';
import type { LoginValues, RegisterValues } from '@/schemas/auth';

export const authService = {
  register: (values: RegisterValues) => unwrap<AuthSession>(api.post('/auth/register', values)),
  login: (values: LoginValues) => unwrap<AuthSession>(api.post('/auth/login', values)),
  logout: () => unwrap<{ loggedOut: boolean }>(api.post('/auth/logout')),
  me: () => unwrap<UserProfile>(api.get('/auth/me')),
};

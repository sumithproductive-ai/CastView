export const ADMIN_EMAIL = 'sumithproductive@gmail.com';

export function isAdminUser(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

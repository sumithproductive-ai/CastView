export const ADMIN_EMAIL = 'sumithproductive@gmail.com';

export function isAdminUser(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

/** Admin accounts are never blocked by trial expiry or billing gates. */
export function hasPermanentAccess(email: string | undefined | null): boolean {
  return isAdminUser(email);
}

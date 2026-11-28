'use client';

import { authClient } from '@/lib/auth/auth-client';

/** End the CareConnect session while preserving the browser's PAuS SSO session. */
export async function signOutAndRedirect() {
  const result = await authClient.signOut({ disableRedirect: true });
  if (result.error)
    throw new Error('Logout could not be completed. Please try again.');
  window.location.assign('/login');
}

'use client';

/** Complete local sign-out before navigating through the PAuS logout endpoint. */
export async function signOutAndRedirect() {
  const response = await fetch('/api/auth/paus/sign-out', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok)
    throw new Error('Logout could not be completed. Please try again.');
  const result: { url?: string } = await response.json();
  window.location.assign(result.url || '/login');
}

import { PAUS_PROVIDER_ID, isRegistrationEnabled } from '@/lib/auth/auth-mode';
import { describe, expect, it } from 'vitest';

describe('auth mode', { tags: ['frontend'] }, () => {
  it.each([undefined, '', 'true', 'TRUE', ' true ', 'yes'])(
    'keeps the current login and register page for %s',
    (value) => {
      expect(isRegistrationEnabled(value)).toBe(true);
    },
  );

  it.each(['false', 'FALSE', ' false '])(
    'switches to PAuS-only login for %s',
    (value) => {
      expect(isRegistrationEnabled(value)).toBe(false);
    },
  );

  it('uses a fixed provider ID the backend must match', () => {
    expect(PAUS_PROVIDER_ID).toBe('paus');
  });
});

describe('administrator login helpers', { tags: ['frontend'] }, () => {
  it('signs in with email only when the identifier contains @', async () => {
    const { isEmailIdentifier } = await import('@/app/login/AdminLogin');
    expect(isEmailIdentifier('admin@unpad.ac.id')).toBe(true);
    expect(isEmailIdentifier('admin')).toBe(false);
  });

  it('allows only admins and psychologists', async () => {
    const { STAFF_ROLES } = await import('@/app/login/AdminLogin');
    expect(STAFF_ROLES).toEqual(['ADMIN', 'PSYCHOLOGIST']);
    expect(STAFF_ROLES).not.toContain('USER');
  });
});

/**
 * Login mode for the frontend, controlled by NEXT_PUBLIC_REGISTRATION_ENABLED.
 *
 * - "true" or unset: the current CareConnect login page (email and password
 *   login, registration, forgot password, and Google sign-in).
 * - "false": login only through PAuS (Universitas Padjadjaran SSO), for the
 *   Unpad environment that is restricted to the academic community.
 *
 * NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
 * the value must be present when `npm run build` runs, not only at runtime.
 *
 * This only changes what the UI shows. It does not block the sign-up API;
 * restricting registration must also be enforced in the backend.
 */
export const isRegistrationEnabled = (
  value: string | undefined = process.env.NEXT_PUBLIC_REGISTRATION_ENABLED,
) => value?.trim().toLowerCase() !== 'false';

export const registrationEnabled = isRegistrationEnabled();

/** Provider ID the backend must register for PAuS (Better Auth genericOAuth). */
export const PAUS_PROVIDER_ID = 'paus';

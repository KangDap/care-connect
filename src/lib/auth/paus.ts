import { z } from 'zod';

const stableId = z.union([
  z.string().trim().min(1),
  z.number().int().nonnegative(),
]);
const pausProfile = z
  .object({
    id: stableId.optional(),
    sub: stableId.optional(),
    email: z.email(),
    name: z.string().trim().min(1).optional(),
    nama: z.string().trim().min(1).optional(),
    email_verified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
  })
  .refine((profile) => profile.id !== undefined || profile.sub !== undefined);

export async function getPausUserInfo(accessToken: string) {
  const response = await fetch(
    process.env.PAUS_USER_INFO_URL || 'https://paus.unpad.ac.id/api/user',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) return null;

  const result = pausProfile.safeParse(await response.json().catch(() => null));
  if (!result.success) return null;

  const profile = result.data;
  return {
    id: String(profile.id ?? profile.sub),
    name: profile.name ?? profile.nama ?? profile.email.split('@')[0],
    email: profile.email,
    emailVerified:
      profile.email_verified === true || profile.emailVerified === true,
  };
}

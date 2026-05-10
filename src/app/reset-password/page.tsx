import { Suspense } from 'react';

import { ResetPasswordForm } from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f3ed] flex items-center justify-center text-[#193c1f]">
          Loading reset password page...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

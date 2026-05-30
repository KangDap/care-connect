import { readFileSync } from 'fs';
import nodemailer from 'nodemailer';
import { join } from 'path';

const APP_NAME = 'CareConnect';
const verificationTemplate = readFileSync(
  join(process.cwd(), 'src/lib/email/templates/verification.html'),
  'utf8',
);
const resetPasswordTemplate = readFileSync(
  join(process.cwd(), 'src/lib/email/templates/reset-password.html'),
  'utf8',
);
const emailExistTemplate = readFileSync(
  join(process.cwd(), 'src/lib/email/templates/email-exist.html'),
  'utf8',
);

const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const hasSmtpConfig =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS &&
  !!process.env.SMTP_FROM;

function renderEmailExistTemplate({ userEmail }: { userEmail: string }) {
  return emailExistTemplate
    .replaceAll('{{app_name}}', escapeHtml(APP_NAME))
    .replaceAll('{{user_email}}', escapeHtml(userEmail));
}

export async function sendExistingUserSignUpAttemptEmail(userEmail: string) {
  if (!transporter) {
    console.warn(
      'SMTP is not configured. Existing user sign-up attempt email was not sent automatically.',
    );
    console.info(`Existing user sign-up attempt notification for ${userEmail}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: userEmail,
    subject: 'Someone tried to sign up with your email',
    html: renderEmailExistTemplate({ userEmail }),
  });
}

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

type EmailInput = {
  user: {
    email: string;
    name?: string | null;
  };
  url: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderVerificationTemplate({
  userName,
  verificationUrl,
}: {
  userName: string;
  verificationUrl: string;
}) {
  return verificationTemplate
    .replaceAll('{{app_name}}', escapeHtml(APP_NAME))
    .replaceAll('{{user_name}}', escapeHtml(userName))
    .replaceAll('{{verification_url}}', escapeHtml(verificationUrl));
}

function renderResetPasswordTemplate({
  userName,
  resetPasswordUrl,
}: {
  userName: string;
  resetPasswordUrl: string;
}) {
  return resetPasswordTemplate
    .replaceAll('{{app_name}}', escapeHtml(APP_NAME))
    .replaceAll('{{user_name}}', escapeHtml(userName))
    .replaceAll('{{reset_url}}', escapeHtml(resetPasswordUrl));
}

export async function sendVerificationEmail({ user, url }: EmailInput) {
  if (!transporter) {
    console.warn(
      'SMTP is not configured. Verification email was not sent automatically.',
    );
    console.info(`Verification link for ${user.email}: ${url}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: 'Verify your CareConnect account',
    html: renderVerificationTemplate({
      userName: user.name ?? 'there',
      verificationUrl: url,
    }),
  });
}

export async function sendResetPasswordEmail({ user, url }: EmailInput) {
  if (!transporter) {
    console.warn(
      'SMTP is not configured. Reset Password email was not sent automatically.',
    );
    console.info(`Reset Password link for ${user.email}: ${url}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: 'Reset your CareConnect password',
    html: renderResetPasswordTemplate({
      userName: user.name ?? 'there',
      resetPasswordUrl: url,
    }),
  });
}

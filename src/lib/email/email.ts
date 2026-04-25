import { readFileSync } from 'fs';
import nodemailer from 'nodemailer';
import { join } from 'path';

const APP_NAME = 'CareConnect';
const verificationTemplate = readFileSync(
  join(process.cwd(), 'src/lib/email/templates/verification.html'),
  'utf8',
);

const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const hasSmtpConfig =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS &&
  !!process.env.SMTP_FROM;

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

type VerificationEmailInput = {
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

export async function sendVerificationEmail({
  user,
  url,
}: VerificationEmailInput) {
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
    text: `Hi ${user.name ?? 'there'},\n\nWelcome to ${APP_NAME}! Please verify your email by opening this link:\n${url}\n\nThis link will expire in 1 hour.`,
    html: renderVerificationTemplate({
      userName: user.name ?? 'there',
      verificationUrl: url,
    }),
  });
}

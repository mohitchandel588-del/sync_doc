import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!isSmtpConfigured) {
    throw new Error("SMTP is not configured.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return transporter;
};

export const sendPasswordResetEmail = async (input: {
  to: string;
  name: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}) => {
  const greeting = input.name?.trim() || input.to;
  const plainText = [
    `Hi ${greeting},`,
    "",
    "We received a request to reset your SyncDoc password.",
    `Use this link within ${input.expiresInMinutes} minutes:`,
    input.resetUrl,
    "",
    "If you did not request this reset, you can safely ignore this email."
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f1721;">
      <p>Hi ${greeting},</p>
      <p>We received a request to reset your SyncDoc password.</p>
      <p>
        Use the button below within ${input.expiresInMinutes} minutes:
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${input.resetUrl}"
          style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #127475; color: #ffffff; text-decoration: none; font-weight: 600;"
        >
          Reset Password
        </a>
      </p>
      <p style="word-break: break-word;">${input.resetUrl}</p>
      <p>If you did not request this reset, you can safely ignore this email.</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: "Reset your SyncDoc password",
    text: plainText,
    html
  });
};

import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; html: string; text?: string };

export async function sendMail(mail: Mail) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(`[mail:dev] → ${mail.to} | ${mail.subject}\n${mail.text ?? mail.html}`);
    return { delivered: false, mocked: true };
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.MAIL_FROM ?? "Habitta <no-reply@habitta.test>", ...mail });
  return { delivered: true, mocked: false };
}

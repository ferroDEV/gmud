import nodemailer from "nodemailer";

const profile = process.env.MAIL_PROFILE || "default";
const common = {
  from: `"${process.env.MAIL_FROM_NAME || "Espro"}" <${process.env.MAIL_FROM}>`
};

function getTransport() {
  const host = process.env.MAIL_HOST || "zimbra.esprobrasil.org.br";
  const port = parseInt(process.env.MAIL_PORT || "587", 10);
  const secure = (process.env.MAIL_SECURE || "false") === "true";
  const tls = (process.env.MAIL_TLS || "true") === "true";

  return nodemailer.createTransport({
    host, port, secure,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    tls: { rejectUnauthorized: false, ciphers: "SSLv3" },
  });
}

const transporter = getTransport();

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: { filename: string; path: string }[];
}) {
  return transporter.sendMail({
    ...common,
    ...opts,
  });
}

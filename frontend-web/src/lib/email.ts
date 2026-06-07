/**
 * Email transacional — abstração com mock provider.
 *
 * Hoje: imprime no console (dev) e registra no audit log.
 * Quando integrar Resend:
 *   1. npm i resend
 *   2. set RESEND_API_KEY no .env
 *   3. set EMAIL_FROM no .env (ex: "FinControl <no-reply@seu-dominio.com>")
 *   4. troque a impl de `sendEmail` por:
 *        const { Resend } = await import("resend");
 *        const resend = new Resend(process.env.RESEND_API_KEY);
 *        await resend.emails.send({ from, to, subject, html, text });
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "FinControl <no-reply@fincontrol.com.br>";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  // Mock provider — em dev, imprime o conteúdo essencial.
  // Em prod sem provider configurado, ainda logamos (não falha).
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "console") {
    console.log("─".repeat(60));
    console.log("[email]", "to:", input.to);
    console.log("[email]", "from:", EMAIL_FROM);
    console.log("[email]", "subject:", input.subject);
    console.log("[email]", "text:", input.text.replace(/\s+/g, " ").slice(0, 200));
    console.log("─".repeat(60));
    return;
  }

  // TODO: integrar Resend aqui quando RESEND_API_KEY estiver setado.
  console.warn("[email] provider desconhecido:", provider);
}

// ──────────────────────────────────────────────
// Templates
// ──────────────────────────────────────────────

function baseTemplate(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a1224;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#e6c879,#b8893f);font-size:24px;font-weight:900;color:#1a1208;line-height:48px;text-align:center;">FC</div>
      <div style="margin-top:12px;font-size:18px;font-weight:900;">Fin<span style="color:#d4af6a">Control</span></div>
    </div>
    <div style="background:#131f3b;border:1px solid rgba(212,175,106,0.14);border-radius:18px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">${title}</h1>
      ${bodyHtml}
      <div style="margin-top:28px;text-align:center;">
        <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#e6c879,#b8893f);color:#1a1208;text-decoration:none;font-weight:700;border-radius:12px;">${ctaLabel}</a>
      </div>
      <p style="margin:24px 0 0;font-size:11px;color:#5a6378;text-align:center;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${ctaUrl}" style="color:#d4af6a;word-break:break-all;">${ctaUrl}</a>
      </p>
    </div>
    <p style="margin:24px 0 0;text-align:center;font-size:11px;color:#5a6378;">
      Se você não solicitou este email, ignore com segurança.
    </p>
  </div>
</body>
</html>`;
}

export function passwordResetEmail(name: string, token: string): SendEmailInput {
  const url = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to: "",
    subject: "Redefinir sua senha · FinControl",
    text: `Olá ${name},\n\nVocê solicitou redefinir sua senha. Acesse o link abaixo para criar uma nova senha (válido por 1 hora):\n\n${url}\n\nSe você não solicitou, ignore este email.`,
    html: baseTemplate(
      "Redefinir senha",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Olá <strong>${escapeHtml(name)}</strong>,</p>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#b0b8c9;">Você solicitou redefinir sua senha. Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#e6c879">1 hora</strong>.</p>`,
      "Redefinir senha",
      url,
    ),
  };
}

export function verifyEmailEmail(name: string, token: string): SendEmailInput {
  const url = `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to: "",
    subject: "Confirme seu email · FinControl",
    text: `Olá ${name},\n\nBem-vindo ao FinControl! Para ativar sua conta, confirme seu email acessando o link:\n\n${url}\n\nO link expira em 24 horas.`,
    html: baseTemplate(
      "Confirme seu email",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Olá <strong>${escapeHtml(name)}</strong>,</p>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#b0b8c9;">Falta só um passo para ativar sua conta no FinControl. Clique no botão abaixo para confirmar seu email. O link expira em <strong style="color:#e6c879">24 horas</strong>.</p>`,
      "Confirmar email",
      url,
    ),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

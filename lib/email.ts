import { Resend } from "resend";
import { siteConfig } from "@/config/site";

function fromEmail() {
  return `${siteConfig.emailCopy.fromName} <${siteConfig.emailCopy.fromEmail}>`;
}

function getResend() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") return null;
  return new Resend(process.env.RESEND_API_KEY);
}

async function send(params: { to: string; subject: string; html: string; text?: string }) {
  const resend = getResend();
  if (!resend) {
    console.warn("[Resend] Not configured — skipping email:", params.subject);
    return;
  }
  await resend.emails.send({ from: fromEmail(), ...params });
}

function appUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}

/** Send contractor application confirmation email */
export async function sendContractorApplicationEmail({
  to,
  businessName,
}: {
  to: string;
  businessName: string;
}) {
  const { name: APP_NAME, emoji, supportEmail } = siteConfig.brand;
  await send({
    to,
    subject: siteConfig.emailCopy.contractorApplicationSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
  </div>
  <p style="font-size:16px;">Hi ${businessName},</p>
  <p style="font-size:16px;">Thanks for applying to join the <strong>${APP_NAME}</strong> contractor network! We're reviewing your application and will email you within <strong>24–48 hours</strong> once approved.</p>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">What happens next?</p>
    <ol style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>We review your business info & service area</li>
      <li>You receive an approval email with login details</li>
      <li>Log in to your dashboard and start receiving leads!</li>
    </ol>
  </div>
  <p style="font-size:16px;">Questions? Reply to this email or contact us anytime.</p>
  <p style="font-size:14px;color:#64748b;margin-top:24px;">— The ${APP_NAME} Team</p>
</body>
</html>`,
    text: `Hi ${businessName}, Thanks for applying to ${APP_NAME}! We're reviewing your application and will email you within 24-48 hours once approved. Visit ${appUrl("/contractor/login")} to check your status. — The ${APP_NAME} Team (${supportEmail})`,
  });
}

/** Send notification to approved contractor */
export async function sendContractorApprovedEmail({
  to,
  businessName,
  email,
}: {
  to: string;
  businessName: string;
  email: string;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;
  await send({
    to,
    subject: siteConfig.emailCopy.contractorApprovedSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:18px;font-weight:700;margin:8px 0 0;">You're approved!</p>
  </div>
  <p style="font-size:16px;">Hi ${businessName},</p>
  <p style="font-size:16px;">Great news — your contractor application has been approved!</p>
  <p style="font-size:16px;">You can now log in to your dashboard and start receiving qualified leads from customers in your area.</p>
  <a href="${appUrl("/contractor/login")}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:16px;margin:20px 0;">
    Log In to My Dashboard
  </a>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;font-size:14px;color:#475569;">
    <p style="margin:0 0 8px;font-weight:600;">Your login:</p>
    <p style="margin:0;"><strong>Email:</strong> ${email}</p>
    <p style="margin:4px 0 0;"><strong>Password:</strong> Use the password you set during application</p>
  </div>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:24px;">
    Questions? Email ${siteConfig.brand.supportEmail}
  </p>
</body>
</html>`,
    text: `Hi ${businessName}, Great news — you're approved! Log in at ${appUrl("/contractor/login")} with your email ${email} to start receiving leads. — ${APP_NAME}`,
  });
}

/** Send lead submission confirmation to customer */
export async function sendCustomerLeadConfirmationEmail({
  to,
  customerName,
  leadId,
  serviceTypes,
  address,
}: {
  to: string;
  customerName: string;
  leadId: string;
  serviceTypes: string[];
  address: string;
}) {
  const { name: APP_NAME, emoji } = siteConfig.brand;
  const serviceLabels = serviceTypes
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ");

  await send({
    to,
    subject: siteConfig.emailCopy.customerConfirmationSubject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="font-size:28px;margin:0;">${emoji} ${APP_NAME}</h1>
    <p style="color:${siteConfig.theme.primaryDark};font-size:16px;font-weight:600;margin:8px 0 0;">Request received!</p>
  </div>
  <p style="font-size:16px;">Hi ${customerName},</p>
  <p style="font-size:16px;">We've received your request and contractors in your area have been notified.</p>
  <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;">Your request</p>
    <p style="margin:0;font-size:14px;font-weight:600;">${serviceLabels}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#64748b;">📍 ${address}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#64748b;">Lead ID: ${leadId.slice(0, 8).toUpperCase()}</p>
  </div>
  <p style="font-size:15px;"><strong>Expect quotes within 24 hours.</strong> You can track them here:</p>
  <a href="${appUrl(`/customer/quotes/${leadId}`)}"
     style="display:block;text-align:center;background:${siteConfig.theme.primary};color:white;text-decoration:none;font-weight:700;
            padding:14px 24px;border-radius:12px;font-size:15px;margin:16px 0;">
    View My Quotes →
  </a>
  <p style="font-size:13px;color:#94a3b8;text-align:center;margin-top:16px;">
    No obligation — you're free to accept any quote or none at all.
  </p>
</body>
</html>`,
    text: `Hi ${customerName}, We received your request (${serviceLabels} at ${address}). Contractors will send quotes within 24 hours. Track quotes at: ${appUrl(`/customer/quotes/${leadId}`)} — ${APP_NAME}`,
  });
}

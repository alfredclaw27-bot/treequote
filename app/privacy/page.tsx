import type { Metadata } from "next";
import { LegalPage, LegalHeading } from "@/components/LegalPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.brand.name}`,
  description: `Privacy Policy for ${siteConfig.brand.name}.`,
};

export default function PrivacyPage() {
  const { brand } = siteConfig;

  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 15, 2026">
      <p>
        This Privacy Policy explains how {brand.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
        collects, uses, and shares information when you use our website and services (the &ldquo;Service&rdquo;).
      </p>

      <LegalHeading>Information we collect</LegalHeading>
      <p>
        When you submit a request, we collect the information you provide: your name, contact details (email, phone),
        service address or area, job details, and any photos you upload. For contractors, we collect your business
        details, contact information, service area, and payment-related information processed by our payment provider.
        We also collect basic technical data (such as device and usage information) to operate and improve the Service.
      </p>

      <LegalHeading>How we use information</LegalHeading>
      <p>We use your information to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Match your request with relevant local contractors and deliver quotes.</li>
        <li>Send transactional messages (confirmations, quote notifications, account emails).</li>
        <li>Operate, secure, and improve the Service.</li>
        <li>Comply with legal obligations and enforce our Terms.</li>
      </ul>

      <LegalHeading>How we share information</LegalHeading>
      <p>
        The core purpose of the Service is to connect homeowners with contractors. When you submit a request, your job
        details and photos are shared with matched contractors. Your direct contact information (full name, phone,
        email, and street address) is withheld until a contractor unlocks the lead — at which point it is shared with
        that contractor so they can reach you. We also share data with service providers who help us run the Service
        (for example, hosting, database, email delivery, and payment processing). We do <strong>not</strong> sell your
        personal information to third parties for their own marketing.
      </p>

      <LegalHeading>Data retention</LegalHeading>
      <p>
        We retain your information for as long as needed to provide the Service and for legitimate business or legal
        purposes. You may request deletion of your information as described below.
      </p>

      <LegalHeading>Your choices</LegalHeading>
      <p>
        You may request access to, correction of, or deletion of your personal information by emailing us. You can opt
        out of non-essential emails using the unsubscribe link or by contacting us; we may still send transactional
        messages related to your requests.
      </p>

      <LegalHeading>Security</LegalHeading>
      <p>
        We use reasonable technical and organizational measures to protect your information. No method of transmission
        or storage is completely secure, and we cannot guarantee absolute security.
      </p>

      <LegalHeading>Children&rsquo;s privacy</LegalHeading>
      <p>The Service is intended for adults and is not directed to children under 13.</p>

      <LegalHeading>Changes to this policy</LegalHeading>
      <p>We may update this Privacy Policy from time to time. Material changes will be reflected by the date above.</p>

      <LegalHeading>Contact</LegalHeading>
      <p>
        To exercise your rights or ask a privacy question, email{" "}
        <a href={`mailto:${brand.supportEmail}`} className="text-primary hover:underline">
          {brand.supportEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage, LegalHeading } from "@/components/LegalPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms of Service — ${siteConfig.brand.name}`,
  description: `Terms of Service for ${siteConfig.brand.name}.`,
};

export default function TermsPage() {
  const { brand } = siteConfig;

  return (
    <LegalPage title="Terms of Service" lastUpdated="July 15, 2026">
      <p>
        Welcome to {brand.name} (&ldquo;{brand.name},&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of our website and services (the
        &ldquo;Service&rdquo;). By submitting a request, creating an account, or otherwise using the Service, you agree
        to these Terms. If you do not agree, do not use the Service.
      </p>

      <LegalHeading>What {brand.name} does</LegalHeading>
      <p>
        {brand.name} is a lead-referral platform. Homeowners submit details about a {siteConfig.itemNounSingular}-service
        job, and we connect that request with independent, third-party contractors who may provide quotes. {brand.name}{" "}
        is <strong>not</strong> a {siteConfig.itemNounSingular}-service company. We do not perform the work, employ the
        contractors, or supervise, guarantee, or warrant any work performed.
      </p>

      <LegalHeading>For homeowners</LegalHeading>
      <p>
        Submitting a request is free and places you under no obligation to hire anyone. When you submit a request, you
        authorize us to share the information you provide (including photos and contact details) with matched
        contractors so they can prepare a quote. You are responsible for independently vetting any contractor —
        including licensing, insurance, references, and pricing — before hiring. Any agreement for work is solely
        between you and the contractor.
      </p>

      <LegalHeading>For contractors</LegalHeading>
      <p>
        Contractors access leads through the Service and may pay a per-lead fee (or use provided credits) to unlock a
        homeowner&rsquo;s contact information. Fees paid to unlock a lead are for the referral itself and are not
        contingent on winning the job. You agree to respond to leads promptly and professionally, to represent your
        licensing and insurance accurately, and to comply with all applicable laws. Leads that are duplicates, contain
        invalid contact information, or fall outside your stated service area may be eligible for a credit as described
        at the time of purchase.
      </p>

      <LegalHeading>Payments</LegalHeading>
      <p>
        Contractor fees, credits, and any promotional (&ldquo;founding&rdquo;) terms are presented within the Service.
        Except where a credit or refund is expressly offered, fees are non-refundable. We may change pricing on a
        going-forward basis.
      </p>

      <LegalHeading>Acceptable use</LegalHeading>
      <p>
        You agree not to misuse the Service, including by submitting false information, scraping or harvesting data,
        soliciting users for unrelated purposes, or attempting to circumvent lead fees. We may suspend or terminate
        access for any misuse.
      </p>

      <LegalHeading>Disclaimers &amp; limitation of liability</LegalHeading>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. {brand.name} does not guarantee that
        you will receive quotes, that any quote will be accurate, or that any contractor is qualified or reputable. To
        the maximum extent permitted by law, {brand.name} is not liable for any indirect, incidental, or consequential
        damages, or for the acts or omissions of any homeowner or contractor. Our total liability for any claim relating
        to the Service will not exceed the amount you paid us in the twelve months before the claim.
      </p>

      <LegalHeading>Changes to these Terms</LegalHeading>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes
        acceptance of the revised Terms.
      </p>

      <LegalHeading>Contact</LegalHeading>
      <p>
        Questions about these Terms? Email us at{" "}
        <a href={`mailto:${brand.supportEmail}`} className="text-primary hover:underline">
          {brand.supportEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}

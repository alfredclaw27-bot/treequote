import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Clock, DollarSign, Users } from "lucide-react";
import { siteConfig } from "@/config/site";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; ref?: string; email?: string }>;
}) {
  const params = await searchParams;
  const leadId = params.leadId ?? params.ref;
  const emailProvided = params.email === "1";
  // Demo-mode leads (zero env keys — no real backend, no email provider) are
  // always minted with a "demo-" prefixed id (see app/submit/page.tsx). No
  // email actually goes out in that mode even if one was collected.
  const isNoBackendDemo = !!leadId && leadId.startsWith("demo-");
  const emailWasSent = emailProvided && !isNoBackendDemo;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-primary" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">You&apos;re all set!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your request has been submitted. Contractors in your area have been notified.
          </p>
        </div>

        <div
          className={`rounded-xl p-4 text-sm font-medium ${
            emailWasSent
              ? "bg-primary/10 text-primary-dark dark:text-primary"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          }`}
        >
          {emailWasSent
            ? siteConfig.emailCopy.submittedEmailConfirmationLine
            : siteConfig.emailCopy.submittedNoEmailLine}
        </div>

        {leadId && (
          <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lead ID</p>
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{leadId.slice(0, 8).toUpperCase()}</p>
          </Card>
        )}

        <Card className="p-5 text-left dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Clock className="text-primary mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">What happens next?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Contractors will review your request and submit quotes — usually within <strong>24 hours</strong>.
                You&apos;ll receive notifications when quotes come in.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 text-left dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Users className="text-primary mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Why {siteConfig.brand.name}?</p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-center gap-1.5"><DollarSign size={14} className="text-accent" /> Free for you — no obligation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary" /> Multiple contractors compete</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary" /> Only local, vetted pros</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {leadId && (
            <Link href={`/customer/quotes/${leadId}`}>
              <Button size="lg" className="w-full gap-2">
                View Quotes →
              </Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="secondary" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Questions? Email {siteConfig.brand.supportEmail}
        </p>
      </div>
    </main>
  );
}

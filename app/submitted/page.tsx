import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Clock, DollarSign, TreePine } from "lucide-react";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">You&apos;re all set!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Your tree service request has been submitted. Contractors in your area have been notified.
          </p>
        </div>

        {leadId && (
          <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lead ID</p>
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{leadId.slice(0, 8).toUpperCase()}</p>
          </Card>
        )}

        <Card className="p-5 text-left dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <Clock className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">What happens next?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Our AI is analyzing your photo right now. Contractors will review your lead and submit quotes — usually within <strong>24 hours</strong>.
                You&apos;ll receive notifications when quotes come in.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 text-left dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <TreePine className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Why TreeQuote?</p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-center gap-1.5"><DollarSign size={14} className="text-amber-500" /> Free for you — no obligation</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> AI price estimate included</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Multiple contractors compete</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {leadId && (
            <Link href={`/customer/quotes/${leadId}`}>
              <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700">
                View Quotes for My Tree →
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
          Questions? Email mike@mtkinnovations.com
        </p>
      </div>
    </main>
  );
}
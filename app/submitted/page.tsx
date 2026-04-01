import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock } from "lucide-react";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">You&apos;re all set!</h1>
          <p className="text-gray-600">
            Your tree service request has been submitted. Contractors in your area have been notified.
          </p>
        </div>

        {leadId && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Lead ID</p>
            <p className="font-mono text-sm text-gray-700">{leadId.slice(0, 8).toUpperCase()}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-start gap-3 text-left">
            <Clock className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-gray-900">What happens next?</p>
              <p className="text-sm text-gray-500 mt-1">
                Our AI is analyzing your photo right now. Contractors will review your lead and submit quotes — usually within 24 hours. 
                You&apos;ll receive notifications when quotes come in.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button variant="secondary" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Questions? Email us at mike@mtkinnovations.com
        </p>
      </div>
    </main>
  );
}

"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function ContractorPendingPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
            <Mail size={40} className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Application Received!</h1>
          <p className="text-gray-500 dark:text-gray-400">
            We&apos;ve sent a confirmation email to you. We&apos;ll review your application and email you within <strong>24 hours</strong> once approved.
          </p>
        </div>

        <Card className="p-6 text-left dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> What&apos;s next?
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Check your email</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">We sent application details to your inbox</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">We review your application</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Usually within a few hours, always within 24h</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Approval email arrives</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Then log in and start quoting!</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
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
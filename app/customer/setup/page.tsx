"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Loader2, MailCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/demo";

function CustomerSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const leadId = searchParams.get("leadId");

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Enter the email you used when you submitted your request.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Best-effort: link any lead(s) already submitted under this email
        // to the new account. Doesn't block navigation if it fails.
        fetch("/api/customers/link-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authUserId: data.user.id, email }),
        }).catch(() => {});
      }

      if (data.session) {
        router.push(leadId ? `/customer/quotes/${leadId}` : "/customer/dashboard");
        return;
      }

      // Supabase project requires email confirmation before a session exists.
      setNeedsConfirmation(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">{siteConfig.brand.emoji}</span>
            <span className="font-bold text-xl text-gray-900 dark:text-white">{siteConfig.brand.name}</span>
          </Link>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Sparkles className="mx-auto text-accent mb-3" size={28} />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Demo mode — accounts disabled</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is a demo install with no backend connected, so customer accounts aren&apos;t available. Track your quotes from the link in your confirmation email instead.
            </p>
          </Card>
          {leadId && (
            <Link href={`/customer/quotes/${leadId}`} className="text-primary font-medium hover:underline text-sm">
              ← Back to my quotes
            </Link>
          )}
        </div>
      </main>
    );
  }

  if (needsConfirmation) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <MailCheck className="mx-auto text-primary mb-3" size={28} />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Check your email</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We sent a confirmation link to <strong>{email}</strong>. Confirm your account, then log in below.
            </p>
          </Card>
          <Link href="/customer/login" className="text-primary font-medium hover:underline text-sm">
            Go to login →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">{siteConfig.brand.emoji}</span>
            <span className="font-bold text-xl text-gray-900 dark:text-white">{siteConfig.brand.name}</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Track quotes on all your requests in one place.
          </p>
        </div>

        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              id="password"
              label="Choose a password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/customer/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function CustomerSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">Loading...</div>}>
      <CustomerSetupContent />
    </Suspense>
  );
}

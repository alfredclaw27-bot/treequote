"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Loader2, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/demo";

export default function CustomerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid email or password.");
    } else {
      router.push("/customer/dashboard");
    }
    setLoading(false);
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
              This is a demo install with no backend connected, so customer accounts aren&apos;t available.
            </p>
          </Card>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Login</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Sign in to track your quotes</p>
        </div>

        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleLogin} className="space-y-4">
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
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          New here?{" "}
          <Link href="/submit" className="text-primary font-medium hover:underline">
            Submit a request
          </Link>{" "}
          to get started.
        </p>
      </div>
    </main>
  );
}

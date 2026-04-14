"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Loader2, Rocket } from "lucide-react";

export default function ContractorLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password. Have you applied yet?");
    } else {
      router.push("/contractor/dashboard");
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    // Demo mode: set a mock auth cookie and redirect to dashboard
    // The dashboard will show mock leads so the full flow is testable
    document.cookie = `treequote_demo=contractor; path=/; max-age=86400; samesite=lax`;
    router.push("/contractor/dashboard?demo=true");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🌳</span>
            <span className="font-bold text-xl text-gray-900">TreeQuote</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Contractor Login</h1>
          <p className="text-gray-500 text-sm mt-2">Sign in to view leads and submit quotes</p>
        </div>

        {/* Demo banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium mb-3">🧪 Demo Mode Available</p>
          <p className="text-xs text-amber-700 mb-3">
            No Supabase setup needed — try the full contractor experience with mock data.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={handleDemoLogin}
            disabled={demoLoading}
          >
            <Rocket size={16} />
            {demoLoading ? "Loading..." : "Explore Demo Account"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-50 px-2 text-gray-400">or sign in</span>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
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

        <p className="text-center text-sm text-gray-500">
          New contractor?{" "}
          <Link href="/contractor/apply" className="text-green-600 font-medium hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </main>
  );
}

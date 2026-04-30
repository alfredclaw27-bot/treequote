"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, TreePine, Zap, ShieldCheck, Star, Users, DollarSign, CheckCircle2, Sun, Moon, Camera, Building2, MapPin } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const CONTRACTOR_STEPS = [
  {
    icon: Camera,
    title: "Customer Submits Request",
    desc: "Homeowner snaps a photo of their tree and fills out a quick form — service type, location, contact info.",
  },
  {
    icon: Zap,
    title: "AI Analyzes the Photo",
    desc: "Our AI reads the image — species, height estimate, health, obstacles, access notes. You get detailed intel.",
  },
  {
    icon: Building2,
    title: "You Get Qualified Leads",
    desc: "Leads are matched to your service area and specialties. Pay a small fee to unlock contact info and submit your quote.",
  },
];

const BENEFITS = [
  { icon: DollarSign, title: "Pay Per Lead", desc: "No monthly fees. Only pay when you get real business opportunities." },
  { icon: Zap, title: "AI-Powered Matching", desc: "We analyze every photo so you know exactly what you're quoting before you pay." },
  { icon: MapPin, title: "Local Leads Only", desc: "Set your service area. You'll only get leads from zip codes you serve." },
  { icon: Star, title: "Stand Out to Customers", desc: "Your quote is shown alongside competitors. Win jobs on price, approach, or availability." },
];

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [customerCount] = useState(847);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <span className="font-bold text-xl text-gray-900 dark:text-white">TreeQuote</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} className="text-gray-300" /> : <Moon size={18} className="text-gray-500" />}
          </button>
          <Link href="/contractor/login">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">Contractor Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-6">
          <Zap size={14} /> {customerCount} trees serviced — Quotes in 24h or less
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          Trees need work?<br />
          <span className="text-green-600 dark:text-green-400">Get quotes from local pros</span><br />
          in minutes.
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
          Snap a photo of your tree. Our AI analyzes it. Local contractors compete for your job.
          No obligation. No cost to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/submit">
            <Button size="lg" className="gap-2 text-base bg-green-600 hover:bg-green-700">
              Get My Free Quote <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="secondary" size="lg" className="text-base border-green-600 text-green-700 dark:text-green-300 dark:border-green-400 dark:hover:bg-green-900/20 hover:bg-green-50">
              See How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Image */}
      <section className="px-6 max-w-4xl mx-auto mb-16">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80"
            alt="Beautiful tree in a sunny yard"
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <p className="text-white font-medium">Healthy Oak, ~40ft — spotted by our AI</p>
          </div>
        </div>
      </section>

      {/* Customer CTA Banner */}
      <section className="px-6 max-w-4xl mx-auto mb-16">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How much does tree work cost?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm max-w-lg mx-auto">
            Get a free AI price estimate when you submit your request. Compare quotes from local contractors — no obligation.
          </p>
          <Link href="/submit">
            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
              Get My Free Estimate <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works — For Customers */}
      <section id="how-it-works" className="px-6 py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Takes less than 2 minutes. Free for homeowners.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📸",
                title: "Snap a Photo",
                desc: "Take a clear picture of the tree that needs work. Upload it to our form.",
              },
              {
                step: "2",
                icon: "🤖",
                title: "AI Analyzes It",
                desc: "Our AI reads the photo — tree type, height estimate, health, access notes.",
              },
              {
                step: "3",
                icon: "💰",
                title: "Get Quotes",
                desc: "Local contractors see your lead and submit competitive quotes. You pick the best.",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, label: "No Obligation", desc: "You're never locked in" },
            { icon: Zap, label: "Quotes in 24h", desc: "Fast contractor response" },
            { icon: Users, label: "Local Pros", desc: "Contractors in your area" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                <Icon className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* For Contractors Section */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium mb-4">
              <DollarSign size={14} /> For Contractors
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get qualified leads delivered<br />straight to your dashboard
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Stop chasing inbound marketing. We send you customers who already have trees that need work — with AI analysis so you know what you're quoting.
            </p>
          </div>

          {/* How it works for contractors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {CONTRACTOR_STEPS.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </Card>
            ))}
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing card */}
          <Card className="p-6 mb-8 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Simple, transparent pricing</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pay only for leads you want. No monthly commitment.</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$10</span>
                  <span className="text-gray-500 dark:text-gray-400 text-lg">/ lead</span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Removal leads from $15 · Trimming from $5</p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> AI photo analysis included</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Customer contact info unlocked</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 24h access window to close the job</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> No long-term contracts</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Join contractors already getting leads in your area.</p>
            <Link href="/contractor/apply">
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                Apply to Join — It's Free <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-gray-900 dark:text-white font-medium mb-1">Trusted by homeowners across Georgia</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">847 trees serviced · {customerCount}+ quotes sent · 4.9/5 average rating</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Takes less than 2 minutes. Free for customers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit">
              <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                Get My Free Quote <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/contractor/apply">
              <Button variant="secondary" size="lg" className="border-amber-500 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                Contractor? Join Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 dark:border-gray-700 text-center text-gray-400 dark:text-gray-500 text-sm">
        <p>© 2026 TreeQuote · Contractors <Link href="/contractor/apply" className="text-green-600 dark:text-green-400 hover:underline">apply here</Link></p>
      </footer>
    </main>
  );
}
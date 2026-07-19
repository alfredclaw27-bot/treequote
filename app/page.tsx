"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRight, ShieldCheck, Users, DollarSign, CheckCircle2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { siteConfig } from "@/config/site";

export default function LandingPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { brand, hero, howItWorksCustomer, trustSignals, customerBanner, contractorPitch, socialProof, footer, emotionalBenefits } = siteConfig;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{brand.emoji}</span>
          <span className="font-bold text-xl text-gray-900 dark:text-white">{brand.name}</span>
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary-dark dark:text-primary rounded-full text-sm font-medium mb-6">
          <ArrowRight size={14} /> {hero.badgeText}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          {hero.titleLines.map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
          <span className="text-primary">{hero.highlightLine}</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">{hero.subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/submit">
            <Button size="lg" className="gap-2 text-base">
              {hero.ctaLabel} <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="secondary" size="lg" className="text-base">
              {hero.secondaryCtaLabel}
            </Button>
          </Link>
        </div>
      </section>

      {/* Hero Image */}
      <section className="px-6 max-w-4xl mx-auto mb-16">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={hero.heroImageUrl}
            alt={hero.heroImageCaption}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <p className="text-white font-medium">{hero.heroImageCaption}</p>
          </div>
        </div>
      </section>

      {/* Emotional benefits — why this actually matters, not just what it does */}
      <section className="px-6 max-w-4xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {emotionalBenefits.map(({ icon, title, desc }) => (
            <Card key={title} className="p-6 text-center dark:bg-gray-800 dark:border-gray-700">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Customer CTA Banner */}
      <section className="px-6 max-w-4xl mx-auto mb-16">
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{customerBanner.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-5 text-sm max-w-lg mx-auto">{customerBanner.subtitle}</p>
          <Link href="/submit">
            <Button size="lg" className="gap-2">
              {customerBanner.ctaLabel} <ArrowRight size={18} />
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
            {howItWorksCustomer.map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
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
          {trustSignals.map(({ label, desc }, i) => {
            const Icon = [ShieldCheck, ArrowRight, Users][i % 3];
            return (
              <div key={label} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="text-primary" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            );
          })}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent-dark dark:text-accent rounded-full text-sm font-medium mb-4">
              <DollarSign size={14} /> {contractorPitch.badgeText}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{contractorPitch.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{contractorPitch.subtitle}</p>
          </div>

          {/* Founding contractor callout */}
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5 mb-12 text-center">
            <p className="font-bold text-gray-900 dark:text-white mb-1">{contractorPitch.foundingCalloutTitle}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{contractorPitch.foundingCalloutDesc}</p>
          </div>

          {/* How it works for contractors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {contractorPitch.steps.map(({ icon, title, desc }) => (
              <Card key={title} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 text-2xl">
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </Card>
            ))}
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {contractorPitch.benefits.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                  {icon}
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{contractorPitch.pricingHeadline}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{contractorPitch.pricingSubtitle}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    ${(siteConfig.defaultLeadPriceCents / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-lg">/ lead</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {contractorPitch.pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Join contractors already getting leads in your area.</p>
            <Link href="/contractor/apply">
              <Button size="lg" className="gap-2 bg-accent hover:bg-accent-dark text-white">
                {contractorPitch.ctaLabel} <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-12 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-900 dark:text-white font-medium mb-1">{socialProof.headline}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{socialProof.statLine}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Takes less than 2 minutes. Free for customers.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit">
              <Button size="lg" className="gap-2">
                {hero.ctaLabel} <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/contractor/apply">
              <Button variant="secondary" size="lg" className="border-accent text-accent-dark dark:text-accent hover:bg-accent/10">
                Contractor? Join Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {footer.copyrightName}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footer.links.map((l) => (
              <Link key={l.href} href={l.href} className="text-primary hover:underline">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

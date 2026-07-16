import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `For Contractors — ${siteConfig.brand.name}`,
  description: `How ${siteConfig.brand.name} sends local ${siteConfig.itemNounSingular}-service pros qualified, photo-backed leads. See the details before you pay, only pay for leads you choose, capped exposure per lead.`,
};

export default function ContractorsPage() {
  const { brand, contractorPitch, maxContractorsPerLead, defaultLeadPriceCents } = siteConfig;
  const leadPrice = (defaultLeadPriceCents / 100).toFixed(0);

  // The four promises that separate us from HomeAdvisor / Angi (see GTM.md — contractors are burned by those).
  const promises = [
    {
      icon: "🔍",
      title: "See the full job before you pay",
      desc: "Every lead includes structured job details AND the customer's photos up front. You know exactly what you'd be quoting before spending a cent.",
    },
    {
      icon: "🎟️",
      title: "Only pay for leads you choose",
      desc: "No monthly subscription, no bulk lead dumps. Unlock a lead's contact info only when it's a job you actually want.",
    },
    {
      icon: "🚫",
      title: `Never sold to more than ${maxContractorsPerLead} companies`,
      desc: `A lead goes to at most ${maxContractorsPerLead} contractors — never the 10-way bidding wars that make other platforms a race to the bottom.`,
    },
    {
      icon: "↩️",
      title: "Bogus leads credited back",
      desc: "Wrong number, duplicate, or outside your service area? Tell us and we credit it back — no argument.",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">{brand.emoji}</span>
          <span className="font-bold text-xl text-gray-900 dark:text-white">{brand.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/contractor/login">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300">
              Contractor Login
            </Button>
          </Link>
          <Link href="/contractor/apply">
            <Button size="sm" className="bg-accent hover:bg-accent-dark text-white">
              Apply — Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent-dark dark:text-accent rounded-full text-sm font-medium mb-6">
          {contractorPitch.badgeText}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          {contractorPitch.title}
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{contractorPitch.subtitle}</p>
        <Link href="/contractor/apply">
          <Button size="lg" className="bg-accent hover:bg-accent-dark text-white">
            {contractorPitch.ctaLabel}
          </Button>
        </Link>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
          No card, no contract. Serving the {brand.region} area.
        </p>
      </section>

      {/* Founding callout */}
      <section className="px-6 max-w-3xl mx-auto mb-16">
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 text-center">
          <p className="font-bold text-lg text-gray-900 dark:text-white mb-1">
            {contractorPitch.foundingCalloutTitle}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{contractorPitch.foundingCalloutDesc}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-14 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {contractorPitch.steps.map(({ icon, title, desc }, i) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {icon}
                </div>
                <div className="text-sm font-semibold text-accent-dark dark:text-accent mb-1">Step {i + 1}</div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The four promises — anti-scam positioning */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Burned by HomeAdvisor or Angi? So were we.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            {brand.name} is built to fix what those platforms get wrong. Four promises we put in writing:
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {promises.map(({ icon, title, desc }) => (
            <Card key={title} className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-16 max-w-4xl mx-auto">
        <Card className="p-8 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{contractorPitch.pricingHeadline}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{contractorPitch.pricingSubtitle}</p>
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="text-5xl font-extrabold text-gray-900 dark:text-white">${leadPrice}</span>
            <span className="text-gray-500 dark:text-gray-400 text-lg">/ lead</span>
          </div>
          <ul className="inline-flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 text-left mb-8">
            {contractorPitch.pricingFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-primary">✓</span> {f}
              </li>
            ))}
          </ul>
          <div>
            <Link href="/contractor/apply">
              <Button size="lg" className="bg-accent hover:bg-accent-dark text-white">
                {contractorPitch.ctaLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {siteConfig.footer.copyrightName}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <Link href="/terms" className="text-primary hover:underline">Terms</Link>
            <Link href="/privacy" className="text-primary hover:underline">Privacy</Link>
            <a href={`mailto:${brand.supportEmail}`} className="text-primary hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

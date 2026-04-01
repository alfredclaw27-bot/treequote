import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, TreePine, Zap, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <span className="font-bold text-xl text-gray-900">TreeQuote</span>
        </div>
        <Link href="/contractor/login">
          <Button variant="ghost" size="sm">Contractor Login</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
          <Zap size={14} /> Fast Quotes — Usually Within 24 Hours
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Trees need work?<br />
          <span className="text-green-600">Get quotes from local pros</span><br />
          in minutes.
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
          Snap a photo of your tree. Our AI analyzes it. Local contractors compete for your job.
          No obligation. No hassle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/submit">
            <Button size="lg" className="gap-2 text-base">
              Get My Free Quote <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="secondary" size="lg" className="text-base">
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

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
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
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
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
            { icon: TreePine, label: "Local Pros", desc: "Contractors in your area" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Icon className="text-green-600" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">Takes less than 2 minutes. Free for customers.</p>
          <Link href="/submit">
            <Button size="lg" className="gap-2">
              Get My Free Quote <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© 2026 TreeQuote · Contractors <Link href="/contractor/apply" className="text-green-600 hover:underline">apply here</Link></p>
      </footer>
    </main>
  );
}

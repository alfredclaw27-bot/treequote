"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import type { Lead } from "@/types";

interface QuoteFormProps {
  lead: Lead;
  onSubmit: (data: { amount: number; notes: string; estimatedDate: string }) => Promise<void>;
  priceCents: number;
}

export function QuoteForm({ lead, onSubmit, priceCents }: QuoteFormProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid quote amount.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ amount: parseFloat(amount), notes, estimatedDate });
    } catch (err) {
      setError("Failed to submit quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const serviceLabels = lead.service_types
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ");

  return (
    <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Submit Your Quote</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Customer looking for: <span className="font-medium">{serviceLabels}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quote Amount ($)</label>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Completion Date</label>
          <Input
            type="date"
            value={estimatedDate}
            onChange={(e) => setEstimatedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes to Customer</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your approach, what's included, any questions..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={4}
          />
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-primary-dark dark:text-primary">
            This lead is unlocked (${(priceCents / 100).toFixed(2)} value) — submitting a quote sends it directly to the customer.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Submitting..." : "Submit Quote"}
        </Button>
      </form>
    </Card>
  );
}

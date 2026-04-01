"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Your Quote</h2>
        <p className="text-gray-500 text-sm">
          Customer looking for: <span className="font-medium capitalize">{lead.service_types.join(", ")}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quote Amount ($)</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Completion Date</label>
          <Input
            type="date"
            value={estimatedDate}
            onChange={(e) => setEstimatedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes to Customer</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your approach, what's included, any questions..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={4}
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>${(priceCents / 100).toFixed(2)} lead access fee</strong> will be charged via Stripe when you submit your quote. 
            The customer&apos;s contact info will be revealed for 24 hours.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Submitting..." : `Submit Quote — $${(priceCents / 100).toFixed(2)}`}
        </Button>
      </form>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Lead } from "@/types";
import { MapPin, Clock } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onQuote?: () => void;
  showQuoteButton?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; variant: "green" | "blue" | "gray" }> = {
  new: { label: "New Lead", variant: "green" },
  quoted: { label: "Quoted", variant: "blue" },
  closed: { label: "Closed", variant: "gray" },
};

export function LeadCard({ lead, onQuote, showQuoteButton = false }: LeadCardProps) {
  const badge = STATUS_BADGE[lead.status] ?? STATUS_BADGE.new;
  const serviceLabels = lead.service_types.join(", ");

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        {lead.photo_url && (
          <img
            src={lead.photo_url}
            alt="Tree photo"
            className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="font-semibold text-gray-900 mb-1 capitalize">{serviceLabels}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin size={14} /> {lead.address}
          </p>
          {lead.analysis_data && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {lead.analysis_data.heightEstimate} · {lead.analysis_data.healthStatus}
              {lead.analysis_data.accessNotes && ` · ${lead.analysis_data.accessNotes}`}
            </p>
          )}
          {showQuoteButton && (
            <button
              onClick={onQuote}
              className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Quote This Lead
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Lead } from "@/types";
import { MapPin, Clock, Target, DollarSign } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onQuote?: () => void;
  showQuoteButton?: boolean;
  contractorSpecialties?: string[];
  contractorLocation?: { lat: number; lng: number };
}

const STATUS_BADGE: Record<string, { label: string; variant: "green" | "blue" | "gray" }> = {
  new: { label: "New Lead", variant: "green" },
  quoted: { label: "Quoted", variant: "blue" },
  closed: { label: "Closed", variant: "gray" },
};

// Mock match score based on service type overlap
function calcMatchScore(lead: Lead, specialties?: string[]): number {
  if (!specialties || specialties.length === 0) return Math.floor(Math.random() * 30 + 70);
  const leadTypes = new Set(lead.service_types);
  const matchCount = leadTypes.intersection(new Set(specialties)).size;
  if (matchCount === 0) return 55;
  if (matchCount === leadTypes.size) return 95;
  return 70 + matchCount * 8;
}

// Haversine distance in miles
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LeadCard({ lead, onQuote, showQuoteButton = false, contractorSpecialties, contractorLocation }: LeadCardProps) {
  const badge = STATUS_BADGE[lead.status] ?? STATUS_BADGE.new;
  const serviceLabels = lead.service_types.join(", ");

  // Match score
  const matchScore = calcMatchScore(lead, contractorSpecialties);
  const scoreColor = matchScore >= 85 ? "bg-green-100 text-green-700" : matchScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";

  // AI price estimate
  const hasPriceEstimate = lead.analysis_data && lead.analysis_data.heightEstimate;

  // Distance (mock contractor location - Atlanta area)
  const contractorLat = contractorLocation?.lat ?? 33.749;
  const contractorLng = contractorLocation?.lng ?? -84.388;
  const distance = lead.latitude && lead.longitude
    ? calcDistance(contractorLat, contractorLng, lead.latitude, lead.longitude)
    : null;

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
            <div className="flex items-center gap-2">
              {/* Match Score */}
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}>
                <Target size={12} />
                {matchScore}%
              </span>
            </div>
          </div>

          <p className="font-semibold text-gray-900 mb-1 capitalize">{serviceLabels}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin size={14} /> {lead.address}
          </p>

          {/* Meta row: AI price + distance */}
          <div className="flex items-center gap-3 mb-2">
            {hasPriceEstimate && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <DollarSign size={12} />
                AI: {lead.analysis_data?.heightEstimate}
              </span>
            )}
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                📍 {distance.toFixed(1)} mi
              </span>
            )}
          </div>

          {lead.analysis_data && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {lead.analysis_data.healthStatus} · {lead.analysis_data.species}
              {lead.analysis_data.accessNotes && ` · ${lead.analysis_data.accessNotes}`}
            </p>
          )}

          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Clock size={12} />
            {new Date(lead.created_at).toLocaleDateString()}
          </span>

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
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Lead } from "@/types";
import { MapPin, Clock, Target, Lock, Unlock, User } from "lucide-react";
import { siteConfig } from "@/config/site";
import { maskCustomerName } from "@/lib/masking";

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

// Match score based on service type overlap with contractor specialties
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
  const serviceLabels = lead.service_types
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ");

  const matchScore = calcMatchScore(lead, contractorSpecialties);
  const scoreColor = matchScore >= 85 ? "bg-primary/10 text-primary-dark" : matchScore >= 70 ? "bg-accent/10 text-accent-dark" : "bg-gray-100 text-gray-500";

  const contractorLat = contractorLocation?.lat ?? 33.749;
  const contractorLng = contractorLocation?.lng ?? -84.388;
  const distance = lead.latitude && lead.longitude
    ? calcDistance(contractorLat, contractorLng, lead.latitude, lead.longitude)
    : null;

  const unlocked = lead.unlocked ?? false;

  return (
    <Card className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="flex gap-4 p-4">
        {lead.photo_url && (
          <img
            src={lead.photo_url}
            alt="Job photo"
            className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor}`}>
                <Target size={12} />
                {matchScore}%
              </span>
            </div>
          </div>

          <p className="font-semibold text-gray-900 dark:text-white mb-1">{serviceLabels}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
            <MapPin size={14} /> {lead.address}
          </p>

          {/* Contact preview — masked until unlocked */}
          {lead.customer && (
            <div className="flex items-center gap-1.5 mb-2 text-xs" data-testid={unlocked ? "contact-unlocked" : "contact-masked"}>
              {unlocked ? (
                <>
                  <Unlock size={12} className="text-primary" />
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{lead.customer.name}</span>
                  <span className="text-gray-400">· {lead.customer.phone}</span>
                </>
              ) : (
                <>
                  <Lock size={12} className="text-gray-400" />
                  <span className="text-gray-400 flex items-center gap-1">
                    <User size={12} /> {maskCustomerName(lead.customer.name)} · Contact hidden
                  </span>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-2">
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                📍 {distance.toFixed(1)} mi
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>

          {showQuoteButton && (
            <button
              onClick={onQuote}
              className="mt-1 w-full py-2 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {unlocked ? "View Lead & Quote" : "Unlock This Lead"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

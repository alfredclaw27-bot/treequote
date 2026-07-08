import type { AnalysisData } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";

interface AnalysisDisplayProps {
  data: AnalysisData;
}

const HEALTH_BADGE: Record<string, "green" | "amber" | "red" | "gray"> = {
  healthy: "green",
  stressed: "amber",
  hazardous: "red",
  dead: "gray",
};

export function AnalysisDisplay({ data }: AnalysisDisplayProps) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{siteConfig.brand.emoji} AI Analysis</h3>
        <Badge variant={HEALTH_BADGE[data.healthStatus] ?? "gray"}>
          {data.healthStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnalysisRow label="Species" value={data.species} />
        <AnalysisRow label="Est. Height" value={data.heightEstimate} />
        <AnalysisRow label="Season" value={data.seasonIndicators} />
        <AnalysisRow label="Confidence" value={`${Math.round(data.confidence * 100)}%`} />
      </div>

      {data.visibleDamage && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Visible Damage</p>
          <p className="text-sm text-gray-700">{data.visibleDamage}</p>
        </div>
      )}

      {data.accessNotes && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Access Notes</p>
          <p className="text-sm text-gray-700">{data.accessNotes}</p>
        </div>
      )}
    </Card>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
    </div>
  );
}

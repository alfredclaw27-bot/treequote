import { siteConfig } from "@/config/site";
import type { Lead } from "@/types";

export interface ContractorMatchProfile {
  specialties?: string[];
  bucketReach?: string;
  crewSize?: string;
  equipment?: string[];
}

export interface LeadFitResult {
  score: number;
  reasons: string[];
  cautions: string[];
}

const HEIGHT_LABELS: Record<string, string> = {
  under_20: "Under 20 ft",
  "20_40": "20-40 ft",
  "40_60": "40-60 ft",
  over_60: "Over 60 ft",
};

function getServiceLabels(serviceTypes: string[]): string[] {
  return serviceTypes.map((id) => siteConfig.serviceTypes.find((service) => service.id === id)?.label ?? id);
}

function getBucketReachFeet(bucketReach?: string): number {
  switch (bucketReach) {
    case "under_30ft":
      return 29;
    case "30_50ft":
      return 50;
    case "50_75ft":
      return 75;
    case "over_75ft":
      return 90;
    default:
      return 0;
  }
}

function getRequiredReach(details: Lead["details"]): number {
  const height = typeof details?.height === "string" ? details.height : undefined;
  if (height === "over_60") return 60;
  if (height === "40_60") return 40;
  if (height === "20_40") return 20;
  return 0;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function calculateLeadFit(
  lead: Lead,
  profile?: ContractorMatchProfile,
  distanceMiles?: number | null
): LeadFitResult {
  const reasons: string[] = [];
  const cautions: string[] = [];

  const specialties = profile?.specialties ?? [];
  const matchedServiceTypes = lead.service_types.filter((serviceType) => specialties.includes(serviceType));
  const serviceLabels = getServiceLabels(lead.service_types);

  let score = 58;

  if (specialties.length === 0) {
    score += 6;
    reasons.push(`Lead matches ${serviceLabels.join(", ")} work, but your specialties are not set yet`);
  } else if (matchedServiceTypes.length === lead.service_types.length) {
    score += 24;
    reasons.push(`Strong specialty match for ${serviceLabels.join(" + ")}`);
  } else if (matchedServiceTypes.length > 0) {
    score += 14;
    reasons.push(`Covers ${getServiceLabels(matchedServiceTypes).join(", ")}`);
    cautions.push(`Lead also includes ${getServiceLabels(lead.service_types.filter((serviceType) => !matchedServiceTypes.includes(serviceType))).join(", ")}`);
  } else {
    score -= 14;
    cautions.push(`Lead does not overlap your listed specialties`);
  }

  if (distanceMiles !== null && distanceMiles !== undefined) {
    if (distanceMiles <= 15) {
      score += 10;
      reasons.push(`Close to your crew at ${distanceMiles.toFixed(1)} mi away`);
    } else if (distanceMiles <= 30) {
      score += 5;
      reasons.push(`Within a workable drive at ${distanceMiles.toFixed(1)} mi`);
    } else if (distanceMiles >= 45) {
      score -= 8;
      cautions.push(`${distanceMiles.toFixed(1)} mi away may be a long haul`);
    }
  }

  const height = typeof lead.details?.height === "string" ? lead.details.height : undefined;
  if (height && height !== "not_sure") {
    reasons.push(`Customer reported ${HEIGHT_LABELS[height] ?? height} job size`);
  }

  const equipmentList = profile?.equipment ?? [];
  const access = typeof lead.details?.equipmentAccess === "string" ? lead.details.equipmentAccess : undefined;
  const requiredReach = getRequiredReach(lead.details);
  const bucketReachFeet = getBucketReachFeet(profile?.bucketReach);
  const hasClimbingGear = equipmentList.includes("climbing_gear");
  const hasCrane = equipmentList.includes("crane");
  const hasStumpGrinder = equipmentList.includes("stump_grinder");

  if (requiredReach >= 40) {
    if (bucketReachFeet >= requiredReach || hasClimbingGear || hasCrane) {
      score += 7;
      reasons.push("Your equipment can handle a taller job");
    } else {
      score -= 7;
      cautions.push("Taller job may need a larger reach setup");
    }
  }

  if (lead.service_types.includes("stump")) {
    if (hasStumpGrinder) {
      score += 8;
      reasons.push("You have stump-grinding equipment for this lead");
    } else {
      cautions.push("Stump work usually converts better with a grinder on hand");
    }
  }

  if (access === "wide_open") {
    score += 4;
    reasons.push("Wide-open access should keep the job straightforward");
  } else if (access === "narrow" || access === "behind_fence") {
    score -= 4;
    cautions.push("Tighter access may slow setup and cleanup");
  } else if (access === "crane_required") {
    if (hasCrane) {
      score += 7;
      reasons.push("You list crane/lift access for crane-required work");
    } else {
      score -= 10;
      cautions.push("Customer flagged this as crane-required");
    }
  }

  const siteConditions = Array.isArray(lead.details?.siteConditions) ? lead.details.siteConditions : [];
  if (siteConditions.includes("near_power_lines")) {
    score -= 8;
    cautions.push("Power lines add safety and coordination risk");
  }
  if (siteConditions.includes("near_structure")) {
    cautions.push("Structure proximity may require a more careful removal plan");
  }
  if (siteConditions.includes("near_fence")) {
    cautions.push("Fence access could affect debris haul-out");
  }

  return {
    score: Math.max(35, Math.min(98, score)),
    reasons: unique(reasons).slice(0, 3),
    cautions: unique(cautions).slice(0, 2),
  };
}

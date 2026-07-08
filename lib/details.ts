import { siteConfig } from "@/config/site";
import type { LeadDetails } from "@/types";

/** Human-readable summary of a details object, for review screens & emails */
export function formatDetailsSummary(details: LeadDetails): string[] {
  const lines: string[] = [];
  for (const field of siteConfig.detailFields) {
    const value = details[field.key];
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (field.kind === "select") {
      const opt = field.options.find((o) => o.value === value);
      lines.push(`${field.label}: ${opt?.label ?? value}`);
    } else if (field.kind === "multiselect" || field.kind === "checkbox-group") {
      const selected = Array.isArray(value) ? value : [];
      const labels = selected.map((v) => field.options.find((o) => o.value === v)?.label ?? v);
      if (labels.length) lines.push(`${field.label}: ${labels.join(", ")}`);
    } else if (field.kind === "checkbox") {
      if (value) lines.push(field.label);
    } else {
      lines.push(`${field.label}: ${value}`);
    }
  }
  return lines;
}

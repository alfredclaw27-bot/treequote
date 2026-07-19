/**
 * Shared helpers for the lead "Updates & comments" timeline (tq_lead_events).
 *
 * A customer can edit their submitted job details (never contact info — see
 * app/customer/quotes/[leadId]/page.tsx) and every edit is captured as a
 * field-by-field diff using the same siteConfig.detailFields schema that
 * drives the submit wizard and `formatDetailsSummary` (lib/details.ts), so
 * labels/options stay consistent everywhere without extra config.
 */
import { siteConfig } from "@/config/site";
import type { DetailField } from "@/config/site";
import type { LeadDetails, LeadEventChange } from "@/types";

const EMPTY = "—";

function optionLabel(field: DetailField, value: string): string {
  if (field.kind === "select" || field.kind === "multiselect" || field.kind === "checkbox-group") {
    return field.options.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

/** Renders a single detail field's value the same way `formatDetailsSummary` does, for diffing. */
function fieldValueLabel(field: DetailField, value: unknown): string {
  if (value === undefined || value === null || value === "") return EMPTY;
  if (field.kind === "select") {
    return optionLabel(field, String(value));
  }
  if (field.kind === "multiselect" || field.kind === "checkbox-group") {
    const arr = Array.isArray(value) ? value : [];
    if (arr.length === 0) return EMPTY;
    return arr.map((v) => optionLabel(field, String(v))).join(", ");
  }
  if (field.kind === "checkbox") {
    return value ? "Yes" : EMPTY;
  }
  return String(value);
}

/** Normalized form used purely to detect "did this field actually change". */
function normalizedValue(value: unknown): string {
  if (value === undefined || value === null || value === "" || value === false) return "";
  if (Array.isArray(value)) return [...value].map(String).sort().join(",");
  return String(value);
}

/** Diffs two `details` objects field-by-field using siteConfig.detailFields. */
export function diffLeadDetails(oldDetails: LeadDetails = {}, newDetails: LeadDetails = {}): LeadEventChange[] {
  const changes: LeadEventChange[] = [];
  for (const field of siteConfig.detailFields) {
    const oldRaw = oldDetails[field.key];
    const newRaw = newDetails[field.key];
    if (normalizedValue(oldRaw) === normalizedValue(newRaw)) continue;
    changes.push({
      field: field.key,
      label: field.label,
      old: fieldValueLabel(field, oldRaw),
      new: fieldValueLabel(field, newRaw),
    });
  }
  return changes;
}

/** Diffs the selected service types (order-insensitive). */
export function diffServiceTypes(oldTypes: string[] = [], newTypes: string[] = []): LeadEventChange[] {
  const oldSet = new Set(oldTypes);
  const newSet = new Set(newTypes);
  const same = oldSet.size === newSet.size && [...oldSet].every((v) => newSet.has(v));
  if (same) return [];

  const label = (id: string) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id;
  return [
    {
      field: "service_types",
      label: "Service requested",
      old: [...oldSet].map(label).join(", ") || EMPTY,
      new: [...newSet].map(label).join(", ") || EMPTY,
    },
  ];
}

/** Full diff between a lead's current job details/service types and proposed new values. */
export function buildLeadEditChanges(
  current: { details?: LeadDetails; service_types?: string[] },
  proposed: { details?: LeadDetails; service_types?: string[] }
): LeadEventChange[] {
  return [
    ...diffServiceTypes(current.service_types, proposed.service_types),
    ...diffLeadDetails(current.details, proposed.details),
  ];
}

/** Renders a change as "Label: old → new" for the timeline UI. */
export function formatChangeLine(change: LeadEventChange): string {
  return `${change.label}: ${change.old} → ${change.new}`;
}

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import type { DetailField } from "@/config/site";
import type { LeadDetails } from "@/types";

/**
 * "Edit my request" form for the customer quotes page. Intentionally scoped
 * to job details (siteConfig.detailFields) + service types only — contact
 * info and address are never editable here, so nothing masked pre-unlock on
 * the contractor side (see app/contractor/quote/[leadId]/page.tsx) can be
 * changed through this form. Every save is recorded as a tracked "edit"
 * event with a field-by-field diff (see lib/lead-events.ts).
 */

interface EditRequestFormProps {
  details: LeadDetails;
  serviceTypes: string[];
  onSave: (next: { details: LeadDetails; service_types: string[] }) => Promise<void>;
  onCancel: () => void;
}

function showField(field: DetailField, values: LeadDetails): boolean {
  if (!field.showIf) return true;
  return values[field.showIf.key] === field.showIf.equals;
}

export function EditRequestForm({ details, serviceTypes, onSave, onCancel }: EditRequestFormProps) {
  const [values, setValues] = useState<LeadDetails>({ ...details });
  const [selectedServices, setSelectedServices] = useState<string[]>([...serviceTypes]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setValue = (key: string, value: string | boolean | string[] | undefined) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleMultiValue = (key: string, optionValue: string) => {
    const current = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    setValue(key, current.includes(optionValue) ? current.filter((v) => v !== optionValue) : [...current, optionValue]);
  };

  const handleSubmit = async () => {
    setError("");
    if (selectedServices.length === 0) {
      setError("Select at least one service.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ details: values, service_types: selectedServices });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          Service requested
        </p>
        <div className="flex flex-wrap gap-2">
          {siteConfig.serviceTypes.map((s) => {
            const active = selectedServices.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                data-testid={`edit-service-${s.id}`}
                onClick={() => toggleService(s.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
              >
                {s.icon} {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {siteConfig.detailFields.filter((f) => showField(f, values)).map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
            {field.label}
          </label>

          {field.kind === "select" && (
            <div className={`grid gap-2 grid-cols-${field.columns ?? 2}`}>
              {field.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`edit-option-${field.key}`}
                  onClick={() => setValue(field.key, opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm border text-left transition-colors ${
                    values[field.key] === opt.value
                      ? "bg-primary/10 border-primary text-primary-dark dark:text-primary"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {(field.kind === "multiselect" || field.kind === "checkbox-group") && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => {
                const active = Array.isArray(values[field.key]) && (values[field.key] as string[]).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`edit-option-${field.key}`}
                    onClick={() => toggleMultiValue(field.key, opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? "bg-primary/10 border-primary text-primary-dark dark:text-primary"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {field.kind === "checkbox" && (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => setValue(field.key, e.target.checked)}
              />
              Yes
            </label>
          )}

          {field.kind === "text" && (
            <input
              type="text"
              value={(values[field.key] as string) ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setValue(field.key, e.target.value)}
              className={inputClass}
            />
          )}

          {field.kind === "textarea" && (
            <textarea
              value={(values[field.key] as string) ?? ""}
              placeholder={field.placeholder}
              onChange={(e) => setValue(field.key, e.target.value)}
              rows={3}
              className={inputClass}
            />
          )}

          {field.kind === "number" && (
            <input
              type="number"
              value={(values[field.key] as string) ?? ""}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              onChange={(e) => setValue(field.key, e.target.value)}
              className={inputClass}
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button data-testid="save-edit" className="flex-1" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

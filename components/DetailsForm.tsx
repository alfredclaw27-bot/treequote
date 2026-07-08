"use client";
import { siteConfig, type DetailField } from "@/config/site";
import type { LeadDetails } from "@/types";

interface DetailsFormProps {
  values: LeadDetails;
  onChange: (values: LeadDetails) => void;
}

/**
 * Renders the vertical-agnostic "Details" step of the submit wizard from
 * `siteConfig.detailFields`. Forking to a new vertical (kitchen, bathroom,
 * patio, etc) just means editing that schema — this component never
 * changes.
 */
export function DetailsForm({ values, onChange }: DetailsFormProps) {
  const setField = (key: string, value: string | boolean | string[]) => {
    onChange({ ...values, [key]: value });
  };

  const isVisible = (field: DetailField) => {
    if (!field.showIf) return true;
    return values[field.showIf.key] === field.showIf.equals;
  };

  const gridCols = (cols?: number) => {
    switch (cols) {
      case 4: return "grid-cols-4";
      case 3: return "grid-cols-3";
      default: return "grid-cols-2";
    }
  };

  return (
    <div className="space-y-4">
      {siteConfig.detailFields.filter(isVisible).map((field) => {
        const value = values[field.key];

        if (field.kind === "select") {
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
              <div className={`grid ${gridCols(field.columns)} gap-2`}>
                {field.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setField(field.key, opt.value)}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      value === opt.value
                        ? "border-primary bg-primary/5 text-primary-dark dark:text-primary"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        if (field.kind === "multiselect") {
          const selected = Array.isArray(value) ? value : [];
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => {
                  const isOn = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setField(field.key, isOn ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        isOn
                          ? "bg-primary/10 border-primary/40 text-primary-dark dark:text-primary"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.kind === "checkbox-group") {
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.label}</label>
              <div className="space-y-2">
                {field.options.map((opt) => {
                  const selected = Array.isArray(value) ? value : [];
                  const checked = selected.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setField(field.key, checked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])
                        }
                        className="w-5 h-5 rounded border-gray-300 text-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        if (field.kind === "checkbox") {
          return (
            <label
              key={field.key}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => setField(field.key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">{field.label}</span>
            </label>
          );
        }

        if (field.kind === "number") {
          return (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          );
        }

        // text / textarea
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {!field.required && <span className="text-gray-400 font-normal">(optional)</span>}
            </label>
            {field.kind === "textarea" ? (
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

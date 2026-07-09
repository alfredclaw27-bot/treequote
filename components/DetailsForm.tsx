"use client";
import { useEffect, useRef, useState } from "react";
import { siteConfig, type DetailField } from "@/config/site";
import { Button } from "@/components/ui/Button";
import type { LeadDetails } from "@/types";

interface DetailsFormProps {
  values: LeadDetails;
  onChange: (values: LeadDetails) => void;
  /** Called once the last visible question has been answered/advanced past. */
  onComplete: () => void;
  /** Called when Back is pressed on the first visible question. */
  onBack: () => void;
  /** Reports (index, total) of visible questions so the parent wizard can subdivide its top progress bar. */
  onProgress?: (index: number, total: number) => void;
}

const ADVANCE_DELAY_MS = 300;

function isFieldVisible(field: DetailField, values: LeadDetails): boolean {
  if (!field.showIf) return true;
  return values[field.showIf.key] === field.showIf.equals;
}

function isAnswered(field: DetailField, values: LeadDetails): boolean {
  const v = values[field.key];
  return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
}

function gridCols(cols?: number) {
  switch (cols) {
    case 4: return "grid-cols-4";
    case 3: return "grid-cols-3";
    default: return "grid-cols-2";
  }
}

/**
 * Typeform-style "one question per page" renderer for
 * `siteConfig.detailFields`. Single-select questions auto-advance shortly
 * after an answer is picked; every other kind shows an explicit Next
 * button. `showIf`-hidden questions are skipped automatically. Fully
 * config-driven — forking to a new vertical never touches this file.
 */
export function DetailsForm({ values, onChange, onComplete, onBack, onProgress }: DetailsFormProps) {
  const [subIndex, setSubIndex] = useState(0);
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleFields = siteConfig.detailFields.filter((f) => isFieldVisible(f, values));
  const total = visibleFields.length;
  // If an earlier answer changed while we were further along (e.g. Back +
  // edit hid a later question), clamp back into range rather than crashing.
  const clampedIndex = total === 0 ? 0 : Math.min(subIndex, total - 1);
  const field = visibleFields[clampedIndex];

  useEffect(() => {
    if (subIndex !== clampedIndex) setSubIndex(clampedIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedIndex]);

  useEffect(() => {
    onProgress?.(clampedIndex, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedIndex, total]);

  useEffect(
    () => () => {
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
    },
    []
  );

  const clearPendingAdvance = () => {
    if (advanceTimeout.current) {
      clearTimeout(advanceTimeout.current);
      advanceTimeout.current = null;
    }
  };

  /** Advances from `fromIndex`, recomputing visibility off `nextValues` (which may not have flowed through props yet). */
  const advanceFrom = (nextValues: LeadDetails, fromIndex: number) => {
    const nextVisible = siteConfig.detailFields.filter((f) => isFieldVisible(f, nextValues));
    if (fromIndex + 1 >= nextVisible.length) {
      onComplete();
    } else {
      setSubIndex(fromIndex + 1);
    }
  };

  const setField = (key: string, value: string | boolean | string[], autoAdvance = false) => {
    const nextValues = { ...values, [key]: value };
    onChange(nextValues);
    clearPendingAdvance();
    if (autoAdvance) {
      advanceTimeout.current = setTimeout(() => advanceFrom(nextValues, clampedIndex), ADVANCE_DELAY_MS);
    }
  };

  const goNext = () => {
    clearPendingAdvance();
    advanceFrom(values, clampedIndex);
  };

  const goBack = () => {
    clearPendingAdvance();
    if (clampedIndex === 0) {
      onBack();
    } else {
      setSubIndex(clampedIndex - 1);
    }
  };

  if (!field) return null;

  const value = values[field.key];
  const canAdvance = !field.required || isAnswered(field, values);
  // Required single-select questions rely purely on auto-advance (picking an
  // option always advances). Everything else — including optional selects,
  // which need a way to be skipped — gets an explicit Next button.
  const showsNextButton = field.kind !== "select" || !field.required;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return; // let Enter make a newline
    e.preventDefault();
    if (canAdvance) goNext();
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          Question {clampedIndex + 1} of {total}
        </p>
        <label data-testid="detail-question-label" className="block text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {field.label}{" "}
          {!field.required && <span className="text-gray-400 font-normal text-sm">(optional)</span>}
        </label>
        {field.helpText && <p className="text-sm text-gray-400">{field.helpText}</p>}
      </div>

      {field.kind === "select" && (
        <div className={`grid ${gridCols(field.columns)} gap-2`}>
          {field.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid="detail-option"
              onClick={() => setField(field.key, opt.value, true)}
              className={`py-4 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                value === opt.value
                  ? "border-primary bg-primary/5 text-primary-dark dark:text-primary"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {field.kind === "multiselect" && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const selected = Array.isArray(value) ? value : [];
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
      )}

      {field.kind === "checkbox-group" && (
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
      )}

      {field.kind === "checkbox" && (
        <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => setField(field.key, e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary"
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">{field.label}</span>
        </label>
      )}

      {field.kind === "number" && (
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          autoFocus
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}

      {field.kind === "textarea" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          autoFocus
          rows={4}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}

      {field.kind === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          autoFocus
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={goBack} className="flex-1">
          ← Back
        </Button>
        {showsNextButton && (
          <Button type="button" onClick={goNext} disabled={!canAdvance} className="flex-1">
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

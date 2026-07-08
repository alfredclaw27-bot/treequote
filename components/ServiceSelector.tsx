"use client";
import { siteConfig } from "@/config/site";
import { Check } from "lucide-react";

interface ServiceSelectorProps {
  selected: string[];
  onChange: (services: string[]) => void;
}

export function ServiceSelector({ selected, onChange }: ServiceSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {siteConfig.serviceTypes.map(({ id, label, description, icon }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className={`
              flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
              ${isSelected ? "border-primary bg-primary/5" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"}
            `}
          >
            <span className="text-2xl">{icon}</span>
            <span className="flex-1 min-w-0">
              <span className={`block font-medium ${isSelected ? "text-primary-dark dark:text-primary" : "text-gray-700 dark:text-gray-200"}`}>{label}</span>
              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</span>
            </span>
            {isSelected && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={14} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

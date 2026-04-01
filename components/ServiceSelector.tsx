"use client";
import { SERVICE_TYPES } from "@/types";
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
      {SERVICE_TYPES.map(({ id, label, icon }) => {
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
              ${isSelected ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}
            `}
          >
            <span className="text-2xl">{icon}</span>
            <span className={`font-medium ${isSelected ? "text-green-700" : "text-gray-700"}`}>{label}</span>
            {isSelected && (
              <div className="ml-auto w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

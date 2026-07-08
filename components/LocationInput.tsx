"use client";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { siteConfig } from "@/config/site";

interface LocationInputProps {
  value: string;
  onChange: (address: string) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Job Location
      </label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="123 Main St, Atlanta, GA"
          className="pl-12"
        />
      </div>
      <p className="text-xs text-gray-400">
        Enter the address where the {siteConfig.itemNounSingular} is located. Google Maps integration coming soon.
      </p>
    </div>
  );
}

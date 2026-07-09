"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { siteConfig } from "@/config/site";

interface LocationInputProps {
  value: string;
  /** `coords` is only populated when the address came from a selected suggestion. */
  onChange: (address: string, coords?: { lat: number; lon: number }) => void;
}

interface Suggestion {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

interface PhotonFeature {
  properties: Record<string, unknown>;
  geometry: { coordinates: [number, number] };
}

// Photon returns full US state names — map to USPS abbreviations for a
// compact "street, city, ST zip" display.
const STATE_ABBREVIATIONS: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  "district of columbia": "DC",
};

function formatSuggestionLabel(props: Record<string, unknown>): string {
  const housenumber = props.housenumber as string | undefined;
  const street = (props.street as string | undefined) ?? (props.name as string | undefined);
  const city =
    (props.city as string | undefined) ??
    (props.town as string | undefined) ??
    (props.village as string | undefined) ??
    (props.county as string | undefined);
  const stateRaw = props.state as string | undefined;
  const state = stateRaw ? STATE_ABBREVIATIONS[stateRaw.toLowerCase()] ?? stateRaw : undefined;
  const postcode = props.postcode as string | undefined;

  const streetLine = housenumber && street ? `${housenumber} ${street}` : street;
  const stateZip = [state, postcode].filter(Boolean).join(" ");
  return [streetLine, city, stateZip].filter(Boolean).join(", ");
}

/**
 * Debounced US address autocomplete backed by the free Photon geocoder
 * (no API key required). Degrades gracefully to plain typing if the
 * lookup fails — the field is a normal text input the whole time.
 */
export function LocationInput({ value, onChange }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errored, setErrored] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Set right after a suggestion is picked so the resulting onChange doesn't
  // immediately re-trigger a search against the address we just filled in.
  const skipNextFetch = useRef(false);

  const fetchSuggestions = useCallback((query: string) => {
    abortRef.current?.abort();

    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Photon ${res.status}`))))
      .then((data: { features?: PhotonFeature[] }) => {
        const features = data.features ?? [];
        const usOnly = features.filter((f) => f.properties?.countrycode === "US");
        const mapped: Suggestion[] = usOnly
          .map((f, i) => ({
            id: `${i}-${f.geometry.coordinates.join(",")}`,
            label: formatSuggestionLabel(f.properties),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
          }))
          .filter((s) => s.label.length > 0);

        setSuggestions(mapped);
        setOpen(mapped.length > 0);
        setActiveIndex(-1);
        setErrored(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSuggestions([]);
        setOpen(false);
        setErrored(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectSuggestion = (s: Suggestion) => {
    skipNextFetch.current = true;
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    onChange(s.label, { lat: s.lat, lon: s.lon });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Job Location
      </label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={20} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="123 Main St, Atlanta, GA"
          className="pl-12 pr-10"
          autoComplete="off"
          data-testid="location-input"
        />
        {loading && (
          <Loader2
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            size={16}
            data-testid="location-loading"
          />
        )}
        {open && suggestions.length > 0 && (
          <ul
            data-testid="location-suggestions"
            className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  data-testid="location-suggestion"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                    i === activeIndex
                      ? "bg-primary/10 text-primary-dark dark:text-primary"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {errored
          ? `Enter the address where the ${siteConfig.itemNounSingular} is located.`
          : `Start typing to search, or enter the address where the ${siteConfig.itemNounSingular} is located.`}
      </p>
    </div>
  );
}

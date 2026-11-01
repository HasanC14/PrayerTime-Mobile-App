import type { AppLanguage, LocationSearchResult } from "../types";

const LOCATIONIQ_BASE_URL = "https://us1.locationiq.com/v1";
const LOCATIONIQ_TIMEOUT_MS = 12_000;

type LocationIqAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  city_district?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
};

type LocationIqPlace = {
  place_id?: string | number;
  osm_id?: string | number;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: LocationIqAddress;
};

export class LocationIqError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocationIqError";
  }
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY?.trim();
  if (!key) {
    throw new LocationIqError("Location search is not configured for this build.");
  }
  return key;
}

async function fetchLocationIq<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOCATIONIQ_TIMEOUT_MS);
  const query = new URLSearchParams({
    key,
    format: "json",
    addressdetails: "1",
    normalizeaddress: "1",
    normalizecity: "1",
    "accept-language": "en",
    ...params
  });

  try {
    const response = await fetch(`${LOCATIONIQ_BASE_URL}/${path}?${query.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new LocationIqError("No matching location was found.");
      }
      if (response.status === 429) {
        throw new LocationIqError("Location search is busy. Please wait a moment and try again.");
      }
      throw new LocationIqError("Location names are temporarily unavailable.");
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof LocationIqError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new LocationIqError("Location search took too long. Please try again.");
    }
    throw new LocationIqError("City search is unavailable. Check your connection or use your phone’s location.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function firstNonEmpty(values: unknown[]): string | undefined {
  return values.map(textValue).find(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function formatLocationIqName(place: LocationIqPlace): string {
  const address = place.address;
  const locality = address
    ? firstNonEmpty([
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.city_district,
        address.county,
        address.state
      ])
    : undefined;
  const country = textValue(address?.country);

  if (locality && country && locality.toLocaleLowerCase() !== country.toLocaleLowerCase()) {
    return `${locality}, ${country}`;
  }
  return locality || country || textValue(place.display_name)?.split(",")[0]?.trim() || "Selected location";
}

function coordinate(value: unknown): number {
  return typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : NaN;
}

function countryCode(value: unknown): string | undefined {
  const text = textValue(value);
  return text && /^[a-z]{2}$/i.test(text) ? text.toUpperCase() : undefined;
}

function toSearchResult(value: unknown, index: number): LocationSearchResult | null {
  if (!isRecord(value)) return null;
  const place = value as LocationIqPlace;
  const lat = coordinate(place.lat);
  const lng = coordinate(place.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return null;
  }

  return {
    id: String(place.place_id ?? place.osm_id ?? `${lat}:${lng}:${index}`),
    name: formatLocationIqName(place),
    displayName: textValue(place.display_name) || formatLocationIqName(place),
    lat,
    lng,
    countryCode: countryCode(place.address?.country_code)
  };
}

export async function reverseGeocodeLocation(
  lat: number,
  lng: number
): Promise<{ name: string; countryCode?: string }> {
  const value = await fetchLocationIq<unknown>("reverse", {
    lat: String(lat),
    lon: String(lng),
    zoom: "10"
  });
  if (!isRecord(value)) throw new LocationIqError("Location names are temporarily unavailable.");
  const place = value as LocationIqPlace;
  const name = formatLocationIqName(place);
  if (name === "Selected location") throw new LocationIqError("Location names are temporarily unavailable.");

  return {
    name,
    countryCode: countryCode(place.address?.country_code)
  };
}

export async function searchLocations(query: string, language: AppLanguage = "en"): Promise<LocationSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    throw new LocationIqError("Enter at least two characters to search.");
  }

  const places = await fetchLocationIq<unknown>("search", {
    q: normalizedQuery,
    limit: "6",
    "accept-language": language
  });
  if (!Array.isArray(places)) throw new LocationIqError("Location names are temporarily unavailable.");
  const seen = new Set<string>();
  const results: LocationSearchResult[] = [];

  places.forEach((place, index) => {
    const result = toSearchResult(place, index);
    if (!result) return;
    const coordinateKey = `${result.lat.toFixed(4)}:${result.lng.toFixed(4)}`;
    if (seen.has(coordinateKey)) return;
    seen.add(coordinateKey);
    results.push(result);
  });

  if (results.length === 0) {
    throw new LocationIqError("No matching location was found.");
  }
  return results;
}

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
    throw new LocationIqError("Could not reach the location service. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function firstNonEmpty(values: (string | undefined)[]): string | undefined {
  return values.find((value) => Boolean(value?.trim()))?.trim();
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
  const country = address?.country?.trim();

  if (locality && country && locality.toLocaleLowerCase() !== country.toLocaleLowerCase()) {
    return `${locality}, ${country}`;
  }
  return locality || country || place.display_name?.split(",")[0]?.trim() || "Selected location";
}

function toSearchResult(place: LocationIqPlace, index: number): LocationSearchResult | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return null;
  }

  return {
    id: String(place.place_id ?? place.osm_id ?? `${lat}:${lng}:${index}`),
    name: formatLocationIqName(place),
    displayName: place.display_name?.trim() || formatLocationIqName(place),
    lat,
    lng,
    countryCode: place.address?.country_code?.toUpperCase()
  };
}

export async function reverseGeocodeLocation(
  lat: number,
  lng: number
): Promise<{ name: string; countryCode?: string }> {
  const place = await fetchLocationIq<LocationIqPlace>("reverse", {
    lat: String(lat),
    lon: String(lng),
    zoom: "10"
  });

  return {
    name: formatLocationIqName(place),
    countryCode: place.address?.country_code?.toUpperCase()
  };
}

export async function searchLocations(query: string, language: AppLanguage = "en"): Promise<LocationSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    throw new LocationIqError("Enter at least two characters to search.");
  }

  const places = await fetchLocationIq<LocationIqPlace[]>("search", {
    q: normalizedQuery,
    limit: "6",
    "accept-language": language
  });
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

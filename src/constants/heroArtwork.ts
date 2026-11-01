import type { HeroArtworkId } from "../types";

export const HERO_ARTWORK_OPTIONS = [
  { id: "serenity", name: "Serenity" },
  { id: "skyline", name: "Mosque skyline" },
  { id: "moonlit", name: "Moonlit palms" },
] as const satisfies readonly { id: HeroArtworkId; name: string }[];

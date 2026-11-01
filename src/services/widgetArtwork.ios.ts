import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";
import type { HeroArtworkId } from "../types";

const sources = {
  serenity: require("../../assets/illustrations/prayer-hero-mosque.png"),
  skyline: require("../../assets/illustrations/prayer-hero-skyline.png"),
  moonlit: require("../../assets/illustrations/prayer-hero-moonlit.png")
};
const prepared = new Map<HeroArtworkId, Promise<string | undefined>>();

export function prepareWidgetArtwork(artwork: HeroArtworkId): Promise<string | undefined> {
  const cached = prepared.get(artwork);
  if (cached) return cached;
  const pending = (async () => {
    try {
      if (!widgetsDirectory) return undefined;
      const asset = await Asset.fromModule(sources[artwork]).downloadAsync();
      if (!asset.localUri) return undefined;
      const destination = new File(widgetsDirectory, `prayer-artwork-${artwork}-v1.png`);
      if (!destination.exists) await new File(asset.localUri).copy(destination);
      return destination.uri;
    } catch (error) {
      console.warn("Widget artwork is unavailable; using the theme background", error);
      return undefined;
    }
  })();
  prepared.set(artwork, pending);
  void pending.then(uri => { if (!uri) prepared.delete(artwork); });
  return pending;
}

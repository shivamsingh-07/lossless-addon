import type { Config } from "./config.js";
import { createProvider, createSourceProvider } from "./providers/index.js";
import type { Provider } from "./types.js";

export interface AddonManifest {
  id: string;
  name: string;
  version: string;
}

export interface Addon {
  /** URL prefix: "" for the root addon, "/c" for Monochrome, and so on. */
  prefix: string;
  manifest: AddonManifest;
  provider: Provider;
}

/**
 * The addons this server exposes. Route letters are kept stable so links that
 * were already added in BitChord keep working.
 */
export function buildAddons(config: Config): Addon[] {
  return [
    {
      prefix: "",
      manifest: { id: "app.bitchord.lossless", name: "Hi-Res Audio", version: "1.0.0" },
      provider: createProvider(config),
    },
    {
      prefix: "/c",
      manifest: { id: "app.bitchord.lossless.monochrome", name: "Monochrome Lossless", version: "1.0.0" },
      provider: createSourceProvider(config, "monochrome"),
    },
    {
      prefix: "/f",
      manifest: { id: "app.bitchord.lossless.instable", name: "Instable Lossless", version: "1.0.0" },
      provider: createSourceProvider(config, "instable"),
    },
  ];
}

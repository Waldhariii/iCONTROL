import type { ISurface } from "../../../core/ports/surface.contract";
import Page from "./Page";
import { manifest } from "./manifest";
import { createRoot } from "react-dom/client";

export const SubscriptionsSurface: ISurface = {
  ...manifest,
  render(host: HTMLElement) {
    const root = createRoot(host);
    root.render(Page({}));
  },
};

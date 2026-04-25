// Addendum v1.1 §4. MVP: internal library only. NO external image search.

import { assets, findAsset, findAssetByKeyword } from "@/data/assets";
import type {
  ImageAssetResolveInput,
  ImageAssetResolveOutput,
  VisualAsset,
} from "@/types/asset";

const FALLBACK_BG: VisualAsset = {
  id: "bg_fallback",
  kind: "fallback",
  label: "장면",
  imageUrl: "",
  altForParent: "장면",
  source: "fallback",
  emojiFallback: "✨",
};

const FALLBACK_CHOICE: VisualAsset = {
  id: "choice_fallback",
  kind: "fallback",
  label: "선택지",
  imageUrl: "",
  altForParent: "선택지",
  source: "fallback",
  emojiFallback: "❓",
};

export function pickBackgroundAsset(placeName: string): VisualAsset {
  const direct = findAssetByKeyword(placeName);
  if (direct && direct.kind === "background") return direct;
  // Otherwise, prefer any background asset whose label contains the keyword.
  for (const x of assets) {
    if (x.kind === "background" && placeName && x.label.includes(placeName)) {
      return x;
    }
  }
  return FALLBACK_BG;
}

export function pickChoiceAssets(objects: string[]): VisualAsset[] {
  const out: VisualAsset[] = [];
  const seen = new Set<string>();
  for (const obj of objects) {
    const a = findAssetByKeyword(obj);
    if (a && !seen.has(a.id)) {
      out.push(a);
      seen.add(a.id);
    }
  }
  return out;
}

export function resolveAssetsForStory(
  input: ImageAssetResolveInput,
): ImageAssetResolveOutput {
  const backgroundAsset = pickBackgroundAsset(input.placeName);
  const choiceAssets = pickChoiceAssets(input.extractedObjects);
  const objectAssets = choiceAssets;
  // pad to at least 1 choice asset so callers never see empty array
  if (choiceAssets.length === 0) choiceAssets.push(FALLBACK_CHOICE);
  return { backgroundAsset, choiceAssets, objectAssets };
}

export function getAssetForChoiceId(
  choiceId: string,
  storyChoiceLabels: Record<string, string>,
): VisualAsset | undefined {
  const label = storyChoiceLabels[choiceId];
  if (!label) return undefined;
  return findAssetByKeyword(label);
}

// Convenience for app/page.tsx — given a Scene's choices, build a
// choiceId → VisualAsset map by matching parentLabel keywords.
export function resolveChoiceAssetMap(
  choices: { id: string; parentLabel: string }[],
): Record<string, VisualAsset> {
  const out: Record<string, VisualAsset> = {};
  for (const c of choices) {
    const a = findAssetByKeyword(c.parentLabel);
    if (a) out[c.id] = a;
  }
  return out;
}

// Re-export to make it ergonomic for callers.
export { findAsset } from "@/data/assets";

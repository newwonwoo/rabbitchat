// Addendum v1.1 §4 — Image Asset Auto Resolver.
// MVP에서는 실제 이미지 검색 API를 호출하지 않고 내부 mock library에서만 매칭.

export type VisualAssetKind =
  | "background"
  | "choice"
  | "object"
  | "character"
  | "fallback";

export type VisualAssetSource =
  | "internal"
  | "mock_search"
  | "generated"
  | "fallback";

export type VisualAsset = {
  id: string;
  kind: VisualAssetKind;
  label: string; // 부모/로그용 — 아동 화면에 표시 금지
  imageUrl: string; // MVP: "/assets/<id>.png" placeholder 또는 빈 문자열
  altForParent: string; // 부모/접근성용
  source: VisualAssetSource;
  emojiFallback?: string; // ChildStoryScreen이 이미지가 없을 때 사용
};

export type ImageAssetResolveInput = {
  placeName: string;
  eventText: string;
  extractedObjects: string[];
};

export type ImageAssetResolveOutput = {
  backgroundAsset: VisualAsset;
  choiceAssets: VisualAsset[];
  objectAssets: VisualAsset[];
};

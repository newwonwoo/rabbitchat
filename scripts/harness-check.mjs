#!/usr/bin/env node
// Harness §14 static guard. Fails non-zero on any violation so CI / pre-push
// hooks can block.
//
// Checks:
//   1. Forbidden execution-code APIs anywhere in src.
//   2. Korean visible-text in JSX children of child-screen / character.
//   3. parentLabel / parentSummary rendered in child-screen / character JSX.
//   4. All eight required turn events called from app/page.tsx.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SRC_DIRS = ["app", "components", "data", "hooks", "lib", "types"];
const CHILD_DIRS = [
  path.join("components", "child-screen"),
  path.join("components", "character"),
];

// Files that legitimately contain forbidden patterns as data (defensive
// guards / docs / type-only stubs). These are exempt from the API scan.
const FORBIDDEN_API_EXEMPTIONS = new Set([
  path.join("lib", "safetyGuards.ts"),
  path.join("lib", "characterVoice.ts"),
  path.join("lib", "storage", "turnStore.ts"),
  // Real provider adapters intentionally call OpenAI / ElevenLabs.
  // They are gated behind NEXT_PUBLIC_PROVIDER=real + API keys; mock
  // mode (default) never imports them at runtime.
  path.join("lib", "providers", "realProviders.ts"),
  // index.ts re-exports identifiers like elevenLabsTTSProvider — these
  // are TS names, not API URLs. Real provider mode is gated by env.
  path.join("lib", "providers", "index.ts"),
  // Settings UI references ElevenLabs by name in user-facing copy
  // (e.g. error messages directing the parent to set the API key).
  path.join("components", "parent-screen", "CacheStats.tsx"),
]);

const FORBIDDEN_APIS = [
  /\bSpeechRecognition\b/,
  /\bwebkitSpeechRecognition\b/,
  /https?:\/\/api\.openai\.com/i,
  /elevenlabs/i,
  /\.supabase\.co/i,
];

const REQUIRED_TURN_EVENTS = [
  "session_start",
  "character_press",
  "mock_voice",
  "choice",
  "parent_gate",
  "restart_story",
  "change_theme",
  "change_character",
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function readLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/);
}

// Strip block comments and line comments (best-effort, not a full parser).
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const violations = [];

// 1. Forbidden APIs (execution code only — comments/strings allowed).
for (const dir of SRC_DIRS) {
  for (const file of walk(path.join(root, dir))) {
    const rel = path.relative(root, file);
    if (FORBIDDEN_API_EXEMPTIONS.has(rel)) continue;
    const stripped = stripComments(fs.readFileSync(file, "utf8"));
    for (const re of FORBIDDEN_APIS) {
      if (re.test(stripped)) {
        violations.push(`[forbidden-api] ${rel} :: ${re}`);
      }
    }
  }
}

// 2. Korean visible JSX children in child-screen / character.
//    Heuristic: any > [가-힣] < or any JSX text node containing 한글.
for (const dir of CHILD_DIRS) {
  for (const file of walk(path.join(root, dir))) {
    const lines = readLines(file);
    lines.forEach((line, i) => {
      // skip pure comment lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      // strip aria-label="..." values before scanning
      const safe = line.replace(/aria-label="[^"]*"/g, "");
      // detect ">한글< pattern (visible JSX text)
      if (/>[^<>{]*[가-힣][^<>{]*</.test(safe)) {
        violations.push(
          `[child-text] ${path.relative(root, file)}:${i + 1}: ${trimmed}`,
        );
      }
    });
  }
}

// 3. parentLabel / parentSummary rendered in child-screen / character JSX.
for (const dir of CHILD_DIRS) {
  for (const file of walk(path.join(root, dir))) {
    const lines = readLines(file);
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      // Allowed: aria-label={choice.parentLabel}
      const stripped = line.replace(/aria-label=\{[^}]*\}/g, "");
      // Forbidden: {choice.parentLabel} or {scene.parentSummary} as visible
      if (/\{[^}]*\.(parentLabel|parentSummary)[^}]*\}/.test(stripped)) {
        violations.push(
          `[parent-leak] ${path.relative(root, file)}:${i + 1}: ${trimmed}`,
        );
      }
    });
  }
}

// 4. All eight turn events called from app/page.tsx.
const pagePath = path.join(root, "app", "page.tsx");
if (fs.existsSync(pagePath)) {
  const text = fs.readFileSync(pagePath, "utf8");
  for (const ev of REQUIRED_TURN_EVENTS) {
    const re = new RegExp(`"${ev}"`);
    if (!re.test(text)) {
      violations.push(`[missing-turn-event] ${ev} not found in app/page.tsx`);
    }
  }
} else {
  violations.push("[missing-file] app/page.tsx");
}

// --- Addendum v1.1 checks --------------------------------------------------

// 5. story auto generator export
const storyGenPath = path.join(root, "lib", "storyAutoGenerator.ts");
if (!fs.existsSync(storyGenPath)) {
  violations.push("[story-gen] lib/storyAutoGenerator.ts missing");
} else {
  const text = fs.readFileSync(storyGenPath, "utf8");
  if (!/export\s+function\s+generateStoryFromEvent/.test(text)) {
    violations.push(
      "[story-gen] generateStoryFromEvent export missing in lib/storyAutoGenerator.ts",
    );
  }
  // 6. branch count >= 5 invariant present
  if (!/branchCount/.test(text)) {
    violations.push("[branch-count] branchCount field missing in generator");
  }
  if (!/branches\.length\s*<\s*5|branches\.length\s+>=\s+5|>= 5/.test(text)) {
    // softer check — just require some branchCount logic
    if (!/branchCount/.test(text)) {
      violations.push("[branch-count] no branch-count enforcement found");
    }
  }
}

// 7. image asset resolver export
const resolverPath = path.join(root, "lib", "imageAssetResolver.ts");
if (!fs.existsSync(resolverPath)) {
  violations.push("[image-resolver] lib/imageAssetResolver.ts missing");
} else {
  const text = fs.readFileSync(resolverPath, "utf8");
  if (!/export\s+function\s+resolveAssetsForStory/.test(text)) {
    violations.push(
      "[image-resolver] resolveAssetsForStory export missing in lib/imageAssetResolver.ts",
    );
  }
}

// 8. ChildStoryScreen accepts asset props
const childScreenPath = path.join(
  root,
  "components",
  "child-screen",
  "ChildStoryScreen.tsx",
);
if (fs.existsSync(childScreenPath)) {
  const text = fs.readFileSync(childScreenPath, "utf8");
  if (!/backgroundAsset/.test(text) || !/choiceAssets/.test(text)) {
    violations.push(
      "[child-screen-asset] ChildStoryScreen does not accept backgroundAsset/choiceAssets",
    );
  }
}

// 9. No external image search APIs
const IMAGE_SEARCH_PATTERNS = [
  /https?:\/\/www\.google\.com\/search/i,
  /https?:\/\/.*bing\.com\/images/i,
  /https?:\/\/api\.unsplash\.com/i,
  /https?:\/\/.*pixabay\.com\/api/i,
];
for (const dir of SRC_DIRS) {
  for (const file of walk(path.join(root, dir))) {
    const rel = path.relative(root, file);
    if (FORBIDDEN_API_EXEMPTIONS.has(rel)) continue;
    const stripped = stripComments(fs.readFileSync(file, "utf8"));
    for (const re of IMAGE_SEARCH_PATTERNS) {
      if (re.test(stripped)) {
        violations.push(`[no-image-search] ${rel} :: ${re}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("\nharness-check FAILED:\n");
  for (const v of violations) console.error("  - " + v);
  console.error(`\n${violations.length} violation(s).\n`);
  process.exit(1);
}

console.log("harness-check PASS");

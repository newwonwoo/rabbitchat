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

if (violations.length > 0) {
  console.error("\nharness-check FAILED:\n");
  for (const v of violations) console.error("  - " + v);
  console.error(`\n${violations.length} violation(s).\n`);
  process.exit(1);
}

console.log("harness-check PASS");

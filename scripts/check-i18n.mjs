/**
 * Lists every user-visible string that has no Hindi translation.
 *
 *   npm run check:i18n
 *
 * A missing entry is not a crash — useT falls back to the English — which is
 * exactly why it needs a report: a silent fallback is invisible until someone
 * switches language and finds half a page still in English.
 *
 * TWO kinds of string are checked, because there are two ways to lose one.
 *
 *   1. Call sites.  `t("Save")` — the literal is right there. Exact.
 *
 *   2. Content.     `t(card.title)`, where `title` lives in a data structure.
 *                   The literal never appears next to a `t(`, so a check that
 *                   only reads call sites reports success while the screen
 *                   renders in English. Not hypothetical: 235 strings — every
 *                   project-type card, fixture name, finish, layout option,
 *                   product and spending tier — once passed this check while
 *                   untranslated.
 *
 * Finding the second kind means knowing which literals are content. Scanning
 * every file by shape is too blunt: routes, CSS and SVG data all look like
 * words. Instead, find the files that hand a *variable* to t() and read those
 * files plus the modules they import — that is where content reaching t()
 * lives, and it leaves the rest of the codebase out of the report entirely.
 *
 * Within those files the decision is still by shape, so it is not exact.
 * `IGNORE` is the escape hatch, and every entry in it says why.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const QUOTE = String.fromCharCode(34);
const ESC = String.fromCharCode(92);
const TICK = String.fromCharCode(96);
const ROOT = process.cwd();

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".")) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".ts") || p.endsWith(".tsx")) files.push(p);
  }
};
["app", "components", "lib"].forEach(walk);

const IDENT = /[A-Za-z0-9_$.]/;

/** Reads a double-quoted literal starting at `j`; returns [value, nextIndex]. */
function readString(src, j) {
  let s = "";
  j++;
  while (j < src.length && src[j] !== QUOTE) {
    if (src[j] === ESC) {
      s += src[j + 1];
      j += 2;
      continue;
    }
    s += src[j++];
  }
  return [s, j + 1];
}

/** Every t()/tr() argument, split by whether it was a literal. */
function callsIn(src) {
  const literals = [];
  let dynamic = false;
  for (const call of ["t(", "tr("]) {
    let i = 0;
    while ((i = src.indexOf(call, i)) !== -1) {
      const before = src[i - 1] || " ";
      i += call.length;
      if (IDENT.test(before)) continue;
      let j = i;
      while (j < src.length && (src[j] === " " || src[j] === "\n" || src[j] === "\r")) j++;
      if (src[j] === QUOTE) {
        const [value] = readString(src, j);
        if (value) literals.push(value);
      } else if (IDENT.test(src[j] ?? "")) {
        // t(card.title) — the copy is in a data structure somewhere.
        dynamic = true;
      }
    }
  }
  return { literals, dynamic };
}

/* ── Which files hold content ──────────────────────────────────────────────── */

const source = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/** Repo-local modules a file imports, resolved to real paths. */
function importsOf(file) {
  const out = [];
  const re = /from\s+"([^"]+)"/g;
  let m;
  while ((m = re.exec(source.get(file) ?? "")) !== null) {
    const spec = m[1];
    let base;
    if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
    else if (spec.startsWith(".")) base = resolve(dirname(file), spec);
    else continue; // a package, not ours
    for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
      const rel = candidate.startsWith(ROOT) ? candidate.slice(ROOT.length + 1) : candidate;
      if (source.has(rel)) {
        out.push(rel);
        break;
      }
    }
  }
  return out;
}

/* ── What counts as copy ───────────────────────────────────────────────────── */

/**
 * Exact strings that look like copy but are not. Each is here for a reason;
 * add to this list rather than loosening the heuristic below, so the next
 * person can see what was excluded and why.
 */
const IGNORE = new Set([
  // Trademarks — the dictionary's header explains why these are never translated.
  "Parryware", "Hindware", "Somany", "Jaquar", "CERA", "GROHE", "Kajaria", "KOHLER",
  // KeyboardEvent.key values, compared against — never shown to anyone.
  "Backspace", "Escape", "Enter", "Shift", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "End", "Tab", "Delete",
  "use client", "use server",
  // Thrown as a sentinel and matched by lib/planner/db; never rendered.
  "Not authenticated",
  // The language toggle shows the target language code, by convention.
  "EN",
  // Locale, currency and storage identifiers: addressed to machines.
  "en-IN", "INR", "hi-IN", "en-US",
  // The brand, including the two halves the wordmark is split into.
  "Milagro Universe", "Milagro", "Universe",
  // People's names — the dictionary's header keeps these as written.
  "Priya S.", "Rahul M.", "Ananya K.",
]);

/**
 * Does this read like something a person sees, or like code?
 *
 * Erring toward "code": a false negative is one untranslated string, while a
 * false positive is noise in a report that then gets ignored wholesale.
 */
function looksLikeCopy(s) {
  if (s.length < 2 || s.length > 240) return false;
  if (IGNORE.has(s)) return false;
  if (!/[A-Za-z]/.test(s)) return false;
  if (/[<>{}]|\$\{/.test(s)) return false; // markup, or a mangled fragment

  // Routes, urls, media types, css custom properties, selectors, colours.
  if (/^[/#.@]|^--|^https?:|^data:/.test(s)) return false;
  if (s.includes("var(--")) return false;
  // Asset suffixes and link targets: "-dark", "_blank".
  if (/^[-_]/.test(s)) return false;
  // Package and module specifiers, including scoped and hyphenated ones.
  if (/^[@\w][\w.-]*\/[\w.-]+$/.test(s)) return false;

  // Identifiers, ids and enum members.
  if (/^[a-z][a-zA-Z0-9]*$/.test(s)) return false;
  if (/^[a-z0-9]+([-_.][a-z0-9]+)*$/.test(s)) return false;
  // Dotted paths: storage keys, event names, config lookups.
  if (/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(s)) return false;
  // BCP-47 locales.
  if (/^[a-z]{2}-[A-Z]{2}$/.test(s)) return false;

  // Media queries and next/image sizes.
  if (/^\((?:max|min)-width|^\(prefers-/.test(s)) return false;
  // HTML entities, from escaping the printable plan.
  if (/^&[a-z]+;$/.test(s)) return false;

  // CSS functions and SVG references: linear-gradient(...), url(#id), rotate(...).
  if (/^[a-z][a-z-]*\(/.test(s)) return false;
  // Font stacks and selector lists: lowercase words separated by commas.
  if (/^[a-z][a-z-]*(\s*,\s*[a-z][a-z-]*)+$/.test(s)) return false;
  // Module specifiers and SQL column lists.
  if (/^[a-z][a-z0-9-]*:/.test(s)) return false;
  if (/^[a-z_]+(\s*,\s*[a-z_]+(\s*\([^)]*\))?)+$/.test(s)) return false;
  // Key prefixes used to build ids, e.g. "fixture:" or "pipe-".
  if (/[:\-]$/.test(s)) return false;

  // SVG path data, and numbers with units.
  if (/^[MmZzLlHhVvCcSsQqTtAa][\d\s,.hvlmcqstaz-]{4,}$/i.test(s)) return false;
  if (/^\d/.test(s) && !/[a-z]{3}/i.test(s)) return false;

  // Tailwind class strings.
  if (/(^|\s)(?:[a-z-]+:)*-?(?:mt|mb|ml|mr|mx|my|px|py|pt|pb|pl|pr|p|m|w|h|gap|space|flex|grid|text|bg|border|rounded|ring|shadow|opacity|z|top|left|right|bottom|inset|min|max|col|row|order|scale|translate|rotate|cursor|overflow|truncate|absolute|relative|sticky|fixed|block|inline|hidden|items|justify|self|place|font|leading|tracking|antialiased|pointer|select|touch|animate|transition|duration|delay|ease|motion|sr|group|peer|backdrop|accent|fill|stroke|object|aspect|whitespace|break|list|underline|uppercase|tabular|shrink|grow|basis|divide|outline|resize|scroll|snap|isolate)[-\s/]/.test(s)) {
    return false;
  }

  return true;
}

/** The last non-whitespace character before `i`, for regex-vs-division. */
function prevToken(src, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(src[j])) j--;
  return j >= 0 ? src[j] : "";
}

/**
 * Copy-shaped literals in a file.
 *
 * A tokenizer, not a set of regexes: what has to be skipped — comments,
 * single-quoted strings, template literals — nests, and `printable.ts` nests
 * templates three deep. Regex stripping silently mangled it into fragments of
 * code that then read as English prose and were reported as untranslated.
 */
function contentIn(src) {
  const out = [];
  /** Brace depth inside each open ${ } interpolation. */
  const interp = [];
  let i = 0;

  /** Consume template text from `i` to its end, or to the next interpolation. */
  function runTemplate() {
    while (i < src.length) {
      if (src[i] === ESC) {
        i += 2;
        continue;
      }
      if (src[i] === TICK) {
        i++;
        return;
      }
      if (src[i] === "$" && src[i + 1] === "{") {
        interp.push(0);
        i += 2;
        return;
      }
      i++;
    }
  }

  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    if (c === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (c === "'") {
      i++;
      while (i < src.length && src[i] !== "'") i += src[i] === ESC ? 2 : 1;
      i++;
      continue;
    }
    // Regex literal. Distinguished from division by what precedes it: after a
    // value, / divides; after an operator or an opening bracket, it opens a
    // pattern. `escapeHtml` is full of them, and each one holds a quote.
    if (c === "/" && /[(,=:[!&|?{};+\-*%^~]|\breturn$/.test(prevToken(src, i))) {
      i++;
      let inClass = false;
      while (i < src.length) {
        const r = src[i];
        if (r === ESC) {
          i += 2;
          continue;
        }
        if (r === "[") inClass = true;
        else if (r === "]") inClass = false;
        else if (r === "/" && !inClass) {
          i++;
          break;
        } else if (r === "\n") break;
        i++;
      }
      while (i < src.length && /[a-z]/.test(src[i])) i++; // flags
      continue;
    }
    if (c === TICK) {
      i++;
      runTemplate();
      continue;
    }
    // Inside an interpolation braces nest; only the one that closes it returns
    // us to the template's text.
    if (interp.length && c === "{") {
      interp[interp.length - 1]++;
      i++;
      continue;
    }
    if (interp.length && c === "}") {
      if (interp[interp.length - 1] === 0) {
        interp.pop();
        i++;
        runTemplate();
      } else {
        interp[interp.length - 1]--;
        i++;
      }
      continue;
    }
    if (c === QUOTE) {
      const [value, after] = readString(src, i);
      i = after;
      if (looksLikeCopy(value)) out.push(value);
      continue;
    }
    i++;
  }
  return out;
}

/* ── Report ───────────────────────────────────────────────────────────────── */

const callSites = new Map();
const dynamicFiles = [];

for (const f of files) {
  if (f.includes(join("lib", "i18n"))) continue;
  const { literals, dynamic } = callsIn(source.get(f));
  for (const k of literals) if (!callSites.has(k)) callSites.set(k, f);
  if (dynamic) dynamicFiles.push(f);
}

// A file that hands a variable to t(), plus the modules it imports, is where
// translatable content lives. One hop is enough: content modules hold the data,
// they do not re-export it from somewhere further away.
const contentFiles = new Set();
for (const f of dynamicFiles) {
  contentFiles.add(f);
  for (const dep of importsOf(f)) contentFiles.add(dep);
}

/**
 * Modules whose strings never reach a screen: analytics event names, SQL
 * column lists and thrown server errors the UI replaces with its own copy.
 * Scanning them produces only noise, and noise is how a report gets ignored.
 */
const NOT_UI = [join("lib", "i18n"), join("lib", "analytics"), join("lib", "db")];

const content = new Map();
for (const f of contentFiles) {
  if (NOT_UI.some((d) => f.includes(d))) continue;
  for (const k of contentIn(source.get(f) ?? "")) if (!content.has(k)) content.set(k, f);
}
// Reported once: a string already seen at a call site is not also content.
for (const k of callSites.keys()) content.delete(k);

const have = new Set();
for (const line of readFileSync(join("lib", "i18n", "dictionary.ts"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed.startsWith(QUOTE)) continue;
  const [value] = readString(trimmed, 0);
  if (value) have.add(value);
}

const missingCalls = [...callSites.entries()].filter(([k]) => !have.has(k));
const missingContent = [...content.entries()].filter(([k]) => !have.has(k));
const total = missingCalls.length + missingContent.length;

const show = (label, rows) => {
  if (!rows.length) return;
  console.log(`\n  ${label}`);
  for (const [k, f] of rows) console.log("  " + f + "\n    " + QUOTE + k.slice(0, 88) + QUOTE);
};

console.log("");
console.log("t() call sites with a literal : " + callSites.size);
console.log("files handing t() a variable  : " + dynamicFiles.length);
console.log("content strings they can reach: " + content.size);
console.log("dictionary entries            : " + have.size);
console.log("MISSING translations          : " + total);

show("MISSING — passed to t() directly:", missingCalls);
show("MISSING — content reached through a variable:", missingContent);

if (total) {
  if (missingContent.length) {
    console.log("\n  Content is matched by shape, not by following the code. Anything");
    console.log("  listed there that no one ever sees belongs in IGNORE in this script.");
  }
  console.log("");
  process.exitCode = 1;
} else {
  console.log("\n  every user-visible string has a Hindi entry.\n");
}

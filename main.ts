// Seventeen Syllables of Debugging — make.fun entry.
// Writes one haiku about debugging (5-7-5, at most 200 chars) to
// $MAKEFUN_OUTPUT_DIR/entry.txt (or /output/entry.txt by default).
// The haiku is validated before it is written: three non-empty lines,
// syllable counts 5, 7, 5, and total length within the gate.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HAIKU: string[] = [
  "Three a.m. cursor",
  "blinks on the line that just broke",
  "fix the test instead",
];

const EXPECTED_SYLLABLES = [5, 7, 5];
const MAX_CHARS = 200;

// Words whose spoken syllable count the vowel-group rule gets wrong.
const EXCEPTIONS: Record<string, number> = {
  "a.m.": 2,
  "p.m.": 2,
  "3am": 2,
};

function countWordSyllables(raw: string): number {
  const word = raw.toLowerCase().replace(/^[^a-z0-9.]+|[^a-z0-9.]+$/g, "");
  if (word.length === 0) return 0;
  if (word in EXCEPTIONS) return EXCEPTIONS[word];
  if (/^[0-9]+$/.test(word)) return 1;
  // Split dotted abbreviations ("a.m.") into their spoken letters.
  if (word.includes(".")) {
    return word.split(".").filter(Boolean).length;
  }
  const letters = word.replace(/[^a-z]/g, "");
  if (letters.length === 0) return 0;
  if (letters.length <= 3) return 1;
  // Count vowel groups: each run of a/e/i/o/u/y is one spoken beat.
  const groups = letters.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  // Silent trailing "e" (line, broke, three) does not add a beat.
  if (letters.endsWith("e") && count > 1) count -= 1;
  // "-ed" after t/d is spoken (blended, wanted); otherwise silent.
  if (letters.endsWith("ed") && !/[td]ed$/.test(letters)) count -= 1;
  // Words ending in consonant + "le" gain a beat (bottle, single).
  if (/[^aeiou]le$/.test(letters) && count > 1) count += 1;
  return Math.max(1, count);
}

function countLineSyllables(line: string): number {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countWordSyllables(word), 0);
}

function validate(lines: string[]): void {
  if (lines.length !== 3) {
    throw new Error(`haiku must have 3 lines, got ${lines.length}`);
  }
  for (const [i, line] of lines.entries()) {
    if (line.trim().length === 0) {
      throw new Error(`line ${i + 1} is empty`);
    }
    const got = countLineSyllables(line);
    if (got !== EXPECTED_SYLLABLES[i]) {
      throw new Error(
        `line ${i + 1} has ${got} syllables, expected ${EXPECTED_SYLLABLES[i]}: ${line}`,
      );
    }
  }
  const text = lines.join("\n");
  if (text.length < 1 || text.length > MAX_CHARS) {
    throw new Error(`haiku is ${text.length} chars, gate is 1-${MAX_CHARS}`);
  }
}

function main(): void {
  validate(HAIKU);
  const text = HAIKU.join("\n");
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), text, "utf8");
  const counts = HAIKU.map(countLineSyllables);
  console.log(
    `wrote ${text.length} chars, syllables ${counts.join("-")}, to ${join(outDir, "entry.txt")}`,
  );
}

main();

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { appLanguages } from "@shared/i18n";
import { languageDictionaries } from ".";

const sourceRoot = resolve(process.cwd(), "src");

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });

const collectDirectTranslationKeys = () => {
  const keys = new Set<string>();

  collectSourceFiles(sourceRoot).forEach((filePath) => {
    const source = readFileSync(filePath, "utf8");

    for (const match of source.matchAll(/\bt\(\s*["'`]([^"'`$]+)["'`]/g)) {
      const key = match[1]?.trim();

      if (key && !key.endsWith(".")) {
        keys.add(key);
      }
    }
  });

  return [...keys].sort();
};

const flattenKeys = (value: unknown, prefix = ""): string[] => {
  if (!value || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(child, nextPrefix);
  });
};

describe("language dictionary coverage", () => {
  it("covers every direct translation key rendered by the app", () => {
    const usedKeys = collectDirectTranslationKeys();
    const dictionaryEntries = Object.entries(languageDictionaries);

    expect(dictionaryEntries.map(([language]) => language).sort()).toEqual(
      [...appLanguages].sort()
    );

    dictionaryEntries.forEach(([language, dictionary]) => {
      const availableKeys = new Set(flattenKeys(dictionary));
      const missingKeys = usedKeys.filter((key) => !availableKeys.has(key));

      expect(
        missingKeys,
        `${language} is missing translations for direct t(...) keys from ${relative(
          process.cwd(),
          sourceRoot
        )}`
      ).toEqual([]);
    });
  });
});

import type { ChineseZodiacSign, EyeColor, ZodiacSign } from "./types";

export interface BabyEyeColorChance {
  color: Exclude<EyeColor, "unknown" | "other">;
  probability: number;
}

export interface BabyPreviewResult {
  eyeColorChances: BabyEyeColorChance[];
  sexChances: {
    girl: 50;
    boy: 50;
    note: "biological_sex_not_predictable_from_parent_profile";
  };
  playfulTraits: string[];
  disclaimer: string;
}

const normalizeEyeColor = (value: EyeColor) => {
  if (value === "hazel" || value === "amber") return "brown";
  if (value === "gray") return "blue";
  return value;
};

const chance = (
  color: BabyEyeColorChance["color"],
  probability: number
): BabyEyeColorChance => ({ color, probability });

const sortChances = (items: BabyEyeColorChance[]) =>
  items.sort((a, b) => b.probability - a.probability);

export const estimateBabyEyeColor = (
  motherEyeColor: EyeColor,
  fatherEyeColor: EyeColor
): BabyEyeColorChance[] => {
  const mother = normalizeEyeColor(motherEyeColor);
  const father = normalizeEyeColor(fatherEyeColor);

  if (mother === "unknown" || father === "unknown" || mother === "other" || father === "other") {
    return [];
  }

  const pair = [mother, father].sort().join("+");

  switch (pair) {
    case "blue+blue":
      return sortChances([chance("blue", 99), chance("green", 1)]);
    case "blue+brown":
      return sortChances([chance("brown", 50), chance("blue", 50)]);
    case "blue+green":
      return sortChances([chance("green", 50), chance("blue", 50)]);
    case "brown+brown":
      return sortChances([chance("brown", 75), chance("green", 18), chance("blue", 7)]);
    case "brown+green":
      return sortChances([chance("brown", 50), chance("green", 38), chance("blue", 12)]);
    case "green+green":
      return sortChances([chance("green", 75), chance("blue", 24), chance("brown", 1)]);
    default:
      return [];
  }
};

const westernTraits = new Map<ZodiacSign, string>([
  ["aries", "initiative"],
  ["taurus", "steadiness"],
  ["gemini", "curiosity"],
  ["cancer", "sensitivity"],
  ["leo", "warm confidence"],
  ["virgo", "attention to detail"],
  ["libra", "social balance"],
  ["scorpio", "emotional depth"],
  ["sagittarius", "independence"],
  ["capricorn", "persistence"],
  ["aquarius", "original thinking"],
  ["pisces", "imagination"],
]);

const chineseTraits = new Map<ChineseZodiacSign, string>([
  ["rat", "quick adaptation"],
  ["ox", "patience"],
  ["tiger", "boldness"],
  ["rabbit", "gentleness"],
  ["dragon", "expressive energy"],
  ["snake", "observant calm"],
  ["horse", "movement and drive"],
  ["goat", "soft creativity"],
  ["monkey", "playful problem-solving"],
  ["rooster", "precision"],
  ["dog", "loyalty"],
  ["pig", "kind openness"],
]);

const buildPlayfulBabyTraits = ({
  motherZodiac,
  fatherZodiac,
  motherChineseZodiac,
  fatherChineseZodiac,
}: {
  motherZodiac: ZodiacSign;
  fatherZodiac: ZodiacSign;
  motherChineseZodiac: ChineseZodiacSign;
  fatherChineseZodiac: ChineseZodiacSign;
}) =>
  [
    motherZodiac !== "unknown" ? westernTraits.get(motherZodiac) : null,
    fatherZodiac !== "unknown" ? westernTraits.get(fatherZodiac) : null,
    motherChineseZodiac !== "unknown" ? chineseTraits.get(motherChineseZodiac) : null,
    fatherChineseZodiac !== "unknown" ? chineseTraits.get(fatherChineseZodiac) : null,
  ].filter((item): item is string => Boolean(item));

export const buildBabyPreview = ({
  motherEyeColor,
  fatherEyeColor,
  motherZodiac,
  fatherZodiac,
  motherChineseZodiac,
  fatherChineseZodiac,
}: {
  motherEyeColor: EyeColor;
  fatherEyeColor: EyeColor;
  motherZodiac: ZodiacSign;
  fatherZodiac: ZodiacSign;
  motherChineseZodiac: ChineseZodiacSign;
  fatherChineseZodiac: ChineseZodiacSign;
}): BabyPreviewResult => ({
  eyeColorChances: estimateBabyEyeColor(motherEyeColor, fatherEyeColor),
  sexChances: {
    girl: 50,
    boy: 50,
    note: "biological_sex_not_predictable_from_parent_profile",
  },
  playfulTraits: buildPlayfulBabyTraits({
    motherZodiac,
    fatherZodiac,
    motherChineseZodiac,
    fatherChineseZodiac,
  }),
  disclaimer:
    "Eye color is a simplified educational estimate. Sex cannot be predicted from parent profile data. Zodiac and birth-year traits are playful reflection, not science.",
});

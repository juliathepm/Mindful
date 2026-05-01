import { z } from "zod";

export const CategoryEnum = z.enum([
  "science",
  "history",
  "fact",
  "nature",
  "art",
  "big_question",
  "food",
]);
export type Category = z.infer<typeof CategoryEnum>;

export const CATEGORY_LABEL: Record<Category, string> = {
  science: "Science",
  history: "History",
  fact: "Fact",
  nature: "Nature",
  art: "Art",
  big_question: "Big Question",
  food: "Food",
};

export const CATEGORY_GRADIENT: Record<Category, [string, string]> = {
  science: ["#3b82f6", "#0ea5e9"],
  history: ["#b45309", "#78350f"],
  fact: ["#db2777", "#f97316"],
  nature: ["#16a34a", "#065f46"],
  art: ["#9333ea", "#4c1d95"],
  big_question: ["#111827", "#374151"],
  food: ["#ef4444", "#f59e0b"],
};

const CardImageUrl = z.object({
  kind: z.literal("url"),
  url: z.string().url(),
  alt: z.string().min(1),
  license: z.enum(["CC0", "CC-BY", "PD", "unsplash"]),
  licenseUrl: z.string().url(),
  author: z.string().min(1),
  sourceUrl: z.string().url(),
});
const CardImageGradient = z.object({
  kind: z.literal("gradient"),
  seed: z.string().min(1),
  emoji: z.string().min(1).max(8).optional(),
});
export const CardImageSchema = z.discriminatedUnion("kind", [
  CardImageUrl,
  CardImageGradient,
]);
export type CardImage = z.infer<typeof CardImageSchema>;

const Source = z.object({ label: z.string().min(1), url: z.string().url() });

const CardBaseFields = {
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "id must be a kebab-case slug"),
  title: z.string().min(1).max(140),
  subtitle: z.string().max(140).optional(),
  image: CardImageSchema,
  body: z.string().min(1).max(4000),
  takeaway: z.string().max(280).optional(),
  sources: z.array(Source).max(5).optional(),
  lengthHint: z.enum(["short", "medium", "long"]),
  origin: z.enum(["seed", "generated"]),
};

const BigQuestionCard = z.object({
  ...CardBaseFields,
  category: z.literal("big_question"),
  framings: z.array(z.string().min(1).max(300)).min(2).max(4),
});

const OtherCard = z.object({
  ...CardBaseFields,
  category: z.enum(["science", "history", "fact", "nature", "art", "food"]),
});

export const CardSchema = z.union([BigQuestionCard, OtherCard]);
export type Card = z.infer<typeof CardSchema>;

export const EventSchema = z.object({
  ts: z.number(),
  cardId: z.string(),
  category: CategoryEnum,
  action: z.enum(["seen", "hearted", "unhearted", "advanced"]),
  source: z.enum(["seed", "generated"]),
});
export type CardEvent = z.infer<typeof EventSchema>;

export const SettingsSchema = z.object({
  apiKey: z.string().optional(),
  topupCallsToday: z.number().int().nonnegative().default(0),
  topupDayStamp: z.string().default(""),
  topupTokensToday: z.number().int().nonnegative().default(0),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const BackupSchema = z.object({
  version: z.literal(1),
  events: z.array(EventSchema),
  generated: z.array(CardSchema),
  settings: SettingsSchema,
});
export type Backup = z.infer<typeof BackupSchema>;

export const MAX_GENERATED = 200;
export const SESSION_CARD_LIMIT = 20;
export const SESSION_MS_LIMIT = 8 * 60 * 1000;
export const TOPUP_DAILY_LIMIT = 5;
export const TOPUP_UNSEEN_THRESHOLD = 10;

export const TOP_UP_CATEGORIES: Category[] = [
  "science",
  "history",
  "fact",
  "nature",
  "art",
  "food",
];

export const PREDEFINED_SUBSTANCES = [
  { id: "alcohol", label: "Alcohol", emoji: "🍷" },
  { id: "nicotine", label: "Nicotine", emoji: "🚬" },
  { id: "cannabis", label: "Weed", emoji: "🌿" },
] as const;

export type PredefinedSubstanceId = (typeof PREDEFINED_SUBSTANCES)[number]["id"];

export function getSubstanceLabel(substance: string, customLabel: string | null): string {
  const predefined = PREDEFINED_SUBSTANCES.find((s) => s.id === substance);
  if (predefined) return predefined.label;
  if (customLabel?.trim()) return customLabel.trim();
  return "Custom";
}

export function getSubstanceEmoji(substance: string): string {
  return PREDEFINED_SUBSTANCES.find((s) => s.id === substance)?.emoji ?? "✦";
}

export function isPredefinedSubstance(substance: string): substance is PredefinedSubstanceId {
  return PREDEFINED_SUBSTANCES.some((s) => s.id === substance);
}

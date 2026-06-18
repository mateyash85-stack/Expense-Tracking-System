import { categoriesApi, Category } from "./expenses";

const DEFAULT_CATEGORIES = [
  { name: "Food",          icon: "🍔" },
  { name: "Transport",     icon: "🚗" },
  { name: "Housing",       icon: "🏠" },
  { name: "Shopping",      icon: "🛍️" },
  { name: "Coffee",        icon: "☕" },
  { name: "Utilities",     icon: "⚡" },
  { name: "Health",        icon: "❤️" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Education",     icon: "📚" },
  { name: "Groceries",     icon: "🛒" },
  { name: "Travel",        icon: "✈️" },
  { name: "EMI",           icon: "🏦" },
  { name: "Investment",    icon: "📈" },
  { name: "Income",        icon: "💰" },
];

export async function seedDefaultCategories(): Promise<Category[]> {
  try {
    const existing = await categoriesApi.list();
    if (existing.length > 0) return existing;

    // No categories yet — seed defaults in parallel for speed
    const results = await Promise.allSettled(
      DEFAULT_CATEGORIES.map(cat => categoriesApi.create(cat.name, cat.icon))
    );

    const created: Category[] = results
      .filter((r): r is PromiseFulfilledResult<Category> => r.status === "fulfilled")
      .map(r => r.value);

    // Fetch again to get all (including any that already existed)
    const final = await categoriesApi.list();
    return final.length > 0 ? final : created;
  } catch (err) {
    console.error("Failed to seed categories:", err);
    // Return empty array — modal will show the warning message
    return [];
  }
}

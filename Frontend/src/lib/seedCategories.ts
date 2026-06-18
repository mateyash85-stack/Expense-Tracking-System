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
  const existing = await categoriesApi.list();
  if (existing.length > 0) return existing;

  const created: Category[] = [];
  for (const cat of DEFAULT_CATEGORIES) {
    try {
      const c = await categoriesApi.create(cat.name, cat.icon);
      created.push(c);
    } catch (_) { /* skip duplicates */ }
  }
  return created;
}

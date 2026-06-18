import api from "./api";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  category_id: string;
  category: Category;
  note: string;
  created_at: string;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export interface ExpenseFilters {
  type?: "income" | "expense";
  category_id?: string;
  start_date?: string;   // FastAPI uses snake_case
  end_date?: string;
  page?: number;
  limit?: number;
}

export const expensesApi = {
  list: async (filters: ExpenseFilters = {}) => {
    const { data } = await api.get<{
      expenses: Expense[]; total: number; page: number; limit: number;
    }>("/expenses/", { params: filters });
    return data;
  },

  summary: async (start_date?: string, end_date?: string) => {
    const { data } = await api.get<{ summary: Summary }>("/expenses/summary", {
      params: { start_date, end_date },
    });
    return data.summary;
  },

  create: async (payload: {
    title: string; amount: number; date: string;
    type: "income" | "expense"; category_id: string; note?: string;
  }) => {
    const { data } = await api.post<{ expense: Expense }>("/expenses/", payload);
    return data.expense;
  },

  update: async (id: string, payload: Partial<Omit<Expense, "id" | "category" | "created_at">>) => {
    const { data } = await api.put<{ expense: Expense }>(`/expenses/${id}`, payload);
    return data.expense;
  },

  delete: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },
};

export const categoriesApi = {
  list: async () => {
    const { data } = await api.get<{ categories: Category[] }>("/categories/");
    return data.categories;
  },

  create: async (name: string, icon: string) => {
    const { data } = await api.post<{ category: Category }>("/categories/", { name, icon });
    return data.category;
  },

  delete: async (id: string) => {
    await api.delete(`/categories/${id}`);
  },
};

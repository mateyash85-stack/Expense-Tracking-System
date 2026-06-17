import { supabaseAdmin } from '../config/supabase.js';

// GET /api/expenses
export const getExpenses = async (req, res, next) => {
  try {
    const { type, category_id, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('expenses')
      .select('*, category:categories(id, name, icon)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) query = query.eq('type', type);
    if (category_id) query = query.eq('category_id', category_id);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error, count } = await query;

    if (error) return res.status(400).json({ message: error.message });

    res.json({ expenses: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/summary
export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('expenses')
      .select('type, amount')
      .eq('user_id', req.user.id);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) return res.status(400).json({ message: error.message });

    const summary = data.reduce(
      (acc, row) => {
        acc[row.type] = (acc[row.type] || 0) + Number(row.amount);
        return acc;
      },
      { income: 0, expense: 0 }
    );

    summary.balance = summary.income - summary.expense;
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/:id
export const getExpenseById = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*, category:categories(id, name, icon)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Expense not found' });
    res.json({ expense: data });
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, date, type, category_id, note } = req.body;

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({ title, amount, date, type, category_id, note, user_id: req.user.id })
      .select('*, category:categories(id, name, icon)')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json({ expense: data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res, next) => {
  try {
    const { title, amount, date, type, category_id, note } = req.body;

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update({ title, amount, date, type, category_id, note })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, category:categories(id, name, icon)')
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!data) return res.status(404).json({ message: 'Expense not found' });

    res.json({ expense: data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!data) return res.status(404).json({ message: 'Expense not found' });

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

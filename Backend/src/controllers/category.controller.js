import { supabaseAdmin } from '../config/supabase.js';

// GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, created_at')
      .eq('user_id', req.user.id)
      .order('name');

    if (error) return res.status(400).json({ message: error.message });
    res.json({ categories: data });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ name, icon, user_id: req.user.id })
      .select()
      .single();

    if (error) {
      // Unique violation
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Category already exists' });
      }
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ category: data });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ name, icon })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!data) return res.status(404).json({ message: 'Category not found' });

    res.json({ category: data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!data) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

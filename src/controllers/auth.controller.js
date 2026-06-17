import { supabase, supabaseAdmin } from '../config/supabase.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Use admin client to create user — skips email confirmation in all environments
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true, // auto-confirm so user can log in immediately
    });

    if (error) return res.status(400).json({ message: error.message });

    res.status(201).json({
      message: 'Registration successful.',
      user: { id: data.user?.id, email: data.user?.email, name },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ message: error.message });

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ message: 'Refresh token required' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) return res.status(401).json({ message: error.message });

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res, next) => {
  try {
    // Fetch profile from our public.profiles table
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) return res.status(404).json({ message: 'Profile not found' });

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: profile.name,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

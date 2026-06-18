import { supabase } from '../config/supabase.js';

/**
 * Verifies the Supabase JWT sent as "Authorization: Bearer <token>"
 * and attaches the Supabase user to req.user.
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }

  req.user = data.user;   // { id, email, ... }
  req.token = token;      // passed to per-user Supabase client
  next();
};

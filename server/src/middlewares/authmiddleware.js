import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Let Supabase handle the complex ES256 decryption!
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("🔴 Supabase Auth Rejected:", error?.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    // Success! Attach the user info to the request
    req.user = {
      supabaseId: data.user.id,
      email: data.user.email,
      role: data.user.role 
    };

    next();
  } catch (err) {
    console.error("🔴 Critical Auth Error:", err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
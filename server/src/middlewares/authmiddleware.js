import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve the server environment file relative to this module, not the shell's
// current directory. This supports running the API from either repo root or
// the server directory.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

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
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("🔴 Supabase Auth Rejected:", error?.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

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


export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); 
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.error("ðŸ”´ Optional Auth Rejected:", error?.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    req.user = {
      supabaseId: data.user.id,
      email: data.user.email,
      role: data.user.role 
    };

    next();
  } catch (err) {
    console.error("ðŸ”´ Optional Auth Error:", err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

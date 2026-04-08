import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  // 1. Get the token from the request headers
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Extract the actual token string
  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify the token using your Supabase JWT Secret
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = {
      supabaseId: decoded.sub,
      email: decoded.email,
      role: decoded.role 
    };

    // 4. Move on to the actual route handler
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};
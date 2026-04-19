// server/src/middlewares/adminMiddleware.js
import { db } from "../config/db.js";
import { users } from "../models/schema.js";
import { eq } from "drizzle-orm";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.supabaseId) {
      return res.status(401).json({ error: "Unauthorized: You must be logged in" });
    }

    const userResult = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.supabaseId, req.user.supabaseId));

    if (!userResult.length || userResult[0].role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privileges required" });
    }

    // Attach role just in case down the chain
    req.user.dbRole = userResult[0].role;
    next();
  } catch (error) {
    console.error("Admin Check Error:", error);
    res.status(500).json({ error: "Internal server error validating admin" });
  }
};

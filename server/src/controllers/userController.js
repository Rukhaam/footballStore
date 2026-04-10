import { db } from "../config/db.js";
import { users } from "../models/schema.js";
import { eq, exists } from "drizzle-orm";

const findUserBySupabaseId = async (supabaseId) => {
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, supabaseId));

  return userResult[0] ?? null;
};

export const getUserProfile = async (req, res) => {
  try {
    const userProfile = await findUserBySupabaseId(req.user.supabaseId);

    if (!userProfile) {
      return res.status(404).json({ error: "User not found in database" });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userName, address, pincode, phoneNumber } = req.body;
    const existingUser = await findUserBySupabaseId(req.user.supabaseId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const updatedUser = await db
      .update(users)
      .set({
        userName,
        address,
        pincode,
        phoneNumber,
      })
      .where(eq(users.supabaseId, req.user.supabaseId))
      .returning();

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

export const checkEmailExists = async (req, res) => {
  const { email } = req.params;
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length > 0) {
      res.status(200).json({
        exists: true,
      });
    }
  } catch (error) {
    console.error("Error Checking Email: ", error);
    res.status(500).json({ error: "Error Checking Email" });
  }
};

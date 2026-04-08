import { db } from '../config/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';

export const getUserProfile = async (req, res) => {
  try {
    const userProfile = await db.select()
      .from(users)
      .where(eq(users.supabaseId, req.user.supabaseId));

    if (userProfile.length === 0) {
      return res.status(404).json({ error: "User not found in database" });
    }

    res.status(200).json(userProfile[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userName, address, pincode, phoneNumber } = req.body;
    const updatedUser = await db.update(users)
      .set({ 
        userName, 
        address, 
        pincode, 
        phoneNumber 
      })
      .where(eq(users.supabaseId, req.user.supabaseId))
      .returning(); 

    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};
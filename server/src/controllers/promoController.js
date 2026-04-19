import { db } from '../config/db.js';
import { promoCodes } from '../models/schema.js';
import { eq } from 'drizzle-orm';

export const validatePromoCode = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) return res.status(400).json({ error: "Promo code is required" });

    const upperCode = code.toUpperCase();
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, upperCode));

    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (!promo.isActive) return res.status(400).json({ error: "This promo code is no longer active" });
    
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
      return res.status(400).json({ error: "This promo code has expired" });
    }
    
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ error: "This promo code has reached its usage limit" });
    }

    if (promo.discountType === 'fixed') {
      if (subtotal && parseFloat(subtotal) <= parseFloat(promo.discountValue)) {
        return res.status(400).json({ 
          error: `Cart subtotal must be greater than ₹${parseFloat(promo.discountValue)} to use this code.` 
        });
      }
    }

    res.status(200).json({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: parseFloat(promo.discountValue)
    });

  } catch (error) {
    console.error("Promo Code Error:", error);
    res.status(500).json({ error: "Failed to validate promo code" });
  }
};

export const getAllPromoCodes = async (req, res) => {
  try {
    const promos = await db.select().from(promoCodes);
    res.status(200).json(promos);
  } catch (error) {
    console.error("Failed to fetch promo codes:", error);
    res.status(500).json({ error: "Failed to fetch promo codes" });
  }
};

export const createPromoCode = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, expiresAt, isActive } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const upperCode = code.toUpperCase();

    const [newPromo] = await db.insert(promoCodes).values({
      code: upperCode,
      discountType,
      discountValue,
      maxUses: maxUses || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true
    }).returning();

    res.status(201).json(newPromo);
  } catch (error) {
    console.error("Failed to create promo code:", error);
    if (error.code === '23505') { // unique violation in Postgres
      return res.status(400).json({ error: "Promo code already exists" });
    }
    res.status(500).json({ error: "Failed to create promo code" });
  }
};

export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedPromo] = await db.delete(promoCodes).where(eq(promoCodes.id, parseInt(id))).returning();

    if (!deletedPromo) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    res.status(200).json({ message: "Promo code deleted successfully", deletedPromo });
  } catch (error) {
    console.error("Failed to delete promo code:", error);
    res.status(500).json({ error: "Failed to delete promo code" });
  }
};
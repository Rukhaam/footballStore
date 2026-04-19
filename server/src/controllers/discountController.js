import { db } from '../config/db.js';
import { products } from '../models/schema.js';
import { eq, isNull, isNotNull, sql } from 'drizzle-orm';

export const applyCatalogDiscount = async (req, res) => {
  try {
    const { targetType, targetId, discountPercentage } = req.body;

    if (!discountPercentage || discountPercentage < 0 || discountPercentage > 100) {
      return res.status(400).json({ error: "Invalid discount percentage" });
    }

    const multiplier = (100 - discountPercentage) / 100;

    // STEP 1: Pure Drizzle way to backup the original price
    await db.update(products)
      .set({ originalPrice: products.price })
      .where(isNull(products.originalPrice));

    // STEP 2: Build the dynamic WHERE condition using Drizzle operators
    let condition;
    if (targetType === 'product') {
      condition = eq(products.id, targetId);
    } else if (targetType === 'category') {
      condition = eq(products.categoryId, targetId);
    } else if (targetType === 'collection') {
      condition = eq(products.collectionId, targetId);
    } else if (targetType !== 'all') {
      return res.status(400).json({ error: "Invalid target type" });
    }

    // STEP 3: Apply the math using sql template literals INSIDE the native .set()
    const updatePayload = {
      price: sql`${products.originalPrice} * ${multiplier}`
    };

    if (targetType === 'all') {
      // Updates the whole table
      await db.update(products).set(updatePayload); 
    } else {
      // Updates only the matching rows
      await db.update(products).set(updatePayload).where(condition);
    }

    res.status(200).json({ message: `Successfully applied ${discountPercentage}% discount to ${targetType}!` });

  } catch (error) {
    console.error("Discount Error:", error);
    res.status(500).json({ error: "Failed to apply discount" });
  }
};

export const removeCatalogDiscount = async (req, res) => {
  try {
    const { targetType, targetId } = req.body;

    // Build the condition exactly like above
    let condition = isNotNull(products.originalPrice); // Only restore items that actually have a saved original price
    
    if (targetType === 'product') {
        condition = and(condition, eq(products.id, targetId));
    } else if (targetType === 'category') {
      condition = and(condition, eq(products.categoryId, targetId));
    } else if (targetType === 'collection') {
      condition = and(condition, eq(products.collectionId, targetId));
    }

    // Pure Drizzle restore
    const updatePayload = {
        price: products.originalPrice, // Restore price
        originalPrice: null            // Optional: Reset originalPrice to null so the sale badge disappears
    };

    if (targetType === 'all') {
        await db.update(products).set(updatePayload).where(isNotNull(products.originalPrice));
    } else {
        await db.update(products).set(updatePayload).where(condition);
    }

    res.status(200).json({ message: "Prices restored to normal!" });
  } catch (error) {
    console.error("Restore Error:", error);
    res.status(500).json({ error: "Failed to restore prices" });
  }
};
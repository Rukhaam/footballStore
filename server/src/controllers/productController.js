import { db } from '../config/db.js';
import { products, collections ,categories,productSizes} from '../models/schema.js';

import { eq } from 'drizzle-orm';
export const getAllJerseys = async (_, res) => {
  try {
    const allJerseys = await db.select().from(products);
    res.status(200).json(allJerseys);
  } catch (error) {
    console.error("Error fetching jerseys:", error);
    res.status(500).json({ error: "Failed to fetch jerseys" });
  }
};

export const getCollections = async (_, res) => {
  try {
    const allCollections = await db.select().from(collections);
    res.status(200).json(allCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch the core product details
    const productResult = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)));

    // If no product exists, stop here
    if (!productResult.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productResult[0];

    // 2. Fetch all available sizes and stock for this specific product
    const sizesData = await db.select()
      .from(productSizes)
      .where(eq(productSizes.productId, parseInt(id)));

    // 3. Combine them perfectly to match the frontend we just built
    res.status(200).json({ 
      ...productData, 
      sizes: sizesData // Attaches the array of sizes!
    });

  } catch (error) {
    console.error("Fetch Product By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
};
export const getCategories = async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    res.status(200).json(allCategories);
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get pagination parameters from the URL (default to Page 1, 15 items)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // 2. Get the category details
    const categoryResult = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
    if (!categoryResult.length) return res.status(404).json({ error: "Category not found" });

    // 3. Fetch ONLY the exact 15 products for this specific page
    const categoryProducts = await db.select()
      .from(products)
      .where(eq(products.categoryId, parseInt(id)))
      .limit(limit)
      .offset(offset);

    // 4. Calculate total pages (get total count of items in this category)
    const allItems = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, parseInt(id)));
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    // 5. Send it all back to the frontend
    res.status(200).json({ 
      category: categoryResult[0], 
      products: categoryProducts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error("Fetch Products By Category Error:", error);
    res.status(500).json({ error: "Failed to fetch category products" });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const collectionData = await db.select().from(collections).where(eq(collections.id, id));
    
    if (collectionData.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const collectionProducts = await db.select().from(products).where(eq(products.collectionId, id));

    res.status(200).json({
      collection: collectionData[0],
      products: collectionProducts
    });
  } catch (error) {
    console.error("Failed to fetch collection details:", error);
    res.status(500).json({ error: "Failed to fetch collection details" });
  }
};
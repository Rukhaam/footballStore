import { db } from '../config/db.js';
import { products, collections, categories, productSizes } from '../models/schema.js';
import { eq, ilike, sql } from 'drizzle-orm';

export const getAllJerseys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql`count(*)` }).from(products);

    if (search) {
      query = query.where(ilike(products.productName, `%${search}%`));
      countQuery = countQuery.where(ilike(products.productName, `%${search}%`));
    }

    const allJerseys = await query.limit(limit).offset(offset);
    const totalResult = await countQuery;
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: allJerseys,
      total,
      page,
      totalPages
    });
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

    const productResult = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(id)));
    
    if (!productResult.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productResult[0];

    const sizesData = await db.select()
      .from(productSizes)
      .where(eq(productSizes.productId, parseInt(id)));

    res.status(200).json({ 
      ...productData, 
      sizes: sizesData 
    });

  } catch (error) {
    console.error("Fetch Product By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; 
    const offset = (page - 1) * limit;

    // 1. Fetch the paginated categories
    const categoryData = await db.select()
      .from(categories)
      .limit(limit)
      .offset(offset);

    // 2. Count total categories for the pagination object
    const countResult = await db.select({ count: sql`count(*)` }).from(categories);
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 3. Return the structured response
    res.status(200).json({
      data: categoryData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const categoryResult = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
    if (!categoryResult.length) return res.status(404).json({ error: "Category not found" });

    // 3. Fetch ONLY the exact products for this specific page
    const categoryProducts = await db.select()
      .from(products)
      .where(eq(products.categoryId, parseInt(id)))
      .limit(limit)
      .offset(offset);

    // 4. Calculate total pages
    const countResult = await db.select({ count: sql`count(*)` }).from(products).where(eq(products.categoryId, parseInt(id)));
    const totalItems = Number(countResult[0].count);
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

// --- to getCollectionById ---
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // 1. Fetch the collection details
    const collectionData = await db.select().from(collections).where(eq(collections.id, parseInt(id)));
    
    if (collectionData.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // 2. Fetch ONLY the exact products for this specific page
    const collectionProducts = await db.select()
      .from(products)
      .where(eq(products.collectionId, parseInt(id)))
      .limit(limit)
      .offset(offset);

    // 3. Calculate total items and total pages
    const countResult = await db.select({ count: sql`count(*)` }).from(products).where(eq(products.collectionId, parseInt(id)));
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Send the structured response
    res.status(200).json({
      collection: collectionData[0],
      products: collectionProducts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error("Failed to fetch collection details:", error);
    res.status(500).json({ error: "Failed to fetch collection details" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || req.query.q || '';
    const offset = (page - 1) * limit;

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql`count(*)` }).from(products);

    if (search) {
      query = query.where(ilike(products.productName, `%${search}%`));
      countQuery = countQuery.where(ilike(products.productName, `%${search}%`));
    }

    const results = await query.limit(limit).offset(offset);
    const totalResult = await countQuery;
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
       data: results,
       total,
       page,
       totalPages
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
};

export const addProduct = async (req, res) => {
  try {
    const { 
      name, 
      price, 
      originalPrice, 
      stock, 
      categoryId, 
      collectionId, 
      productImageUrl, 
      gallery, 
      description 
    } = req.body;

    const newProduct = await db.insert(products).values({
      productName: name,
      price: price,
      
      originalPrice: originalPrice === "" ? null : originalPrice, 
      
      stock: stock || 0,
      categoryId: categoryId || null,
      collectionId: collectionId || null,
      productImageUrl: productImageUrl,
      
      gallery: gallery || [], 
      
      description: description
    }).returning();

    res.status(201).json(newProduct[0] || newProduct);
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await db.delete(products).where(eq(products.id, parseInt(id))).returning();
    if (!deletedProduct?.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully", product: deletedProduct[0] });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};
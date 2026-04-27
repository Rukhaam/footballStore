import { db } from "../config/db.js";
import {
  products,
  collections,
  categories,
  productSizes,
} from "../models/schema.js";
import { eq, ilike, sql } from "drizzle-orm";
import {
  slugify,
  buildCollectionSlug,
  buildProductSlug,
} from "../utils/slugify.js";

const withProductSlug = (product) => ({
  ...product,
  slug: buildProductSlug(product.productName, product.id),
});

const withProductSlugs = (items) => items.map(withProductSlug);

const withCollectionSlug = (collection) => ({
  ...collection,
  slug: buildCollectionSlug(collection.collectionName),
});

const withCollectionSlugs = (items) => items.map(withCollectionSlug);

const parseProductIdParam = (rawParam) => {
  const decodedParam = decodeURIComponent(rawParam || "").trim();
  if (!decodedParam) return null;

  if (/^\d+$/.test(decodedParam)) {
    return Number.parseInt(decodedParam, 10);
  }

  const trailingIdMatch = decodedParam.match(/-(\d+)$/);
  if (trailingIdMatch) {
    return Number.parseInt(trailingIdMatch[1], 10);
  }

  return null;
};

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const parseNumericValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).trim().replace(/,/g, "");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseGalleryInput = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  const normalized = value.trim();
  if (!normalized) return [];

  const delimiter = normalized.includes("|") ? "|" : ",";
  return normalized
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNonNegativeInteger = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return Number.NaN;
    return Number.isInteger(value) && value >= 0 ? value : Number.NaN;
  }

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    return Number.NaN;
  }

  return Number.parseInt(normalized, 10);
};

const parseOptionalForeignId = (value, label) => {
  const normalizedValue = normalizeOptionalString(value);
  if (normalizedValue === null) {
    return { value: null };
  }

  const parsed = Number.parseInt(normalizedValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${label}Id must be a positive integer` };
  }

  return { value: parsed };
};

const normalizeSizeLabel = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const parseSizeStockInput = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return { entries: [] };
  }

  const entriesMap = new Map();

  const upsertSizeStock = (sizeValue, stockValue) => {
    const size = normalizeSizeLabel(sizeValue);
    if (!size) {
      return;
    }

    const parsedStock = parseNonNegativeInteger(stockValue);
    if (Number.isNaN(parsedStock)) {
      throw new Error(
        `stock for size ${size} must be a valid non-negative integer`,
      );
    }

    const normalizedStock = parsedStock ?? 0;
    entriesMap.set(size, normalizedStock);
  };

  try {
    if (Array.isArray(rawValue)) {
      rawValue.forEach((entry) => {
        if (!entry || typeof entry !== "object") {
          throw new Error(
            "each size entry must be an object with size and stock",
          );
        }

        upsertSizeStock(entry.size, entry.stock);
      });
    } else if (typeof rawValue === "object") {
      Object.entries(rawValue).forEach(([size, stock]) => {
        upsertSizeStock(size, stock);
      });
    } else {
      return {
        error:
          "sizeStock must be an object or an array of { size, stock } entries",
      };
    }
  } catch (error) {
    return { error: error.message || "Invalid sizeStock payload" };
  }

  return {
    entries: Array.from(entriesMap.entries()).map(([size, stock]) => ({
      size,
      stock,
    })),
  };
};

const normalizeImportKey = (key) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const SIZE_IMPORT_ALIASES = {
  XS: ["xs", "sizexs", "stockxs", "xssize", "xsstock"],
  S: ["s", "sizes", "stocks", "ssize", "sstock"],
  M: ["m", "sizem", "stockm", "msize", "mstock"],
  L: ["l", "sizel", "stockl", "lsize", "lstock"],
  XL: ["xl", "sizexl", "stockxl", "xlsize", "xlstock"],
  XXL: ["xxl", "sizexxl", "stockxxl", "xxlsize", "xxlstock"],
};

const extractSizeStockPayload = (row) => {
  const explicitPayload = row?.sizeStock ?? row?.sizes;

  if (
    explicitPayload !== undefined &&
    explicitPayload !== null &&
    !(typeof explicitPayload === "string" && explicitPayload.trim() === "")
  ) {
    if (typeof explicitPayload === "string") {
      const normalizedPayload = explicitPayload.trim();
      if (
        normalizedPayload.startsWith("{") ||
        normalizedPayload.startsWith("[")
      ) {
        try {
          return JSON.parse(normalizedPayload);
        } catch {
          return explicitPayload;
        }
      }
    }

    return explicitPayload;
  }

  const normalizedRow = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    normalizedRow[normalizeImportKey(key)] = value;
  });

  const inferredSizeStock = {};

  Object.entries(SIZE_IMPORT_ALIASES).forEach(([sizeLabel, aliases]) => {
    for (const alias of aliases) {
      const value = normalizedRow[alias];
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        inferredSizeStock[sizeLabel] = value;
        break;
      }
    }
  });

  return Object.keys(inferredSizeStock).length ? inferredSizeStock : null;
};

const resolveForeignKey = ({ idValue, nameValue, idMap, nameMap, label }) => {
  const normalizedId = normalizeOptionalString(idValue);
  const normalizedName = normalizeOptionalString(nameValue);

  if (normalizedId !== null) {
    const parsedId = Number.parseInt(normalizedId, 10);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return { error: `${label}Id must be a positive integer` };
    }

    if (!idMap.has(parsedId)) {
      return { error: `${label}Id ${parsedId} does not exist` };
    }

    return { id: parsedId };
  }

  if (normalizedName !== null) {
    const mappedId = nameMap.get(normalizedName.toLowerCase());
    if (!mappedId) {
      return { error: `${label}Name \"${normalizedName}\" does not exist` };
    }

    return { id: mappedId };
  }

  return { id: null };
};

export const getAllJerseys = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql`count(*)` }).from(products);

    if (search) {
      query = query.where(ilike(products.productName, `%${search}%`));
      countQuery = countQuery.where(ilike(products.productName, `%${search}%`));
    }

    const allJerseys = await query.limit(limit).offset(offset);
    const allJerseysWithSlugs = withProductSlugs(allJerseys);
    const totalResult = await countQuery;
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: allJerseysWithSlugs,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching jerseys:", error);
    res.status(500).json({ error: "Failed to fetch jerseys" });
  }
};

export const getCollections = async (_, res) => {
  try {
    const allCollections = await db.select().from(collections);
    res.status(200).json(withCollectionSlugs(allCollections));
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
};

export const addCollection = async (req, res) => {
  try {
    const collectionName = normalizeOptionalString(
      req.body?.name ?? req.body?.collectionName,
    );
    const description = normalizeOptionalString(req.body?.description);
    const logoUrl = normalizeOptionalString(
      req.body?.imageUrl ?? req.body?.logoUrl,
    );

    if (!collectionName) {
      return res.status(400).json({ error: "Collection name is required" });
    }

    if (!logoUrl) {
      return res
        .status(400)
        .json({ error: "Collection image URL is required" });
    }

    const existingCollections = await db
      .select({
        id: collections.id,
        collectionName: collections.collectionName,
      })
      .from(collections);

    const duplicateCollection = existingCollections.find(
      (item) =>
        item.collectionName.trim().toLowerCase() ===
        collectionName.toLowerCase(),
    );

    if (duplicateCollection) {
      return res.status(409).json({ error: "Collection name already exists" });
    }

    const insertedRows = await db
      .insert(collections)
      .values({
        collectionName,
        description,
        logoUrl,
      })
      .returning();

    const inserted = insertedRows[0];
    return res.status(201).json(withCollectionSlug(inserted));
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Collection name already exists" });
    }

    console.error("Add Collection Error:", error);
    return res.status(500).json({ error: "Failed to add collection" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id: idOrSlug } = req.params;
    const productId = parseProductIdParam(idOrSlug);
    const decodedParam = decodeURIComponent(idOrSlug || "").trim();

    let productResult = [];

    if (productId !== null) {
      productResult = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));
    }

    // Fallback for slug-only links without a numeric suffix.
    if (!productResult.length && decodedParam) {
      const lightweightProducts = await db
        .select({ id: products.id, productName: products.productName })
        .from(products);
      const matched = lightweightProducts.find(
        (item) => slugify(item.productName) === slugify(decodedParam),
      );

      if (matched) {
        productResult = await db
          .select()
          .from(products)
          .where(eq(products.id, matched.id));
      }
    }

    if (!productResult.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productResult[0];

    const sizesData = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, productData.id));

    res.status(200).json({
      ...withProductSlug(productData),
      sizes: sizesData,
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
    const categoryData = await db
      .select()
      .from(categories)
      .limit(limit)
      .offset(offset);

    const categoryDataWithSlug = categoryData.map((category) => ({
      ...category,
      slug: slugify(category.categoryName),
    }));

    // 2. Count total categories for the pagination object
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(categories);
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 3. Return the structured response
    res.status(200).json({
      data: categoryDataWithSlug,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      },
    });
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const addCategory = async (req, res) => {
  try {
    const categoryName = normalizeOptionalString(
      req.body?.name ?? req.body?.categoryName,
    );
    const categoryUrl = normalizeOptionalString(
      req.body?.imageUrl ?? req.body?.categoryUrl,
    );

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    if (!categoryUrl) {
      return res.status(400).json({ error: "Category image URL is required" });
    }

    const existingCategories = await db
      .select({
        id: categories.id,
        categoryName: categories.categoryName,
      })
      .from(categories);

    const duplicateCategory = existingCategories.find(
      (item) =>
        item.categoryName.trim().toLowerCase() === categoryName.toLowerCase(),
    );

    if (duplicateCategory) {
      return res.status(409).json({ error: "Category name already exists" });
    }

    const insertedRows = await db
      .insert(categories)
      .values({
        categoryName,
        categoryUrl,
      })
      .returning();

    const inserted = insertedRows[0];

    return res.status(201).json({
      ...inserted,
      slug: slugify(inserted.categoryName),
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Category name already exists" });
    }

    console.error("Add Category Error:", error);
    return res.status(500).json({ error: "Failed to add category" });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id: idOrSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const decodedParam = decodeURIComponent(idOrSlug || "").trim();
    const numericId = Number.parseInt(decodedParam, 10);
    const isNumericParam =
      Number.isInteger(numericId) && String(numericId) === decodedParam;

    let category = null;

    if (isNumericParam) {
      const byId = await db
        .select()
        .from(categories)
        .where(eq(categories.id, numericId));
      category = byId[0] || null;
    } else {
      const allCategories = await db.select().from(categories);
      category =
        allCategories.find(
          (item) => slugify(item.categoryName) === slugify(decodedParam),
        ) || null;
    }

    if (!category) return res.status(404).json({ error: "Category not found" });

    // 3. Fetch ONLY the exact products for this specific page
    const categoryProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, category.id))
      .limit(limit)
      .offset(offset);
    const categoryProductsWithSlugs = withProductSlugs(categoryProducts);

    // 4. Calculate total pages
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(eq(products.categoryId, category.id));
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 5. Send it all back to the frontend
    res.status(200).json({
      category: {
        ...category,
        slug: slugify(category.categoryName),
      },
      products: categoryProductsWithSlugs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      },
    });
  } catch (error) {
    console.error("Fetch Products By Category Error:", error);
    res.status(500).json({ error: "Failed to fetch category products" });
  }
};

// --- to getCollectionById ---
export const getCollectionById = async (req, res) => {
  try {
    const { id: idOrSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const decodedParam = decodeURIComponent(idOrSlug || "").trim();
    const numericId = Number.parseInt(decodedParam, 10);
    const isNumericParam =
      Number.isInteger(numericId) && String(numericId) === decodedParam;

    let collection = null;

    if (isNumericParam) {
      const byId = await db
        .select()
        .from(collections)
        .where(eq(collections.id, numericId));
      collection = byId[0] || null;
    } else {
      const allCollections = await db.select().from(collections);
      collection =
        allCollections.find(
          (item) =>
            buildCollectionSlug(item.collectionName) ===
            buildCollectionSlug(decodedParam),
        ) || null;
    }

    // 1. Fetch the collection details
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // 2. Fetch ONLY the exact products for this specific page
    const collectionProducts = await db
      .select()
      .from(products)
      .where(eq(products.collectionId, collection.id))
      .limit(limit)
      .offset(offset);
    const collectionProductsWithSlugs = withProductSlugs(collectionProducts);

    // 3. Calculate total items and total pages
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(eq(products.collectionId, collection.id));
    const totalItems = Number(countResult[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Send the structured response
    res.status(200).json({
      collection: withCollectionSlug(collection),
      products: collectionProductsWithSlugs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
      },
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
    const search = req.query.search || req.query.q || "";
    const offset = (page - 1) * limit;

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql`count(*)` }).from(products);

    if (search) {
      query = query.where(ilike(products.productName, `%${search}%`));
      countQuery = countQuery.where(ilike(products.productName, `%${search}%`));
    }

    const results = await query.limit(limit).offset(offset);
    const resultsWithSlugs = withProductSlugs(results);
    const totalResult = await countQuery;
    const total = Number(totalResult[0].count);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      data: resultsWithSlugs,
      total,
      page,
      totalPages,
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
      description,
    } = req.body;

    const normalizedName = normalizeOptionalString(name);
    if (!normalizedName) {
      return res.status(400).json({ error: "name is required" });
    }

    const parsedPrice = parseNumericValue(price);
    if (parsedPrice === null || parsedPrice < 0) {
      return res
        .status(400)
        .json({ error: "price must be a valid non-negative number" });
    }

    let parsedOriginalPrice = null;
    const normalizedOriginalPrice = normalizeOptionalString(originalPrice);
    if (normalizedOriginalPrice !== null) {
      parsedOriginalPrice = parseNumericValue(normalizedOriginalPrice);
      if (parsedOriginalPrice === null || parsedOriginalPrice < 0) {
        return res
          .status(400)
          .json({ error: "originalPrice must be a valid non-negative number" });
      }
    }

    const parsedStock = parseNonNegativeInteger(stock);
    if (Number.isNaN(parsedStock)) {
      return res
        .status(400)
        .json({ error: "stock must be a valid non-negative integer" });
    }

    const normalizedStock = parsedStock ?? 0;

    const categoryIdResult = parseOptionalForeignId(categoryId, "category");
    if (categoryIdResult.error) {
      return res.status(400).json({ error: categoryIdResult.error });
    }

    const collectionIdResult = parseOptionalForeignId(
      collectionId,
      "collection",
    );
    if (collectionIdResult.error) {
      return res.status(400).json({ error: collectionIdResult.error });
    }

    const normalizedProductImageUrl = normalizeOptionalString(productImageUrl);
    if (!normalizedProductImageUrl) {
      return res.status(400).json({ error: "productImageUrl is required" });
    }

    const normalizedGallery = parseGalleryInput(gallery);
    const normalizedDescription = normalizeOptionalString(description) || "";

    const sizeStockPayload = extractSizeStockPayload(req.body);
    const parsedSizeStock = parseSizeStockInput(sizeStockPayload);
    if (parsedSizeStock.error) {
      return res.status(400).json({ error: parsedSizeStock.error });
    }

    const sizeEntries = parsedSizeStock.entries;
    if (sizeEntries.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one size entry is required in sizeStock" });
    }

    const sizeStockTotal = sizeEntries.reduce(
      (sum, item) => sum + item.stock,
      0,
    );
    if (normalizedStock !== sizeStockTotal) {
      return res.status(400).json({
        error: `stock (${normalizedStock}) must equal the sum of sizeStock values (${sizeStockTotal})`,
      });
    }

    const createdProduct = await db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(products)
        .values({
          productName: normalizedName,
          price: parsedPrice,
          originalPrice: parsedOriginalPrice,
          stock: normalizedStock,
          categoryId: categoryIdResult.value,
          collectionId: collectionIdResult.value,
          productImageUrl: normalizedProductImageUrl,
          gallery: normalizedGallery,
          description: normalizedDescription,
        })
        .returning();

      const insertedProduct = insertedRows[0] || insertedRows;

      const sizeRows = sizeEntries.map((entry) => ({
        productId: insertedProduct.id,
        size: entry.size,
        stock: entry.stock,
      }));

      const insertedSizes = await tx
        .insert(productSizes)
        .values(sizeRows)
        .returning();

      return {
        product: insertedProduct,
        sizes: insertedSizes,
      };
    });

    res.status(201).json({
      ...withProductSlug(createdProduct.product),
      sizes: createdProduct.sizes,
    });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const productId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const existingProduct = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId));

    if (!existingProduct.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      name,
      price,
      originalPrice,
      stock,
      categoryId,
      collectionId,
      productImageUrl,
      gallery,
      description,
    } = req.body;

    const normalizedName = normalizeOptionalString(name);
    if (!normalizedName) {
      return res.status(400).json({ error: "name is required" });
    }

    const parsedPrice = parseNumericValue(price);
    if (parsedPrice === null || parsedPrice < 0) {
      return res
        .status(400)
        .json({ error: "price must be a valid non-negative number" });
    }

    let parsedOriginalPrice = null;
    const normalizedOriginalPrice = normalizeOptionalString(originalPrice);
    if (normalizedOriginalPrice !== null) {
      parsedOriginalPrice = parseNumericValue(normalizedOriginalPrice);
      if (parsedOriginalPrice === null || parsedOriginalPrice < 0) {
        return res
          .status(400)
          .json({ error: "originalPrice must be a valid non-negative number" });
      }
    }

    const parsedStock = parseNonNegativeInteger(stock);
    if (Number.isNaN(parsedStock)) {
      return res
        .status(400)
        .json({ error: "stock must be a valid non-negative integer" });
    }

    const normalizedStock = parsedStock ?? 0;

    const categoryIdResult = parseOptionalForeignId(categoryId, "category");
    if (categoryIdResult.error) {
      return res.status(400).json({ error: categoryIdResult.error });
    }

    const collectionIdResult = parseOptionalForeignId(
      collectionId,
      "collection",
    );
    if (collectionIdResult.error) {
      return res.status(400).json({ error: collectionIdResult.error });
    }

    const normalizedProductImageUrl = normalizeOptionalString(productImageUrl);
    if (!normalizedProductImageUrl) {
      return res.status(400).json({ error: "productImageUrl is required" });
    }

    const normalizedGallery = parseGalleryInput(gallery);
    const normalizedDescription = normalizeOptionalString(description) || "";

    const sizeStockPayload = extractSizeStockPayload(req.body);
    const parsedSizeStock = parseSizeStockInput(sizeStockPayload);
    if (parsedSizeStock.error) {
      return res.status(400).json({ error: parsedSizeStock.error });
    }

    const sizeEntries = parsedSizeStock.entries;
    if (!sizeEntries.length) {
      return res
        .status(400)
        .json({ error: "At least one size entry is required in sizeStock" });
    }

    const sizeStockTotal = sizeEntries.reduce(
      (sum, item) => sum + item.stock,
      0,
    );
    if (normalizedStock !== sizeStockTotal) {
      return res.status(400).json({
        error: `stock (${normalizedStock}) must equal the sum of sizeStock values (${sizeStockTotal})`,
      });
    }

    const updatedProduct = await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(products)
        .set({
          productName: normalizedName,
          price: parsedPrice,
          originalPrice: parsedOriginalPrice,
          stock: normalizedStock,
          categoryId: categoryIdResult.value,
          collectionId: collectionIdResult.value,
          productImageUrl: normalizedProductImageUrl,
          gallery: normalizedGallery,
          description: normalizedDescription,
        })
        .where(eq(products.id, productId))
        .returning();

      await tx
        .delete(productSizes)
        .where(eq(productSizes.productId, productId));

      const sizeRows = sizeEntries.map((entry) => ({
        productId,
        size: entry.size,
        stock: entry.stock,
      }));

      const insertedSizes = await tx
        .insert(productSizes)
        .values(sizeRows)
        .returning();

      return {
        product: updatedRows[0],
        sizes: insertedSizes,
      };
    });

    return res.status(200).json({
      ...withProductSlug(updatedProduct.product),
      sizes: updatedProduct.sizes,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({ error: "Failed to update product" });
  }
};

export const addProductsBulk = async (req, res) => {
  try {
    const productRows = req.body?.products;

    if (!Array.isArray(productRows) || productRows.length === 0) {
      return res
        .status(400)
        .json({ error: "products must be a non-empty array" });
    }

    if (productRows.length > 2000) {
      return res
        .status(400)
        .json({ error: "Maximum 2000 products can be imported at once" });
    }

    const [allCategories, allCollections] = await Promise.all([
      db
        .select({ id: categories.id, categoryName: categories.categoryName })
        .from(categories),
      db
        .select({
          id: collections.id,
          collectionName: collections.collectionName,
        })
        .from(collections),
    ]);

    const categoryIdMap = new Map(
      allCategories.map((item) => [item.id, item.id]),
    );
    const categoryNameMap = new Map(
      allCategories.map((item) => [
        item.categoryName.trim().toLowerCase(),
        item.id,
      ]),
    );
    const collectionIdMap = new Map(
      allCollections.map((item) => [item.id, item.id]),
    );
    const collectionNameMap = new Map(
      allCollections.map((item) => [
        item.collectionName.trim().toLowerCase(),
        item.id,
      ]),
    );

    const validRows = [];
    const failures = [];

    productRows.forEach((row, index) => {
      const rowNumber =
        Number.isInteger(row?.rowNumber) && row.rowNumber > 0
          ? row.rowNumber
          : index + 2;

      const name = normalizeOptionalString(row?.name ?? row?.productName);
      if (!name) {
        failures.push({ row: rowNumber, error: "name is required" });
        return;
      }

      const price = parseNumericValue(row?.price);
      if (price === null || price < 0) {
        failures.push({
          row: rowNumber,
          error: "price must be a valid non-negative number",
        });
        return;
      }

      const parsedStock = parseNonNegativeInteger(row?.stock);
      if (Number.isNaN(parsedStock)) {
        failures.push({
          row: rowNumber,
          error: "stock must be a valid non-negative integer",
        });
        return;
      }

      const stock = parsedStock ?? 0;

      let originalPrice = null;
      const originalPriceRaw = normalizeOptionalString(row?.originalPrice);
      if (originalPriceRaw !== null) {
        const parsedOriginalPrice = parseNumericValue(originalPriceRaw);
        if (parsedOriginalPrice === null || parsedOriginalPrice < 0) {
          failures.push({
            row: rowNumber,
            error: "originalPrice must be a valid non-negative number",
          });
          return;
        }
        originalPrice = parsedOriginalPrice;
      }

      const categoryResolution = resolveForeignKey({
        idValue: row?.categoryId,
        nameValue: row?.categoryName,
        idMap: categoryIdMap,
        nameMap: categoryNameMap,
        label: "category",
      });

      if (categoryResolution.error) {
        failures.push({ row: rowNumber, error: categoryResolution.error });
        return;
      }

      const collectionResolution = resolveForeignKey({
        idValue: row?.collectionId,
        nameValue: row?.collectionName,
        idMap: collectionIdMap,
        nameMap: collectionNameMap,
        label: "collection",
      });

      if (collectionResolution.error) {
        failures.push({ row: rowNumber, error: collectionResolution.error });
        return;
      }

      const sizeStockPayload = extractSizeStockPayload(row);
      const parsedSizeStock = parseSizeStockInput(sizeStockPayload);

      if (parsedSizeStock.error) {
        failures.push({ row: rowNumber, error: parsedSizeStock.error });
        return;
      }

      if (!parsedSizeStock.entries.length) {
        failures.push({
          row: rowNumber,
          error: "At least one size entry is required (XS, S, M, L, XL, XXL)",
        });
        return;
      }

      const sizeStockTotal = parsedSizeStock.entries.reduce(
        (sum, item) => sum + item.stock,
        0,
      );
      if (stock !== sizeStockTotal) {
        failures.push({
          row: rowNumber,
          error: `stock (${stock}) must equal the sum of sizeStock values (${sizeStockTotal})`,
        });
        return;
      }

      const gallery = parseGalleryInput(row?.gallery ?? row?.galleryUrls);

      validRows.push({
        productName: name,
        description: normalizeOptionalString(row?.description) || "",
        price,
        originalPrice,
        stock,
        categoryId: categoryResolution.id,
        collectionId: collectionResolution.id,
        productImageUrl: normalizeOptionalString(
          row?.productImageUrl ?? row?.imageUrl,
        ),
        gallery,
        sizeEntries: parsedSizeStock.entries,
      });
    });

    if (validRows.length === 0) {
      return res.status(400).json({
        error: "No valid rows found for import",
        insertedCount: 0,
        failedCount: failures.length,
        failures,
      });
    }

    const insertedProducts = [];
    const chunkSize = 200;

    for (let index = 0; index < validRows.length; index += chunkSize) {
      const chunk = validRows.slice(index, index + chunkSize);
      const insertedChunk = await db.transaction(async (tx) => {
        const productPayloadRows = chunk.map(
          ({ sizeEntries, ...productRow }) => productRow,
        );
        const createdProducts = await tx
          .insert(products)
          .values(productPayloadRows)
          .returning();

        const sizeRows = createdProducts.flatMap((createdProduct, rowIndex) =>
          chunk[rowIndex].sizeEntries.map((entry) => ({
            productId: createdProduct.id,
            size: entry.size,
            stock: entry.stock,
          })),
        );

        if (sizeRows.length) {
          await tx.insert(productSizes).values(sizeRows);
        }

        return createdProducts;
      });

      insertedProducts.push(...insertedChunk);
    }

    return res.status(201).json({
      message: `Imported ${insertedProducts.length} product(s)`,
      insertedCount: insertedProducts.length,
      failedCount: failures.length,
      failures,
      data: withProductSlugs(insertedProducts),
    });
  } catch (error) {
    console.error("Bulk Add Product Error:", error);
    return res.status(500).json({ error: "Failed to import products" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await db
      .delete(products)
      .where(eq(products.id, parseInt(id)))
      .returning();
    if (!deletedProduct?.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    res
      .status(200)
      .json({
        message: "Product deleted successfully",
        product: deletedProduct[0],
      });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

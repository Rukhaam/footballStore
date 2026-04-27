export const slugify = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const buildProductSlug = (productName = "", productId) => {
  const base = slugify(productName);
  return productId ? `${base}-${productId}` : base;
};

export const getProductSlug = (product) => {
  if (!product) return "";
  return product.slug || buildProductSlug(product.productName || "", product.id);
};

export const buildCollectionSlug = (collectionName = "") => slugify(collectionName);

export const getCollectionSlug = (collection) => {
  if (!collection) return "";
  return collection.slug || buildCollectionSlug(collection.collectionName || "");
};

import { createSlice } from '@reduxjs/toolkit';

export const CART_STORAGE_KEY = 'kinetic-arena-cart';

const parseSize = (rawSize) => {
  if (!rawSize) return null;
  if (typeof rawSize === 'object') return parseSize(rawSize.size);
  if (typeof rawSize === 'string' && rawSize.startsWith('{')) {
    try {
      return parseSize(JSON.parse(rawSize).size);
    } catch {
      return rawSize.trim().toUpperCase() || null;
    }
  }

  const clean = String(rawSize).trim().toUpperCase();
  return clean || null;
};

const getProductId = (item) => item.product?.id || item.productId || item.id;

export const normalizeCartItem = (item) => {
  const product = item.product || item;
  const productId = getProductId(item);
  const quantity = Number.parseInt(item.quantity, 10);

  return {
    ...item,
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    size: parseSize(item.size || item.product?.size),
    priceAtTime: item.priceAtTime ?? product.price ?? item.price ?? 0,
    product: {
      ...product,
      id: productId,
      name: product.name || product.productName || item.productName || 'Jersey',
      imageUrl: product.imageUrl || product.productImageUrl || item.productImageUrl || ''
    }
  };
};

export const loadCartItemsFromStorage = () => {
  if (typeof window === 'undefined') return [];

  try {
    const savedItems = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(savedItems) ? savedItems.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

const initialState = {
  items: loadCartItemsFromStorage(),
  isOpen: false,
};

const isMatch = (item, targetProductId, targetSize) => {
  const currentId = getProductId(item);
  const currentSize = parseSize(item.size || item.product?.size);

  const idMatches = String(currentId) === String(targetProductId);
  const sizeMatches = String(currentSize || '') === String(parseSize(targetSize) || '');

  return idMatches && sizeMatches;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action) => {
      state.items = Array.isArray(action.payload)
        ? action.payload.map(normalizeCartItem)
        : [];
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    addItemToLocalCart: (state, action) => {
      const newItem = normalizeCartItem(action.payload);
      const newItemSize = newItem.size;
      const newItemId = getProductId(newItem);

      const existingItemIndex = state.items.findIndex((item) =>
        isMatch(item, newItemId, newItemSize)
      );

      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        state.items.push({ ...newItem, size: newItemSize });
      }
    },
    updateItemQuantityLocal: (state, action) => {
      const { productId, quantity, size } = action.payload;

      const itemIndex = state.items.findIndex((item) => isMatch(item, productId, size));

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
      }
    },
    removeItemFromLocalCart: (state, action) => {
      const { productId, size } = action.payload;

      // Filter OUT the item that matches
      state.items = state.items.filter((item) => !isMatch(item, productId, size));
    },
    clearLocalCart: (state) => {
      state.items = [];
    }
  },
});

export const { 
  setCartItems, 
  toggleCart, 
  addItemToLocalCart, 
  updateItemQuantityLocal, 
  removeItemFromLocalCart,
  clearLocalCart 
} = cartSlice.actions;

export default cartSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isOpen: false,
};

// --- THE FIX: A bulletproof matcher that ignores Data Type mismatches ---
const isMatch = (item, targetProductId, targetSize) => {
  // 1. Find the ID whether it is nested (item.product.id) or flat (item.id)
  const currentId = item.product?.id || item.productId || item.id;
  // 2. Find the size whether it is nested or flat
  const currentSize = item.size || item.product?.size;

  // 3. Force everything to Strings to prevent Number vs String bugs
  const idMatches = String(currentId) === String(targetProductId);
  // 4. Fallback to empty strings to prevent 'null' vs 'undefined' bugs
  const sizeMatches = String(currentSize || '') === String(targetSize || '');

  return idMatches && sizeMatches;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action) => {
      state.items = action.payload;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    addItemToLocalCart: (state, action) => {
      const newItem = action.payload;
      const newItemSize = newItem.size || newItem.product?.size;
      const newItemId = newItem.product?.id || newItem.id;

      const existingItemIndex = state.items.findIndex((item) =>
        isMatch(item, newItemId, newItemSize)
      );

      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        // Force the size to the top level for consistency
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
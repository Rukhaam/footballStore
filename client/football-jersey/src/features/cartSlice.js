// client/src/features/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isOpen: false,
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
      // BUG FIX: Now checks BOTH product ID and Size so variants don't merge!
      const newItemSize = newItem.size || newItem.product?.size;
      
      const existingItemIndex = state.items.findIndex((item) => {
        const currentItemSize = item.size || item.product?.size;
        return item.product.id === newItem.product.id && currentItemSize === newItemSize;
      });
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        // Normalize size to root level to match database fetch structure
        state.items.push({ ...newItem, size: newItemSize });
      }
    },
    updateItemQuantityLocal: (state, action) => {
      // BUG FIX: Ensure we accept size in the payload
      const { productId, quantity, size } = action.payload; 
      
      const itemIndex = state.items.findIndex((item) => {
        const currentItemSize = item.size || item.product?.size;
        return item.product.id === productId && currentItemSize === size;
      });
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
        } else {
          state.items[itemIndex].quantity = quantity;
        }
      }
    },
    removeItemFromLocalCart: (state, action) => {
      // BUG FIX: Payload is now an object containing both ID and Size
      const { productId, size } = action.payload; 
      
      state.items = state.items.filter((item) => {
        const currentItemSize = item.size || item.product?.size;
        // Keep items that DO NOT match both the ID and the Size
        return !(item.product.id === productId && currentItemSize === size);
      });
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
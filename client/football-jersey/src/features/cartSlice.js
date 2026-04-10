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
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === newItem.product.id
      );
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += newItem.quantity;
      } else {
        state.items.push(newItem);
      }
    },
    // --- NEW REDUCERS ---
    updateItemQuantityLocal: (state, action) => {
      const { productId, quantity } = action.payload;
      const itemIndex = state.items.findIndex((item) => item.product.id === productId);
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // If quantity hits 0, remove the item entirely
          state.items.splice(itemIndex, 1);
        } else {
          // Otherwise, set the new quantity
          state.items[itemIndex].quantity = quantity;
        }
      }
    },
    removeItemFromLocalCart: (state, action) => {
      const productId = action.payload; 
      state.items = state.items.filter((item) => item.product.id !== productId);
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
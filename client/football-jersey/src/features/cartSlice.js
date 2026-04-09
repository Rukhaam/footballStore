// client/src/features/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isOpen: false, // Controls the slide-out cart drawer UI
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


    removeItemFromLocalCart: (state, action) => {
      const cartItemId = action.payload;
      state.items = state.items.filter((item) => item.cartItemId !== cartItemId);
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
  removeItemFromLocalCart, 
  clearLocalCart 
} = cartSlice.actions;

export default cartSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import cartReducer, { CART_STORAGE_KEY } from '../features/cartSlice';
import searchReducer from '../features/searchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    search :searchReducer
  },
});

let currentCartItems = store.getState().cart.items;

store.subscribe(() => {
  if (typeof window === 'undefined') return;

  const nextCartItems = store.getState().cart.items;
  if (nextCartItems === currentCartItems) return;

  currentCartItems = nextCartItems;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCartItems));
  } catch {
    // Storage can be unavailable in private browsing or embedded previews.
  }
});

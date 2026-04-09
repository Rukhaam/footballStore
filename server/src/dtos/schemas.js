import { z } from 'zod';

// DTO for updating user profile
export const updateUserProfileDTO = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z.string().min(5, "Address is too short").optional(),
  pincode: z.string().regex(/^\d{5,6}$/, "Invalid pincode format").optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
});

// DTO for adding an item to the cart
export const addToCartDTO = z.object({
  productId: z.number().int().positive("Product ID must be a valid positive integer"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// DTO for checkout
export const checkoutDTO = z.object({
  addressSnapshot: z.string().min(10, "A full shipping address is required for checkout"),
});
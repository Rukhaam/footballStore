import { z } from 'zod';

export const updateUserProfileDTO = z.object({
  userName: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z.string().min(5, "Address is too short").optional(),
  pincode: z.string().regex(/^\d{5,6}$/, "Invalid pincode format").optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
});

export const addToCartDTO = z.object({
  productId: z.number().int().positive("Product ID must be a valid positive integer"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// FIXED: Now Zod will allow the cartItems and guest data through!
export const checkoutDTO = z.object({
  addressSnapshot: z.string(),
  customerDetails: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string()
  }).optional().nullable(),
  cartItems: z.array(z.any()), 
  isGuest: z.boolean()
}).passthrough();
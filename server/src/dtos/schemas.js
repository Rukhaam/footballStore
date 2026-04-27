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


export const checkoutDTO = z.object({
  addressSnapshot: z.string().optional(),
  customerDetails: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(7).max(20),
    address: z.string().trim().min(5).max(120),
    city: z.string().trim().min(2).max(60),
    postalCode: z.string().trim().min(3).max(20)
  }).passthrough(),
  cartItems: z.array(z.any()).min(1, 'Cart cannot be empty'),
  isGuest: z.boolean().optional(),
  promoCode: z.string().trim().min(1).max(50).optional().nullable()
}).passthrough();
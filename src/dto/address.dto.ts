import { z } from 'zod';

export const AddressSchema = z.object({
    body: z.object({
        label: z.string().optional(),
        line1: z.string().min(1, 'Address line 1 is required'),
        line2: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postal_code: z.string().min(1, 'Postal code is required'),
        country: z.string().default('India'),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        is_default: z.boolean().default(false),
    }),
});

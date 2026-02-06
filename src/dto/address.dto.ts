import { z } from 'zod';

export const AddressSchema = z.object({
    body: z.object({
        label: z.string().optional(),
        line1: z.string().min(5),
        line2: z.string().optional(),
        city: z.string().min(2),
        state: z.string().min(2),
        postal_code: z.string().min(4),
        country: z.string().default('India'),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        is_default: z.boolean().default(false),
    }),
});

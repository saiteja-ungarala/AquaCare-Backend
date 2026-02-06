import { z } from 'zod';

export const CheckoutSchema = z.object({
    body: z.object({
        address_id: z.number(),
        payment_method: z.enum(['cod', 'wallet', 'online']).default('cod'),
    }),
});

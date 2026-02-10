import { z } from 'zod';

export const CheckoutSchema = z.object({
    body: z.object({
        addressId: z.number().optional(),
        address_id: z.number().optional(),
        paymentMethod: z.enum(['cod', 'wallet', 'online']).optional(),
        payment_method: z.enum(['cod', 'wallet', 'online']).optional(),
    }).transform(data => ({
        address_id: data.addressId || data.address_id,
        payment_method: data.paymentMethod || data.payment_method || 'cod',
    })),
});

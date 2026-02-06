import { z } from 'zod';

export const CreateBookingSchema = z.object({
    body: z.object({
        service_id: z.number(),
        scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format YYYY-MM-DD'),
        scheduled_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format HH:MM:SS'),
        address_id: z.number().optional(),
        notes: z.string().optional(),
    }),
});

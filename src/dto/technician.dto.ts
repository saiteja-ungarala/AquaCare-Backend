import { z } from 'zod';

const TechnicianKycDocTypeSchema = z.enum([
    'aadhaar',
    'pan',
    'driving_license',
    'selfie',
    'other',
    'government_id',
    'license',
]);

export const TechnicianKycSchema = z.object({
    body: z.object({
        doc_type: z.preprocess(
            (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
            TechnicianKycDocTypeSchema
        ).optional(),
    }),
});

export const TechnicianOnlineSchema = z.object({
    body: z.object({
        is_online: z.boolean(),
    }),
});

export const TechnicianJobStatusSchema = z.object({
    body: z.object({
        status: z.enum(['in_progress', 'completed']),
    }),
});

export const TechnicianCampaignProgressSchema = z.object({
    params: z.object({
        campaignId: z.coerce.number().int().positive(),
    }),
});

export const TechnicianLocationSchema = z.object({
    body: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
});

export const TechnicianJobUpdateSchema = z.object({
    params: z.object({
        bookingId: z.coerce.number().int().positive(),
    }),
    body: z.object({
        update_type: z.enum(['arrived', 'diagnosed', 'in_progress', 'completed', 'photo', 'note']),
        note: z.string().optional(),
        media_url: z.string().url().optional(),
    }),
});

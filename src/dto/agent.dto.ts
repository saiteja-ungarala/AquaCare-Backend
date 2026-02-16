import { z } from 'zod';

const AgentKycDocTypeSchema = z.enum([
    'aadhaar',
    'pan',
    'driving_license',
    'selfie',
    'other',
    // Accepted aliases (mapped in service layer)
    'government_id',
    'license',
]);

export const AgentKycSchema = z.object({
    body: z.object({
        doc_type: z.preprocess(
            (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
            AgentKycDocTypeSchema
        ).optional(),
    }),
});

export const AgentOnlineSchema = z.object({
    body: z.object({
        is_online: z.boolean(),
    }),
});

export const AgentJobStatusSchema = z.object({
    body: z.object({
        status: z.enum(['in_progress', 'completed']),
    }),
});

export const AgentCampaignProgressSchema = z.object({
    params: z.object({
        campaignId: z.coerce.number().int().positive(),
    }),
});
